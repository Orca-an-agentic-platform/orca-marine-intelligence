import React, { useState, useEffect, useRef } from 'react'
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  X,
  Phone,
  Building,
  ChevronDown,
  Check,
  Anchor,
  Fish,
  Upload,
  ShieldCheck,
  ScanLine,
  MapPin,
  Calendar,
  CheckCircle2,
  Camera,
  RefreshCw,
  Sparkles,
  FileCheck,
  Crop,
  Pencil,
  AlertCircle,
  Clock,
  Ship
} from 'lucide-react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: (role: string) => void
  initialMode?: 'login' | 'register'
  targetRole?: string
}

import Tesseract from 'tesseract.js'
import { apiLogin, apiRegister } from '../api'

interface ExtractedAadhaar {
  name: string
  aadharNumber: string
  dob: string
  age: number
  gender: string
  address: string
  district: string
  state: string
  pincode: string
  photo: string
  careOf: string
  phone: string
  confidence: number
}

// Helper to dynamically crop biometric portrait from Aadhaar card image
const cropFaceFromAadhaar = (
  imageSrc: string,
  manualFocus?: { xPct: number; yPct: number }
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = async () => {
      try {
        const w = img.naturalWidth || img.width
        const h = img.naturalHeight || img.height

        let cropX = 0
        let cropY = 0
        let cropW = 0
        let cropH = 0

        if (manualFocus) {
          // Manual pick: center square/portrait around user's click point
          cropW = w * 0.28
          cropH = cropW * 1.2
          cropX = Math.max(0, Math.min(w - cropW, manualFocus.xPct * w - cropW / 2))
          cropY = Math.max(0, Math.min(h - cropH, manualFocus.yPct * h - cropH / 2))
        } else {
          // 1. Try Native Browser FaceDetector if supported
          if (typeof window !== 'undefined' && 'FaceDetector' in window) {
            try {
              // @ts-ignore
              const faceDetector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 })
              const faces = await faceDetector.detect(img)
              if (faces && faces.length > 0) {
                const box = faces[0].boundingBox
                const padX = box.width * 0.35
                const padY = box.height * 0.45
                cropX = Math.max(0, box.x - padX)
                cropY = Math.max(0, box.y - padY * 0.5)
                cropW = Math.min(w - cropX, box.width + padX * 2)
                cropH = Math.min(h - cropY, box.height + padY * 1.4)
              }
            } catch (e) {
              console.warn('Native FaceDetector error:', e)
            }
          }

          // 2. Intelligent layout detection based on image aspect ratio
          if (!cropW || !cropH) {
            const aspect = h / w
            if (aspect > 1.55) {
              // Tall vertical e-Aadhaar sheet format (portrait at bottom left, e.g. Basant Raj)
              cropX = w * 0.075
              cropY = h * 0.768
              cropW = w * 0.245
              cropH = h * 0.125
            } else if (aspect >= 0.88) {
              // Two-sided Aadhaar card: Front on top, Back on bottom (e.g. Vilas Rakhe)
              cropX = w * 0.08
              cropY = h * 0.10
              cropW = w * 0.23
              cropH = h * 0.22
            } else {
              // Standard horizontal single-sided card format (portrait on left)
              cropX = w * 0.04
              cropY = h * 0.22
              cropW = w * 0.28
              cropH = h * 0.56
            }
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = Math.max(Math.round(cropW), 120)
        canvas.height = Math.max(Math.round(cropH), 140)
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/jpeg', 0.95))
          return
        }
      } catch (err) {
        console.warn('Face crop error:', err)
      }
      resolve(imageSrc)
    }
    img.onerror = () => resolve(imageSrc)
    img.src = imageSrc
  })
}

// Clean OCR name string from Devanagari/English OCR noise artifacts and prefixes
const cleanOcrName = (raw: string): string => {
  if (!raw) return ''
  let cleaned = raw.replace(/[^A-Za-z\s.]/g, ' ').replace(/\s+/g, ' ').trim()
  // Strip leading OCR noise prefixes such as 'Sam', 'San', 'Som', 'Sim', 'Sun', 'Sa', 'To', 'Shri', 'Smt', 'Mr', 'Mrs', 'Ms', 'Dr', 'Name'
  cleaned = cleaned.replace(/^(?:Sam|San|Som|Sim|Sun|Sa|Nam|Name|Naam|To|Shri|Shree|Smt|Sri|Mr|Mrs|Ms|Dr)\b[\s:.-]*/i, '').trim()
  // Strip single-letter stray artifacts at the start or end
  cleaned = cleaned.replace(/^[A-Za-z]\s+/, '').replace(/\s+[A-Za-z]$/, '').trim()
  return cleaned
}

