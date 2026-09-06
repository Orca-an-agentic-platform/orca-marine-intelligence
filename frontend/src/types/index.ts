// User roles and dashboard routing map
export type UserRole =
  | 'fisherman'
  | 'coastal_authority'
  | 'disaster_management'
  | 'maritime_operator'
  | 'researcher'
  | 'institutional_researcher'
  | 'shipping_operator'
  | 'fisheries_dept'
  | 'marketplace'
  | 'admin'

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
export type AlertSeverity = 'INFO' | 'WARNING' | 'DANGER' | 'CRITICAL'
export type GoNoGo = 'GO' | 'CAUTION' | 'NO-GO'

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

export interface MapLayer {
  layer_id: string
  layer_type: 'raster' | 'geojson' | 'vector'
  title: string
  source_url?: string
  data?: object
  visible_by_default: boolean
  legend?: object
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
  go_no_go?: GoNoGo
  confidence_score: number
  language: string
  evidence: EvidenceItem[]
  map_layers: MapLayer[]
  generated_at: string
}

export interface ChatQueryRequest {
  query: string
  session_id?: string
  location?: Location
  language?: string
  user_role: UserRole
}

export interface SSEEvent {
  type: 'status' | 'advisory' | 'risk' | 'intent' | 'done' | 'error'
  message?: string
  data?: AdvisoryModel | RiskModel | object
  session_id?: string
}

export interface AlertModel {
  alert_id: string
  alert_type: string
  severity: AlertSeverity
  valid_from: string
  valid_to?: string
  source: string
  message: string
  official_warning_ref?: string
}

export interface MarketPrice {
  species: string
  port: string
  price_per_kg: number
  recorded_at: string
  source: string
}
