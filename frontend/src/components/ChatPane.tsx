import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, Mic, MicOff, MessageSquare, Volume2, VolumeX, Phone, PhoneOff, Globe } from 'lucide-react'
import { chatQuerySSE, isBackendAvailable, SSEEvent } from '../api'

export interface LanguageOption {
  code: string
  label: string
  nativeName: string
  sttLocale: string
  ttsLocale: string
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeName: 'English', sttLocale: 'en-IN', ttsLocale: 'en-IN' },
  { code: 'mr', label: 'Marathi', nativeName: 'मराठी', sttLocale: 'mr-IN', ttsLocale: 'mr-IN' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी', sttLocale: 'hi-IN', ttsLocale: 'hi-IN' },
  { code: 'ml', label: 'Malayalam', nativeName: 'മലയാളം', sttLocale: 'ml-IN', ttsLocale: 'ml-IN' },
  { code: 'ta', label: 'Tamil', nativeName: 'தமிழ்', sttLocale: 'ta-IN', ttsLocale: 'ta-IN' },
  { code: 'te', label: 'Telugu', nativeName: 'తెలుగు', sttLocale: 'te-IN', ttsLocale: 'te-IN' },
  { code: 'gu', label: 'Gujarati', nativeName: 'ગુજરાતી', sttLocale: 'gu-IN', ttsLocale: 'gu-IN' },
  { code: 'bn', label: 'Bengali', nativeName: 'বাংলা', sttLocale: 'bn-IN', ttsLocale: 'bn-IN' },
  { code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ', sttLocale: 'kn-IN', ttsLocale: 'kn-IN' },
]

export const LOCALIZED_STRINGS: Record<string, {
  welcome: string
  voiceWelcome: string
  presetQueries: string[]
  placeholder: string
  connecting: string
  voiceListening: string
  voiceProcessing: string
  voiceSpeaking: string
  voicePrompt: string
  footer: string
}> = {
  en: {
    welcome: "Hello! I'm ORCA — your marine intelligence assistant. I can help with fishing safety, weather conditions, PFZ zones, hazard alerts and route planning.\nWhat would you like to know?",
    voiceWelcome: "Hello! I'm ORCA Voice Assistant. Press the microphone button and speak your question about marine safety, weather, or fishing zones.",
    presetQueries: [
      'Is it safe to fish near Ratnagiri tomorrow?',
      'Where is the nearest PFZ today?',
      'What are the wave conditions for next 24 hours?',
    ],
    placeholder: "Ask about conditions, safety, PFZ...",
    connecting: "Connecting to marine intelligence network...",
    voiceListening: "Speak now — I'm listening...",
    voiceProcessing: "Analyzing your query with marine intelligence...",
    voiceSpeaking: "ORCA is speaking the advisory...",
    voicePrompt: "Tap the microphone to start voice conversation",
    footer: "Data from INCOIS, IMD, MOSDAC. Sources cited in every response",
  },
  mr: {
    welcome: "नमस्कार! मी ORCA — तुमचा सागरी गुप्तचर आणि सुरक्षा सहाय्यक. मी मासेमारी सुरक्षा, हवामान, PFZ क्षेत्रे आणि सागरी मार्गदर्शनात मदत करू शकतो.\nतुम्हाला काय जाणून घ्यायचे आहे?",
    voiceWelcome: "नमस्कार! मी ORCA व्हॉइस असिस्टंट. समुद्रातील सुरक्षितता, हवामान किंवा मासेमारी क्षेत्राबद्दल विचारण्यासाठी मायक्रोफोनवर टॅप करा.",
    presetQueries: [
      'उद्या रत्नागिरी जवळ मासेमारी करणे सुरक्षित आहे का?',
      'आज जवळचे PFZ (मासेमारी क्षेत्र) कुठे आहे?',
      'पुढील २४ तासांत लाटांची स्थिती काय आहे?',
    ],
    placeholder: "हवामान, सुरक्षा किंवा PFZ बद्दल विचारा...",
    connecting: "सागरी माहिती नेटवर्कशी जोडत आहे...",
    voiceListening: "बोला — मी ऐकत आहे...",
    voiceProcessing: "सागरी गुप्तचर माहितीचे विश्लेषण करत आहे...",
    voiceSpeaking: "ORCA सल्ला वाचून दाखवत आहे...",
    voicePrompt: "बोलण्यासाठी मायक्रोफोनवर टॅप करा",
    footer: "INCOIS, IMD, MOSDAC कडून अचूक सागरी माहिती",
  },
  hi: {
    welcome: "नमस्ते! मैं ORCA हूँ — आपका समुद्री सुरक्षा और मौसम सहायक। मैं मछली पकड़ने की सुरक्षा, मौसम, PFZ ज़ोन और मार्ग योजना में आपकी मदद कर सकता हूँ।\nआप क्या जानना चाहते हैं?",
    voiceWelcome: "नमस्ते! मैं ORCA वॉइस असिस्टेंट हूँ। समुद्री सुरक्षा, मौसम या मछली पकड़ने के क्षेत्रों के बारे में पूछने के लिए माइक दबाएँ।",
    presetQueries: [
      'क्या कल रत्नागिरी के पास मछली पकड़ना सुरक्षित है?',
      'आज सबसे नज़दीकी PFZ कहाँ है?',
      'अगले 24 घंटों में समुद्र और लहरों की स्थिति कैसी है?',
    ],
    placeholder: "मौसम, सुरक्षा, PFZ के बारे में पूछें...",
    connecting: "समुद्री नेटवर्क से संपर्क हो रहा है...",
    voiceListening: "बोलिए — मैं सुन रहा हूँ...",
    voiceProcessing: "समुद्री डेटा का विश्लेषण हो रहा है...",
    voiceSpeaking: "ORCA सलाह पढ़ रहा है...",
    voicePrompt: "आवाज़ में बात करने के लिए माइक दबाएँ",
    footer: "INCOIS, IMD और MOSDAC द्वारा सत्यापित डेटा",
  },
  ml: {
    welcome: "നമസ്കാരം! ഞാൻ ഓർക്ക (ORCA) — നിങ്ങളുടെ സമുദ്ര ഇന്റലിജൻസ് അസിസ്റ്റന്റ്. മത്സ്യബന്ധന സുരക്ഷ, കാലാവസ്ഥ, PFZ മേഖലകൾ എന്നിവയിൽ ഞാൻ സഹായിക്കാം.\nതാങ്കൾക്ക് എന്താണ് അറിയേണ്ടത്?",
    voiceWelcome: "നമസ്കാരം! ഞാൻ ഓർക്ക വോയ്‌സ് അസിസ്റ്റന്റ്. കടൽ സുരക്ഷയെക്കുറിച്ചോ കാലാവസ്ഥയെക്കുറിച്ചോ ചോദിക്കാൻ മൈക്രോഫോൺ അമർത്തുക.",
    presetQueries: [
      'നാളെ രത്നഗിരി തീരത്ത് മീൻപിടുത്തം സുരക്ഷിതമാണോ?',
      'ഇന്ന് ഏറ്റവും അടുത്തുള്ള PFZ എവിടെയാണ്?',
      'അടുത്ത 24 മണിക്കൂറിലെ തിരമാലകളുടെ അവസ്ഥ എന്താണ്?',
    ],
    placeholder: "കാലാവസ്ഥ, സുരക്ഷ, PFZ എന്നിവയെക്കുറിച്ച് ചോദിക്കുക...",
    connecting: "സമുദ്ര വിവര ശൃംഖലയുമായി ബന്ധപ്പെടുന്നു...",
    voiceListening: "സംസാരിക്കൂ — ഞാൻ കേൾക്കുന്നു...",
    voiceProcessing: "സമുദ്ര വിവരങ്ങൾ വിശകലനം ചെയ്യുന്നു...",
    voiceSpeaking: "നിർദ്ദേശങ്ങൾ നൽകുന്നു...",
    voicePrompt: "സംസാരിക്കാൻ മൈക്രോഫോൺ ടാപ്പ് ചെയ്യുക",
    footer: "INCOIS, IMD, MOSDAC വിവരങ്ങൾ അടിസ്ഥാനമാക്കിയത്",
  },
  ta: {
    welcome: "வணக்கம்! நான் ORCA — உங்கள் கடல்சார் பாதுகாப்பு உதவியாளர். மீன்பிடி பாதுகாப்பு, வானிலை, PFZ மண்டலங்கள் குறித்து நான் உங்களுக்கு உதவ முடியும்.\nநீங்கள் என்ன தெரிந்து கொள்ள விரும்புகிறீர்கள்?",
    voiceWelcome: "வணக்கம்! நான் ORCA வாய்ஸ் அசிஸ்டண்ட். கடல் பாதுகாப்பு மற்றும் வானிலை பற்றி கேட்க மைக்ரோஃபோனை அழுத்தவும்.",
    presetQueries: [
      'நாளை ரத்னகிரி அருகே மீன்பிடிக்க செல்வது பாதுகாப்பானதா?',
      'இன்று மிக அருகில் உள்ள PFZ எங்கே உள்ளது?',
      'அடுத்த 24 மணி நேர கடல் அலை நிலை எப்படி உள்ளது?',
    ],
    placeholder: "வானிலை, பாதுகாப்பு, PFZ பற்றி கேளுங்கள்...",
    connecting: "கடல்சார் தரவு நெட்வொர்க்குடன் இணைகிறது...",
    voiceListening: "பேசுங்கள் — நான் கேட்கிறேன்...",
    voiceProcessing: "கடல்சார் தகவல்கள் ஆராயப்படுகின்றன...",
    voiceSpeaking: "ORCA ஆலோசனையை பேசுகிறது...",
    voicePrompt: "பேசத் தொடங்க மைக்ரோஃபோனைத் தொடவும்",
    footer: "INCOIS, IMD, MOSDAC அதிகாரப்பூர்வ தரவு",
  },
  te: {
    welcome: "నమస్కారం! నేను ORCA — మీ సముద్ర రక్షణ సహాయకుడిని. చేపల వేట భద్రత, వాతావరణం, PFZ జోన్ల గురించి నేను సహాయం చేయగలను.\nమీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు?",
    voiceWelcome: "నమస్కారం! నేను ORCA వాయిస్ అసిస్టెంట్‌ని. సముద్ర భద్రత, వాతావరణం గురించి మాట్లాడటానికి మైక్ నొక్కండి.",
    presetQueries: [
      'రేపు రత్నగిరి వద్ద చేపల వేటకు వెళ్లడం సురక్షితమేనా?',
      'ఈ రోజు సమీపంలోని PFZ ఎక్కడ ఉంది?',
      'రాబోయే 24 గంటల్లో సముద్రపు అలల పరిస్థితి ఏమిటి?',
    ],
    placeholder: "వాతావరణం, భద్రత, PFZ గురించి అడగండి...",
    connecting: "సముద్ర డేటా నెట్‌వర్క్‌తో కనెక్ట్ అవుతోంది...",
    voiceListening: "మాట్లాడండి — వింటున్నాను...",
    voiceProcessing: "సముద్ర సమాచారాన్ని విశ్లేషిస్తోంది...",
    voiceSpeaking: "సలహా అందిస్తోంది...",
    voicePrompt: "మాట్లాడటానికి మైక్రోఫోన్ నొక్కండి",
    footer: "INCOIS, IMD, MOSDAC అధికారిక డేటా",
  },
  gu: {
    welcome: "નમસ્તે! હું ORCA છું — તમારો દરિયાઈ સલામતી અને હવામાન સહાયક. હું માછીમારી સલામતી, હવામાન અને PFZ ઝોનમાં મદદ કરી શકું છું.\nતમે શું જાણવા માંગો છો?",
    voiceWelcome: "નમસ્તે! હું ORCA વોઈસ આસિસ્ટન્ટ છું. દરિયાઈ સલામતી અને હવામાન વિશે પૂછવા માટે માઈક દબાવો.",
    presetQueries: [
      'શું કાલે રત્નાગિરી નજીક માછીમારી કરવી સુરક્ષિત છે?',
      'આજે સૌથી નજીકનું PFZ ક્યાં છે?',
      'આગામી 24 કલાકમાં મોજાંની સ્થિતિ કેવી છે?',
    ],
    placeholder: "હવામાન, સલામતી, PFZ વિશે પૂછો...",
    connecting: "દરિયાઈ નેટવર્ક સાથે જોડાઈ રહ્યું છે...",
    voiceListening: "બોલો — હું સાંભળી રહ્યો છું...",
    voiceProcessing: "દરિયાઈ માહિતીનું વિશ્લેષણ થઈ રહ્યું છે...",
    voiceSpeaking: "સલાહ આપી રહ્યું છે...",
    voicePrompt: "બોલવા માટે માઇક્રોફોન પર ટેપ કરો",
    footer: "INCOIS, IMD, MOSDAC અધિકૃત ડેટા",
  },
  bn: {
    welcome: "নমস্কার! আমি ORCA — আপনার সামুদ্রিক গোয়েন্দা ও সুরক্ষা সহকারী। আমি মাছ ধরার সুরক্ষা, আবহাওয়া এবং PFZ জোনে সাহায্য করতে পারি।\nআপনি কী জানতে চান?",
    voiceWelcome: "নমস্কার! আমি ORCA ভয়েস সহকারী। সামুদ্রিক সুরক্ষা ও আবহাওয়া সম্পর্কে জানতে মাইক স্পর্শ করুন।",
    presetQueries: [
      'কাল কি রত্নগিরির কাছে মাছ ধরা নিরাপদ?',
      'আজ সবচেয়ে কাছের PFZ কোথায়?',
      'পরবর্তী ২৪ ঘণ্টায় ঢেউয়ের পরিস্থিতি কেমন?',
    ],
    placeholder: "আবহাওয়া, সুরক্ষা বা PFZ সম্পর্কে জিজ্ঞাসা করুন...",
    connecting: "সামুদ্রিক নেটওয়ার্কের সাথে সংযোগ স্থাপন হচ্ছে...",
    voiceListening: "বলুন — আমি শুনছি...",
    voiceProcessing: "তথ্য বিশ্লেষণ করা হচ্ছে...",
    voiceSpeaking: "পরামর্শ প্রদান করা হচ্ছে...",
    voicePrompt: "কথা বলতে মাইক্রোফোনে ট্যাপ করুন",
    footer: "INCOIS, IMD, MOSDAC থেকে প্রাপ্ত তথ্য",
  },
  kn: {
    welcome: "ನಮಸ್ಕಾರ! ನಾನು ORCA — ನಿಮ್ಮ ಸಮುದ್ರ ಗುಪ್ತಚರ ಮತ್ತು ಸುರಕ್ಷತಾ ಸಹಾಯಕ. ಮೀನುಗಾರಿಕೆ ಸುರಕ್ಷತೆ, ಹವಾಮಾನ ಮತ್ತು PFZ ವಲಯಗಳ ಬಗ್ಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.\nನೀವು ಏನನ್ನು ತಿಳಿಯಲು ಬಯಸುತ್ತೀರಿ?",
    voiceWelcome: "ನಮಸ್ಕಾರ! ನಾನು ORCA ಧ್ವನಿ ಸಹಾಯಕ. ಸಮುದ್ರ ಸುರಕ್ಷತೆ ಅಥವಾ ಹವಾಮಾನದ ಬಗ್ಗೆ ಕೇಳಲು ಮೈಕ್ರೊಫೋನ್ ಒತ್ತಿರಿ.",
    presetQueries: [
      'ನಾಳೆ ರತ್ನಗಿರಿ ಬಳಿ ಮೀನುಗಾರಿಕೆ ಸುರಕ್ಷಿತವೇ?',
      'ಇಂದು ಹತ್ತಿರದ PFZ ಎಲ್ಲಿದೆ?',
      'ಮುಂದಿನ 24 ಗಂಟೆಗಳಲ್ಲಿ ಅಲೆಗಳ ಸ್ಥಿತಿ ಹೇಗಿದೆ?',
    ],
    placeholder: "ಹವಾಮಾನ, ಸುರಕ್ಷತೆ, PFZ ಬಗ್ಗೆ ಕೇಳಿ...",
    connecting: "ಸಮುದ್ರ ಮಾಹಿತಿ ನೆಟ್‌ವರ್ಕ್ ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ...",
    voiceListening: "ಮಾತನಾಡಿ — ನಾನು ಕೇಳುತ್ತಿದ್ದೇನೆ...",
    voiceProcessing: "ಮಾಹಿತಿ ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
    voiceSpeaking: "ಸಲಹೆ ನೀಡಲಾಗುತ್ತಿದೆ...",
    voicePrompt: "ಮಾತನಾಡಲು ಮೈಕ್ರೊಫೋನ್ ಟ್ಯಾಪ್ ಮಾಡಿ",
    footer: "INCOIS, IMD, MOSDAC ಅಧಿಕೃತ ಡೇಟಾ",
  },
}

// ─── Native Neural Audio Player (Google TTS in Marathi, Malayalam, Tamil, etc.) ───
export const playMarineTTS = (
  text: string,
  langCode: string,
  onStart?: () => void,
  onEnd?: () => void
): { stop: () => void } => {
  // Cancel browser synthesis
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }

  const cleanText = text
    .replace(/[*#•_`~]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleanText) {
    onEnd?.()
    return { stop: () => {} }
  }

  let stopped = false

  // 1. Primary: Stream Native Neural Audio from /chat/tts in authentic language
  const ttsUrl = `/chat/tts?lang=${encodeURIComponent(langCode)}&text=${encodeURIComponent(cleanText.slice(0, 1000))}`
  const audio = new Audio(ttsUrl)

  audio.onplay = () => {
    if (!stopped) onStart?.()
  }
  audio.onended = () => {
    if (!stopped) onEnd?.()
  }
  audio.onerror = () => {
    if (stopped) return
    console.warn('Backend TTS stream error, trying browser synthesis fallback...')
    fallbackBrowserSynthesis(cleanText, langCode, onStart, onEnd)
  }

  audio.play().catch(() => {
    if (stopped) return
    fallbackBrowserSynthesis(cleanText, langCode, onStart, onEnd)
  })

  return {
    stop: () => {
      stopped = true
      audio.pause()
      audio.src = ''
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      onEnd?.()
    },
  }
}

function fallbackBrowserSynthesis(
  cleanText: string,
  langCode: string,
  onStart?: () => void,
  onEnd?: () => void
) {
  if (!('speechSynthesis' in window)) {
    onEnd?.()
    return
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(cleanText)
  utterance.rate = 0.95
  utterance.pitch = 1.0

  const voices = window.speechSynthesis.getVoices()
  let matchedVoice = voices.find((v) =>
    v.lang.toLowerCase().replace('_', '-').startsWith(langCode)
  )

  if (!matchedVoice && langCode === 'mr') {
    // Marathi fallback to Hindi voice (Devanagari script support)
    matchedVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().replace('_', '-').startsWith('hi') ||
        v.name.toLowerCase().includes('lekha') ||
        v.name.toLowerCase().includes('hindi')
    )
    if (matchedVoice) utterance.lang = matchedVoice.lang
  } else if (matchedVoice) {
    utterance.lang = matchedVoice.lang
  }

  if (matchedVoice) utterance.voice = matchedVoice

  utterance.onstart = () => onStart?.()
  utterance.onend = () => onEnd?.()
  utterance.onerror = () => onEnd?.()

  window.speechSynthesis.speak(utterance)
}

interface ChatMessage {
  id: string
  role: 'bot' | 'user'
  content: string
  timestamp: string
  statusText?: string
  goNoGo?: string
}

// ─── Extend Window for SpeechRecognition ────────────────────────────────────
interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } }
  resultIndex: number
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