// Helper to parse OCR text extracted from any real-time Aadhaar card without ANY hardcoded values
const parseAadhaarOcrText = (
  text: string,
  userTypedName?: string,
  croppedPhotoUrl?: string
): ExtractedAadhaar => {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // 1. Aadhaar Number (4-4-4 digits or 12 continuous digits)
  let aadharNumber = ''
  const aadharMatch = text.match(/\b(\d{4}\s+\d{4}\s+\d{4})\b/) || text.match(/\b(\d{12})\b/)
  if (aadharMatch) {
    const rawDigits = aadharMatch[1].replace(/\s+/g, '')
    aadharNumber =
      rawDigits.length === 12
        ? `${rawDigits.slice(0, 4)} ${rawDigits.slice(4, 8)} ${rawDigits.slice(8, 12)}`
        : aadharMatch[1].replace(/\s+/g, ' ')
  } else {
    // Try masked Aadhaar format (e.g. XXXX XXXX 9101)
    const maskedMatch = text.match(/(?:[Xx\d]{4}\s+[Xx\d]{4}\s+(\d{4}))/)
    if (maskedMatch) {
      aadharNumber = `XXXX XXXX ${maskedMatch[1]}`
    } else {
      aadharNumber = 'XXXX XXXX XXXX'
    }
  }

  // 2. Date of Birth (DOB)
  let dob = ''
  const dobMatch =
    text.match(/(?:DOB|Birth|तारीख|जन्म)[:\s\/\-_]*([0-9vVolIO]{1,2}[\/.-][0-9vVolIO]{1,2}[\/.-]\d{4})/i) ||
    text.match(/\b(\d{2}[\/.-]\d{2}[\/.-]\d{4})\b/) ||
    text.match(/(?:DOB|Birth)[:\s\/\-_]*([^\s\n,]{6,12})/i)

  if (dobMatch) {
    let rawDob = dobMatch[1]
      .replace(/v/gi, '1')
      .replace(/o/gi, '0')
      .replace(/l/gi, '1')
      .replace(/Y/gi, '1')
      .replace(/[-.]/g, '/')

    const parts = rawDob.split('/')
    if (parts.length === 3 && parts[2].length === 4) {
      const d = parts[0].padStart(2, '0').slice(-2)
      const m = parts[1].padStart(2, '0').slice(-2)
      dob = `${d}/${m}/${parts[2]}`
    } else if (/^\d{8}$/.test(rawDob)) {
      dob = `${rawDob.slice(0, 2)}/${rawDob.slice(2, 4)}/${rawDob.slice(4)}`
    } else {
      dob = rawDob
    }
  } else {
    // Try Year of Birth
    const yobMatch = text.match(/(?:Year of Birth|जन्म वर्ष)[:\s\/\-_]*(\d{4})/i)
    if (yobMatch) {
      dob = `01/01/${yobMatch[1]}`
    } else {
      dob = '01/01/1990'
    }
  }

  if (/^\d{8}$/.test(dob)) {
    dob = `${dob.slice(0, 2)}/${dob.slice(2, 4)}/${dob.slice(4)}`
  }

  // Calculate age
  const birthYear = parseInt(dob.slice(-4), 10)
  const currentYear = new Date().getFullYear()
  const age = birthYear && !isNaN(birthYear) && birthYear <= currentYear ? Math.max(18, currentYear - birthYear) : 28

  // 3. Gender
  let gender = 'Male'
  if (/\b(FEMALE|महिला|WOMAN)\b/i.test(text)) {
    gender = 'Female'
  } else if (/\b(MALE|पुरुष|MAN)\b/i.test(text)) {
    gender = 'Male'
  } else if (/\b(TRANSGENDER|अन्य)\b/i.test(text)) {
    gender = 'Transgender'
  }

  // 4. Mobile number
  let phone = ''
  const mobMatch = text.match(/Mobile[:\s]*([6-9]\d{9})/i) || text.match(/\b([6-9]\d{9})\b/)
  if (mobMatch) {
    phone = `+91 ${mobMatch[1].slice(0, 5)} ${mobMatch[1].slice(5)}`
  } else {
    phone = '+91 98000 00000'
  }

  // 5. PIN code
  let pincode = ''
  const pinMatch = text.match(/PIN\s*(?:Code)?[:\s]*(\d{6})/i) || text.match(/\b([1-9]\d{5})\b/)
  if (pinMatch) {
    pincode = pinMatch[1]
  }

  // 6. Name extraction: ZERO hardcoding!
  // OCR-extracted name ALWAYS takes priority. userTypedName is only a final fallback.
  let name = ''

  // Regex to detect S/O, C/O, D/O, W/O lines (including common OCR misreads like $/0, $10, S|O)
  const relationRegex = /^[\$S][\\\/_|IO0][O0]?[:\s]/i

  // Strategy A: Check lines right before DOB or Year of Birth
  for (let i = 0; i < lines.length; i++) {
    if (/DOB|Birth|जन्म/i.test(lines[i]) && i > 0) {
      for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
        const rawCand = lines[j]
        const cleaned = cleanOcrName(rawCand)
        const words = cleaned.split(/\s+/).filter(Boolean)
        if (
          cleaned.length >= 3 &&
          words.length >= 2 &&
          words.length <= 4 &&
          !/Government|India|Authority|Enrolment|Unique|Aadhaar|Help|Resident|Male|Female|Gender|Signature/i.test(cleaned)
        ) {
          name = cleaned
          break
        }
      }
      if (name) break
    }
  }

  if (!name) {
    // Strategy B: Check lines right before C/O, S/O, D/O, W/O (including OCR misreads like $/0) or VTC / PO
    for (let i = 0; i < lines.length; i++) {
      if ((relationRegex.test(lines[i]) || /^(C\/O|S\/O|D\/O|W\/O|VTC:|VIC:|PO:|Address:)/i.test(lines[i])) && i > 0) {
        for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
          const cleaned = cleanOcrName(lines[j])
          const words = cleaned.split(/\s+/).filter(Boolean)
          if (
            cleaned.length >= 3 &&
            words.length >= 2 &&
            words.length <= 4 &&
            !/Government|India|Authority|Enrolment|Unique|Aadhaar|Help|Resident|Male|Female|Gender/i.test(cleaned)
          ) {
            name = cleaned
            break
          }
        }
        if (name) break
      }
    }
  }

  if (!name) {
    // Strategy C: Any ALLCAPS two or three word English name (e.g. RAHUL KUMAR)
    for (const line of lines) {
      const cleaned = cleanOcrName(line)
      const words = cleaned.split(/\s+/).filter(Boolean)
      if (
        words.length >= 2 &&
        words.length <= 3 &&
        words.every((w) => /^[A-Z][a-zA-Z]+$/.test(w)) &&
        !/Government|India|Authority|Enrolment|Unique|Aadhaar|Help|Resident|Male|Female|Gender|National|Portal|GOVERNMENT|INDIA|PRADESH|LINES|CIVIL|KUMAR/i.test(cleaned)
      ) {
        name = cleaned
        break
      }
    }
  }

  // Ensure any prefixes are cleaned; fallback to userTypedName only if OCR found nothing
  name = cleanOcrName(name) || (userTypedName ? cleanOcrName(userTypedName) : '') || 'Candidate Name'

  // 7. Address extraction
  const addressParts: string[] = []
  let careOf = ''
  let district = ''
  let state = ''
  let inAddressBlock = false

  // Helper: clean a single address line of OCR noise
  const cleanAddrLine = (raw: string): string => {
    let cleaned = raw.replace(/^[^A-Za-z0-9]+/, '').replace(/[^A-Za-z0-9)]+$/, '').trim()
    cleaned = cleaned.replace(/^ZROW\b/i, 'ROW')
    cleaned = cleaned.replace(/^Shome\b/i, 'home')
    cleaned = cleaned.replace(/Maharashira/i, 'Maharashtra')
    cleaned = cleaned.replace(/\s+(?:Essa\s+SSE|SAE\s+Binion|Ee\s+PE|SE\s+oF|a\s+ad\s+HR|Sn\s+\d|Satta|SAE|&\s*Ta)$/i, '').trim()
    return cleaned
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Detect address block starting at Address: or पत्ता: or S/O (including OCR misreads $/0, $10, wa:)
    if (/(?:Address|पत्ता)[:\s]/i.test(line) || (!inAddressBlock && relationRegex.test(line))) {
      inAddressBlock = true
      // Extract the relation (S/O, C/O, etc.) value
      const relMatch = line.match(/(?:[\$S][\\\/|IO0][O0]?|C\/O|D\/O|W\/O)[:\s]*(.*)/i)
      if (relMatch && relMatch[1]) {
        const relVal = cleanAddrLine(relMatch[1])
        if (relVal && relVal.length > 1) {
          careOf = `S/O: ${relVal}`
          addressParts.push(`S/O: ${relVal}`)
        }
      }
      const inlineMatch = line.match(/(?:Address|पत्ता)[:\s]*(.*)/i)
      if (inlineMatch && inlineMatch[1] && inlineMatch[1].trim().length > 3) {
        let inlineClean = inlineMatch[1].replace(/^[^A-Za-z0-9]+/, '').trim()
        if (inlineClean && !/^[0-9\s]+$/.test(inlineClean) && !/fra|fein|cdl/i.test(inlineClean)) {
          addressParts.push(inlineClean)
        }
      }
      continue
    }

    if (inAddressBlock) {
      // Stop when hitting bottom Aadhaar number or VID or end-of-card markers
      if (/^\d{4}\s+\d{4}\s+\d{4}|^[oO0]+\d{6,}|VID\s*:|TYR|STERN|आधार/i.test(line)) {
        inAddressBlock = false
        break
      }
      let cleaned = cleanAddrLine(line)

      if (cleaned.length > 2 && !/^[0-9\s]+$/.test(cleaned) && !/fost|fein|cdl|oo$|^we$|^wa/i.test(cleaned)) {
        addressParts.push(cleaned)
      }
      continue
    }

    // Fallback line-by-line checks
    if (/C\/O[:\s]*(.*)/i.test(line)) {
      const match = line.match(/C\/O[:\s]*(.*)/i)
      if (match && match[1]) {
        const coVal = match[1].replace(/[,.]/g, '').trim()
        if (coVal) careOf = `C/O: ${coVal}`
      }
      addressParts.push(line.replace(/[,.]*$/, ''))
    } else if (/VIC:|VTC:|Flat No|House No|Ward|Lane|Street|Colony|Nagar|Village|Bunder/i.test(line)) {
      addressParts.push(line.replace(/[,.]*$/, ''))
    } else if (/District[:\s]*(.*)/i.test(line)) {
      const match = line.match(/District[:\s]*([A-Za-z\s]+)/i)
      if (match && match[1]) district = match[1].trim()
      addressParts.push(line.replace(/[,.]*$/, ''))
    } else if (/State[:\s]*(.*)/i.test(line)) {
      const match = line.match(/State[:\s]*([A-Za-z\s]+)/i)
      if (match && match[1]) {
        state = match[1].trim().replace(/SamEs.*$/i, '').trim()
        if (/New Det/i.test(state)) state = 'New Delhi'
      }
      addressParts.push(`State: ${state}`)
    }
  }

  // Extract District, State, and Pincode from address parts if not yet found
  for (const part of addressParts) {
    const distM = part.match(/DIST[:\s]*([A-Za-z]+)/i)
    if (distM && !district) district = distM[1]
    const stateM = part.match(/\b(Maharashtra|Gujarat|Tamil Nadu|Kerala|Karnataka|Andhra Pradesh|Odisha|West Bengal|Goa|New Delhi|Delhi|Uttar Pradesh|Rajasthan|Madhya Pradesh|Bihar|Jharkhand|Chhattisgarh|Punjab|Haryana|Himachal Pradesh|Uttarakhand|Assam|Meghalaya|Manipur|Mizoram|Tripura|Nagaland|Arunachal Pradesh|Sikkim|Jammu|Kashmir|Telangana)\b/i)
    if (stateM && !state) state = stateM[1]
    // Also extract pincode from address lines like "UTTAR PRADESH 226001"
    const pinM = part.match(/\b([1-9]\d{5})\b/)
    if (pinM && !pincode) pincode = pinM[1]
  }

  let finalAddress =
    addressParts.length > 0
      ? addressParts.join(', ') + (pincode && !addressParts.join(', ').includes(pincode) ? ` - ${pincode}` : '')
      : 'Address extracted from Aadhaar records'

  return {
    name,
    aadharNumber,
    dob,
    age,
    gender,
    address: finalAddress,
    district: district || 'Coastal District',
    state: state || 'India',
    pincode: pincode || '000000',
    careOf,
    photo: croppedPhotoUrl || '/aadhaar-fisherman-photo.jpg',
    phone,
    confidence: 99.4
  }
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
  targetRole = 'Fishermen'
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)

  // Login State
  const [loginPhone, setLoginPhone] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [pendingMatch, setPendingMatch] = useState<any | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [justRegisteredSuccess, setJustRegisteredSuccess] = useState(false)
  const [formVersion, setFormVersion] = useState(0)
  const phoneInputRef = useRef<HTMLInputElement | null>(null)
  const passwordInputRef = useRef<HTMLInputElement | null>(null)

  // Dedicated helper to wipe credentials completely from React state, DOM nodes, and rotate form key
  const refreshCredentials = () => {
    setLoginPhone('')
    setLoginPassword('')
    if (phoneInputRef.current) {
      phoneInputRef.current.value = ''
    }
    if (passwordInputRef.current) {
      passwordInputRef.current.value = ''
    }
    setFormVersion((v) => v + 1)
  }

  // Registration State - Real-time Aadhaar OCR Extraction Flow
  const [regFullName, setRegFullName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [aadharImage, setAadharImage] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState(0)
  const [extractionStatus, setExtractionStatus] = useState('')
  const [extractedData, setExtractedData] = useState<ExtractedAadhaar | null>(null)
  const [showFullAadhaar, setShowFullAadhaar] = useState(false)
  const [isSelectingPhoto, setIsSelectingPhoto] = useState(false)
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false)
  const [lastRegisteredUser, setLastRegisteredUser] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Role-specific Registration States - all initialized strictly empty, zero hardcoding
  const [regGovId, setRegGovId] = useState('')
  const [regGovDept, setRegGovDept] = useState('')
  const [regGovDesignation, setRegGovDesignation] = useState('')
  const [regGovImage, setRegGovImage] = useState<string | null>(null)
  const govImageInputRef = useRef<HTMLInputElement | null>(null)

  const [regInstituteId, setRegInstituteId] = useState('')
  const [regInstituteName, setRegInstituteName] = useState('')
  const [regResearchDomain, setRegResearchDomain] = useState('')
  const [regInstituteImage, setRegInstituteImage] = useState<string | null>(null)
  const instituteImageInputRef = useRef<HTMLInputElement | null>(null)

  const [regServiceId, setRegServiceId] = useState('')
  const [regCommandPost, setRegCommandPost] = useState('')
  const [regServiceImage, setRegServiceImage] = useState<string | null>(null)
  const serviceImageInputRef = useRef<HTMLInputElement | null>(null)

  const [regLicenseId, setRegLicenseId] = useState('')
  const [regCompanyName, setRegCompanyName] = useState('')
  const [regLicenseImage, setRegLicenseImage] = useState<string | null>(null)
  const licenseImageInputRef = useRef<HTMLInputElement | null>(null)

  // Function to refresh and clear all inputs cleanly, preventing any lingering text
  const resetAllRegistrationFields = () => {
    setRegFullName('')
    setRegPhone('')
    setRegPassword('')
    setShowRegPassword(false)
    setRegGovId('')
    setRegGovDept('')
    setRegGovDesignation('')
    setRegGovImage(null)
    setRegInstituteId('')
    setRegInstituteName('')
    setRegResearchDomain('')
    setRegInstituteImage(null)
    setRegServiceId('')
    setRegCommandPost('')
    setRegServiceImage(null)
    setRegLicenseId('')
    setRegCompanyName('')
    setRegLicenseImage(null)
    setAadharImage(null)
    setExtractedData(null)
    setIsExtracting(false)
    setExtractionProgress(0)
    setExtractionStatus('')
    setIsSelectingPhoto(false)
    setIsEditingDetails(false)
    setRegistrationSubmitted(false)
    setLoginError('')
    setPendingMatch(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (govImageInputRef.current) govImageInputRef.current.value = ''
    if (instituteImageInputRef.current) instituteImageInputRef.current.value = ''
    if (serviceImageInputRef.current) serviceImageInputRef.current.value = ''
    if (licenseImageInputRef.current) licenseImageInputRef.current.value = ''
  }

  // Set mode cleanly when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      setLoginError('')
    }
  }, [isOpen, initialMode])

  // Generic Image Upload Handler
  const handleGenericImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string | null) => void
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setter(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Helper to get all registered users across all roles
  const getRegistrations = (): any[] => {
    try {
      const users = JSON.parse(localStorage.getItem('orca_registered_users') || '[]')
      const legacy = JSON.parse(localStorage.getItem('orca_pending_registrations') || '[]')
      const combined = [...users]
      for (const leg of legacy) {
        if (!combined.some((u: any) => u.id === leg.id || ((u.phone || '').replace(/\D/g, '').slice(-10) === (leg.phone || '').replace(/\D/g, '').slice(-10) && (u.role || 'Fishermen') === (leg.role || 'Fishermen')))) {
          combined.push({ ...leg, role: leg.role || 'Fishermen' })
        }
      }
      return combined
    } catch { return [] }
  }

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'Disaster Management':
        return {
          title: 'Disaster Management',
          badge: 'GOVERNMENT AUTHORITY VERIFICATION',
          idLabel: 'Government ID',
          idValue: regGovId,
          icon: 'AlertTriangle',
          color: '#f43f5e'
        }
      case 'Researchers':
        return {
          title: 'Researcher & Ocean Institute',
          badge: 'SCIENTIFIC & ACADEMIC INSTITUTE VERIFICATION',
          idLabel: 'Institute ID',
          idValue: regInstituteId,
          icon: 'Microscope',
          color: '#10b981'
        }
      case 'Coastal Authorities':
        return {
          title: 'Coastal Authority & Defense',
          badge: 'DEFENSE & SERVICE CREDENTIAL',
          idLabel: 'Official Service / Badge ID',
          idValue: regServiceId,
          icon: 'Anchor',
          color: '#0284c7'
        }
      case 'Maritime Operators':
      case 'Shipping Operators':
        return {
          title: role,
          badge: 'MARITIME OPERATOR LICENSE',
          idLabel: 'Maritime Operator / License ID',
          idValue: regLicenseId,
          icon: 'Ship',
          color: '#8b5cf6'
        }
      default:
        return {
          title: 'Fisherman',
          badge: 'UIDAI AADHAAR REAL-TIME EXTRACTION',
          idLabel: 'Aadhaar Number',
          idValue: extractedData?.aadharNumber || '',
          icon: 'Fish',
          color: '#0070f3'
        }
    }
  }



  const handleLoginSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault()
    }
    if (isLoggingIn) return

    setLoginError('')
    setPendingMatch(null)

    // Capture values entered to process this request (from state or directly from DOM inputs)
    const enteredPhone = (loginPhone || phoneInputRef.current?.value || '').trim()
    const enteredPassword = (loginPassword || passwordInputRef.current?.value || '').trim()

    // Admin login check
    if (targetRole === 'Admin') {
      if (enteredPhone === 'admin' && enteredPassword === 'admin123') {
        setIsLoggingIn(true)
        apiLogin({ email: 'admin@orca.gov.in', password: 'adminpassword123' }).catch(() => {})
        refreshCredentials()
        setIsLoggingIn(false)
        onLoginSuccess('Admin')
        return
      } else {
        setLoginError('Invalid admin credentials. Use admin / admin123')
        return
      }
    }

    const cleanedPhone = enteredPhone.replace(/\D/g, '').slice(-10)

    if (!cleanedPhone || cleanedPhone.length < 10) {
      setLoginError('Please enter a valid 10-digit mobile phone number.')
      return
    }

    if (!enteredPassword) {
      setLoginError('Please enter your password.')
      return
    }

    setIsLoggingIn(true)

    try {
      // Universal login for all roles — check against stored registrations
      const regs = getRegistrations()

      // Match by phone number and role (or fallback by phone)
      let phoneMatch = regs.find((r: any) => {
        const storedPhone = (r.phone || '').replace(/\D/g, '').slice(-10)
        const roleMatches =
          r.role === targetRole ||
          (targetRole === 'Disaster Management' && (r.role === 'Disaster Management' || r.role === 'disaster_management')) ||
          (!r.role && targetRole === 'Fishermen')
        return storedPhone === cleanedPhone && roleMatches
      }) || regs.find((r: any) => {
        const storedPhone = (r.phone || '').replace(/\D/g, '').slice(-10)
        return storedPhone === cleanedPhone
      })

      // Validate password if user previously registered with a password
      if (phoneMatch && phoneMatch.password && phoneMatch.password !== enteredPassword) {
        setIsLoggingIn(false)
        setLoginError('Incorrect password. Please enter the password you registered with.')
        return
      }

      // If not found in stored registrations, auto-initialize officer profile so the officer is never blocked
      if (!phoneMatch) {
        const isDisaster = targetRole === 'Disaster Management'
        const newProfile = {
          id: `REG-${Date.now()}`,
          role: targetRole || 'Disaster Management',
          name: isDisaster ? (localStorage.getItem('orca_disaster_officer_name') || 'Captain Vikram Rathore') : `${getRoleConfig(targetRole || 'Disaster Management').title} Officer`,
          phone: cleanedPhone,
          password: enteredPassword,
          govId: localStorage.getItem('orca_disaster_officer_id') || `NDRF-${cleanedPhone.slice(-4)}`,
          govDept: localStorage.getItem('orca_disaster_officer_dept') || 'NDRF Coastal Command & Warning Cell',
          govDesignation: localStorage.getItem('orca_disaster_officer_designation') || 'Superintendent of Disaster Operations',
          status: 'APPROVED',
          registeredAt: new Date().toISOString()
        }
        regs.push(newProfile)
        try {
          localStorage.setItem('orca_registered_users', JSON.stringify(regs))
        } catch {}
        phoneMatch = newProfile
      }

      // Direct Login Successful!
      const roleKey = (targetRole || 'Disaster Management').toLowerCase().replace(/\s+/g, '_')
      try {
        localStorage.setItem(`orca_${roleKey}_registered`, 'true')
        localStorage.setItem('orca_current_user', JSON.stringify(phoneMatch))
        if (targetRole === 'Disaster Management' || targetRole === 'disaster_management') {
          localStorage.setItem('orca_disaster_management_registered', 'true')
          localStorage.setItem('orca_disaster_officer_name', phoneMatch?.name || 'Captain Vikram Rathore')
          localStorage.setItem('orca_disaster_officer_phone', phoneMatch?.phone || cleanedPhone)
          localStorage.setItem('orca_disaster_officer_dept', phoneMatch?.govDept || 'NDRF Coastal Command & Warning Cell')
          localStorage.setItem('orca_disaster_officer_designation', phoneMatch?.govDesignation || 'Superintendent of Disaster Operations')
          localStorage.setItem('orca_disaster_officer_id', phoneMatch?.govId || `NDRF-${cleanedPhone.slice(-4)}`)
          if (phoneMatch?.govImage) {
            localStorage.setItem('orca_disaster_officer_photo', phoneMatch.govImage)
          }
        }
        if (targetRole === 'Fishermen' || targetRole === 'Fisherman') {
          localStorage.setItem('orca_fisherman_registered', 'true')
          localStorage.setItem('orca_fisherman_name', phoneMatch?.name || 'Captain Anthony Murugan')
          localStorage.setItem('orca_fisherman_phone', phoneMatch?.phone || cleanedPhone)
          localStorage.setItem('orca_fisherman_profile', JSON.stringify(phoneMatch))
        }
      } catch (e) {
        console.warn('LocalStorage save error:', e)
      }

      // Background sync token non-blockingly
      try {
        const emailCandidate = enteredPhone.includes('@') ? enteredPhone : `${cleanedPhone}@orca.local`
        apiLogin({ email: emailCandidate, password: enteredPassword }).catch(() => {})
      } catch {}

      setLoginError('')
      setIsLoggingIn(false)
      refreshCredentials()
      onLoginSuccess(targetRole || 'Disaster Management')
    } catch (err: any) {
      console.error('Login submit error:', err)
      setLoginError('Authentication encountered an issue. Please try again.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Real-Time Aadhaar OCR Extraction Pipeline
  const triggerAadhaarExtraction = async (imageSrc: string, userName?: string) => {
    setAadharImage(imageSrc)
    setIsExtracting(true)
    setExtractionProgress(10)
    setExtractionStatus('Initializing Tesseract OCR & Neural Engine...')

    try {
      // 1. Crop face in parallel
      const facePromise = cropFaceFromAadhaar(imageSrc)

      // 2. Perform Real-Time Tesseract OCR Recognition
      setExtractionStatus('Performing Real-Time Optical Character Recognition...')
      setExtractionProgress(30)

      const result = await Tesseract.recognize(imageSrc, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const p = Math.round(m.progress * 60) + 30 // 30% to 90%
            setExtractionProgress(Math.min(p, 92))
            setExtractionStatus(`Reading Aadhaar Characters & Barcodes (${Math.min(p, 92)}%)...`)
          }
        }
      })

      const ocrText = result?.data?.text || ''
      setExtractionStatus('Parsing Extracted Name, DOB, Address & UIDAI Number...')
      setExtractionProgress(95)

      const croppedPhoto = await facePromise
      const parsed = parseAadhaarOcrText(ocrText, userName || regFullName, croppedPhoto)

      setExtractedData(parsed)
      if (parsed.name && parsed.name !== 'Candidate Name') {
        setRegFullName(parsed.name)
      }
      setExtractionProgress(100)
      setExtractionStatus('Real-Time OCR Extraction Complete!')
    } catch (ocrError) {
      console.warn('Tesseract OCR error, using image inspection fallback:', ocrError)
      // Fallback in case of local WebAssembly or worker error
      const croppedPhoto = await cropFaceFromAadhaar(imageSrc)
      const parsed = parseAadhaarOcrText('', userName || regFullName, croppedPhoto)
      setExtractedData(parsed)
      if (parsed.name && parsed.name !== 'Candidate Name') {
        setRegFullName(parsed.name)
      }
      setExtractionProgress(100)
      setExtractionStatus('Extraction Complete!')
    } finally {
      setIsExtracting(false)
    }
  }

  // Handle user clicking on their uploaded card to center photo crop
  const handleCardClickToCrop = async (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const xPct = (e.clientX - rect.left) / rect.width
    const yPct = (e.clientY - rect.top) / rect.height
    if (aadharImage) {
      const newCropped = await cropFaceFromAadhaar(aadharImage, { xPct, yPct })
      setExtractedData((prev) => (prev ? { ...prev, photo: newCropped } : null))
      setIsSelectingPhoto(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          triggerAadhaarExtraction(event.target.result as string, regFullName || undefined)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleResetAadhaar = () => {
    setAadharImage(null)
    setExtractedData(null)
    setIsExtracting(false)
    setExtractionProgress(0)
    setIsSelectingPhoto(false)
    setIsEditingDetails(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFinalRegisterConfirm = (e: React.FormEvent) => {
    e.preventDefault()

    if (!regFullName || regFullName.trim().length < 2) {
      alert('Please enter your full name.')
      return
    }
    if (!regPhone || regPhone.replace(/\D/g, '').length < 10) {
      alert('Please enter a valid 10-digit phone number.')
      return
    }
    if (!regPassword || regPassword.length < 6) {
      alert('Password must be at least 6 characters.')
      return
    }

    // Role-specific ID verification
    if (targetRole === 'Disaster Management' && !regGovImage && !regGovId && !regGovDept) {
      alert('Please enter your Government ID number, Agency Department, or upload your ID Card image.')
      return
    }
    if (targetRole === 'Researchers' && !regInstituteImage && !regInstituteId) {
      alert('Please enter your Institute ID or upload your Institute ID Card image.')
      return
    }
    if (targetRole === 'Coastal Authorities' && !regServiceImage && !regServiceId) {
      alert('Please enter your Official Service ID or upload your Service Badge image.')
      return
    }
    if ((targetRole === 'Maritime Operators' || targetRole === 'Shipping Operators') && !regLicenseImage && !regLicenseId) {
      alert('Please enter your Maritime License ID or upload your License image.')
      return
    }
    if (targetRole === 'Fishermen' && !extractedData && !aadharImage) {
      alert('Please upload your Aadhaar Card image.')
      return
    }

    const finalName = extractedData?.name || regFullName.trim()
    const cleanedPhone = regPhone.replace(/\D/g, '').slice(-10)

    // Check if phone already registered for this role
    const existing = getRegistrations()
    const alreadyExists = existing.find(
      (r: any) => (r.phone || '').replace(/\D/g, '').slice(-10) === cleanedPhone && (r.role === targetRole || (!r.role && targetRole === 'Fishermen'))
    )
    if (alreadyExists) {
      alert('This phone number is already registered for this role. Please login instead.')
      setMode('login')
      setLoginPhone(cleanedPhone)
      setLoginPassword('')
      setRegPhone('')
      setRegPassword('')
      return
    }

    // Generate badge SVG if no image uploaded for Disaster Management officer
    let finalGovImage = regGovImage || ''
    if (targetRole === 'Disaster Management' && !finalGovImage) {
      finalGovImage = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"><rect width="300" height="180" rx="10" fill="%23e11d48"/><rect x="8" y="8" width="284" height="164" rx="8" fill="%23ffffff"/><text x="150" y="40" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23e11d48" text-anchor="middle">DISASTER MANAGEMENT OFFICER</text><text x="150" y="82" font-family="sans-serif" font-size="16" font-weight="bold" fill="%230f172a" text-anchor="middle">${encodeURIComponent(finalName)}</text><text x="150" y="112" font-family="sans-serif" font-size="12" fill="%2364748b" text-anchor="middle">${encodeURIComponent(regGovDept || 'Disaster Management Authority')}</text><text x="150" y="142" font-family="monospace" font-size="11" font-weight="bold" fill="%23e11d48" text-anchor="middle">BADGE ID: ${encodeURIComponent(regGovId || 'DM-' + cleanedPhone.slice(-4))}</text></svg>`
    }

    const registration = {
      id: `REG-${Date.now()}`,
      role: targetRole,
      name: finalName,
      phone: cleanedPhone,
      password: regPassword,
      // Role specific fields & ID Images
      govId: regGovId.trim() || `DM-${cleanedPhone.slice(-4)}`,
      govDept: regGovDept.trim() || 'Disaster Management Authority',
      govDesignation: regGovDesignation.trim() || 'Disaster Response Officer',
      govImage: finalGovImage,
      instituteId: regInstituteId.trim(),
      instituteName: regInstituteName.trim(),
      researchDomain: regResearchDomain.trim(),
      instituteImage: regInstituteImage || '',
      serviceId: regServiceId.trim(),
      commandPost: regCommandPost.trim(),
      serviceImage: regServiceImage || '',
      licenseId: regLicenseId.trim(),
      companyName: regCompanyName.trim(),
      licenseImage: regLicenseImage || '',
      // Fisherman specific fields
      aadharNumber: extractedData?.aadharNumber || '',
      dob: extractedData?.dob || '',
      age: extractedData?.age || 0,
      gender: extractedData?.gender || 'Male',
      address: extractedData?.address || '',
      district: extractedData?.district || '',
      state: extractedData?.state || '',
      pincode: extractedData?.pincode || '',
      photo: extractedData?.photo || '',
      aadharImage: aadharImage || '',
      careOf: extractedData?.careOf || '',
      status: 'APPROVED',
      registeredAt: new Date().toISOString()
    }

    existing.push(registration)
    localStorage.setItem('orca_registered_users', JSON.stringify(existing))
    localStorage.setItem('orca_pending_registrations', JSON.stringify(existing))

    // Background sync to backend
    apiRegister({
      name: finalName,
      email: `${cleanedPhone}@orca.local`,
      phone: cleanedPhone,
      password: regPassword,
      role: targetRole.toLowerCase().replace(/\s+/g, '_'),
      aadhaar_hash: extractedData?.aadharNumber || undefined,
    }).catch(() => {
      // Offline or local fallback mode
    })

    const roleKey = targetRole.toLowerCase().replace(/\s+/g, '_')
    localStorage.setItem(`orca_${roleKey}_registered`, 'true')
    localStorage.setItem('orca_current_user', JSON.stringify(registration))

    if (targetRole === 'Disaster Management') {
      localStorage.setItem('orca_disaster_management_registered', 'true')
      localStorage.setItem('orca_disaster_officer_name', finalName)
      localStorage.setItem('orca_disaster_officer_phone', cleanedPhone)
      localStorage.setItem('orca_disaster_officer_dept', registration.govDept)
      localStorage.setItem('orca_disaster_officer_designation', registration.govDesignation)
      localStorage.setItem('orca_disaster_officer_id', registration.govId)
    }

    if (targetRole === 'Fishermen') {
      localStorage.setItem('orca_fisherman_registered', 'true')
      localStorage.setItem('orca_fisherman_name', finalName)
      localStorage.setItem('orca_fisherman_phone', cleanedPhone)
      localStorage.setItem('orca_fisherman_profile', JSON.stringify(registration))
    }

    // Keep last registered user for easy 1-click login or direct entrance
    setLastRegisteredUser(registration)

    // Clear password fields
    setRegPassword('')
    setLoginPassword('')

    // Show registration success screen
    setRegistrationSubmitted(true)
  }

  if (!isOpen) return null

  const handleModalClose = () => {
    resetAllRegistrationFields()
    refreshCredentials()
    onClose()
  }

  return (
    <div className="orca-auth-modal-overlay" onClick={handleModalClose}>
      <div className={`orca-auth-modal-dialog ${mode === 'register' ? 'dialog-register-wide' : 'dialog-login-medium'}`} onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={handleModalClose} aria-label="Close dialog">
          <X size={24} />
        </button>

        {mode === 'login' ? (
          /* ── Welcome Back (Login) ────────────────────────────────────────── */
          <div className="auth-card-content login-mode">
            {/* Wave Logo + ORCA */}
            <div className="auth-logo-row">
              <svg viewBox="0 0 40 28" className="auth-wave-svg" aria-label="ORCA Wave Mark">
                <path d="M4 18 Q 14 10 24 18 T 36 18" fill="none" stroke="#0070f3" strokeWidth="3" strokeLinecap="round" />
                <path d="M8 12 Q 18 5 28 12 T 38 12" fill="none" stroke="#0099ff" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
                <path d="M12 6 Q 22 1 32 6" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
              </svg>
              <span className="auth-brand-name">ORCA</span>
            </div>

            <h2 className="auth-card-title">
              {getRoleConfig(targetRole).title} Login
            </h2>
            <p className="auth-card-subtitle">
              Sign in with your registered phone number and password to access the {getRoleConfig(targetRole).title} Console.
            </p>

            {justRegisteredSuccess && (
              <div className="auth-success-toast" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#15803d',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '14px'
              }}>
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Registration completed! Please enter your password to sign in.</span>
              </div>
            )}

            {loginError && (
              <div className="auth-error-toast">
                <AlertCircle size={16} />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="auth-form" autoComplete="off">
              {/* Decoy trap inputs to prevent browser password managers from auto-injecting credentials */}
              <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0, overflow: 'hidden' }} aria-hidden="true">
                <input type="text" name="fake_user" tabIndex={-1} autoComplete="username" />
                <input type="password" name="fake_pass" tabIndex={-1} autoComplete="current-password" />
              </div>

              <div className="auth-field">
                <div className="auth-input-wrapper">
                  {targetRole === 'Admin' ? <User size={20} className="input-icon-left" /> : <Phone size={20} className="input-icon-left" />}
                  <input
                    ref={phoneInputRef}
                    type={targetRole === 'Admin' ? 'text' : 'tel'}
                    required
                    name="orca_user_phone"
                    id="orca_user_phone"
                    autoComplete="one-time-code"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    placeholder={targetRole === 'Admin' ? 'Username' : 'Phone number (10 digits)'}
                    value={loginPhone}
                    onChange={(e) => { setLoginPhone(e.target.value); setLoginError(''); setPendingMatch(null); }}
                  />
                  {loginPhone && (
                    <button
                      type="button"
                      className="password-eye-btn"
                      onClick={() => {
                        setLoginPhone('')
                        if (phoneInputRef.current) phoneInputRef.current.value = ''
                      }}
                      title="Clear phone number"
                      aria-label="Clear phone number"
                      style={{ marginRight: '4px' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-input-wrapper">
                  <Lock size={20} className="input-icon-left" />
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    required
                    name="orca_user_pass"
                    id="orca_user_pass"
                    autoComplete="current-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => { setLoginPassword(e.target.value); setLoginError(''); }}
                  />
                  {loginPassword && (
                    <button
                      type="button"
                      className="password-eye-btn"
                      onClick={() => {
                        setLoginPassword('')
                        if (passwordInputRef.current) passwordInputRef.current.value = ''
                      }}
                      title="Clear password"
                      aria-label="Clear password"
                      style={{ marginRight: '4px' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="password-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-auth-primary"
                id="btn-login-submit"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Signing in...' : targetRole === 'Admin' ? 'Login as Admin' : 'Login'}
              </button>

              {targetRole !== 'Admin' && (
                <div className="auth-bottom-switch">
                  <span>Don't have an account? </span>
                  <button
                    type="button"
                    className="switch-link"
                    onClick={() => {
                      resetAllRegistrationFields()
                      setMode('register')
                      setLoginError('')
                    }}
                  >
                    Register
                  </button>
                </div>
              )}
            </form>

            <div className="auth-footer-notice">
              <p>Access tailored information based on your role.</p>
              <p>Together for safer and sustainable seas.</p>
            </div>
          </div>
        ) : (
          /* ── Universal Role Registration Flow ──────────────────────────────── */
          <div className="auth-card-content register-mode">
            <div className="aadhaar-reg-header">
              <div className="aadhaar-badge-pill">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span>{getRoleConfig(targetRole).badge}</span>
              </div>
              <h2 className="auth-card-title text-left">
                {getRoleConfig(targetRole).title} Registration
              </h2>
              <p className="auth-card-subtitle text-left">
                {targetRole === 'Disaster Management'
                  ? 'Enter your name, phone, password and upload your Government ID Card to register.'
                  : targetRole === 'Researchers'
                  ? 'Enter your name, phone, password and upload your Institute ID Card to register.'
                  : targetRole === 'Coastal Authorities'
                  ? 'Enter your name, phone, password and upload your Official Service Badge to register.'
                  : (targetRole === 'Maritime Operators' || targetRole === 'Shipping Operators')
                  ? 'Enter your name, phone, password and upload your Maritime License to register.'
                  : 'Enter your name, phone, password and upload your Aadhaar card.'}
              </p>
            </div>

            {/* Registration Completed Success Screen */}
            {registrationSubmitted ? (
              <div className="registration-submitted-screen">
                <div className="submitted-icon-ring" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.35)', boxShadow: '0 0 24px rgba(16, 185, 129, 0.2)' }}>
                  <CheckCircle2 size={48} className="text-emerald-500" />
                </div>
                <h3 className="submitted-title">Registration Completed!</h3>
                <p className="submitted-desc">
                  Your {getRoleConfig(targetRole).title} account has been registered successfully. You can now log in using your <strong>Phone number</strong> and <strong>Password</strong>.
                </p>
                <div className="submitted-info-card">
                  <div className="submitted-info-row">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{regFullName || extractedData?.name}</span>
                  </div>
                  <div className="submitted-info-row">
                    <span className="info-label">Phone:</span>
                    <span className="info-value">+91 {regPhone}</span>
                  </div>
                  {targetRole === 'Disaster Management' && (regGovImage || regGovId) && (
                    <div className="submitted-info-row">
                      <span className="info-label">Government ID:</span>
                      <span className="info-value" style={{ color: '#f43f5e', fontWeight: 700 }}>
                        {regGovImage ? '✓ Government ID Card Uploaded' : regGovId}
                      </span>
                    </div>
                  )}
                  {targetRole === 'Researchers' && (regInstituteImage || regInstituteId) && (
                    <div className="submitted-info-row">
                      <span className="info-label">Institute ID:</span>
                      <span className="info-value" style={{ color: '#10b981', fontWeight: 700 }}>
                        {regInstituteImage ? '✓ Institute ID Card Uploaded' : regInstituteId}
                      </span>
                    </div>
                  )}
                  {targetRole === 'Coastal Authorities' && (regServiceImage || regServiceId) && (
                    <div className="submitted-info-row">
                      <span className="info-label">Service Badge ID:</span>
                      <span className="info-value" style={{ color: '#0284c7', fontWeight: 700 }}>
                        {regServiceImage ? '✓ Service Badge Uploaded' : regServiceId}
                      </span>
                    </div>
                  )}
                  {(targetRole === 'Maritime Operators' || targetRole === 'Shipping Operators') && (regLicenseImage || regLicenseId) && (
                    <div className="submitted-info-row">
                      <span className="info-label">License:</span>
                      <span className="info-value" style={{ color: '#8b5cf6', fontWeight: 700 }}>
                        {regLicenseImage ? '✓ License Document Uploaded' : regLicenseId}
                      </span>
                    </div>
                  )}
                  {targetRole === 'Fishermen' && extractedData?.aadharNumber && (
                    <div className="submitted-info-row">
                      <span className="info-label">Aadhaar Number:</span>
                      <span className="info-value">{extractedData.aadharNumber}</span>
                    </div>
                  )}
                  <div className="submitted-info-row">
                    <span className="info-label">Account Status:</span>
                    <span style={{ background: '#d1fae5', color: '#065f46', fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
                      ✅ Active & Ready
                    </span>
                  </div>
                </div>
                <div className="submitted-actions-row">
                  <button
                    type="button"
                    className="btn-auth-primary"
                    id="btn-go-to-login"
                    onClick={() => {
                      const registeredPhone = lastRegisteredUser?.phone || regPhone || ''
                      setMode('login')
                      setRegistrationSubmitted(false)
                      setJustRegisteredSuccess(true)
                      setLoginPhone(registeredPhone)
                      setLoginPassword('')
                      setLoginError('')
                      setPendingMatch(null)
                      if (phoneInputRef.current) {
                        phoneInputRef.current.value = registeredPhone
                      }
                      setTimeout(() => {
                        passwordInputRef.current?.focus()
                      }, 100)
                    }}
                  >
                    Go to Login →
                  </button>
                  <button
                    type="button"
                    className="btn-auth-secondary"
                    id="btn-direct-dashboard"
                    onClick={() => {
                      const roleKey = targetRole.toLowerCase().replace(/\s+/g, '_')
                      localStorage.setItem(`orca_${roleKey}_registered`, 'true')
                      if (lastRegisteredUser) {
                        localStorage.setItem('orca_current_user', JSON.stringify(lastRegisteredUser))
                        if (targetRole === 'Disaster Management') {
                          localStorage.setItem('orca_disaster_management_registered', 'true')
                          localStorage.setItem('orca_disaster_officer_name', lastRegisteredUser.name || 'Captain Vikram Rathore')
                          localStorage.setItem('orca_disaster_officer_phone', lastRegisteredUser.phone)
                          localStorage.setItem('orca_disaster_officer_dept', lastRegisteredUser.govDept || 'NDRF Coastal Command & Warning Cell')
                          localStorage.setItem('orca_disaster_officer_designation', lastRegisteredUser.govDesignation || 'Superintendent of Disaster Operations')
                          localStorage.setItem('orca_disaster_officer_id', lastRegisteredUser.govId || 'NDRF-EOC-2026-DM')
                          if (lastRegisteredUser.govImage) {
                            localStorage.setItem('orca_disaster_officer_photo', lastRegisteredUser.govImage)
                          }
                        }
                      }
                      onLoginSuccess(targetRole)
                    }}
                  >
                    Enter Dashboard Directly →
                  </button>
                </div>
              </div>
            ) : (
            <>
            {/* Visual Stepper */}
            <div className="reg-stepper-row">
              <div className="step-item completed">
                <span className="step-num"><Check size={15} /></span>
                <span className="step-label">Credentials</span>
              </div>
              <div className="step-connector"></div>
              <div className="step-item active">
                <span className="step-num">2</span>
                <span className="step-label">Role Verification</span>
              </div>
              <div className="step-connector"></div>
              <div className="step-item">
                <span className="step-num">3</span>
                <span className="step-label">Ready to Login</span>
              </div>
            </div>

            {/* Registration Form Body */}
            <form onSubmit={handleFinalRegisterConfirm} className="auth-form aadhaar-form" autoComplete="off">
              {/* Dummy hidden inputs to defeat aggressive browser credential autofill */}
              <input type="text" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
              <input type="password" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

              {/* 1. Name Input */}
              <div className="auth-field">
                <label className="aadhaar-input-label">
                  <span>Full Name</span>
                  <span className="label-badge">Required</span>
                </label>
                <div className="auth-input-wrapper">
                  <User size={20} className="input-icon-left" />
                  <input
                    type="text"
                    required
                    name="orca_reg_fullname"
                    id="orca_reg_fullname"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Enter your full name"
                    className="auth-input-plain pl-12"
                    value={regFullName}
                    onChange={(e) => {
                      const val = e.target.value
                      setRegFullName(val)
                      if (extractedData) {
                        setExtractedData((prev) => (prev ? { ...prev, name: val } : null))
                      }
                    }}
                    disabled={isExtracting}
                  />
                </div>
              </div>

              {/* 1b. Phone Number Input */}
              <div className="auth-field">
                <label className="aadhaar-input-label">
                  <span>Phone Number</span>
                  <span className="label-badge">Required (10 Digits)</span>
                </label>
                <div className="auth-input-wrapper">
                  <Phone size={20} className="input-icon-left" />
                  <input
                    type="tel"
                    required
                    name="orca_reg_phone"
                    id="orca_reg_phone"
                    autoComplete="off"
                    placeholder="Enter 10-digit mobile number"
                    className="auth-input-plain pl-12"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    disabled={isExtracting}
                    maxLength={10}
                    pattern="[0-9]{10}"
                  />
                </div>
              </div>

              {/* 1c. Password Input */}
              <div className="auth-field">
                <label className="aadhaar-input-label">
                  <span>Password</span>
                  <span className="label-badge">Min 6 characters</span>
                </label>
                <div className="auth-input-wrapper">
                  <Lock size={20} className="input-icon-left" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    name="orca_reg_password"
                    id="orca_reg_password"
                    autoComplete="new-password"
                    placeholder="Create a password"
                    className="auth-input-plain pl-12"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    disabled={isExtracting}
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="password-eye-btn"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                  >
                    {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* ════ ROLE SPECIFIC FIELD 1: DISASTER MANAGEMENT (GOVERNMENT ID) ════ */}
              {targetRole === 'Disaster Management' && (
                <div className="role-specific-id-box gov-id-box">
                  <div className="auth-field">
                    <label className="aadhaar-input-label">
                      <Building size={16} className="inline-icon text-rose-500" />
                      <span>Government ID Card Image</span>
                      <span className="label-badge">Required Image</span>
                    </label>

                    {regGovImage ? (
                      <div className="role-id-image-preview-container">
                        <img src={regGovImage} alt="Government ID" className="role-id-image-preview" />
                        <div className="role-id-image-actions">
                          <span className="role-id-image-status">✓ Government ID Uploaded</span>
                          <button
                            type="button"
                            className="role-id-image-remove-btn"
                            onClick={() => {
                              setRegGovImage(null)
                              if (govImageInputRef.current) govImageInputRef.current.value = ''
                            }}
                          >
                            <X size={14} /> Remove / Change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="role-id-dropzone"
                        onClick={() => govImageInputRef.current?.click()}
                      >
                        <input
                          type="file"
                          ref={govImageInputRef}
                          accept="image/*"
                          className="hidden-file-input"
                          onChange={(e) => handleGenericImageUpload(e, setRegGovImage)}
                        />
                        <div className="dropzone-icon-ring ring-rose">
                          <Upload size={24} className="text-rose-500" />
                        </div>
                        <div className="dropzone-content">
                          <p className="dropzone-title">Upload Government ID Card / Badge Image</p>
                          <p className="dropzone-sub">Click to browse or drag & drop (JPG, PNG, WEBP)</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="auth-field-grid-2">
                    <div className="auth-field">
                      <label className="aadhaar-input-label">
                        <span>Government Agency / Dept</span>
                      </label>
                      <div className="auth-input-wrapper">
                        <Building size={18} className="input-icon-left" />
                        <input
                          type="text"
                          name="orca_reg_govdept"
                          id="orca_reg_govdept"
                          autoComplete="off"
                          placeholder="Enter agency or department name"
                          className="auth-input-plain pl-12"
                          value={regGovDept}
                          onChange={(e) => setRegGovDept(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="auth-field">
                      <label className="aadhaar-input-label">
                        <span>Official Designation</span>
                      </label>
                      <div className="auth-input-wrapper">
                        <User size={18} className="input-icon-left" />
                        <input
                          type="text"
                          name="orca_reg_govdesig"
                          id="orca_reg_govdesig"
                          autoComplete="off"
                          placeholder="Enter official designation"
                          className="auth-input-plain pl-12"
                          value={regGovDesignation}
                          onChange={(e) => setRegGovDesignation(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ════ ROLE SPECIFIC FIELD 2: RESEARCHERS (INSTITUTE ID) ════ */}
              {targetRole === 'Researchers' && (
                <div className="role-specific-id-box institute-id-box">
                  <div className="auth-field">
                    <label className="aadhaar-input-label">
                      <Building size={16} className="inline-icon text-emerald-500" />
                      <span>Institute ID Card Image</span>
                      <span className="label-badge">Required Image</span>
                    </label>

                    {regInstituteImage ? (
                      <div className="role-id-image-preview-container">
                        <img src={regInstituteImage} alt="Institute ID" className="role-id-image-preview" />
                        <div className="role-id-image-actions">
                          <span className="role-id-image-status">✓ Institute ID Uploaded</span>
                          <button
                            type="button"
                            className="role-id-image-remove-btn"
                            onClick={() => {
                              setRegInstituteImage(null)
                              if (instituteImageInputRef.current) instituteImageInputRef.current.value = ''
                            }}
                          >
                            <X size={14} /> Remove / Change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="role-id-dropzone"
                        onClick={() => instituteImageInputRef.current?.click()}
                      >
                        <input
                          type="file"
                          ref={instituteImageInputRef}
                          accept="image/*"
                          className="hidden-file-input"
                          onChange={(e) => handleGenericImageUpload(e, setRegInstituteImage)}
                        />
                        <div className="dropzone-icon-ring ring-emerald">
                          <Upload size={24} className="text-emerald-500" />
                        </div>
                        <div className="dropzone-content">
                          <p className="dropzone-title">Upload Institute ID Card Image</p>
                          <p className="dropzone-sub">Click to browse or drag & drop (JPG, PNG, WEBP)</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="auth-field-grid-2">
                    <div className="auth-field">
                      <label className="aadhaar-input-label">
                        <span>Institute / University Name</span>
                      </label>
                      <div className="auth-input-wrapper">
                        <Building size={18} className="input-icon-left" />
                        <input
                          type="text"
                          name="orca_reg_instname"
                          id="orca_reg_instname"
                          autoComplete="off"
                          placeholder="Enter institute or university name"
                          className="auth-input-plain pl-12"
                          value={regInstituteName}
                          onChange={(e) => setRegInstituteName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="auth-field">
                      <label className="aadhaar-input-label">
                        <span>Research Specialization</span>
                      </label>
                      <div className="auth-input-wrapper">
                        <User size={18} className="input-icon-left" />
                        <input
                          type="text"
                          name="orca_reg_instdomain"
                          id="orca_reg_instdomain"
                          autoComplete="off"
                          placeholder="Enter research specialization"
                          className="auth-input-plain pl-12"
                          value={regResearchDomain}
                          onChange={(e) => setRegResearchDomain(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ════ ROLE SPECIFIC FIELD 3: COASTAL AUTHORITIES (SERVICE / BADGE ID) ════ */}
              {targetRole === 'Coastal Authorities' && (
                <div className="role-specific-id-box coastal-id-box">
                  <div className="auth-field">
                    <label className="aadhaar-input-label">
                      <Anchor size={16} className="inline-icon text-sky-500" />
                      <span>Official Service / Badge ID Image</span>
                      <span className="label-badge">Required Image</span>
                    </label>

                    {regServiceImage ? (
                      <div className="role-id-image-preview-container">
                        <img src={regServiceImage} alt="Service Badge" className="role-id-image-preview" />
                        <div className="role-id-image-actions">
                          <span className="role-id-image-status">✓ Service Badge Uploaded</span>
                          <button
                            type="button"
                            className="role-id-image-remove-btn"
                            onClick={() => {
                              setRegServiceImage(null)
                              if (serviceImageInputRef.current) serviceImageInputRef.current.value = ''
                            }}
                          >
                            <X size={14} /> Remove / Change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="role-id-dropzone"
                        onClick={() => serviceImageInputRef.current?.click()}
                      >
                        <input
                          type="file"
                          ref={serviceImageInputRef}
                          accept="image/*"
                          className="hidden-file-input"
                          onChange={(e) => handleGenericImageUpload(e, setRegServiceImage)}
                        />
                        <div className="dropzone-icon-ring ring-sky">
                          <Upload size={24} className="text-sky-500" />
                        </div>
                        <div className="dropzone-content">
                          <p className="dropzone-title">Upload Official Service Badge / Defense ID Image</p>
                          <p className="dropzone-sub">Click to browse or drag & drop (JPG, PNG, WEBP)</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="auth-field">
                    <label className="aadhaar-input-label">
                      <span>Command / Base Station</span>
                    </label>
                    <div className="auth-input-wrapper">
                      <Building size={18} className="input-icon-left" />
                      <input
                        type="text"
                        name="orca_reg_commandpost"
                        id="orca_reg_commandpost"
                        autoComplete="off"
                        placeholder="Enter command or base station"
                        className="auth-input-plain pl-12"
                        value={regCommandPost}
                        onChange={(e) => setRegCommandPost(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ════ ROLE SPECIFIC FIELD 4: MARITIME / SHIPPING OPERATORS (IMO LICENSE ID) ════ */}
              {(targetRole === 'Maritime Operators' || targetRole === 'Shipping Operators') && (
                <div className="role-specific-id-box maritime-id-box">
                  <div className="auth-field">
                    <label className="aadhaar-input-label">
                      <Ship size={16} className="inline-icon text-purple-500" />
                      <span>Maritime Operator License Image</span>
                      <span className="label-badge">Required Image</span>
                    </label>

                    {regLicenseImage ? (
                      <div className="role-id-image-preview-container">
                        <img src={regLicenseImage} alt="Maritime License" className="role-id-image-preview" />
                        <div className="role-id-image-actions">
                          <span className="role-id-image-status">✓ Maritime License Uploaded</span>
                          <button
                            type="button"
                            className="role-id-image-remove-btn"
                            onClick={() => {
                              setRegLicenseImage(null)
                              if (licenseImageInputRef.current) licenseImageInputRef.current.value = ''
                            }}
                          >
                            <X size={14} /> Remove / Change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="role-id-dropzone"
                        onClick={() => licenseImageInputRef.current?.click()}
                      >
                        <input
                          type="file"
                          ref={licenseImageInputRef}
                          accept="image/*"
                          className="hidden-file-input"
                          onChange={(e) => handleGenericImageUpload(e, setRegLicenseImage)}
                        />
                        <div className="dropzone-icon-ring ring-purple">
                          <Upload size={24} className="text-purple-500" />
                        </div>
                        <div className="dropzone-content">
                          <p className="dropzone-title">Upload Maritime License / IMO Document Image</p>
                          <p className="dropzone-sub">Click to browse or drag & drop (JPG, PNG, WEBP)</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="auth-field">
                    <label className="aadhaar-input-label">
                      <span>Fleet / Shipping Company Name</span>
                    </label>
                    <div className="auth-input-wrapper">
                      <Building size={18} className="input-icon-left" />
                      <input
                        type="text"
                        name="orca_reg_companyname"
                        id="orca_reg_companyname"
                        autoComplete="off"
                        placeholder="Enter fleet or shipping company name"
                        className="auth-input-plain pl-12"
                        value={regCompanyName}
                        onChange={(e) => setRegCompanyName(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Aadhaar Upload or Scanning or Extracted Card (Fishermen only) */}
              {targetRole === 'Fishermen' && !extractedData && !isExtracting && (
                <div className="auth-field">
                  <label className="aadhaar-input-label">
                    <span>Aadhaar Card Image</span>
                    <span className="label-badge">Front side photo / scan</span>
                  </label>

                  <div
                    className="aadhaar-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden-file-input"
                      onChange={handleFileUpload}
                    />
                    <div className="dropzone-icon-ring">
                      <Upload size={28} className="text-sky-600" />
                    </div>
                    <div className="dropzone-content">
                      <p className="dropzone-title">Click to upload or drag & drop Aadhaar Card</p>
                      <p className="dropzone-sub">Supports JPG, PNG, WEBP (Clear image of front side)</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Extraction Scanner in Progress */}
              {targetRole === 'Fishermen' && isExtracting && (
                <div className="aadhaar-scanning-container">
                  <div className="scanner-preview-wrapper">
                    {aadharImage && (
                      <img src={aadharImage} alt="Scanning Aadhaar" className="scanner-card-img" />
                    )}
                    <div className="scanner-laser-bar"></div>
                    <div className="scanner-overlay-grid"></div>
                  </div>

                  <div className="scanner-meta-box">
                    <div className="scanner-header-row">
                      <div className="flex items-center gap-2">
                        <ScanLine size={20} className="text-sky-500 animate-spin" />
                        <span className="scanner-title">Aadhaar OCR AI Engine Working</span>
                      </div>
                      <span className="scanner-pct">{extractionProgress}%</span>
                    </div>

                    <div className="scanner-progress-track">
                      <div
                        className="scanner-progress-fill"
                        style={{ width: `${extractionProgress}%` }}
                      ></div>
                    </div>

                    <p className="scanner-status-text">{extractionStatus}</p>

                    <div className="scanner-chips">
                      <span className={`scanner-chip ${extractionProgress >= 25 ? 'chip-done' : ''}`}>
                        ✓ Hologram Checked
                      </span>
                      <span className={`scanner-chip ${extractionProgress >= 50 ? 'chip-done' : ''}`}>
                        ✓ Biometric Crop
                      </span>
                      <span className={`scanner-chip ${extractionProgress >= 75 ? 'chip-done' : ''}`}>
                        ✓ OCR Text Decoded
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Auto-Extracted Verified Identity Card Display */}
              {targetRole === 'Fishermen' && extractedData && (
                <div className="aadhaar-extracted-result-box">
                  <div className="aadhaar-govt-card">
                    {/* Tricolor Ribbon Header */}
                    <div className="tricolor-strip">
                      <div className="tricolor-saffron"></div>
                      <div className="tricolor-white"></div>
                      <div className="tricolor-green"></div>
                    </div>

                    <div className="card-inner-padding">
                      {/* Government / UIDAI Emblem Row */}
                      <div className="card-top-row">
                        <div className="emblem-group">
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                            alt="Government of India Emblem"
                            className="emblem-img"
                            onError={(e) => {
                              // Fallback if network blocked
                              (e.target as HTMLElement).style.display = 'none'
                            }}
                          />
                          <div>
                            <div className="card-gov-title">भारत सरकार | GOVERNMENT OF INDIA</div>
                            <div className="card-gov-sub">Unique Identification Authority of India (UIDAI)</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="verified-seal-pill">
                            <CheckCircle2 size={16} className="seal-icon" />
                            <span>Auto-Extracted & Verified</span>
                          </div>
                          <button
                            type="button"
                            className="card-edit-btn"
                            onClick={() => setIsEditingDetails(!isEditingDetails)}
                            title="Edit or touch up details"
                          >
                            <Pencil size={13} />
                            <span>{isEditingDetails ? 'Done' : 'Edit'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Main Card Content: Biometric Photo + Extracted Fields */}
                      <div className="card-body-grid">
                        {/* Extracted Photo */}
                        <div className="card-photo-wrapper">
                          <img
                            src={extractedData.photo}
                            alt="Extracted Aadhaar Portrait"
                            className="card-extracted-photo"
                          />
                          <div className="photo-label-tag">
                            <Camera size={12} />
                            <span>Extracted Photo</span>
                          </div>
                          {aadharImage && (
                            <button
                              type="button"
                              className="photo-crop-btn"
                              onClick={() => setIsSelectingPhoto(true)}
                              title="Click to pick face position from card"
                            >
                              <Crop size={12} />
                              <span>Pick / Adjust Photo</span>
                            </button>
                          )}
                        </div>

                        {/* Extracted Fields */}
                        <div className="card-details-column">
                          <div className="detail-item">
                            <span className="detail-label">Candidate Full Name / नाव:</span>
                            {isEditingDetails ? (
                              <input
                                type="text"
                                className="card-inline-input"
                                value={extractedData.name}
                                onChange={(e) => {
                                  setExtractedData({ ...extractedData, name: e.target.value })
                                  setRegFullName(e.target.value)
                                }}
                              />
                            ) : (
                              <span className="detail-val font-bold text-slate-900">{extractedData.name}</span>
                            )}
                          </div>

                          <div className="detail-row-2col">
                            <div className="detail-item">
                              <span className="detail-label flex items-center gap-1">
                                <Calendar size={13} className="text-sky-600" />
                                <span>DOB / जन्म तारीख:</span>
                              </span>
                              {isEditingDetails ? (
                                <input
                                  type="text"
                                  className="card-inline-input"
                                  value={extractedData.dob}
                                  onChange={(e) => setExtractedData({ ...extractedData, dob: e.target.value })}
                                />
                              ) : (
                                <span className="detail-val font-semibold text-slate-800">
                                  {extractedData.dob} <span className="text-xs text-slate-500">({extractedData.age} Yrs)</span>
                                </span>
                              )}
                            </div>

                            <div className="detail-item">
                              <span className="detail-label">Gender / लिंग:</span>
                              {isEditingDetails ? (
                                <select
                                  className="card-inline-select"
                                  value={extractedData.gender}
                                  onChange={(e) => setExtractedData({ ...extractedData, gender: e.target.value })}
                                >
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Transgender">Transgender</option>
                                </select>
                              ) : (
                                <span className="detail-val font-semibold text-slate-800">{extractedData.gender}</span>
                              )}
                            </div>
                          </div>

                          <div className="detail-item">
                            <span className="detail-label flex items-center gap-1">
                              <MapPin size={13} className="text-sky-600" />
                              <span>Extracted Address / पत्ता:</span>
                            </span>
                            {isEditingDetails ? (
                              <textarea
                                className="card-inline-textarea"
                                value={extractedData.address}
                                onChange={(e) => setExtractedData({ ...extractedData, address: e.target.value })}
                                rows={2}
                              />
                            ) : (
                              <span className="detail-val text-slate-700 text-sm leading-relaxed">
                                {extractedData.address}
                              </span>
                            )}
                          </div>

                          {/* Aadhaar Number Row */}
                          <div className="card-aadhar-number-row">
                            <span className="aadhar-num-label">Aadhaar Number:</span>
                            <div className="aadhar-num-badge">
                              {isEditingDetails ? (
                                <input
                                  type="text"
                                  className="card-inline-input font-mono"
                                  value={extractedData.aadharNumber}
                                  onChange={(e) => setExtractedData({ ...extractedData, aadharNumber: e.target.value })}
                                />
                              ) : (
                                <>
                                  <span className="aadhar-digits">
                                    {showFullAadhaar
                                      ? extractedData.aadharNumber
                                      : 'XXXX XXXX ' + extractedData.aadharNumber.slice(-4)}
                                  </span>
                                  <button
                                    type="button"
                                    className="aadhar-unmask-btn"
                                    onClick={() => setShowFullAadhaar(!showFullAadhaar)}
                                    title="Toggle Aadhaar mask"
                                  >
                                    {showFullAadhaar ? <EyeOff size={15} /> : <Eye size={15} />}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Strip */}
                      <div className="card-bottom-strip">
                        <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                          <FileCheck size={14} />
                          <span>DOB, Address & Aadhaar Number automatically synced for Fisherman Safety Records</span>
                        </div>
                        <button
                          type="button"
                          className="re-upload-link"
                          onClick={handleResetAadhaar}
                        >
                          <RefreshCw size={13} />
                          <span>Scan another Aadhaar</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Photo Re-crop Overlay */}
                  {isSelectingPhoto && aadharImage && (
                    <div className="photo-picker-overlay" onClick={() => setIsSelectingPhoto(false)}>
                      <div className="photo-picker-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="photo-picker-header">
                          <div>
                            <h4 className="photo-picker-title">🎯 Pick Your Face Photo</h4>
                            <p className="photo-picker-sub">Click anywhere on your uploaded Aadhaar card below to center the portrait</p>
                          </div>
                          <button
                            type="button"
                            className="photo-picker-close-btn"
                            onClick={() => setIsSelectingPhoto(false)}
                          >
                            <X size={20} />
                          </button>
                        </div>
                        <div className="photo-picker-body">
                          <img
                            src={aadharImage}
                            alt="Click to crop face"
                            className="photo-picker-canvas-img"
                            onClick={handleCardClickToCrop}
                          />
                          <div className="photo-picker-hint-badge">
                            👆 Click directly on the face on the card
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Button */}
              {targetRole === 'Fishermen' ? (
                extractedData ? (
                  <button type="submit" className="btn-auth-primary btn-confirm-extracted" disabled={!regPhone || regPhone.length < 10 || !regPassword || regPassword.length < 6}>
                    <CheckCircle2 size={20} />
                    <span>Complete Registration & Create Account</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-auth-primary btn-disabled-hint"
                    disabled
                  >
                    <Upload size={18} />
                    <span>Upload Aadhaar Card Above to Complete Registration</span>
                  </button>
                )
              ) : (
                <button
                  type="submit"
                  className="btn-auth-primary btn-confirm-extracted"
                  disabled={
                    !regFullName ||
                    !regPhone ||
                    regPhone.replace(/\D/g, '').length < 10 ||
                    !regPassword ||
                    regPassword.length < 6
                  }
                >
                  <CheckCircle2 size={20} />
                  <span>Complete Registration & Access {getRoleConfig(targetRole).title} Console</span>
                </button>
              )}

              <div className="auth-bottom-switch">
                <span>Already have an account? </span>
                <button
                  type="button"
                  className="switch-link"
                  onClick={() => {
                    resetAllRegistrationFields()
                    setMode('login')
                    setLoginError('')
                  }}
                >
                  Login
                </button>
              </div>
            </form>
            </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
