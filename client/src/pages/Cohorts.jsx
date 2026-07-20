import { Users, ShieldCheck, MapPinned } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../services/api.js'
import { useRuntime } from '../services/runtime.jsx'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function Cohorts() {
  const { runtime } = useRuntime()
  const [cohorts, setCohorts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (runtime.apiReachable) {
      api.cohorts('district').then((res) => {
        if (active) {
          setCohorts(res.cohorts || [])
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
          <h1>Socio-Demographic Insights</h1>
          <p>Safe aggregate demographic grouping to avoid bias while revealing broad community impact trends.</p>
        </div>
        <span className="data-label">SYNTHETIC DEMO DATA</span>
      </header>

      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Aggregate Data</p>
              <h2>Cohort Analysis</h2>
            </div>
            <Users size={22} />
          </div>
          {loading ? (
            <p>Loading cohorts...</p>
          ) : cohorts.length ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cohorts} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--line)" />
                  <XAxis type="number" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="label" type="category" stroke="var(--text)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'var(--surface-2)' }} contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text-bright)' }} />
                  <Bar dataKey="value" fill="var(--cyan)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">
              <MapPinned size={28} />
              <strong>No cohort data available</strong>
              <p>Try running analysis with a different grouping dimension.</p>
            </div>
          )}
        </article>

        <article className="panel safety-callout">
          <ShieldCheck size={28} style={{ color: 'var(--green)' }} />
          <div>
            <strong>Bias Protection Enabled</strong>
            <p>This demographic representation enforces minimum aggregation thresholds. Personally Identifiable Information (PII) is structurally excluded from cohort calculation to prevent automated individual profiling.</p>
          </div>
        </article>
      </section>
    </div>
  )
}

export default Cohorts