// ─── Clean Markdown / Asterisk Formatter ────────────────────────────────────
const formatChatContent = (rawText: string) => {
  if (!rawText) return null
  const lines = rawText.split('\n')
  return lines.map((line, idx) => {
    let trimmed = line.trim()
    if (!trimmed) {
      return <div key={idx} style={{ height: '6px' }} />
    }
    const isBullet = /^[•*\-]\s+/.test(trimmed)
    if (isBullet) {
      trimmed = trimmed.replace(/^[•*\-]\s+/, '')
    }

    // Parse **bold text**
    const parts = trimmed.split(/(\*\*.*?\*\*)/g)
    const elements = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} style={{ fontWeight: 700, color: 'inherit' }}>{part.slice(2, -2).replace(/\*/g, '')}</strong>
      }
      return part.replace(/\*/g, '')
    })

    if (isBullet) {
      return (
        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '3px', marginBottom: '3px' }}>
          <span style={{ color: '#0284c7', fontWeight: 800, lineHeight: '1.4' }}>•</span>
          <span style={{ flex: 1, lineHeight: '1.5' }}>{elements}</span>
        </div>
      )
    }

    return (
      <div key={idx} style={{ marginBottom: '4px', lineHeight: '1.5' }}>
        {elements}
      </div>
    )
  })
}

