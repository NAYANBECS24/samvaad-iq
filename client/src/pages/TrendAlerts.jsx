import { AlertTriangle, BellRing, ShieldAlert, Activity } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../services/api.js'
import { useRuntime } from '../services/runtime.jsx'

function TrendAlerts() {
  const { runtime } = useRuntime()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (runtime.apiReachable) {
      api.alerts({}).then((res) => {
        if (active) {
          setAlerts(res.alerts || [])
          setLoading(false)
        }
      }).catch((err) => {
        console.error(err)
        if (active) setLoading(false)
      })
    } else {
      setLoading(false)
    }
    return () => { active = false }
  }, [runtime.apiReachable])

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Challenge Addition</p>
          <h1>Trend & Anomaly Alerts</h1>
          <p>Automated notifications for unusual case volume or emerging patterns.</p>
        </div>
        <span className="data-label">SYNTHETIC DEMO DATA</span>
      </header>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">System Alerts</p>
              <h2>Active Pattern Anomalies</h2>
            </div>
            <BellRing size={22} />
          </div>
          {loading ? (
            <p>Loading alerts...</p>
          ) : alerts.length ? (
            <div className="alert-grid">
              {alerts.map((alert, idx) => (
                <div key={idx} className="trend-alert-card">
                  <Activity size={18} />
                  <div>
                    <strong>{alert.title || alert.type}</strong>
                    <p>{alert.description}</p>
                    <small>Severity: {alert.severity || 'Medium'}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <ShieldAlert size={28} />
              <strong>No critical trend anomalies detected</strong>
              <p>The system is monitoring for unusual spikes in case categories and locations.</p>
            </div>
          )}
        </article>
      </section>
    </div>
  )
}

export default TrendAlerts
