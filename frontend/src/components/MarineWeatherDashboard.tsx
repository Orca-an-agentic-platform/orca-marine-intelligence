import React, { useState, useEffect } from 'react'
import {
  Thermometer,
  CloudRain,
  Waves,
  Wind,
  RotateCw,
  Droplets,
  Compass,
  MapPin,
  Navigation,
  Crosshair,
  Anchor,
  Ship,
  ShieldCheck,
  TrendingUp,
  Layers,
  Sun,
  CloudSun,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  Sparkles,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

interface HourlyDataPoint {
  timeStr: string
  formattedTime: string
  dateLabel: string
  dayName: string
  hourNumber: number
  temp: number
  humidity: number
  rainProb: number
  rainMm: number
  weatherCode: number
  weatherText: string
  windSpeedKmh: number
  windSpeedKnots: number
  windDirectionDeg: number
  windDirectionCard: string
  windGustsKmh: number
  waveHeightM: number
  wavePeriodS: number
  waveDirectionDeg: number
  waveDirectionCard: string
  safety: 'safe' | 'caution' | 'rough'
}

interface WeatherSummary {
  temp: number
  feelsLike: number
  humidity: number
  weatherCode: number
  rainMm: number
  rainProb: number
  total36hRain: number
  waveHeight: number
  maxWave36h: number
  wavePeriod: number
  waveDirection: number
  windSpeed: number
  maxWind36h: number
  windGusts: number
  windDirection: number
  lat: number
  lon: number
  locationName: string
  basin: string
  nauticalZone: string
  port: string
  isGps: boolean
  lastUpdated: string
}

const COASTAL_PRESETS = [
  {
    name: 'Ratnagiri Coast Sector',
    lat: 16.99,
    lon: 73.30,
    zone: 'Territorial Waters (12 NM Zone)',
    basin: 'Arabian Sea • Konkan Shelf',
    port: 'Mirya Bay / Bhagwati Harbor',
  },
  {
    name: 'Malvan / Sindhudurg Ground',
    lat: 16.06,
    lon: 73.47,
    zone: 'Inshore Coastal Sector',
    basin: 'Arabian Sea • South Konkan',
    port: 'Malvan Fisheries Jetty',
  },
  {
    name: 'Mumbai Harbor & High',
    lat: 18.96,
    lon: 72.82,
    zone: 'Territorial & Offshore Zone',
    basin: 'Arabian Sea • North Konkan',
    port: 'Sassoon Dock / Ferry Wharf',
  },
  {
    name: 'Goa Coast / Mormugao Sector',
    lat: 15.40,
    lon: 73.80,
    zone: 'Continental Shelf Corridor',
    basin: 'Arabian Sea • Central West Coast',
    port: 'Mormugao Harbor / Panaji',
  },
  {
    name: 'Mangalore Deep Sea Sector',
    lat: 12.87,
    lon: 74.84,
    zone: 'Exclusive Economic Zone (EEZ)',
    basin: 'Arabian Sea • Canara Coast',
    port: 'Old Mangalore Bunder',
  },
  {
    name: 'Kochi Marine Fishing Grounds',
    lat: 9.97,
    lon: 76.24,
    zone: 'Territorial Waters (12 NM)',
    basin: 'Arabian Sea • Malabar Basin',
    port: 'Kochi Fisheries Harbor',
  },
  {
    name: 'Porbandar Coastal Sector',
    lat: 21.64,
    lon: 69.60,
    zone: 'Saurashtra Coast Corridor',
    basin: 'Arabian Sea • Gujarat Shelf',
    port: 'Porbandar Old Port',
  },
]

function getWeatherText(code: number): string {
  if (code === 0) return 'Clear Sky'
  if (code === 1) return 'Mainly Clear'
  if (code === 2) return 'Partly Cloudy'
  if (code === 3) return 'Overcast'
  if (code === 45 || code === 48) return 'Fog / Mist'
  if (code >= 51 && code <= 55) return 'Drizzle'
  if (code >= 61 && code <= 65) return 'Rain'
  if (code >= 80 && code <= 82) return 'Showers'
  if (code >= 95) return 'Thunderstorm'
  return 'Scattered Clouds'
}

function WeatherIcon({ code, size = 16, className = 'text-sky' }: { code: number; size?: number; className?: string }) {
  if (code === 0) return <Sun size={size} className={className} />
  if (code === 1 || code === 2) return <CloudSun size={size} className={className} />
  if (code === 3) return <Cloud size={size} className={className} />
  if (code === 45 || code === 48) return <CloudFog size={size} className={className} />
  if (code >= 51 && code <= 55) return <CloudDrizzle size={size} className={className} />
  if (code >= 61 && code <= 65) return <CloudRain size={size} className={className} />
  if (code >= 80 && code <= 82) return <CloudRain size={size} className={className} />
  if (code >= 95) return <CloudLightning size={size} className={className} />
  return <CloudSun size={size} className={className} />
}

function getCardinalDirection(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const idx = Math.round(deg / 22.5) % 16
  return dirs[idx]
}

export const MarineWeatherDashboard: React.FC = () => {
  const [summary, setSummary] = useState<WeatherSummary>({
    temp: 25.8,
    feelsLike: 27.2,
    humidity: 91,
    weatherCode: 1,
    rainMm: 0.1,
    rainProb: 53,
    total36hRain: 4.8,
    waveHeight: 1.06,
    maxWave36h: 1.08,
    wavePeriod: 7.3,
    waveDirection: 253,
    windSpeed: 4.4,
    maxWind36h: 14.1,
    windGusts: 14.4,
    windDirection: 297,
    lat: 16.99,
    lon: 73.30,
    locationName: 'Ratnagiri Coast Sector, Maharashtra',
    basin: 'Arabian Sea • Konkan Shelf',
    nauticalZone: 'Territorial Waters (12 NM Zone)',
    port: 'Mirya Bay Harbor (Ratnagiri)',
    isGps: false,
    lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  })

  const [hourlyList, setHourlyList] = useState<HourlyDataPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [detectingGps, setDetectingGps] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState('Ratnagiri Coast Sector')
  const [activeRange, setActiveRange] = useState<'36' | '12' | '24'>('36')
  const [activeGraphTab, setActiveGraphTab] = useState<'wave' | 'wind' | 'rain' | 'temp' | 'combined'>('wave')
  const [selectedHourIndex, setSelectedHourIndex] = useState<number | null>(null)

  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      )
      const data = await res.json()
      const parts: string[] = []
      if (data.locality || data.city) parts.push(data.locality || data.city)
      if (data.principalSubdivision) parts.push(data.principalSubdivision)
      if (parts.length > 0) return `${parts.join(', ')} Coast`
    } catch {
      // fallback
    }
    return `Coast Sector (${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E)`
  }

  const fetch36hWeather = async (
    targetLat = 16.99,
    targetLon = 73.30,
    isLiveGps = false,
    customName?: string,
    basinInfo = 'Arabian Sea • Coastal Basin',
    zoneInfo = 'Territorial Waters (12 NM Zone)',
    portInfo = 'Nearest Coastal Landing'
  ) => {
    setLoading(true)
    try {
      let resolvedName = customName
      if (!resolvedName) {
        if (isLiveGps) {
          resolvedName = await reverseGeocode(targetLat, targetLon)
        } else {
          resolvedName = 'Ratnagiri Coast Sector, Maharashtra'
        }
      }

      // 1. Fetch Atmospheric 36h forecast
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLon}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m&forecast_hours=36&timezone=auto`

      // 2. Fetch Marine 36h forecast
      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${targetLat}&longitude=${targetLon}&hourly=wave_height,wave_direction,wave_period&forecast_hours=36&timezone=auto`

      const [fRes, mRes] = await Promise.all([
        fetch(forecastUrl).then((r) => r.json()),
        fetch(marineUrl).then((r) => r.json()),
      ])

      const hF = fRes.hourly || {}
      const hM = mRes.hourly || {}

      const times: string[] = hF.time || []
      const items: HourlyDataPoint[] = []

      let totalRain = 0
      let maxWave = 0
      let maxWind = 0

      for (let i = 0; i < times.length && i < 36; i++) {
        const d = new Date(times[i])
        const hours = d.getHours().toString().padStart(2, '0') + ':00'
        const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' })
        const dateLabel = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

        const waveVal = hM.wave_height ? (hM.wave_height[i] ?? 1.0) : 1.0
        const windVal = hF.wind_speed_10m ? (hF.wind_speed_10m[i] ?? 5.0) : 5.0
        const rainVal = hF.precipitation ? (hF.precipitation[i] ?? 0.0) : 0.0
        const wCode = hF.weather_code ? hF.weather_code[i] : 1
        const wText = getWeatherText(wCode)
        const windDirDeg = hF.wind_direction_10m ? hF.wind_direction_10m[i] : 270
        const waveDirDeg = hM.wave_direction ? (hM.wave_direction[i] ?? 250) : 250

        totalRain += rainVal
        if (waveVal > maxWave) maxWave = waveVal
        if (windVal > maxWind) maxWind = windVal

        let safety: 'safe' | 'caution' | 'rough' = 'safe'
        if (waveVal > 2.2 || windVal > 28) {
          safety = 'rough'
        } else if (waveVal > 1.5 || windVal > 20) {
          safety = 'caution'
        }

        items.push({
          timeStr: times[i],
          formattedTime: hours,
          dateLabel,
          dayName,
          hourNumber: i + 1,
          temp: hF.temperature_2m ? Math.round(hF.temperature_2m[i] * 10) / 10 : 25.0,
          humidity: hF.relative_humidity_2m ? hF.relative_humidity_2m[i] : 90,
          rainProb: hF.precipitation_probability ? hF.precipitation_probability[i] : 20,
          rainMm: Math.round(rainVal * 10) / 10,
          weatherCode: wCode,
          weatherText: wText,
          windSpeedKmh: Math.round(windVal * 10) / 10,
          windSpeedKnots: Math.round(windVal * 0.539957 * 10) / 10,
          windDirectionDeg: windDirDeg,
          windDirectionCard: getCardinalDirection(windDirDeg),
          windGustsKmh: hF.wind_gusts_10m ? Math.round(hF.wind_gusts_10m[i] * 10) / 10 : 15.0,
          waveHeightM: Math.round(waveVal * 100) / 100,
          wavePeriodS: hM.wave_period ? Math.round(hM.wave_period[i] * 10) / 10 : 7.0,
          waveDirectionDeg: waveDirDeg,
          waveDirectionCard: getCardinalDirection(waveDirDeg),
          safety,
        })
      }

      setHourlyList(items)

      if (items.length > 0) {
        const cur = items[0]
        setSummary({
          temp: cur.temp,
          feelsLike: cur.temp + 1.2,
          humidity: cur.humidity,
          weatherCode: cur.weatherCode,
          rainMm: cur.rainMm,
          rainProb: cur.rainProb,
          total36hRain: Math.round(totalRain * 10) / 10,
          waveHeight: cur.waveHeightM,
          maxWave36h: Math.round(maxWave * 100) / 100,
          wavePeriod: cur.wavePeriodS,
          waveDirection: cur.waveDirectionDeg,
          windSpeed: cur.windSpeedKmh,
          maxWind36h: Math.round(maxWind * 10) / 10,
          windGusts: cur.windGustsKmh,
          windDirection: cur.windDirectionDeg,
          lat: targetLat,
          lon: targetLon,
          locationName: resolvedName,
          basin: basinInfo,
          nauticalZone: zoneInfo,
          port: portInfo,
          isGps: isLiveGps,
          lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        })
      }
    } catch (err) {
      console.warn('Failed fetching Open-Meteo 36h data:', err)
    } finally {
      setLoading(false)
      setDetectingGps(false)
    }
  }

  // Handle active GPS request
  const handleDetectLiveGps = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser')
      return
    }
    setDetectingGps(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSelectedPreset('custom')
        fetch36hWeather(
          pos.coords.latitude,
          pos.coords.longitude,
          true,
          undefined,
          'Live Fisherman Coordinates • Arabian Sea',
          'Live Marine Navigation Corridor',
          'Active Vessel GPS Position'
        )
      },
      (err) => {
        console.warn('Geolocation failed:', err)
        setDetectingGps(false)
        alert('Could not acquire GPS coordinates. Showing default Ratnagiri Coast Sector.')
        fetch36hWeather(16.99, 73.30, false)
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }

  // Handle preset selector
  const handleSelectPreset = (presetName: string) => {
    setSelectedPreset(presetName)
    const preset = COASTAL_PRESETS.find((p) => p.name === presetName)
    if (preset) {
      fetch36hWeather(
        preset.lat,
        preset.lon,
        false,
        preset.name,
        preset.basin,
        preset.zone,
        preset.port
      )
    }
  }

  useEffect(() => {
    // Initial fetch on mount: try browser GPS first, else fallback to Ratnagiri
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSelectedPreset('custom')
          fetch36hWeather(
            pos.coords.latitude,
            pos.coords.longitude,
            true,
            undefined,
            'Live Fisherman Coordinates • Arabian Sea',
            'Live Marine Navigation Corridor',
            'Active Vessel GPS Position'
          )
        },
        () => {
          fetch36hWeather(16.99, 73.30, false)
        },
        { timeout: 4000 }
      )
    } else {
      fetch36hWeather(16.99, 73.30, false)
    }
  }, [])

  const curWeatherText = getWeatherText(summary.weatherCode)
  const windDirName = getCardinalDirection(summary.windDirection)
  const waveDirName = getCardinalDirection(summary.waveDirection)

  const limitHours = activeRange === '12' ? 12 : activeRange === '24' ? 24 : 36
  const graphData = hourlyList.slice(0, limitHours)

  const activeInspectedItem =
    selectedHourIndex !== null && selectedHourIndex < graphData.length
      ? graphData[selectedHourIndex]
      : graphData[0] || null

  // Custom Clean Tooltip (Sky Blue + White Theme, NO EMOJIS)
  const CustomGraphTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: HourlyDataPoint = payload[0].payload
      return (
        <div className="mwd-clean-tooltip">
          <div className="tooltip-top-bar">
            <span className="tooltip-time-text">
              {data.dayName} {data.formattedTime}
            </span>
            <span className={`tooltip-tag ${data.safety}`}>
              {data.safety.toUpperCase()}
            </span>
          </div>

          <div className="tooltip-weather-summary">
            <WeatherIcon code={data.weatherCode} size={15} className="text-sky" />
            <span className="tooltip-condition-name">{data.weatherText}</span>
            <span className="tooltip-temp-value">{Math.round(data.temp)}°C</span>
          </div>

          <div className="tooltip-specs-grid">
            <div className="tooltip-spec-item">
              <span className="spec-lbl">Wave Swell</span>
              <span className="spec-val text-sky">{data.waveHeightM.toFixed(2)} m</span>
              <span className="spec-sub">{data.wavePeriodS}s • {data.waveDirectionCard}</span>
            </div>

            <div className="tooltip-spec-item">
              <span className="spec-lbl">Wind Speed</span>
              <span className="spec-val text-navy">{data.windSpeedKmh} km/h</span>
              <span className="spec-sub">{data.windSpeedKnots} kts • {data.windDirectionCard}</span>
            </div>

            <div className="tooltip-spec-item">
              <span className="spec-lbl">Precipitation</span>
              <span className="spec-val text-sky">{data.rainProb}%</span>
              <span className="spec-sub">{data.rainMm} mm</span>
            </div>

            <div className="tooltip-spec-item">
              <span className="spec-lbl">Humidity</span>
              <span className="spec-val text-navy">{data.humidity}%</span>
              <span className="spec-sub">Air Temp {data.temp}°C</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="mwd-container">
      {/* ── Top Fisherman Location Command Box (Sky Blue + White Theme) ── */}
      <div className="mwd-location-box">
        <div className="location-box-header">
          <div className="location-box-title-group">
            <div className="location-radar-pulse">
              <Navigation size={20} className="text-sky" />
              <span className="radar-ring" />
            </div>
            <div>
              <div className="location-box-badge-row">
                <span className="location-box-kicker">FISHERMAN LOCATION FIX</span>
                <span className={`location-status-tag ${summary.isGps ? 'live-gps' : 'station'}`}>
                  <span className="live-status-dot" />
                  {summary.isGps ? 'LIVE BOAT GPS' : 'ANCHORED SECTOR'}
                </span>
                <span className="location-api-badge">
                  <Sparkles size={11} className="text-sky" />
                  <span>Open-Meteo Marine Live</span>
                </span>
              </div>
              <h2 className="location-box-main-name">{summary.locationName}</h2>
            </div>
          </div>

          {/* Right: GPS Actions & Live Refresh Button */}
          <div className="location-box-actions">
            <button
              className={`loc-gps-btn ${detectingGps ? 'detecting' : ''}`}
              onClick={handleDetectLiveGps}
              disabled={detectingGps}
              title="Detect My Live Boat GPS coordinates"
            >
              <Crosshair size={14} />
              <span>{detectingGps ? 'Locking Boat GPS...' : 'Detect Live Boat GPS'}</span>
            </button>

            <div className="loc-port-dropdown-wrapper">
              <Anchor size={14} className="port-icon" />
              <select
                className="loc-port-select"
                value={selectedPreset}
                onChange={(e) => handleSelectPreset(e.target.value)}
              >
                <option value="custom">Select Fishing Sector...</option>
                {COASTAL_PRESETS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} ({p.lat.toFixed(2)}°N, {p.lon.toFixed(2)}°E)
                  </option>
                ))}
              </select>
            </div>

            <button
              className={`loc-refresh-btn ${loading ? 'spinning' : ''}`}
              onClick={() =>
                fetch36hWeather(
                  summary.lat,
                  summary.lon,
                  summary.isGps,
                  summary.locationName,
                  summary.basin,
                  summary.nauticalZone,
                  summary.port
                )
              }
              disabled={loading}
              title="Refresh 36-Hour Marine Forecast"
            >
              <RotateCw size={15} />
              <span>{loading ? 'Updating...' : `Updated ${summary.lastUpdated}`}</span>
            </button>
          </div>
        </div>

        {/* Location Box Body / Coordinates & Nautical Details */}
        <div className="location-box-body">
          <div className="loc-detail-chip coords">
            <Compass size={18} className="text-sky" />
            <div className="chip-content">
              <span className="chip-label">GPS COORDINATES</span>
              <span className="chip-value-coords">
                {summary.lat.toFixed(4)}° N, {summary.lon.toFixed(4)}° E
              </span>
            </div>
          </div>

          <div className="loc-detail-chip">
            <Ship size={18} className="text-sky" />
            <div className="chip-content">
              <span className="chip-label">MARITIME BASIN</span>
              <span className="chip-value">{summary.basin}</span>
            </div>
          </div>

          <div className="loc-detail-chip">
            <ShieldCheck size={18} className="text-sky" />
            <div className="chip-content">
              <span className="chip-label">NAUTICAL ZONE</span>
              <span className="chip-value">{summary.nauticalZone}</span>
            </div>
          </div>

          <div className="loc-detail-chip">
            <MapPin size={18} className="text-sky" />
            <div className="chip-content">
              <span className="chip-label">NEAREST HARBOR FIX</span>
              <span className="chip-value">{summary.port}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Weather Briefly: 4 Core Metric Cards (Sky Blue + White) ── */}
      <div className="mwd-summary-grid">
        {/* 1. TEMPERATURE */}
        <div className="mwd-card">
          <div className="mwd-card-head">
            <div className="mwd-card-title-group">
              <Thermometer size={20} className="text-sky" />
              <span className="mwd-card-title">Temperature</span>
            </div>
            <span className="mwd-clean-badge">
              <WeatherIcon code={summary.weatherCode} size={15} className="text-sky" />
              <span>{curWeatherText}</span>
            </span>
          </div>

          <div className="mwd-temp-body">
            <div className="mwd-large-num">
              <span>{summary.temp.toFixed(1)}</span>
              <span className="unit">°C</span>
            </div>
            <div className="mwd-sub-metrics">
              <div className="sub-metric-row">
                <span className="lbl">Feels Like:</span>
                <span className="val">{summary.feelsLike.toFixed(1)} °C</span>
              </div>
              <div className="sub-metric-row">
                <Droplets size={13} className="text-sky" />
                <span className="lbl">Humidity:</span>
                <span className="val">{summary.humidity}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. RAIN */}
        <div className="mwd-card">
          <div className="mwd-card-head">
            <div className="mwd-card-title-group">
              <CloudRain size={20} className="text-sky" />
              <span className="mwd-card-title">Rain & Precip</span>
            </div>
            <span className="mwd-clean-badge">
              <span>{summary.rainMm > 0 ? 'Active Rain' : 'Dry Coast'}</span>
            </span>
          </div>

          <div className="mwd-rain-body">
            <div className="mwd-metric-split">
              <div>
                <span className="sub-lbl">Current Rain</span>
                <div className="mwd-medium-num">
                  <span>{summary.rainMm.toFixed(1)}</span>
                  <span className="unit">mm</span>
                </div>
              </div>
              <div className="split-border" />
              <div>
                <span className="sub-lbl">Rain Probability</span>
                <div className="mwd-medium-num">
                  <span>{summary.rainProb}</span>
                  <span className="unit">%</span>
                </div>
              </div>
            </div>
            <div className="mwd-footer-note">
              36h Cumulative: <strong>{summary.total36hRain} mm</strong>
            </div>
          </div>
        </div>

        {/* 3. WAVE */}
        <div className="mwd-card">
          <div className="mwd-card-head">
            <div className="mwd-card-title-group">
              <Waves size={20} className="text-sky" />
              <span className="mwd-card-title">Wave & Sea State</span>
            </div>
            <span className="mwd-clean-badge">
              <span>{summary.waveHeight <= 1.5 ? 'Calm Swell' : 'Moderate Swell'}</span>
            </span>
          </div>

          <div className="mwd-wave-body">
            <div className="mwd-large-num">
              <span>{summary.waveHeight.toFixed(2)}</span>
              <span className="unit">meters</span>
            </div>
            <div className="mwd-sub-metrics">
              <div className="sub-metric-row">
                <span className="lbl">Swell Period:</span>
                <span className="val">{summary.wavePeriod.toFixed(1)} sec</span>
              </div>
              <div className="sub-metric-row">
                <span className="lbl">Direction:</span>
                <span className="val">
                  {summary.waveDirection}° {waveDirName}
                </span>
              </div>
            </div>
          </div>

          <div className="mwd-gauge-container">
            <div className="mwd-gauge-track">
              <div
                className="mwd-gauge-fill"
                style={{ width: `${Math.min((summary.waveHeight / 3.0) * 100, 100)}%` }}
              />
            </div>
            <div className="mwd-gauge-labels">
              <span>0-1.5m Calm</span>
              <span>1.5-2.5m Moderate</span>
              <span>&gt;2.5m Rough</span>
            </div>
          </div>
        </div>

        {/* 4. WIND */}
        <div className="mwd-card">
          <div className="mwd-card-head">
            <div className="mwd-card-title-group">
              <Wind size={20} className="text-sky" />
              <span className="mwd-card-title">Wind & Gusts</span>
            </div>
            <span className="mwd-clean-badge">
              <span>{Math.round(summary.windSpeed * 0.539957 * 10) / 10} knots</span>
            </span>
          </div>

          <div className="mwd-wind-body">
            <div className="mwd-large-num">
              <span>{summary.windSpeed.toFixed(1)}</span>
              <span className="unit">km/h</span>
            </div>
            <div className="mwd-sub-metrics">
              <div className="sub-metric-row">
                <Compass size={13} className="text-sky" />
                <span className="lbl">Direction:</span>
                <span className="val">
                  {summary.windDirection}° {windDirName}
                </span>
              </div>
              <div className="sub-metric-row">
                <span className="lbl">Max Gusts:</span>
                <span className="val">{summary.windGusts.toFixed(1)} km/h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 36-Hour Hourly Prediction Graph Section (Sky Blue + White Theme) ── */}
      <div className="mwd-graph-section">
        {/* Graph Header Controls */}
        <div className="mwd-graph-header">
          <div className="mwd-graph-title-col">
            <div className="mwd-graph-heading-row">
              <TrendingUp size={19} className="text-sky" />
              <h3 className="mwd-graph-title">36-Hour Hourly Weather & Marine Forecast Graph</h3>
            </div>
            <p className="mwd-graph-subtitle">
              Interactive hourly wave swell, wind velocity & precipitation trends
            </p>
          </div>

          <div className="mwd-graph-controls">
            {/* Metric Tab Switchers */}
            <div className="mwd-tab-pills">
              <button
                className={`tab-pill ${activeGraphTab === 'wave' ? 'active' : ''}`}
                onClick={() => setActiveGraphTab('wave')}
              >
                <Waves size={13} />
                <span>Wave Height</span>
              </button>
              <button
                className={`tab-pill ${activeGraphTab === 'wind' ? 'active' : ''}`}
                onClick={() => setActiveGraphTab('wind')}
              >
                <Wind size={13} />
                <span>Wind & Gusts</span>
              </button>
              <button
                className={`tab-pill ${activeGraphTab === 'rain' ? 'active' : ''}`}
                onClick={() => setActiveGraphTab('rain')}
              >
                <CloudRain size={13} />
                <span>Rain & Rain %</span>
              </button>
              <button
                className={`tab-pill ${activeGraphTab === 'temp' ? 'active' : ''}`}
                onClick={() => setActiveGraphTab('temp')}
              >
                <Thermometer size={13} />
                <span>Temperature</span>
              </button>
              <button
                className={`tab-pill ${activeGraphTab === 'combined' ? 'active' : ''}`}
                onClick={() => setActiveGraphTab('combined')}
              >
                <Layers size={13} />
                <span>Combined</span>
              </button>
            </div>

            {/* Time Horizon Filter */}
            <div className="mwd-horizon-pills">
              <button
                className={`horizon-btn ${activeRange === '12' ? 'active' : ''}`}
                onClick={() => setActiveRange('12')}
              >
                12h
              </button>
              <button
                className={`horizon-btn ${activeRange === '24' ? 'active' : ''}`}
                onClick={() => setActiveRange('24')}
              >
                24h
              </button>
              <button
                className={`horizon-btn ${activeRange === '36' ? 'active' : ''}`}
                onClick={() => setActiveRange('36')}
              >
                36h
              </button>
            </div>
          </div>
        </div>

        {/* ── Active Graph (Sky Blue Theme) ── */}
        <div className="mwd-chart-wrapper">
          <ResponsiveContainer width="100%" height={320}>
            {activeGraphTab === 'wave' ? (
              <AreaChart data={graphData} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="skyWaveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" vertical={false} />
                <XAxis
                  dataKey="formattedTime"
                  stroke="#475569"
                  fontSize={13}
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#475569"
                  fontSize={13}
                  tickLine={false}
                  unit="m"
                  domain={[
                    (dataMin: number) => Math.max(0, Math.floor((dataMin - 0.2) * 10) / 10),
                    (dataMax: number) => Math.max(2.0, Math.ceil((dataMax + 0.3) * 10) / 10),
                  ]}
                />
                <Tooltip content={<CustomGraphTooltip />} />
                <ReferenceLine
                  y={1.5}
                  stroke="#0284c7"
                  strokeDasharray="4 4"
                  strokeOpacity={0.65}
                  label={{ value: 'Caution Line (1.5m)', position: 'top', fill: '#0284c7', fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="waveHeightM"
                  name="Wave Height"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#skyWaveGradient)"
                  activeDot={{ r: 5, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : activeGraphTab === 'wind' ? (
              <AreaChart data={graphData} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="skyWindGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0369a1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" vertical={false} />
                <XAxis
                  dataKey="formattedTime"
                  stroke="#475569"
                  fontSize={13}
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#475569"
                  fontSize={13}
                  tickLine={false}
                  unit="km/h"
                  domain={[0, (dataMax: number) => Math.ceil(dataMax + 5)]}
                />
                <Tooltip content={<CustomGraphTooltip />} />
                <Area
                  type="monotone"
                  dataKey="windGustsKmh"
                  name="Wind Gusts"
                  stroke="#38bdf8"
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  fillOpacity={0}
                />
                <Area
                  type="monotone"
                  dataKey="windSpeedKmh"
                  name="Wind Speed"
                  stroke="#0369a1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#skyWindGradient)"
                  activeDot={{ r: 5, fill: '#0369a1', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : activeGraphTab === 'rain' ? (
              <ComposedChart data={graphData} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="skyRainGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#bae6fd" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" vertical={false} />
                <XAxis
                  dataKey="formattedTime"
                  stroke="#475569"
                  fontSize={13}
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#0284c7"
                  fontSize={13}
                  tickLine={false}
                  unit="%"
                  domain={[0, 100]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#0369a1"
                  fontSize={13}
                  tickLine={false}
                  unit="mm"
                  domain={[0, (max: number) => Math.max(Math.ceil(max + 1), 5)]}
                />
                <Tooltip content={<CustomGraphTooltip />} />
                <Bar
                  yAxisId="right"
                  dataKey="rainMm"
                  name="Rain Volume"
                  fill="#0284c7"
                  radius={[3, 3, 0, 0]}
                  barSize={12}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="rainProb"
                  name="Rain Probability"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#skyRainGradient)"
                  activeDot={{ r: 5, fill: '#0284c7' }}
                />
              </ComposedChart>
            ) : activeGraphTab === 'temp' ? (
              <AreaChart data={graphData} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="skyTempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#e0f2fe" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" vertical={false} />
                <XAxis
                  dataKey="formattedTime"
                  stroke="#475569"
                  fontSize={13}
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#475569"
                  fontSize={13}
                  tickLine={false}
                  unit="°C"
                  domain={[(dataMin: number) => Math.floor(dataMin - 1), (dataMax: number) => Math.ceil(dataMax + 1)]}
                />
                <Tooltip content={<CustomGraphTooltip />} />
                <Area
                  type="monotone"
                  dataKey="temp"
                  name="Temperature"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#skyTempGradient)"
                  activeDot={{ r: 5, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              /* Combined Multi-Metric Graph */
              <ComposedChart data={graphData} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" vertical={false} />
                <XAxis
                  dataKey="formattedTime"
                  stroke="#475569"
                  fontSize={13}
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#0284c7"
                  fontSize={13}
                  tickLine={false}
                  unit="m"
                  domain={[0, 4]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#0369a1"
                  fontSize={13}
                  tickLine={false}
                  unit="km/h"
                  domain={[0, 40]}
                />
                <Tooltip content={<CustomGraphTooltip />} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="waveHeightM"
                  name="Wave Height (m)"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="windSpeedKmh"
                  name="Wind Speed (km/h)"
                  stroke="#0369a1"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="windGustsKmh"
                  name="Gusts (km/h)"
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                  dot={false}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* ── Subtle Hourly Navigation Timeline Strip (NO EMOJIS, SKY BLUE + WHITE) ── */}
        <div className="mwd-subtle-timeline">
          <div className="subtle-timeline-head">
            <span className="subtle-timeline-title">
              Hourly Navigation Timeline ({graphData.length} Hours Forecast)
            </span>
            <span className="subtle-timeline-hint">Scroll horizontally • Click hour to inspect</span>
          </div>

          <div className="subtle-timeline-strip">
            {graphData.map((item, index) => {
              const isSelected = selectedHourIndex === index
              return (
                <div
                  key={index}
                  className={`subtle-hour-pill ${item.safety} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedHourIndex(index)}
                  title={`Hour ${item.formattedTime}: Wave ${item.waveHeightM}m, Wind ${item.windSpeedKmh}km/h`}
                >
                  <div className="shp-header">
                    <span className="shp-time">{item.formattedTime}</span>
                    <span className="shp-day">{item.dayName}</span>
                  </div>

                  <div className="shp-weather">
                    <WeatherIcon code={item.weatherCode} size={16} className="text-sky" />
                    <span className="shp-temp">{Math.round(item.temp)}°</span>
                  </div>

                  <div className="shp-metrics">
                    <div className="shp-row">
                      <span className="shp-lbl">Wave</span>
                      <span className="shp-val text-sky">{item.waveHeightM.toFixed(1)}m</span>
                    </div>
                    <div className="shp-row">
                      <span className="shp-lbl">Wind</span>
                      <span className="shp-val">{Math.round(item.windSpeedKmh)}</span>
                    </div>
                    <div className="shp-row">
                      <span className="shp-lbl">Rain</span>
                      <span className="shp-val">{item.rainProb}%</span>
                    </div>
                  </div>

                  <div className="shp-footer">
                    <span className={`shp-status-badge ${item.safety}`}>
                      {item.safety === 'safe' ? 'Safe' : item.safety === 'caution' ? 'Caution' : 'Rough'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Selected Hour Readout Bar (Clean Sky Blue + White) ── */}
        {activeInspectedItem && (
          <div className="mwd-clean-inspector-bar">
            <div className="clean-ins-left">
              <span className="clean-ins-kicker">SELECTED HOUR FIX:</span>
              <span className="clean-ins-time">
                {activeInspectedItem.dayName} {activeInspectedItem.formattedTime} ({activeInspectedItem.dateLabel})
              </span>
              <span className="clean-ins-condition">
                <WeatherIcon code={activeInspectedItem.weatherCode} size={16} className="text-sky" />
                <span>{activeInspectedItem.weatherText}</span>
              </span>
            </div>

            <div className="clean-ins-metrics">
              <div className="clean-ins-stat">
                <span className="lbl">Wave Swell:</span>
                <span className="val text-sky">
                  {activeInspectedItem.waveHeightM.toFixed(2)} m ({activeInspectedItem.wavePeriodS}s)
                </span>
              </div>
              <div className="clean-ins-stat">
                <span className="lbl">Wind:</span>
                <span className="val text-navy">
                  {activeInspectedItem.windSpeedKmh} km/h ({activeInspectedItem.windSpeedKnots} kts)
                </span>
              </div>
              <div className="clean-ins-stat">
                <span className="lbl">Precipitation:</span>
                <span className="val text-sky">
                  {activeInspectedItem.rainProb}% ({activeInspectedItem.rainMm} mm)
                </span>
              </div>
              <div className="clean-ins-stat">
                <span className="lbl">Temperature:</span>
                <span className="val text-navy">
                  {activeInspectedItem.temp}°C
                </span>
              </div>
            </div>

            <div className="clean-ins-right">
              <span className={`clean-ins-badge ${activeInspectedItem.safety}`}>
                {activeInspectedItem.safety === 'safe'
                  ? 'FAVORABLE NAVIGATION CONDITIONS'
                  : activeInspectedItem.safety === 'caution'
                  ? 'MODERATE SWELL • CAUTION'
                  : 'ROUGH SEA CONDITIONS'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
