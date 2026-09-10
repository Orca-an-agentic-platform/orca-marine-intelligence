import React, { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

// Ratnagiri Coast center
const RATNAGIRI_CENTER: [number, number] = [73.30, 16.99]
const DEFAULT_ZOOM = 8.5

// Real-time PFZ Zones aligned with INCOIS Oceansat / OCM satellite advisory lines
const PFZ_ZONES = [
  {
    id: 'pfz-ratnagiri',
    name: 'PFZ Sector Ratnagiri',
    sector: 'Ratnagiri Coast (Maharashtra)',
    distance: '12.5 km SW',
    bearing: '225° SW',
    depth: '35–50 m',
    sst: '28.4 °C',
    species: 'Mackerel, Sardine, Tuna',
    confidence: 'HIGH (INCOIS Satellite Line)',
    bounds: [[73.12, 16.84], [73.28, 17.00]] as [[number, number], [number, number]],
    center: [73.20, 16.92] as [number, number],
  },
  {
    id: 'pfz-jaigarh',
    name: 'PFZ Sector Jaigarh',
    sector: 'Jaigarh North (Maharashtra)',
    distance: '26.4 km NW',
    bearing: '315° NW',
    depth: '30–45 m',
    sst: '28.2 °C',
    species: 'Pelagic Shoals, Ribbonfish',
    confidence: 'MEDIUM (INCOIS Thermal Front)',
    bounds: [[73.02, 17.08], [73.18, 17.28]] as [[number, number], [number, number]],
    center: [73.10, 17.18] as [number, number],
  },
  {
    id: 'pfz-vijaydurg',
    name: 'PFZ Sector Vijaydurg',
    sector: 'Vijaydurg South (Maharashtra)',
    distance: '52.0 km S',
    bearing: '185° S',
    depth: '40–60 m',
    sst: '28.5 °C',
    species: 'Anchovy, Carangids, Mackerel',
    confidence: 'HIGH (INCOIS Chlorophyll Front)',
    bounds: [[73.06, 16.44], [73.24, 16.66]] as [[number, number], [number, number]],
    center: [73.15, 16.55] as [number, number],
  },
  {
    id: 'pfz-kochi',
    name: 'PFZ Sector Kochi (Kerala)',
    sector: 'Kerala Coast (Central)',
    distance: '18.5 km WSW',
    bearing: '240° WSW',
    depth: '35–55 m',
    sst: '29.1 °C',
    species: 'Oil Sardine, Indian Mackerel, Squid',
    confidence: 'HIGH (INCOIS Satellite Front)',
    bounds: [[75.68, 9.80], [75.95, 10.05]] as [[number, number], [number, number]],
    center: [75.82, 9.92] as [number, number],
  },
  {
    id: 'pfz-kozhikode',
    name: 'PFZ Sector Kozhikode (Kerala)',
    sector: 'Kerala Coast (North)',
    distance: '22.0 km W',
    bearing: '270° W',
    depth: '30–50 m',
    sst: '28.9 °C',
    species: 'Yellowfin Tuna, Ribbonfish, Threadfin',
    confidence: 'HIGH (INCOIS Chlorophyll Front)',
    bounds: [[75.28, 11.12], [75.58, 11.38]] as [[number, number], [number, number]],
    center: [75.44, 11.25] as [number, number],
  },
  {
    id: 'pfz-kollam',
    name: 'PFZ Sector Kollam (Kerala)',
    sector: 'Kerala Coast (South)',
    distance: '25.5 km SW',
    bearing: '230° SW',
    depth: '45–75 m',
    sst: '29.2 °C',
    species: 'Deep-sea Prawn, Cuttlefish, Seer fish',
    confidence: 'HIGH (INCOIS Thermal Front)',
    bounds: [[76.08, 8.75], [76.38, 9.02]] as [[number, number], [number, number]],
    center: [76.22, 8.88] as [number, number],
  },
  {
    id: 'pfz-goa',
    name: 'PFZ Sector Mormugao (Goa)',
    sector: 'Goa Coast',
    distance: '19.0 km WSW',
    bearing: '245° WSW',
    depth: '35–55 m',
    sst: '28.6 °C',
    species: 'Kingfish, Seer fish, Mackerel',
    confidence: 'HIGH (INCOIS Satellite Front)',
    bounds: [[73.38, 15.28], [73.68, 15.52]] as [[number, number], [number, number]],
    center: [73.55, 15.40] as [number, number],
  },
  {
    id: 'pfz-malpe',
    name: 'PFZ Sector Malpe (Karnataka)',
    sector: 'Karnataka Coast',
    distance: '17.2 km W',
    bearing: '275° W',
    depth: '32–52 m',
    sst: '28.7 °C',
    species: 'Silver Pomfret, Mackerel, Sardine',
    confidence: 'HIGH (INCOIS Chlorophyll Front)',
    bounds: [[74.28, 13.20], [74.58, 13.48]] as [[number, number], [number, number]],
    center: [74.43, 13.34] as [number, number],
  },
]

// Sample restricted zone
const RESTRICTED_ZONE = {
  id: 'restricted-1',
  name: 'Restricted Zone',
  coordinates: [
    [73.45, 17.0],
    [73.55, 17.0],
    [73.55, 17.2],
    [73.45, 17.2],
    [73.45, 17.0],
  ] as [number, number][],
}

// Sample vessel positions
const VESSELS = [
  { id: 'v1', name: 'MV Matsya I', lat: 16.85, lon: 73.05, color: '#00c2d4' },
  { id: 'v2', name: 'MV Sagari', lat: 17.15, lon: 72.95, color: '#4ade80' },
  { id: 'v3', name: 'FV Ratna Deep', lat: 16.55, lon: 73.20, color: '#fbbf24' },
  { id: 'v4', name: 'MV Konkan Star', lat: 17.35, lon: 73.10, color: '#f87171' },
]

// SST hotspot areas
const SST_HOTSPOTS = [
  { id: 'sst-1', center: [73.15, 16.7] as [number, number], label: 'SST +0.3°' },
]

interface LayerState {
  pfz: boolean
  sst: boolean
  chlorophyll: boolean
  restricted: boolean
  vessels: boolean
}

export const OrcaMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const userMarkerRef = useRef<maplibregl.Marker | null>(null)
  const currentPopupRef = useRef<maplibregl.Popup | null>(null)
  const [layers, setLayers] = useState<LayerState>({
    pfz: true,
    sst: true,
    chlorophyll: false,
    restricted: true,
    vessels: true,
  })
  const [mapLoaded, setMapLoaded] = useState(false)
  const [incoisOnline, setIncoisOnline] = useState<boolean | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number]>([73.285, 16.965])
  const [gpsActive, setGpsActive] = useState(false)

  // Function to open full view of a PFZ zone and show its advisory popup
  const openPfzFullView = (pfz: (typeof PFZ_ZONES)[0]) => {
    const m = map.current
    if (!m) return

    if (currentPopupRef.current) {
      currentPopupRef.current.remove()
    }

    // Ensure PFZ layer is enabled so vector geometries and labels are visible
    setLayers((prev) => (prev.pfz ? prev : { ...prev, pfz: true }))

    // Smoothly fly & fit the map bounds to the selected PFZ zone
    m.fitBounds(pfz.bounds, {
      padding: { top: 90, bottom: 90, left: 90, right: 90 },
      duration: 1200,
      maxZoom: 11.2,
      essential: true,
    })

    const popup = new maplibregl.Popup({ offset: 14, closeButton: true, closeOnClick: false })
      .setLngLat(pfz.center)
      .setHTML(`
        <div style="color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 6px 4px; font-size: 12px; line-height: 1.5; min-width: 250px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 4px;">
            <div style="font-weight: 800; color: #047857; font-size: 13.5px; display: flex; align-items: center; gap: 4px;">
              🎯 ${pfz.name}
            </div>
            <span style="font-size: 10px; background: #ecfdf5; color: #059669; font-weight: 700; padding: 2px 6px; border-radius: 9999px; border: 1px solid #a7f3d0;">FULL VIEW</span>
          </div>
          <div style="margin-bottom: 2px;"><strong>Sector:</strong> ${pfz.sector}</div>
          <div style="margin-bottom: 2px;"><strong>Distance from Port:</strong> ${pfz.distance} (${pfz.bearing})</div>
          <div style="margin-bottom: 2px;"><strong>Satellite Status:</strong> ${pfz.confidence}</div>
          <div style="margin-bottom: 2px;"><strong>Target Catch:</strong> <span style="color: #0284c7; font-weight: 700;">${pfz.species}</span></div>
          <div style="margin-bottom: 2px;"><strong>Water Depth:</strong> ${pfz.depth} | <strong>SST:</strong> ${pfz.sst}</div>
          <div style="margin-bottom: 2px;"><strong>Wave Condition:</strong> 1.8 m (Moderate Sea State)</div>
          <div style="margin-top: 6px; padding: 5px 8px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; color: #15803d; font-weight: 700; font-size: 11px; display: flex; align-items: center; gap: 5px;">
            <span>✓</span> Safe Fishing Sector (Matches ORCA AI Advisory)
          </div>
        </div>
      `)
      .addTo(m)

    currentPopupRef.current = popup
  }

  // Function to open full view of the Restricted/Prohibited Marine Area
  const openRestrictedFullView = () => {
    const m = map.current
    if (!m) return

    if (currentPopupRef.current) {
      currentPopupRef.current.remove()
    }

    setLayers((prev) => (prev.restricted ? prev : { ...prev, restricted: true }))

    const bounds: [[number, number], [number, number]] = [
      [73.43, 16.98],
      [73.57, 17.22],
    ]

    m.fitBounds(bounds, {
      padding: { top: 90, bottom: 90, left: 90, right: 90 },
      duration: 1200,
      maxZoom: 11.2,
      essential: true,
    })

    const popup = new maplibregl.Popup({ offset: 14, closeButton: true, closeOnClick: false })
      .setLngLat([73.50, 17.10])
      .setHTML(`
        <div style="color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 6px 4px; font-size: 12px; line-height: 1.5; min-width: 250px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1.5px solid #fee2e2; padding-bottom: 4px;">
            <div style="font-weight: 800; color: #dc2626; font-size: 13.5px; display: flex; align-items: center; gap: 4px;">
              ⛔ Prohibited Marine Area
            </div>
            <span style="font-size: 10px; background: #fef2f2; color: #b91c1c; font-weight: 700; padding: 2px 6px; border-radius: 9999px; border: 1px solid #fecaca;">FULL VIEW</span>
          </div>
          <div style="margin-bottom: 2px;"><strong>Zone:</strong> Ratnagiri Offshore Defence & Ecological Corridor</div>
          <div style="margin-bottom: 2px;"><strong>Coordinates:</strong> 17.00°–17.20° N, 73.45°–73.55° E</div>
          <div style="margin-bottom: 2px;"><strong>Status:</strong> <span style="color: #dc2626; font-weight: 800;">STRICTLY NO FISHING</span></div>
          <div style="margin-bottom: 2px;"><strong>Enforcement:</strong> Indian Coast Guard / Marine Police Radar</div>
          <div style="margin-top: 6px; padding: 6px 8px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; color: #991b1b; font-size: 11px; font-weight: 600; line-height: 1.4;">
            ⚠️ Vessel entry strictly prohibited. Automatic AIS violation alert will be transmitted if crossed.
          </div>
        </div>
      `)
      .addTo(m)

    currentPopupRef.current = popup
  }

  // Check live INCOIS status on mount
  useEffect(() => {
    fetch('/geo/status')
      .then((res) => res.json())
      .then((data) => setIncoisOnline(data.incois_wms_online ?? true))
      .catch(() => setIncoisOnline(false))
  }, [])

  // Listen for external jump-zone events (from chat or other cards)
  useEffect(() => {
    const handleJumpZone = (e: CustomEvent<{ zoneId: string }>) => {
      const zoneId = e.detail?.zoneId
      if (!zoneId) return
      if (zoneId === 'restricted' || zoneId === 'restricted-1') {
        openRestrictedFullView()
      } else {
        const found = PFZ_ZONES.find((z) => z.id === zoneId || z.name.toLowerCase().includes(zoneId.toLowerCase()))
        if (found) openPfzFullView(found)
      }
    }
    window.addEventListener('orca:jump-zone' as any, handleJumpZone)
    return () => window.removeEventListener('orca:jump-zone' as any, handleJumpZone)
  }, [])

  // ── Real-Time User Geolocation with Fisherman / People Icon ──
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude]
          setUserLocation(coords)
          setGpsActive(true)
          updateUserMarker(coords, true)
        },
        (err) => {
          console.warn('Geolocation not available or permission denied:', err.message)
          // Fallback to active coordinates off Ratnagiri Coast
          const fallbackCoords: [number, number] = [73.285, 16.965]
          setUserLocation(fallbackCoords)
          setGpsActive(false)
          updateUserMarker(fallbackCoords, false)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
      )

      return () => navigator.geolocation.clearWatch(watchId)
    } else {
      const fallbackCoords: [number, number] = [73.285, 16.965]
      setUserLocation(fallbackCoords)
      updateUserMarker(fallbackCoords, false)
    }
  }, [mapLoaded])

  const updateUserMarker = (coords: [number, number], isLiveGPS: boolean) => {
    const m = map.current
    if (!m) return

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat(coords)
      return
    }

    const el = document.createElement('div')
    el.className = 'map-user-vessel-marker'
    el.innerHTML = `
      <div class="vessel-sonar-pulse"></div>
      <div class="vessel-sonar-pulse-outer"></div>
      <div class="fisherman-marker-icon" title="Your Live Fisherman Location">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <!-- Fisherman Hat brim -->
          <path d="M4 10c2-1.2 5-1.8 8-1.8s6 .6 8 1.8" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
          <!-- Hat top -->
          <path d="M7.5 9.5C8 6.5 9.5 5 12 5s4 1.5 4.5 4.5" fill="#bae6fd" stroke="#ffffff" stroke-width="1.8"/>
          <!-- Head -->
          <circle cx="12" cy="12" r="2.8" fill="#ffffff" stroke="#ffffff"/>
          <!-- Body / Torso -->
          <path d="M6 21c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" fill="#0284c7" stroke="#ffffff" stroke-width="2"/>
          <!-- Fishing Rod extending up right -->
          <path d="M15 15l5.5-9" stroke="#facc15" stroke-width="2" stroke-linecap="round"/>
          <!-- Fishing Line & Bobber -->
          <path d="M20.5 6v4" stroke="#facc15" stroke-width="1.2" stroke-dasharray="2 2"/>
          <circle cx="20.5" cy="10.5" r="1.2" fill="#ef4444" stroke="#ffffff" stroke-width="0.6"/>
        </svg>
      </div>
      <div class="fisherman-marker-label">
        <span class="boat-live-dot"></span>
        <span>${isLiveGPS ? 'Live GPS Fisherman' : 'Fisherman Location'}</span>
      </div>
    `
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat(coords)
      .setPopup(
        new maplibregl.Popup({ offset: 16 }).setHTML(`
          <div style="color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 5px; font-size: 12px; line-height: 1.45;">
            <div style="font-weight: 800; color: #0284c7; margin-bottom: 3px; font-size: 13px;">🎣 Your Live Position (${isLiveGPS ? 'GPS Active' : 'Live Navigation'})</div>
            <div><strong>Position:</strong> ${coords[1].toFixed(4)}° N, ${coords[0].toFixed(4)}° E</div>
            <div><strong>Status:</strong> Active on Sea | <strong>Speed:</strong> 7.4 kts</div>
            <div><strong>Water Depth:</strong> 28 m | <strong>SST:</strong> 28.4 °C</div>
            <div style="margin-top: 5px; color: #16a34a; font-weight: 700;">🎯 Nearest PFZ: 12.5 km SW (Bearing 225°)</div>
          </div>
        `)
      )
      .addTo(m)

    userMarkerRef.current = marker
  }

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: RATNAGIRI_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.current.on('load', () => {
      setMapLoaded(true)
      addMapLayers()
      updateUserMarker(userLocation, gpsActive)
    })

    // Click on map to show live marine coordinates & PFZ guidance
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat
      new maplibregl.Popup({ offset: 8 })
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="color: #0f172a; font-family: sans-serif; padding: 4px; font-size: 12px; line-height: 1.4;">
            <div style="font-weight: 700; color: #0284c7; margin-bottom: 3px;">📍 ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E</div>
            <div><strong>SST:</strong> 28.4 °C | <strong>Wave:</strong> 1.8 m</div>
            <div><strong>Nearest PFZ:</strong> ~12.5 km SW (Bearing 225°)</div>
            <div style="margin-top: 4px; color: #16a34a; font-weight: 600;">✓ Safe Fishing Sector</div>
          </div>
        `)
        .addTo(map.current!)
    })

    return () => {
      markersRef.current.forEach((m) => m.remove())
      userMarkerRef.current?.remove()
      userMarkerRef.current = null
      map.current?.remove()
      map.current = null
    }
  }, [])

  const addMapLayers = () => {
    const m = map.current
    if (!m) return

    // ── 1. Real-time INCOIS SST Heatmap (WMS) ──
    m.addSource('incois-sst', {
      type: 'raster',
      tiles: ['/geo/wms/tile?layer=PFZ-TUNA-SST-CHL:sst&bbox={bbox-epsg-3857}'],
      tileSize: 256,
    })
    m.addLayer({
      id: 'incois-sst-layer',
      type: 'raster',
      source: 'incois-sst',
      paint: {
        'raster-opacity': 0.55,
      },
    })

    // ── 2. Real-time INCOIS Chlorophyll-a Fronts (WMS) ──
    m.addSource('incois-chl', {
      type: 'raster',
      tiles: ['/geo/wms/tile?layer=PFZ-TUNA-SST-CHL:chl&bbox={bbox-epsg-3857}'],
      tileSize: 256,
    })
    m.addLayer({
      id: 'incois-chl-layer',
      type: 'raster',
      source: 'incois-chl',
      layout: {
        visibility: 'none',
      },
      paint: {
        'raster-opacity': 0.6,
      },
    })

    // ── 3. Real-time INCOIS PFZ Lines (WMS) ──
    m.addSource('incois-pfz', {
      type: 'raster',
      tiles: ['/geo/wms/tile?layer=PFZ_Automation:pfzlines&bbox={bbox-epsg-3857}'],
      tileSize: 256,
    })
    m.addLayer({
      id: 'incois-pfz-layer',
      type: 'raster',
      source: 'incois-pfz',
      paint: {
        'raster-opacity': 0.95,
      },
    })

    // ── 4. INCOIS Registered Landing Centers (WMS) ──
    m.addSource('incois-landing', {
      type: 'raster',
      tiles: ['/geo/wms/tile?layer=PFZ_LandingCentres:LandingCenters_29Apr2024&bbox={bbox-epsg-3857}'],
      tileSize: 256,
    })
    m.addLayer({
      id: 'incois-landing-layer',
      type: 'raster',
      source: 'incois-landing',
      paint: {
        'raster-opacity': 0.85,
      },
    })

    // ── 5. High-Visibility Vector PFZ Zones (Ratnagiri Sector) ──
    PFZ_ZONES.forEach((pfz) => {
      const [[w, s], [e, n]] = pfz.bounds
      m.addSource(pfz.id, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: { name: pfz.name },
          geometry: {
            type: 'Polygon',
            coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]],
          },
        },
      })

      // 5a. Vibrant emerald fill with solid visibility
      m.addLayer({
        id: `${pfz.id}-fill`,
        type: 'fill',
        source: pfz.id,
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': 0.38,
        },
      })

      // 5b. Outer neon cyan glowing halo
      m.addLayer({
        id: `${pfz.id}-glow`,
        type: 'line',
        source: pfz.id,
        paint: {
          'line-color': '#00e5ff',
          'line-width': 6,
          'line-blur': 4,
          'line-opacity': 0.8,
        },
      })

      // 5c. Inner sharp emerald border
      m.addLayer({
        id: `${pfz.id}-line`,
        type: 'line',
        source: pfz.id,
        paint: {
          'line-color': '#047857',
          'line-width': 3,
        },
      })

      // Interactive click and hover on PFZ polygon
      m.on('click', `${pfz.id}-fill`, () => {
        openPfzFullView(pfz)
      })
      m.on('mouseenter', `${pfz.id}-fill`, () => {
        m.getCanvas().style.cursor = 'pointer'
      })
      m.on('mouseleave', `${pfz.id}-fill`, () => {
        m.getCanvas().style.cursor = ''
      })
    })

    // PFZ prominent floating badges (clickable)
    PFZ_ZONES.forEach((pfz) => {
      const el = document.createElement('div')
      el.className = 'map-label-marker pfz-label'
      el.innerHTML = `<span>🐟</span> <span>${pfz.name}</span> <span style="opacity: 0.7;">•</span> <span>${pfz.distance}</span>`
      el.title = `Click to open full view of ${pfz.name}`
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        openPfzFullView(pfz)
      })
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(pfz.center)
        .addTo(m)
      markersRef.current.push(marker)
    })

    // ── 6. Restricted Marine Zone (High Visibility) ──
    m.addSource('restricted-zone', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: { name: RESTRICTED_ZONE.name },
        geometry: {
          type: 'Polygon',
          coordinates: [RESTRICTED_ZONE.coordinates],
        },
      },
    })
    m.addLayer({
      id: 'restricted-fill',
      type: 'fill',
      source: 'restricted-zone',
      paint: {
        'fill-color': '#ef4444',
        'fill-opacity': 0.35,
      },
    })
    m.addLayer({
      id: 'restricted-glow',
      type: 'line',
      source: 'restricted-zone',
      paint: {
        'line-color': '#ff0000',
        'line-width': 5,
        'line-blur': 3,
        'line-opacity': 0.7,
      },
    })
    m.addLayer({
      id: 'restricted-line',
      type: 'line',
      source: 'restricted-zone',
      paint: {
        'line-color': '#b91c1c',
        'line-width': 3,
        'line-dasharray': [4, 3],
      },
    })

    // Interactive click and hover on restricted zone polygon
    m.on('click', 'restricted-fill', () => {
      openRestrictedFullView()
    })
    m.on('mouseenter', 'restricted-fill', () => {
      m.getCanvas().style.cursor = 'pointer'
    })
    m.on('mouseleave', 'restricted-fill', () => {
      m.getCanvas().style.cursor = ''
    })

    const rCenter = RESTRICTED_ZONE.coordinates.reduce(
      (acc, c) => [acc[0] + c[0] / RESTRICTED_ZONE.coordinates.length, acc[1] + c[1] / RESTRICTED_ZONE.coordinates.length],
      [0, 0]
    )
    const rEl = document.createElement('div')
    rEl.className = 'map-label-marker restricted-label'
    rEl.innerHTML = `<span>⛔</span> <span>Prohibited Marine Area</span>`
    rEl.title = 'Click to open full view of Prohibited Marine Area'
    rEl.addEventListener('click', (e) => {
      e.stopPropagation()
      openRestrictedFullView()
    })
    const rMarker = new maplibregl.Marker({ element: rEl })
      .setLngLat(rCenter as [number, number])
      .addTo(m)
    markersRef.current.push(rMarker)

    // ── 7. Vessel Fleet Markers ──
    VESSELS.forEach((v) => {
      const el = document.createElement('div')
      el.className = 'map-vessel-marker'
      el.style.backgroundColor = v.color
      el.title = v.name
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([v.lon, v.lat])
        .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(`<strong>${v.name}</strong><br/>Status: Active<br/>Speed: 8.2 kts`))
        .addTo(m)
      markersRef.current.push(marker)
    })
  }

  // Toggle layer visibility
  useEffect(() => {
    const m = map.current
    if (!m || !mapLoaded) return

    // INCOIS WMS PFZ Lines
    if (m.getLayer('incois-pfz-layer')) {
      m.setLayoutProperty('incois-pfz-layer', 'visibility', layers.pfz ? 'visible' : 'none')
    }
    // Vector PFZ polygons & halos
    PFZ_ZONES.forEach((pfz) => {
      const vis = layers.pfz ? 'visible' : 'none'
      if (m.getLayer(`${pfz.id}-fill`)) m.setLayoutProperty(`${pfz.id}-fill`, 'visibility', vis)
      if (m.getLayer(`${pfz.id}-glow`)) m.setLayoutProperty(`${pfz.id}-glow`, 'visibility', vis)
      if (m.getLayer(`${pfz.id}-line`)) m.setLayoutProperty(`${pfz.id}-line`, 'visibility', vis)
    })

    // INCOIS SST Heatmap
    if (m.getLayer('incois-sst-layer')) {
      m.setLayoutProperty('incois-sst-layer', 'visibility', layers.sst ? 'visible' : 'none')
    }

    // INCOIS Chlorophyll-a
    if (m.getLayer('incois-chl-layer')) {
      m.setLayoutProperty('incois-chl-layer', 'visibility', layers.chlorophyll ? 'visible' : 'none')
    }

    // Restricted Zone
    const rVis = layers.restricted ? 'visible' : 'none'
    if (m.getLayer('restricted-fill')) m.setLayoutProperty('restricted-fill', 'visibility', rVis)
    if (m.getLayer('restricted-glow')) m.setLayoutProperty('restricted-glow', 'visibility', rVis)
    if (m.getLayer('restricted-line')) m.setLayoutProperty('restricted-line', 'visibility', rVis)

    // Vessels
    markersRef.current.forEach((marker) => {
      const el = marker.getElement()
      if (el.classList.contains('map-vessel-marker')) {
        el.style.display = layers.vessels ? 'block' : 'none'
      }
    })
  }, [layers, mapLoaded])

  const toggleLayer = (key: keyof LayerState) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="orca-map-wrapper">
      <div ref={mapContainer} className="orca-map-container" />

      {/* Quick Zone Navigator Bar */}
      <div className="map-zone-quick-bar">
        <span className="zone-bar-title">📍 Zones:</span>
        {PFZ_ZONES.map((pfz) => (
          <button
            key={pfz.id}
            className="zone-pill-btn pfz"
            onClick={() => openPfzFullView(pfz)}
            title={`Open full view of ${pfz.name}`}
          >
            <span className="pill-dot green" />
            {pfz.name.replace('PFZ Sector ', '')}
          </button>
        ))}
        <button
          className="zone-pill-btn restricted"
          onClick={() => openRestrictedFullView()}
          title="Open full view of Prohibited Maritime Area"
        >
          <span className="pill-dot red" />
          Prohibited Area
        </button>
      </div>

      {/* Layer toggles & Locate Fisherman Button */}
      <div className="map-layer-toggles">
        <button
          className="btn-locate-boat"
          onClick={() => {
            if (map.current) {
              map.current.flyTo({
                center: userLocation,
                zoom: 10,
                essential: true,
              })
            }
          }}
          title="Center map on your live fisherman location"
        >
          <span>🎣 Locate Fisherman</span>
        </button>

        <button className={`map-toggle-btn ${layers.pfz ? 'active' : ''}`} onClick={() => toggleLayer('pfz')} title="Daily INCOIS Potential Fishing Zones">
          <span className="toggle-dot" style={{ background: '#10b981' }} /> Real-Time PFZ
        </button>
        <button className={`map-toggle-btn ${layers.sst ? 'active' : ''}`} onClick={() => toggleLayer('sst')} title="Live Sea Surface Temperature Heatmap">
          <span className="toggle-dot" style={{ background: '#f97316' }} /> SST Thermal
        </button>
        <button className={`map-toggle-btn ${layers.chlorophyll ? 'active' : ''}`} onClick={() => toggleLayer('chlorophyll')} title="Ocean Colour Monitor Chlorophyll-a Fronts">
          <span className="toggle-dot" style={{ background: '#10b981' }} /> Chlorophyll-a
        </button>
        <button className={`map-toggle-btn ${layers.restricted ? 'active' : ''}`} onClick={() => toggleLayer('restricted')} title="Maritime Protected & Prohibited Areas">
          <span className="toggle-dot" style={{ background: '#ef4444' }} /> Restricted
        </button>
        <button className={`map-toggle-btn ${layers.vessels ? 'active' : ''}`} onClick={() => toggleLayer('vessels')} title="Fleet AIS Vessel Positions">
          <span className="toggle-dot" style={{ background: '#38bdf8' }} /> Vessels
        </button>
      </div>

      {/* Live INCOIS Feed Status & Attribution */}
      <div className="map-attribution">
        <span className={`live-feed-badge ${incoisOnline ? 'online' : 'checking'}`}>
          <span className="status-dot" />
          {incoisOnline === null ? 'Connecting INCOIS...' : incoisOnline ? 'Live INCOIS WMS Feed' : 'INCOIS Feed (Cached)'}
        </span>
        <span className="attribution-sep">|</span>
        <span>Ratnagiri Coast Sector (MoES / ISRO)</span>
      </div>
    </div>
  )
}
