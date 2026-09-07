import { Vessel, BuoyStation, SOSEvent, MarketPrice, AdvisoryModel } from './types'

export const INCOIS_BUOYS: BuoyStation[] = [
  {
    id: 'BD08',
    name: 'INCOIS BD08 (Bay of Bengal Deep Sea)',
    agency: 'INCOIS',
    lat: 18.2,
    lon: 89.6,
    waveHeightM: 2.1,
    wavePeriodS: 7.4,
    seaSurfaceTempC: 29.4,
    windSpeedKnots: 22.5,
    windDirectionDeg: 195,
    pressureHpa: 1004.2,
    status: 'ONLINE',
    lastTelemetry: '2 mins ago'
  },
  {
    id: 'CB02',
    name: 'INCOIS CB02 (Chennai Coastal Buoy)',
    agency: 'INCOIS',
    lat: 13.1,
    lon: 80.4,
    waveHeightM: 1.3,
    wavePeriodS: 5.8,
    seaSurfaceTempC: 28.7,
    windSpeedKnots: 14.0,
    windDirectionDeg: 120,
    pressureHpa: 1011.0,
    status: 'ONLINE',
    lastTelemetry: 'Just now'
  },
  {
    id: 'AD02',
    name: 'NIOT-AD02 (Arabian Sea Off-Kochi)',
    agency: 'NIOT',
    lat: 9.9,
    lon: 75.8,
    waveHeightM: 1.6,
    wavePeriodS: 6.2,
    seaSurfaceTempC: 29.1,
    windSpeedKnots: 16.2,
    windDirectionDeg: 280,
    pressureHpa: 1010.5,
    status: 'ONLINE',
    lastTelemetry: '4 mins ago'
  },
  {
    id: 'WRB-RAM',
    name: 'INCOIS Wave Rider Buoy (Palk Strait / Rameswaram)',
    agency: 'INCOIS',
    lat: 9.3,
    lon: 79.35,
    waveHeightM: 0.9,
    wavePeriodS: 4.8,
    seaSurfaceTempC: 29.8,
    windSpeedKnots: 11.0,
    windDirectionDeg: 160,
    pressureHpa: 1011.8,
    status: 'ONLINE',
    lastTelemetry: '1 min ago'
  },
  {
    id: 'OB01',
    name: 'INCOIS-OB01 (Odisha Paradip Deep)',
    agency: 'INCOIS',
    lat: 20.1,
    lon: 87.2,
    waveHeightM: 2.8,
    wavePeriodS: 8.5,
    seaSurfaceTempC: 28.3,
    windSpeedKnots: 27.4,
    windDirectionDeg: 210,
    pressureHpa: 1002.1,
    status: 'ONLINE',
    lastTelemetry: '3 mins ago'
  }
]

