// User roles and government dashboard routing map
export type UserRole =
  | 'government_authority'
  | 'coast_guard'
  | 'incois_scientist'
  | 'fisheries_dept'
  | 'disaster_management'
  | 'fisherman'
  | 'harbor_officer'

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
export type AlertSeverity = 'INFO' | 'WARNING' | 'DANGER' | 'CRITICAL'
export type GoNoGo = 'GO' | 'CAUTION' | 'NO-GO'

export type VesselAuthStatus = 
  | 'VERIFIED'           // Valid Marine Card + Aadhaar + ReALCraft
  | 'SUSPICIOUS_IMPOSTER'// Mismatched biometric or spoofed transponder
  | 'UNREGISTERED'       // No transponder or foreign craft
  | 'EXPIRED_PERMIT'     // Harbor permit expired
  | 'DISTRESS_SOS'       // Active emergency beacon

export interface Vessel {
  id: string
  name: string
  registrationNo: string
  ownerName: string
  aadhaarHash: string
  biometricCardId: string
  vesselType: 'Mechanized Trawler' | 'Motorized Craft' | 'Traditional Non-Motorized' | 'Deep Sea Longliner'
  engineHp: number
  portOfOrigin: string
  currentLat: number
  currentLon: number
  speedKnots: number
  headingDeg: number
  crewCount: number
  distToImblKm: number
  authStatus: VesselAuthStatus
  flagReason?: string
  lastBiometricScan: string
  transponderId: string
  emergencyActive?: boolean
}

export interface BuoyStation {
  id: string
  name: string
  agency: 'INCOIS' | 'NIOT' | 'IMD'
  lat: number
  lon: number
  waveHeightM: number
  wavePeriodS: number
  seaSurfaceTempC: number
  windSpeedKnots: number
  windDirectionDeg: number
  pressureHpa: number
  status: 'ONLINE' | 'MAINTENANCE' | 'OFFLINE'
  lastTelemetry: string
}

export interface SOSEvent {
  id: string
  vesselId: string
  vesselName: string
  captainName: string
  contactPhone: string
  lat: number
  lon: number
  natureOfEmergency: 'Engine Failure' | 'Vessel Inundation / Capsize Risk' | 'Medical Critical' | 'Collision' | 'Border Interception'
  crewCount: number
  batteryPct: number
  signalTime: string
  elapsedMinutes: number
  assignedQrt?: string
  status: 'ACTIVE_DISTRESS' | 'PATROL_DISPATCHED' | 'RESCUED'
}

export interface AgentStep {
  agentName: 'Supervisor' | 'WeatherAgent' | 'INCOISMarineAgent' | 'IMBLGeofenceAgent' | 'DeterministicGuardrail' | 'AdvisoryAgent'
  role: string
  status: 'pending' | 'running' | 'completed' | 'overridden'
  thought: string
  dataOutput?: Record<string, any>
  timestamp: string
}

export interface Location {
  lat: number
  lon: number
  name?: string
}

export interface EvidenceItem {
  claim: string
  source: string
  source_url?: string
  retrieved_at: string
  valid_for?: string
  quality_flag?: string
  is_official_warning: boolean
}

export interface RiskFactor {
  name: string
  value: string | number
  weight: number
  contribution: 'increased' | 'decreased' | 'neutral'
  source: string
  retrieved_at: string
}

export interface RiskModel {
  risk_level: RiskLevel
  risk_score: number
  factors: RiskFactor[]
  active_official_warnings: string[]
  restricted_zone_violation: boolean
  deterministic_override?: string
  uncertainty_note?: string
  assessed_at: string
}

export interface AdvisoryModel {
  summary: string
  detailed_guidance: string
  precautions: string[]
  limitations: string[]
  official_warnings: string[]
  go_no_go: GoNoGo
  confidence_score: number
  language: string
  evidence: EvidenceItem[]
  generated_at: string
}

export interface MarketPrice {
  species: string
  speciesTamil?: string
  port: string
  price_per_kg: number
  trend: 'up' | 'down' | 'stable'
  recorded_at: string
  source: string
}
