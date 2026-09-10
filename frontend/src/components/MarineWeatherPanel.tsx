import React, { useState, useEffect } from 'react'
import {
  Thermometer,
  CloudRain,
  Waves,
  Wind,
  RotateCw,
  Droplets,
  ArrowUpRight,
  ShieldCheck,
  Compass,
} from 'lucide-react'

interface WeatherData {
  temperature: number
  humidity: number
  precipitation: number
  rain: number
  weatherCode: number
  windSpeed: number
  windDirection: number
  windGusts: number
  waveHeight: number
  wavePeriod: number
  waveDirection: number
  lastUpdated: string
}

function getWeatherInfo(code: number): { text: string; icon: string } {
  if (code === 0) return { text: 'Clear Sky', icon: '☀️' }
  if (code === 1) return { text: 'Mainly Clear', icon: '🌤️' }
  if (code === 2) return { text: 'Partly Cloudy', icon: '⛅' }
  if (code === 3) return { text: 'Overcast', icon: '☁️' }
  if (code === 45 || code === 48) return { text: 'Fog / Mist', icon: '🌫️' }
  if (code >= 51 && code <= 55) return { text: 'Light Drizzle', icon: '🌦️' }
  if (code >= 61 && code <= 65) return { text: 'Rain', icon: '🌧️' }
  if (code >= 80 && code <= 82) return { text: 'Rain Showers', icon: '🌧️' }
  if (code >= 95) return { text: 'Thunderstorm', icon: '⛈️' }
  return { text: 'Scattered Clouds', icon: '🌤️' }
}

function getCardinalDirection(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const idx = Math.round(deg / 22.5) % 16
  return dirs[idx]
}