export const FLEET_VESSELS: Vessel[] = [
  {
    id: 'V-101',
    name: 'M/V Matsya Sugandhi',
    registrationNo: 'IND-TN-04-MM-1204',
    ownerName: 'Murugan Anthony',
    aadhaarHash: 'XXXX-XXXX-8821',
    biometricCardId: 'TN-BIO-2024-9981',
    vesselType: 'Mechanized Trawler',
    engineHp: 180,
    portOfOrigin: 'Rameswaram Fisheries Harbor',
    currentLat: 9.38,
    currentLon: 79.48,
    speedKnots: 7.2,
    headingDeg: 85,
    crewCount: 5,
    distToImblKm: 8.4,
    authStatus: 'VERIFIED',
    lastBiometricScan: '06-Sep 04:30 AM (RFID Port Gate)',
    transponderId: 'DAT-SG-91823'
  },
  {
    id: 'V-102',
    name: 'M/V Kadal Nayagan',
    registrationNo: 'IND-TN-04-MM-0943',
    ownerName: 'S. Selvam',
    aadhaarHash: 'XXXX-XXXX-3341',
    biometricCardId: 'TN-BIO-2023-4102',
    vesselType: 'Motorized Craft',
    engineHp: 25,
    portOfOrigin: 'Mandapam Port',
    currentLat: 9.42,
    currentLon: 79.52,
    speedKnots: 5.1,
    headingDeg: 78,
    crewCount: 3,
    distToImblKm: 3.2,
    authStatus: 'VERIFIED',
    flagReason: '⚠️ Approaching 5km IMBL Border Buffer Zone',
    lastBiometricScan: '06-Sep 05:15 AM (RFID Port Gate)',
    transponderId: 'DAT-SG-44102'
  },
  {
    id: 'V-103',
    name: 'SUSPECT CRAFT [UNIDENTIFIED]',
    registrationNo: 'UNREG-NORTH-GULF-09',
    ownerName: 'UNKNOWN / NOT REGISTERED',
    aadhaarHash: 'NO_RECORD_FOUND',
    biometricCardId: 'INVALID_TOKEN_REJECTED',
    vesselType: 'Motorized Craft',
    engineHp: 115,
    portOfOrigin: 'NON-DECLARED (Anomalous Entry)',
    currentLat: 9.51,
    currentLon: 79.58,
    speedKnots: 19.8,
    headingDeg: 240,
    crewCount: 4,
    distToImblKm: 1.8,
    authStatus: 'SUSPICIOUS_IMPOSTER',
    flagReason: '🚨 FAKE IDENTITY: ReALCraft QR mismatch. High-speed vector crossing IMBL into Indian waters without Marine Card',
    lastBiometricScan: 'FAILED / REJECTED AT INCOIS GATEWAY',
    transponderId: 'ANOMALOUS_CHIRP_SPOOFED'
  },
  {
    id: 'V-104',
    name: 'M/V Sagar Kanya II',
    registrationNo: 'IND-KL-07-MM-3109',
    ownerName: 'Baby Joseph Varghese',
    aadhaarHash: 'XXXX-XXXX-9104',
    biometricCardId: 'KL-BIO-2024-1188',
    vesselType: 'Deep Sea Longliner',
    engineHp: 240,
    portOfOrigin: 'Cochin Fisheries Harbor',
    currentLat: 9.75,
    currentLon: 75.60,
    speedKnots: 8.8,
    headingDeg: 195,
    crewCount: 8,
    distToImblKm: 142.0,
    authStatus: 'VERIFIED',
    lastBiometricScan: '05-Sep 18:00 PM (Cochin Port Biometric)',
    transponderId: 'DAT-SG-77192'
  },
  {
    id: 'V-105',
    name: 'M/V Samudra Ratna',
    registrationNo: 'IND-TN-16-MM-4491',
    ownerName: 'T. Karuppasamy',
    aadhaarHash: 'XXXX-XXXX-1903',
    biometricCardId: 'TN-BIO-2022-7740',
    vesselType: 'Mechanized Trawler',
    engineHp: 160,
    portOfOrigin: 'Nagapattinam Port',
    currentLat: 10.75,
    currentLon: 80.20,
    speedKnots: 0.8,
    headingDeg: 310,
    crewCount: 6,
    distToImblKm: 24.5,
    authStatus: 'DISTRESS_SOS',
    emergencyActive: true,
    flagReason: '🆘 ACTIVE SOS: Rudder shaft fracture. Taking in sea water in rough swell.',
    lastBiometricScan: '06-Sep 02:00 AM (Harbor Scanner)',
    transponderId: 'EPIRB-ORCA-0041'
  },
  {
    id: 'V-106',
    name: 'M/V Al-Noor (Flagged Infiltration)',
    registrationNo: 'FOR-UNREGISTERED-88',
    ownerName: 'Imposter / False Identity Claim',
    aadhaarHash: 'FORGED_CHECKSUM_FLAGGED',
    biometricCardId: 'NON_RECOGNIZED_SCHEME',
    vesselType: 'Motorized Craft',
    engineHp: 140,
    portOfOrigin: 'Trans-boundary Unregistered',
    currentLat: 22.80,
    currentLon: 68.10,
    speedKnots: 14.5,
    headingDeg: 135,
    crewCount: 5,
    distToImblKm: 2.1,
    authStatus: 'SUSPICIOUS_IMPOSTER',
    flagReason: '🚨 SECURITY THREAT: Sir Creek border infiltration alert. Claiming to be local fisherman with spoofed mobile GPS.',
    lastBiometricScan: 'DENIED: Biometric thumb hash failed National Marine Registry check',
    transponderId: 'UNENCRYPTED_RADIO_BLIP'
  }
]

export const ACTIVE_SOS_ALERTS: SOSEvent[] = [
  {
    id: 'SOS-2026-0906-01',
    vesselId: 'V-105',
    vesselName: 'M/V Samudra Ratna (IND-TN-16-MM-4491)',
    captainName: 'T. Karuppasamy',
    contactPhone: '+91 94432 XXXXX',
    lat: 10.75,
    lon: 80.20,
    natureOfEmergency: 'Vessel Inundation / Capsize Risk',
    crewCount: 6,
    batteryPct: 68,
    signalTime: '23:42 IST',
    elapsedMinutes: 18,
    assignedQrt: 'ICGS Rani Abbakka (En-route, ETA 28m)',
    status: 'PATROL_DISPATCHED'
  },
  {
    id: 'SOS-2026-0906-02',
    vesselId: 'V-208',
    vesselName: 'M/V Ganga Sagar (IND-OD-02-MM-1928)',
    captainName: 'Biren Mondal',
    contactPhone: '+91 98310 XXXXX',
    lat: 19.85,
    lon: 86.72,
    natureOfEmergency: 'Engine Failure',
    crewCount: 4,
    batteryPct: 42,
    signalTime: '23:15 IST',
    elapsedMinutes: 45,
    assignedQrt: 'Paradip Marine Police Interceptor Boat #03',
    status: 'ACTIVE_DISTRESS'
  }
]

