import { Activity, AlertTriangle, MapPinned, RadioTower, Route, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { buildDiffusionModel } from '../services/prototypeEngine.js'

const districts = ['All', 'Bengaluru South', 'Mysuru', 'Hubballi-Dharwad', 'Mangaluru']
const crimeTypes = ['All', 'Motorcycle Theft', 'Chain Snatching', 'UPI Fraud', 'House Burglary']
const colors = {
  Expansion: '#be123c',
  Watch: '#b45309',
  Contained: '#0f766e',
}

function DiffusionRisk() {
  const [district, setDistrict] = useState('Mysuru')
  const [crimeType, setCrimeType] = useState('Motorcycle Theft')
  const model = useMemo(() => buildDiffusionModel({ district, crimeType }), [crimeType, district])

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Crime Contagion Diffusion</p>
          <h1>Area-Level Rc Risk Model</h1>
        </div>
        <div className="intent-pill">
          <Activity size={16} />
          {model.risk}
        </div>
      </header>

      <section className="control-strip">
        <label>
          District
          <select value={district} onChange={(event) => setDistrict(event.target.value)}>
            {districts.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Crime Type
          <select value={crimeType} onChange={(event) => setCrimeType(event.target.value)}>
            {crimeTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <div className="diffusion-score">
          <span>Rc</span>
          <strong>{model.rc}</strong>
          <small>{model.advisory}</small>
        </div>
      </section>

      <section className="kpi-grid compact-kpis">
        <article className="kpi-card">
          <RadioTower size={22} />
          <span>Active Linked Incidents</span>
          <strong>{model.active}</strong>
        </article>
        <article className="kpi-card">
          <ShieldCheck size={22} />
          <span>Inactive / Resolved</span>
          <strong>{model.inactive}</strong>
        </article>
        <article className="kpi-card emphasis">
          <MapPinned size={22} />
          <span>Expansion Zones</span>
          <strong>{model.zones.filter((zone) => zone.risk === 'Expansion').length}</strong>
        </article>
        <article className="kpi-card emphasis">
          <Route size={22} />
          <span>Corridors</span>
          <strong>{model.corridors.length}</strong>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Station Rc</p>
              <h2>Diffusion Pressure</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={model.zones}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="station_name" tick={{ fontSize: 12 }} interval={0} />
              <YAxis domain={[0, 2.5]} />
              <Tooltip />
              <Bar dataKey="rc" radius={[4, 4, 0, 0]}>
                {model.zones.map((zone) => (
                  <Cell key={zone.station_id} fill={colors[zone.risk] || '#2563eb'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Corridors</p>
              <h2>Repeated Identifier Exposure</h2>
            </div>
            <AlertTriangle size={20} />
          </div>
          {model.corridors.length ? (
            model.corridors.map((corridor) => (
              <div key={corridor.id} className="station-row">
                <strong>
                  {corridor.from} {'->'} {corridor.to}
                </strong>
                <span>exposure {corridor.exposure}</span>
                <small>
                  {corridor.indicator}: {corridor.cases.join(', ')}
                </small>
              </div>
            ))
          ) : (
            <p className="disclaimer">No repeated corridor identifiers in the selected synthetic slice.</p>
          )}
        </article>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Interpretation</p>
            <h2>Hypothesis-Only Diffusion Reading</h2>
          </div>
        </div>
        <div className="risk-list">
          <span>Rc above 1.2 means expansion watch</span>
          <span>Area-level only</span>
          <span>No individual prediction</span>
          <span>Patrol decisions remain human-led</span>
        </div>
      </section>
    </div>
  )
}

export default DiffusionRisk