// ─── Text Chat Sub-Component ───────────────────────────────────────────────
interface TextChatProps {
  language: string
}

const TextChat: React.FC<TextChatProps> = ({ language }) => {
  const currentTexts = LOCALIZED_STRINGS[language] || LOCALIZED_STRINGS.en

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      content: currentTexts.welcome,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [agentOnline, setAgentOnline] = useState<boolean | null>(null)
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null)
  const activeAudioRef = useRef<{ stop: () => void } | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // When language switches, update welcome if only welcome message exists
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{
          id: 'welcome',
          role: 'bot',
          content: currentTexts.welcome,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        }]
      }
      return prev
    })
  }, [language, currentTexts.welcome])

  useEffect(() => {
    isBackendAvailable().then((ok) => setAgentOnline(ok))
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Stop playback on unmount
  useEffect(() => {
    return () => {
      activeAudioRef.current?.stop()
    }
  }, [])

  const handleToggleSpeak = (msgId: string, text: string) => {
    if (speakingMsgId === msgId) {
      activeAudioRef.current?.stop()
      setSpeakingMsgId(null)
      return
    }

    activeAudioRef.current?.stop()
    setSpeakingMsgId(msgId)

    activeAudioRef.current = playMarineTTS(
      text,
      language,
      () => setSpeakingMsgId(msgId),
      () => setSpeakingMsgId(null)
    )
  }

  const sendMessage = (text: string) => {
    if (!text.trim() || isStreaming) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsStreaming(true)

    const botMsgId = crypto.randomUUID()
    const botMsg: ChatMessage = {
      id: botMsgId,
      role: 'bot',
      content: '',
      statusText: currentTexts.connecting,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, botMsg])

    if (abortRef.current) abortRef.current.abort()

    abortRef.current = chatQuerySSE(
      { query: text.trim(), user_role: 'fisherman', language: language },
      (event: SSEEvent) => {
        setAgentOnline(true)
        if (event.type === 'status' && event.message) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId && !m.content
                ? { ...m, statusText: event.message }
                : m
            )
          )
        } else if (event.type === 'intent' && event.data) {
          const qType = event.data.query_type || 'marine query'
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId && !m.content
                ? { ...m, statusText: `Analyzing ${qType.replace('_', ' ')} data from INCOIS & IMD...` }
                : m
            )
          )
        } else if (event.type === 'advisory' && event.data) {
          const adv = event.data
          const mainText =
            adv.detailed_guidance ||
            adv.summary ||
            'Analysis complete. Conditions retrieved from ocean and meteorological services.'
          
          let effectiveGoNoGo = adv.go_no_go || undefined
          const lower = mainText.toLowerCase()
          if (
            lower.includes('high-risk and not recommended') ||
            lower.includes('not recommended') ||
            lower.includes('apprehension by') ||
            lower.includes('boat seizure') ||
            lower.includes('prohibited') ||
            lower.includes('do not venture') ||
            lower.includes('strict no-go') ||
            lower.includes('unsafe')
          ) {
            effectiveGoNoGo = 'NO-GO'
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? {
                    ...m,
                    content: mainText,
                    statusText: undefined,
                    goNoGo: effectiveGoNoGo,
                  }
                : m
            )
          )
        }
      },
      (err) => {
        console.error('Chat error:', err)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  statusText: undefined,
                  content:
                    'I apologize, but I encountered an issue connecting to the marine intelligence system. Please verify local conditions with IMD/INCOIS before departure.',
                }
              : m
          )
        )
        setIsStreaming(false)
      },
      () => {
        setIsStreaming(false)
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === botMsgId) {
              return {
                ...m,
                statusText: undefined,
                content:
                  m.content ||
                  'Marine intelligence advisory is available based on current data feeds. Please check the map and risk panels for telemetry.',
              }
            }
            return m
          })
        )
      }
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <>
      {/* Agent Status */}
      <div className="chat-pane-agent-status-bar">
        <span className={`chat-agent-status ${agentOnline ? 'online' : ''}`}>
          <span className="status-dot" />
          {agentOnline === null ? 'Checking...' : agentOnline ? 'Agent Online' : 'Offline Mode'}
        </span>
      </div>

      {/* Messages */}
      <div className="chat-pane-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble ${msg.role}`}>
            <div className="bubble-content">
              {msg.content ? (
                <>
                  {msg.goNoGo && (
                    <div className={`go-no-go-badge ${msg.goNoGo.toLowerCase().replace(/[^a-z-]/g, '')}`}>
                      {msg.goNoGo}
                    </div>
                  )}
                  <div className="bubble-text">{formatChatContent(msg.content)}</div>
                  {msg.role === 'bot' && (
                    <button
                      className="chat-speech-btn"
                      onClick={() => handleToggleSpeak(msg.id, msg.content)}
                      title="Speak advisory in selected language"
                    >
                      {speakingMsgId === msg.id ? <VolumeX size={12} /> : <Volume2 size={12} />}
                      <span>{speakingMsgId === msg.id ? 'Stop' : 'Listen'}</span>
                    </button>
                  )}
                </>
              ) : (
                <div className="bubble-thinking">
                  <span className="typing-indicator">
                    <span /><span /><span />
                  </span>
                  <span className="thinking-text">{msg.statusText || 'Analyzing marine data...'}</span>
                </div>
              )}
            </div>
            <span className="bubble-time">{msg.timestamp}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Queries */}
      <div className="chat-pane-presets">
        {currentTexts.presetQueries.map((q, i) => (
          <button
            key={i}
            className="preset-query-btn"
            onClick={() => sendMessage(q)}
            disabled={isStreaming}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form className="chat-pane-input" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={currentTexts.placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!input.trim() || isStreaming}
        >
          <Send size={16} />
        </button>
      </form>

      {/* Footer */}
      <div className="chat-pane-footer">
        {currentTexts.footer}
      </div>
    </>
  )
}

// ─── Voice Conversational Agent Sub-Component ───────────────────────────────
interface VoiceConversation {
  id: string
  role: 'agent' | 'user'
  content: string
  timestamp: string
}

interface VoiceAgentProps {
  language: string
}

const VoiceAgent: React.FC<VoiceAgentProps> = ({ language }) => {
  const currentLangConfig = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0]
  const currentTexts = LOCALIZED_STRINGS[language] || LOCALIZED_STRINGS.en

  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [transcript, setTranscript] = useState('')
  const [conversations, setConversations] = useState<VoiceConversation[]>([
    {
      id: 'voice-welcome',
      role: 'agent',
      content: currentTexts.voiceWelcome,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [pulseIntensity, setPulseIntensity] = useState(0)

  const activeAudioRef = useRef<{ stop: () => void } | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const conversationEndRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>(0)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  // Update welcome on language change if only initial welcome is in history
  useEffect(() => {
    setConversations((prev) => {
      if (prev.length === 1 && prev[0].id === 'voice-welcome') {
        return [{
          id: 'voice-welcome',
          role: 'agent',
          content: currentTexts.voiceWelcome,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        }]
      }
      return prev
    })
  }, [language, currentTexts.voiceWelcome])

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversations])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeAudioRef.current?.stop()
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop())
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const speakText = useCallback((text: string) => {
    if (!autoSpeak) return
    activeAudioRef.current?.stop()
    activeAudioRef.current = playMarineTTS(
      text,
      language,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    )
  }, [autoSpeak, language])

  const processVoiceQuery = useCallback((text: string) => {
    if (!text.trim()) return

    const userMsg: VoiceConversation = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }
    setConversations((prev) => [...prev, userMsg])
    setIsProcessing(true)
    setTranscript('')

    const botMsgId = crypto.randomUUID()
    const botMsg: VoiceConversation = {
      id: botMsgId,
      role: 'agent',
      content: '',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }
    setConversations((prev) => [...prev, botMsg])

    if (abortRef.current) abortRef.current.abort()

    abortRef.current = chatQuerySSE(
      { query: text.trim(), user_role: 'fisherman', language: language },
      (event: SSEEvent) => {
        if (event.type === 'advisory' && event.data) {
          const adv = event.data
          const mainText =
            adv.detailed_guidance ||
            adv.summary ||
            'Analysis complete. Conditions retrieved from ocean and meteorological services.'
          setConversations((prev) =>
            prev.map((m) =>
              m.id === botMsgId ? { ...m, content: mainText } : m
            )
          )
          speakText(mainText)
        }
      },
      (err) => {
        console.error('Voice query error:', err)
        const errorMsg = 'Sorry, I could not connect to the marine intelligence system. Please try again.'
        setConversations((prev) =>
          prev.map((m) =>
            m.id === botMsgId ? { ...m, content: errorMsg } : m
          )
        )
        speakText(errorMsg)
        setIsProcessing(false)
      },
      () => {
        setIsProcessing(false)
        setConversations((prev) =>
          prev.map((m) => {
            if (m.id === botMsgId && !m.content) {
              const fallback = 'Marine advisory data is being processed. Please check the map for live telemetry.'
              speakText(fallback)
              return { ...m, content: fallback }
            }
            return m
          })
        )
      }
    )
  }, [speakText, language])

  const startAudioVisualization = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      const updateVisuals = () => {
        if (!analyserRef.current) return
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length
        setPulseIntensity(Math.min(avg / 128, 1))
        animationFrameRef.current = requestAnimationFrame(updateVisuals)
      }
      updateVisuals()
    } catch {
      // Mic visualization not available
    }
  }, [])

  const stopAudioVisualization = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop())
      mediaStreamRef.current = null
    }
    analyserRef.current = null
    setPulseIntensity(0)
  }, [])

  const toggleListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setConversations((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: 'agent',
        content: 'Voice recognition is not supported in your browser. Please use Chrome or Edge for voice features.',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      }])
      return
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      stopAudioVisualization()
      setIsListening(false)
      return
    }

    // Stop any ongoing speech
    activeAudioRef.current?.stop()
    setIsSpeaking(false)

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = currentLangConfig.sttLocale
    recognitionRef.current = recognition

    recognition.onstart = () => {
      setIsListening(true)
      startAudioVisualization()
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interimTranscript = ''
      for (let i = event.resultIndex; i < Object.keys(event.results).length; i++) {
        const result = event.results[i]
        if (result && result[0]) {
          const t = result[0].transcript
          if (i < Object.keys(event.results).length - 1) {
            finalTranscript += t
          } else {
            interimTranscript += t
          }
        }
      }
      setTranscript(finalTranscript || interimTranscript)
    }

    recognition.onend = () => {
      setIsListening(false)
      stopAudioVisualization()
      if (transcript.trim()) {
        processVoiceQuery(transcript)
      }
    }

    recognition.onerror = (event: { error: string }) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      stopAudioVisualization()
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        setConversations((prev) => [...prev, {
          id: crypto.randomUUID(),
          role: 'agent',
          content: `Voice recognition error: ${event.error}. Please try again.`,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        }])
      }
    }

    recognition.start()
  }, [isListening, transcript, processVoiceQuery, startAudioVisualization, stopAudioVisualization, currentLangConfig])

  const transcriptRef = useRef(transcript)
  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = () => {
        setIsListening(false)
        stopAudioVisualization()
        const currentTranscript = transcriptRef.current
        if (currentTranscript.trim()) {
          processVoiceQuery(currentTranscript)
        }
      }
    }
  }, [processVoiceQuery, stopAudioVisualization])

  const stopSpeaking = () => {
    activeAudioRef.current?.stop()
    setIsSpeaking(false)
  }

  return (
    <>
      {/* Voice Conversation History */}
      <div className="voice-conversation-area">
        {conversations.map((conv) => (
          <div key={conv.id} className={`voice-conv-item ${conv.role}`}>
            <div className="voice-conv-icon">
              {conv.role === 'agent' ? <Bot size={14} /> : <Mic size={14} />}
            </div>
            <div className="voice-conv-content">
              <div className="voice-text-body">
                {conv.content ? (
                  <>
                    {formatChatContent(conv.content)}
                    {conv.role === 'agent' && (
                      <button
                        className="voice-replay-btn"
                        onClick={() => speakText(conv.content)}
                        title="Listen to advisory in selected language"
                      >
                        <Volume2 size={13} />
                        <span>Listen</span>
                      </button>
                    )}
                  </>
                ) : (
                  <span className="voice-thinking">
                    <span className="typing-indicator"><span /><span /><span /></span>
                    Processing query...
                  </span>
                )}
              </div>
              <span className="voice-conv-time">{conv.timestamp}</span>
            </div>
          </div>
        ))}
        <div ref={conversationEndRef} />
      </div>

      {/* Live Transcript */}
      {(isListening || transcript) && (
        <div className="voice-live-transcript">
          <div className="transcript-indicator">
            <span className="transcript-dot" />
            {isListening ? 'Listening...' : 'Processing...'}
          </div>
          {transcript && <p className="transcript-text">"{transcript}"</p>}
        </div>
      )}

      {/* Voice Controls */}
      <div className="voice-controls-area">
        <div className="voice-controls-row">
          <button
            className="voice-toggle-speaker"
            onClick={() => {
              if (isSpeaking) stopSpeaking()
              else setAutoSpeak(!autoSpeak)
            }}
            title={isSpeaking ? 'Stop speaking' : autoSpeak ? 'Disable auto-speak' : 'Enable auto-speak'}
          >
            {isSpeaking ? <VolumeX size={16} /> : autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            className={`voice-mic-btn ${isListening ? 'active' : ''} ${isProcessing ? 'processing' : ''}`}
            onClick={toggleListening}
            disabled={isProcessing}
            style={{
              '--pulse-intensity': isListening ? Math.max(0.3, pulseIntensity) : 0,
            } as React.CSSProperties}
          >
            <div className="mic-btn-inner">
              {isListening ? (
                <>
                  <div className="mic-pulse-ring ring-1" />
                  <div className="mic-pulse-ring ring-2" />
                  <div className="mic-pulse-ring ring-3" />
                  <PhoneOff size={22} />
                </>
              ) : isProcessing ? (
                <div className="mic-processing-spinner" />
              ) : (
                <Phone size={22} />
              )}
            </div>
          </button>

          <button
            className="voice-clear-btn"
            onClick={() => setConversations((prev) => [prev[0]])}
            title="Clear conversation"
          >
            Clear
          </button>
        </div>

        <p className="voice-hint">
          {isListening
            ? currentTexts.voiceListening
            : isProcessing
            ? currentTexts.voiceProcessing
            : isSpeaking
            ? currentTexts.voiceSpeaking
            : currentTexts.voicePrompt}
        </p>
      </div>
    </>
  )
}

