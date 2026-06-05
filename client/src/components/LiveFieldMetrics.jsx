import { CloudSun, Database, Droplets, RadioTower, RefreshCw, Wind } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fetchLiveFieldMetrics, getFallbackFieldMetrics } from '../services/liveMetrics.js'

function LiveFieldMetrics({ compact = false }) {
  const [metrics, setMetrics] = useState(() => getFallbackFieldMetrics())
  const [loading, setLoading] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      const next = await fetchLiveFieldMetrics()
      setMetrics(next)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    fetchLiveFieldMetrics().then((next) => {
      if (!active) return
      setMetrics(next)
    })
    const timer = window.setInterval(refresh, 180000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  const updated = metrics ? new Date(metrics.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'
  const weatherItems = compact ? metrics.weather.slice(0, 2) : metrics.weather

  return (
    <section className={`panel live-metrics ${compact ? 'compact' : ''}`}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Live Field Context</p>
          <h2>Weather + API Pulse</h2>
        </div>
        <button className="icon-button neutral" type="button" onClick={refresh} aria-label="Refresh live metrics" title="Refresh">
          <RefreshCw size={17} className={loading ? 'spin' : ''} />
        </button>
      </div>

      <div className="pulse-strip">
        <div className="pulse-item">
          <RadioTower size={17} />
          <span>{metrics?.apiHealth.status || 'checking'}</span>
          <small>{metrics?.apiHealth.latencyMs ? `${metrics.apiHealth.latencyMs} ms` : 'fallback ready'}</small>
        </div>
        <div className="pulse-item">
          <Database size={17} />
          <span>{metrics?.syntheticData.firs || 0} FIRs</span>
          <small>{metrics?.syntheticData.active || 0} active synthetic records</small>
        </div>
        <div className="pulse-item">
          <CloudSun size={17} />
          <span>{updated}</span>
          <small>auto refresh 3 min</small>
        </div>
      </div>

      <div className="weather-grid">
        {weatherItems.map((item) => (
          <article key={item.district} className={`weather-card risk-${item.risk.toLowerCase()}`}>
            <div>
              <strong>{item.district}</strong>
              <span>{item.condition}</span>
            </div>
            <div className="weather-values">
              <span>{Math.round(item.temperature)} C</span>
              <small>
                <Droplets size={13} /> {item.rain} mm
              </small>
              <small>
                <Wind size={13} /> {Math.round(item.wind)} km/h
              </small>
            </div>
            <em>{item.risk}</em>
          </article>
        ))}
      </div>

      <p className="disclaimer">Live data is field context only. Crime records remain synthetic for prototype safety.</p>
    </section>
  )
}

export default LiveFieldMetrics