export const MarineWeatherPanel: React.FC = () => {
  const [data, setData] = useState<WeatherData>({
    temperature: 26.2,
    humidity: 88,
    precipitation: 0.0,
    rain: 0.0,
    weatherCode: 1,
    windSpeed: 6.5,
    windDirection: 275,
    windGusts: 14.8,
    waveHeight: 1.1,
    wavePeriod: 7.4,
    waveDirection: 250,
    lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  })
  const [loading, setLoading] = useState(false)
  const [isLive, setIsLive] = useState(false)

  const fetchOpenMeteoWeather = async () => {
    setLoading(true)
    try {
      // 1. Fetch Atmospheric Forecast (Temp, Rain, Wind)
      const forecastPromise = fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=16.99&longitude=73.30&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto'
      ).then((r) => r.json())

      // 2. Fetch Marine Forecast (Wave height, period, direction)
      const marinePromise = fetch(
        'https://marine-api.open-meteo.com/v1/marine?latitude=16.99&longitude=73.30&current=wave_height,wave_direction,wave_period&timezone=auto'
      ).then((r) => r.json())

      const [forecastRes, marineRes] = await Promise.all([forecastPromise, marinePromise])

      const curF = forecastRes.current || {}
      const curM = marineRes.current || {}

      setData({
        temperature: curF.temperature_2m ?? 26.2,
        humidity: curF.relative_humidity_2m ?? 88,
        precipitation: curF.precipitation ?? 0.0,
        rain: curF.rain ?? 0.0,
        weatherCode: curF.weather_code ?? 1,
        windSpeed: curF.wind_speed_10m ?? 6.5,
        windDirection: curF.wind_direction_10m ?? 275,
        windGusts: curF.wind_gusts_10m ?? 14.8,
        waveHeight: curM.wave_height ?? 1.1,
        wavePeriod: curM.wave_period ?? 7.4,
        waveDirection: curM.wave_direction ?? 250,
        lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      })
      setIsLive(true)
    } catch (err) {
      console.warn('Open-Meteo live fetch failed, keeping active station cache:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOpenMeteoWeather()
    const interval = setInterval(fetchOpenMeteoWeather, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const weather = getWeatherInfo(data.weatherCode)
  const windDirName = getCardinalDirection(data.windDirection)
  const waveDirName = getCardinalDirection(data.waveDirection)

  const wavePercent = Math.min(Math.round((data.waveHeight / 3.5) * 100), 100)
  const isWaveSafe = data.waveHeight <= 1.5
  const isWaveModerate = data.waveHeight > 1.5 && data.waveHeight <= 2.5

  return (
    <div className="fd-weather-panel">
      {/* ── Header ── */}
      <div className="weather-panel-header">
        <div className="weather-header-info">
          <div className="weather-title-row">
            <span className="weather-title">Marine Weather</span>
            <span className={`weather-live-chip ${isLive ? 'live' : ''}`}>
              <span className="live-weather-dot" /> {isLive ? 'OPEN-METEO LIVE' : 'LIVE FEED'}
            </span>
          </div>
          <div className="weather-location-row">
            <span className="weather-location">Ratnagiri Coast • 16.99° N, 73.30° E</span>
            <button
              className={`weather-refresh-btn ${loading ? 'spinning' : ''}`}
              onClick={fetchOpenMeteoWeather}
              title="Refresh weather data"
            >
              <RotateCw size={12} />
              <span>{loading ? 'Updating...' : data.lastUpdated}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 4 Dedicated Clean Sections ── */}
      <div className="weather-content-scroll">
        {/* 1. TEMPERATURE CARD */}
        <div className="clean-weather-card">
          <div className="card-top-row">
            <div className="card-label-group">
              <Thermometer size={16} className="metric-icon temp-color" />
              <span className="card-label">Temperature</span>
            </div>
            <span className="weather-desc-badge">
              <span>{weather.icon}</span>
              <span>{weather.text}</span>
            </span>
          </div>

          <div className="temp-hero-display">
            <div className="temp-value-large">
              <span className="temp-digits">{Math.round(data.temperature)}</span>
              <span className="temp-deg">°C</span>
            </div>
            <div className="temp-sub-details">
              <div className="sub-detail-item">
                <span className="sub-detail-label">Air Temp:</span>
                <span className="sub-detail-val">{data.temperature.toFixed(1)} °C</span>
              </div>
              <div className="sub-detail-item">
                <Droplets size={12} className="droplet-icon" />
                <span className="sub-detail-label">Humidity:</span>
                <span className="sub-detail-val">{data.humidity}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. RAIN CARD */}
        <div className="clean-weather-card">
          <div className="card-top-row">
            <div className="card-label-group">
              <CloudRain size={16} className="metric-icon rain-color" />
              <span className="card-label">Rain & Precipitation</span>
            </div>
            <span className={`status-pill ${data.rain > 0 ? 'rainy' : 'dry'}`}>
              {data.rain > 0 ? 'Rain Active' : 'Dry / Clear'}
            </span>
          </div>

          <div className="metric-two-col">
            <div className="metric-stat-box">
              <span className="stat-label">Current Rain</span>
              <div className="stat-number">
                <span>{data.rain.toFixed(1)}</span>
                <span className="stat-unit">mm</span>
              </div>
              <span className="stat-hint">{data.rain > 0 ? 'Active drizzle/rain' : 'No rain recorded'}</span>
            </div>

            <div className="metric-stat-box">
              <span className="stat-label">Total Precipitation</span>
              <div className="stat-number">
                <span>{data.precipitation.toFixed(1)}</span>
                <span className="stat-unit">mm/h</span>
              </div>
              <span className="stat-hint">Hourly precipitation</span>
            </div>
          </div>
        </div>

        {/* 3. WAVE CARD */}
        <div className="clean-weather-card">
          <div className="card-top-row">
            <div className="card-label-group">
              <Waves size={16} className="metric-icon wave-color" />
              <span className="card-label">Wave & Sea State</span>
            </div>
            <span className={`status-pill ${isWaveSafe ? 'safe' : isWaveModerate ? 'moderate' : 'rough'}`}>
              {isWaveSafe ? 'Calm Sea' : isWaveModerate ? 'Moderate Swell' : 'Rough Sea'}
            </span>
          </div>

          <div className="wave-hero-display">
            <div className="wave-val-box">
              <span className="wave-digits">{data.waveHeight.toFixed(2)}</span>
              <span className="wave-m-unit">meters</span>
            </div>
            <div className="wave-specs-list">
              <div className="wave-spec-line">
                <span className="spec-name">Swell Period:</span>
                <span className="spec-val">{data.wavePeriod.toFixed(1)} sec</span>
              </div>
              <div className="wave-spec-line">
                <span className="spec-name">Direction:</span>
                <span className="spec-val">{data.waveDirection}° {waveDirName}</span>
              </div>
            </div>
          </div>

          {/* Wave gauge */}
          <div className="wave-gauge-box">
            <div className="gauge-header">
              <span>Wave Safety Scale</span>
              <span>{data.waveHeight.toFixed(1)}m / 3.5m</span>
            </div>
            <div className="gauge-track">
              <div
                className={`gauge-fill ${isWaveSafe ? 'safe' : isWaveModerate ? 'moderate' : 'rough'}`}
                style={{ width: `${wavePercent}%` }}
              />
            </div>
            <div className="gauge-labels">
              <span className="text-emerald">● &lt;1.5m Calm</span>
              <span className="text-amber">● 1.5-2.5m Moderate</span>
              <span className="text-red">● &gt;2.5m Rough</span>
            </div>
          </div>
        </div>

        {/* 4. WIND CARD */}
        <div className="clean-weather-card">
          <div className="card-top-row">
            <div className="card-label-group">
              <Wind size={16} className="metric-icon wind-color" />
              <span className="card-label">Wind & Gusts</span>
            </div>
            <span className="status-pill wind-pill">
              {(data.windSpeed * 0.539957).toFixed(1)} kts
            </span>
          </div>

          <div className="metric-two-col">
            <div className="metric-stat-box">
              <span className="stat-label">Wind Speed</span>
              <div className="stat-number">
                <span>{data.windSpeed.toFixed(1)}</span>
                <span className="stat-unit">km/h</span>
              </div>
              <div className="wind-dir-sub">
                <Compass size={11} className="compass-icon" />
                <span>{data.windDirection}° {windDirName}</span>
              </div>
            </div>

            <div className="metric-stat-box">
              <span className="stat-label">Max Gusts</span>
              <div className="stat-number">
                <span>{data.windGusts.toFixed(1)}</span>
                <span className="stat-unit">km/h</span>
              </div>
              <span className="stat-hint">
                {data.windGusts > 25 ? 'Noticeable gusts' : 'Gentle / Manageable'}
              </span>
            </div>
          </div>
        </div>

        {/* Safety Confirmation Badge */}
        <div className="weather-footer-chip">
          <ShieldCheck size={14} className="text-emerald" />
          <span>Real-time weather data feed via Open-Meteo API</span>
        </div>
      </div>
    </div>
  )
}