export const FISH_MARKET_PRICES: MarketPrice[] = [
  { species: 'Silver Pomfret (Vavval)', speciesTamil: 'வெள்ள வவ்வால்', port: 'Kasimedu (Chennai)', price_per_kg: 840, trend: 'up', recorded_at: '06-Sep 18:00', source: 'MPEDA/CMFRI Mandi Feed' },
  { species: 'King Fish / Seer (Vanjaram)', speciesTamil: 'வஞ்சிரம்', port: 'Rameswaram Harbor', price_per_kg: 720, trend: 'up', recorded_at: '06-Sep 17:30', source: 'TN Fisheries Dept Mandi' },
  { species: 'Yellowfin Tuna (Soorai)', speciesTamil: 'சூரை', port: 'Cochin Harbor', price_per_kg: 290, trend: 'stable', recorded_at: '06-Sep 18:15', source: 'Kerala Matsyafed' },
  { species: 'Tiger Prawn (Kaara Eral)', speciesTamil: 'கார இறால்', port: 'Visakhapatnam Port', price_per_kg: 680, trend: 'up', recorded_at: '06-Sep 16:45', source: 'AP Fisheries Board' },
  { species: 'Indian Mackerel (Kanagatha)', speciesTamil: 'கானாங்கெளுத்தி', port: 'Mangalore Port', price_per_kg: 180, trend: 'down', recorded_at: '06-Sep 17:00', source: 'Karnataka Fisheries Dept' }
]

export const SAMPLE_ADVISORY: AdvisoryModel = {
  summary: 'CAUTION RECOMMENDED: South Palk Bay is navigable with moderate chop, but high swell persists eastward. STRICT COMPLIANCE: Do not cross 5km IMBL buffer.',
  detailed_guidance: 'INCOIS Ocean State Forecast indicates wave heights averaging 1.1m to 1.6m with wind gusts up to 18 knots from SSW. Potential Fishing Zones (PFZ) detected 14km East of Dhanushkodi with high Chlorophyll-a gradient (0.85 mg/m³). However, vessel Masters must activate DAT-SG satellite transponder and maintain strict distance from the International Maritime Boundary Line (IMBL).',
  precautions: [
    'Mandatory biometric check-in at Rameswaram Harbor before 04:30 AM departure.',
    'Equip 100% crew with MoES certified Life Jackets and GPS Distress Transponders.',
    'Keep VHF Channel 16 monitored at all times for Coast Guard MRCC bulletins.',
    'Observe 5km standoff from Sri Lankan territorial waters line (IMBL Treaty 1974).'
  ],
  limitations: [
    'Valid for vessels with engine capacity > 45 HP only.',
    'Non-motorized traditional catamarans prohibited beyond 3 nautical miles.'
  ],
  official_warnings: [
    'INCOIS Bulletin #INCOIS/OSF/2026/0906-TN: Moderate Sea State warning for Gulf of Mannar.',
    'Coast Guard Headquarters Advisory: Enhanced joint surveillance underway. Unidentified crafts will be intercepted.'
  ],
  go_no_go: 'CAUTION',
  confidence_score: 96.4,
  language: 'en',
  evidence: [
    {
      claim: 'Wave heights at Palk Bay currently 1.1m - 1.4m',
      source: 'INCOIS Wave Rider Buoy WRB-RAM',
      source_url: 'https://incois.gov.in/portal/osf/wrb.jsp',
      retrieved_at: '06-Sep-2026 23:50 IST',
      is_official_warning: false
    },
    {
      claim: 'SST 29.8°C with thermal front favorable for Sardine/Mackerel schooling',
      source: 'INCOIS MODIS Satellite Chlorophyll Product #PFZ-SE-904',
      retrieved_at: '06-Sep-2026 22:30 IST',
      is_official_warning: false
    },
    {
      claim: 'Restricted IMBL Defense Zone 5km Buffer enforced',
      source: 'Ministry of External Affairs & Coast Guard Joint Protocol 2024',
      retrieved_at: '06-Sep-2026 00:00 IST',
      is_official_warning: true
    }
  ],
  generated_at: '06-Sep-2026 23:52:10 IST'
}
