import L from 'leaflet'
import { useMemo, useState } from 'react'
import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import CaseCard from '../components/CaseCard.jsx'
import { buildDiffusionModel, getHotspots } from '../services/intelligenceRepository.js'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
})

const districts = ['Mysuru', 'Bengaluru South', 'Hubballi-Dharwad', 'Mangaluru']
const crimeTypes = ['Chain Snatching', 'Motorcycle Theft', 'UPI Fraud', 'House Burglary']
const crimePeakHours = {
  'Motorcycle Theft': 21,
  'Chain Snatching': 19,
  'UPI Fraud': 14,
  'House Burglary': 2,
}

function concentrationFor(caseRecord, stationCounts) {
  const station = stationCounts.find((item) => item.station_id === caseRecord.station_id)
  if ((station?.count || 0) >= 2 || caseRecord.status === 'Open') return 'high'
  if (caseRecord.status === 'Under Investigation') return 'medium'
  return 'low'
}

function markerIcon(concentration) {
  const colors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }
  const color = colors[concentration] || colors.low
  return L.divIcon({
    className: `risk-marker risk-${concentration}`,
    html: `<span style="box-shadow: 0 0 12px ${color}88"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

function circularDistance(hour, peak) {
  const distance = Math.abs(hour - peak)
  return Math.min(distance, 24 - distance)
}

function buildPatternWindows(hotspots, diffusionModel, crimeType, hour) {
  const peak = crimePeakHours[crimeType] ?? 20
  const timeCurve = Math.max(0.18, 1 - circularDistance(hour, peak) / 9)
  const baseZones = hotspots.clusters.length
    ? hotspots.clusters.map((cluster) => ({
        id: cluster.cluster_id,
        lat: cluster.centroid.lat,
        lon: cluster.centroid.lon,
        count: cluster.count,
        concentration: cluster.concentration || cluster.risk,
        cases: cluster.cases,
      }))
    : hotspots.points.slice(0, 5).map((caseRecord, index) => ({
        id: `PATTERN-${index + 1}`,
        lat: caseRecord.lat,
        lon: caseRecord.lon,
        count: 1,
        concentration: concentrationFor(caseRecord, hotspots.stationCounts),
        cases: [caseRecord.fir_id],
      }))

  return baseZones.map((zone, index) => {
    const rcBoost = Math.min(0.28, (diffusionModel.zones[index]?.rc || diffusionModel.rc) * 0.08)
    const concentrationBoost = zone.concentration === 'high' ? 0.24 : zone.concentration === 'medium' ? 0.14 : 0.05
    const score = Math.min(0.96, 0.32 + zone.count * 0.08 + timeCurve * 0.34 + concentrationBoost + rcBoost)
    return {
      ...zone,
      score,
      radius: 180 + score * 680,
      opacity: 0.16 + score * 0.22,
      color: score > 0.76 ? '#ef4444' : score > 0.58 ? '#f59e0b' : '#10b981',
    }
  })
}

function HotspotMap() {
  const [district, setDistrict] = useState('Mysuru')
  const [crimeType, setCrimeType] = useState('Chain Snatching')
  const [patternHour, setPatternHour] = useState(21)
  const hotspots = useMemo(() => getHotspots({ district, crimeType }), [district, crimeType])
  const diffusionModel = useMemo(() => buildDiffusionModel({ district, crimeType }), [district, crimeType])
  const patternWindows = useMemo(
    () => buildPatternWindows(hotspots, diffusionModel, crimeType, patternHour),
    [crimeType, diffusionModel, hotspots, patternHour],
  )
  const center = hotspots.points[0] ? [hotspots.points[0].lat, hotspots.points[0].lon] : [12.9716, 77.5946]

  const totalCases = hotspots.points.length
  const highConcentration = hotspots.clusters.filter((c) => (c.concentration || c.risk) === 'high').length
  const clusters = hotspots.clusters.length

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Hotspot Map</p>
          <h1>Geospatial FIR View</h1>
        </div>
        <div className="filter-row" style={{ gap: 10 }}>
          <select value={district} onChange={(event) => setDistrict(event.target.value)}>
            {districts.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select value={crimeType} onChange={(event) => setCrimeType(event.target.value)}>
            {crimeTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Historical aggregate activity strip */}
      <div style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'Cases in View', value: totalCases, color: 'var(--cyan)' },
          { label: 'Clusters', value: clusters, color: 'var(--amber)' },
          { label: 'High Concentration', value: highConcentration, color: 'var(--red)' },
        ].map((stat) => (
          <div key={stat.label} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 10,
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            backdropFilter: 'blur(12px)',
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: 99,
              background: stat.color,
              boxShadow: `0 0 6px ${stat.color}`,
            }} />
            <span style={{ color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 700 }}>{stat.label}</span>
            <strong style={{
              color: 'var(--text-bright)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.95rem',
            }}>
              {stat.value}
            </strong>
          </div>
        ))}
      </div>

      <section className="map-layout">
        <div className="map-surface">
          <MapContainer center={center} zoom={13} scrollWheelZoom className="leaflet-shell">
            <TileLayer
              attribution="&copy; CartoDB"
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {hotspots.points.map((caseRecord) => (
              <Marker
                key={caseRecord.fir_id}
                position={[caseRecord.lat, caseRecord.lon]}
                icon={markerIcon(concentrationFor(caseRecord, hotspots.stationCounts))}
              >
                <Popup>
                  <strong>{caseRecord.fir_id}</strong>
                  <br />
                  {caseRecord.crime_type}
                  <br />
                  {caseRecord.station?.station_name}
                </Popup>
              </Marker>
            ))}
            {patternWindows.map((zone) => (
              <Circle
                key={zone.id}
                center={[zone.lat, zone.lon]}
                radius={zone.radius}
                pathOptions={{
                  color: zone.color,
                  fillColor: zone.color,
                  fillOpacity: zone.opacity,
                  opacity: 0.68,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong>{zone.id}</strong>
                  <br />
                  Historical pattern index {Math.round(zone.score * 100)}%
                  <br />
                  {zone.cases.join(', ')}
                </Popup>
              </Circle>
            ))}
          </MapContainer>
        </div>

        <aside className="panel hotspot-list">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Stations</p>
              <h2>Hotspot Count</h2>
            </div>
          </div>
          {hotspots.stationCounts.map((item) => (
            <div key={item.station_id} className="station-row">
              <strong>{item.station_name}</strong>
              <span>{item.count} FIR</span>
              <small>{item.cases.join(', ')}</small>
            </div>
          ))}
          {hotspots.clusters.length ? (
            <>
              <div className="section-heading compact-heading">
                <div>
                  <p className="eyebrow">Clusters</p>
                  <h2>DBSCAN-Style Concentration</h2>
                </div>
              </div>
              {hotspots.clusters.map((cluster) => (
                <div key={cluster.cluster_id} className="station-row">
                  <strong>{cluster.cluster_id}</strong>
                  <span>{cluster.concentration || cluster.risk} concentration</span>
                  <small>{cluster.cases.join(', ')}</small>
                </div>
              ))}
            </>
          ) : null}
          <div className="map-legend">
            <span><i className="risk-dot high" /> High concentration</span>
            <span><i className="risk-dot medium" /> Medium concentration</span>
            <span><i className="risk-dot low" /> Low concentration</span>
          </div>
        </aside>
      </section>

      <section className="forecast-strip">
        <div className="forecast-header">
          <div>
            <p className="eyebrow">Historical Time-Pattern Heatmap</p>
            <h2>{String(patternHour).padStart(2, '0')}:00 comparison window</h2>
          </div>
          <div className="diffusion-score compact">
            <span>Rc</span>
            <strong>{diffusionModel.rc}</strong>
            <small>{diffusionModel.patternBand}</small>
          </div>
        </div>
        <input
          className="forecast-range"
          min="0"
          max="23"
          value={patternHour}
          onChange={(event) => setPatternHour(Number(event.target.value))}
          type="range"
        />
        <div className="forecast-zones">
          {patternWindows.slice(0, 4).map((zone) => (
            <span key={zone.id} style={{ '--zone-color': zone.color }}>
              {zone.id} - {Math.round(zone.score * 100)}%
            </span>
          ))}
        </div>
      </section>

      <p className="disclaimer">This view compares historical synthetic area, time, and category patterns. It does not predict an individual, guilt, or a future incident.</p>

      <section className="case-grid">
        {hotspots.points.map((caseRecord) => (
          <CaseCard key={caseRecord.fir_id} caseRecord={caseRecord} compact />
        ))}
      </section>
    </div>
  )
}

export default HotspotMap