// ─── Main ChatPane with Tab Toggle & Language Selection ──────────────────────
export const ChatPane: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'voice'>('chat')
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('orca_chat_lang') || 'mr'
  })

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
    localStorage.setItem('orca_chat_lang', newLang)
  }

  return (
    <div className="fd-chat-pane">
      {/* Header with Brand, Language Selector, and Tab Toggle */}
      <div className="chat-pane-header">
        <div className="chat-pane-brand">
          <Bot size={20} className="chat-bot-icon" />
          <div>
            <span className="chat-brand-name">ORCA</span>
            <span className="chat-brand-subtitle">Marine Intelligence</span>
          </div>
        </div>

        <div className="chat-pane-controls">
          {/* Language Selector */}
          <div className="chat-lang-selector" title="Select Chat Language">
            <Globe size={13} />
            <select
              className="chat-lang-select"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} ({lang.label})
                </option>
              ))}
            </select>
          </div>

          {/* Mode Switcher */}
          <div className="chat-mode-tabs">
            <button
              className={`chat-mode-tab ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare size={13} />
              Chat
            </button>
            <button
              className={`chat-mode-tab ${activeTab === 'voice' ? 'active' : ''}`}
              onClick={() => setActiveTab('voice')}
            >
              <Mic size={13} />
              Voice
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'chat' ? <TextChat language={language} /> : <VoiceAgent language={language} />}
    </div>
  )
}
