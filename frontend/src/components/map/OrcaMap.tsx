import { useEffect, useRef } from 'react'

export default function OrcaMap() {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // MapLibre GL — loads dynamically to avoid SSR issues
    let map: any = null
    import('maplibre-gl').then(({ default: maplibregl }) => {
      if (!mapRef.current) return
      map = new maplibregl.Map({
        container: mapRef.current,
        style: {
          version: 8,
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors',
            },
          },
          layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
        },
        center: [73.3, 16.99], // Ratnagiri coast
        zoom: 6,
        attributionControl: false,
      })

      map.on('load', () => {
        // Sample PFZ zone polygon (representative data)
        map.addSource('pfz', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              properties: { name: 'PFZ Zone A', confidence: 'medium' },
              geometry: {
                type: 'Polygon',
                coordinates: [[[72.8, 16.5],[73.2, 16.5],[73.2, 16.9],[72.8, 16.9],[72.8, 16.5]]],
              },
            }],
          },
        })
        map.addLayer({ id: 'pfz-fill', type: 'fill', source: 'pfz', paint: { 'fill-color': '#06ffa5', 'fill-opacity': 0.15 } })
        map.addLayer({ id: 'pfz-border', type: 'line', source: 'pfz', paint: { 'line-color': '#06ffa5', 'line-width': 2, 'line-opacity': 0.8 } })

        // Sample restricted zone
        map.addSource('restricted', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              properties: { name: 'Malvan MPA', type: 'MPA' },
              geometry: {
                type: 'Polygon',
                coordinates: [[[73.4, 16.0],[73.7, 16.0],[73.7, 16.3],[73.4, 16.3],[73.4, 16.0]]],
              },
            }],
          },
        })
        map.addLayer({ id: 'restricted-fill', type: 'fill', source: 'restricted', paint: { 'fill-color': '#ef4444', 'fill-opacity': 0.12 } })
        map.addLayer({ id: 'restricted-border', type: 'line', source: 'restricted', paint: { 'line-color': '#ef4444', 'line-width': 2, 'line-dasharray': [3, 3] } })

        // Vessel marker (representative)
        const el = document.createElement('div')
        el.innerHTML = '🚢'
        el.style.fontSize = '20px'
        el.style.cursor = 'pointer'
        new maplibregl.Marker({ element: el }).setLngLat([73.1, 16.7]).setPopup(
          new maplibregl.Popup({ closeButton: false }).setHTML('<div style="color:#000;font-size:12px;padding:4px"><b>Vessel MH-1234</b><br/>Speed: 8 knots</div>')
        ).addTo(map)

        // Port marker
        const portEl = document.createElement('div')
        portEl.innerHTML = '⚓'
        portEl.style.fontSize = '18px'
        new maplibregl.Marker({ element: portEl }).setLngLat([73.312, 16.990]).setPopup(
          new maplibregl.Popup({ closeButton: false }).setHTML('<div style="color:#000;font-size:12px;padding:4px"><b>Ratnagiri Port</b></div>')
        ).addTo(map)
      })
    }).catch(() => {
      // MapLibre failed to load — show placeholder
    })

    return () => map?.remove()
  }, [])

  return (
    <div className="relative flex-1 rounded-2xl overflow-hidden glass border border-white/5 min-h-0">
      <div ref={mapRef} className="absolute inset-0" />

      {/* Map overlay controls */}
      <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
        {[
          { id: 'pfz', label: 'PFZ Zones', color: '#06ffa5', active: true },
          { id: 'sst', label: 'SST', color: '#00d4ff', active: true },
          { id: 'restricted', label: 'Restricted', color: '#ef4444', active: true },
          { id: 'vessels', label: 'Vessels', color: '#f59e0b', active: true },
        ].map(l => (
          <div key={l.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg glass border border-white/10 text-xs cursor-pointer hover:border-white/20">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: l.color, opacity: l.active ? 1 : 0.3 }} />
            <span className="text-slate-300 font-medium">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Data freshness tag */}
      <div className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-lg glass border border-white/10 text-xs text-slate-400 font-mono z-10">
        🛰️ Sample data · INCOIS/MOSDAC
      </div>

      {/* Legend — PFZ */}
      <div className="absolute top-3 right-3 px-3 py-2 rounded-xl glass border border-white/10 z-10 text-xs space-y-1.5">
        <p className="text-slate-400 font-medium mb-1">Legend</p>
        <div className="flex items-center gap-2"><span className="w-3 h-1.5 rounded" style={{background:'#06ffa5'}} /><span className="text-slate-400">PFZ (Sample)</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-1.5 rounded" style={{background:'#ef4444'}} /><span className="text-slate-400">Restricted Zone</span></div>
        <div className="flex items-center gap-2"><span>🚢</span><span className="text-slate-400">Vessel</span></div>
        <div className="flex items-center gap-2"><span>⚓</span><span className="text-slate-400">Port</span></div>
      </div>
    </div>
  )
}
