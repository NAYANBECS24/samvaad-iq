import { AlertTriangle, Car, CheckCircle2, Clock, MapPin, Radio, Route, Shield, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import LiveFieldMetrics from '../components/LiveFieldMetrics.jsx'
import { patrolWhatIf } from '../services/intelligenceRepository.js'

const districts = ['Bengaluru South', 'Mysuru', 'Hubballi-Dharwad', 'Mangaluru']
const crimeTypes = ['Motorcycle Theft', 'Chain Snatching', 'UPI Fraud', 'House Burglary']

function CoverageGauge({ value, label, color }) {
  const percent = Math.min(100, Math.max(0, value))
  return (
    <div style={{
      display: 'grid',
      placeItems: 'center',
      gap: 6,
      padding: 16,
    }}>
      <svg viewBox="0 0 100 100" style={{ width: 110, height: 110, transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--line)" strokeWidth="6" />
        <circle
          cx="50" cy="50" r="42"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${percent * 2.64} 264`}
          style={{
            filter: `drop-shadow(0 0 8px ${color})`,
            transition: 'stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>
      <div style={{ marginTop: -80, textAlign: 'center' }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '1.6rem',
          fontWeight: 900,
          color: 'var(--text-bright)',
        }}>
          {percent}%
        </div>
        <div style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          {label}
        </div>
      </div>
      <div style={{ height: 30 }} />
    </div>
  )
}

function PatrolWhatIf() {
  const [district, setDistrict] = useState('Bengaluru South')
  const [crimeType, setCrimeType] = useState('Motorcycle Theft')
  const [units, setUnits] = useState(3)
  const [deployedZone, setDeployedZone] = useState(null)
  const [dispatchPulse, setDispatchPulse] = useState(0)
  const simulation = useMemo(() => patrolWhatIf({ district, crimeType, units }), [district, crimeType, units])
  const activeDeployment = simulation.recommendations.find((item) => item.station === deployedZone)
  const adjustedCoverageAfter = Math.min(98, simulation.coverageAfter + (activeDeployment ? 7 : 0))
  const delta = adjustedCoverageAfter - simulation.coverageBefore
  const dispatchZones = simulation.recommendations.slice(0, 4).map((zone, index) => ({
    ...zone,
    x: [16, 58, 34, 75][index] || 44,
    y: [28, 24, 66, 58][index] || 46,
  }))

  function deployToZone(zone) {
    setDeployedZone(zone.station)
    setDispatchPulse((value) => value + 1)
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Supervisor What-If</p>
          <h1>Patrol Coverage Simulation</h1>
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
        <label>
          Patrol Units: {units}
          <input min="1" max="8" value={units} onChange={(event) => setUnits(Number(event.target.value))} type="range" />
        </label>
      </section>

      <LiveFieldMetrics />

      <section className="dispatch-simulator">
        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Interactive Planning Simulator</p>
              <h2>Assign A Unit To A High-Concentration Area</h2>
            </div>
            <Radio size={19} />
          </div>
          <div className="dispatch-staging">
            <div
              className="patrol-car"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('text/plain', 'SAMVAAD-PATROL-01')
              }}
            >
              <Car size={22} />
              <span>UNIT-01</span>
            </div>
            <div className={`dispatch-success ${activeDeployment ? 'active' : ''}`} key={dispatchPulse}>
              <CheckCircle2 size={18} />
              <span>{activeDeployment ? `${activeDeployment.station} covered` : 'Awaiting assignment'}</span>
            </div>
          </div>
        </article>

        <article className="dispatch-map">
          <div className="dispatch-grid" />
          {dispatchZones.map((zone) => (
            <button
              key={zone.station}
              className={`dispatch-zone ${zone.station === deployedZone ? 'is-deployed' : ''}`}
              type="button"
              style={{ '--zone-x': `${zone.x}%`, '--zone-y': `${zone.y}%` }}
              onClick={() => deployToZone(zone)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                deployToZone(zone)
              }}
            >
              <MapPin size={18} />
              <strong>{zone.station}</strong>
              <span>{zone.recommended_units} unit</span>
            </button>
          ))}
        </article>
      </section>

      {/* Coverage gauges */}
      <section className="coverage-grid">
        <div style={{
          borderRadius: 14,
          border: '1px solid var(--line)',
          background: 'var(--surface)',
          backdropFilter: 'blur(16px)',
        }}>
          <CoverageGauge value={simulation.coverageBefore} label="Before" color="var(--amber)" />
        </div>
        <div style={{
          borderRadius: 14,
          border: '1px solid var(--line)',
          background: 'var(--surface)',
          backdropFilter: 'blur(16px)',
        }}>
          <CoverageGauge value={adjustedCoverageAfter} label="After" color="var(--emerald)" />
        </div>
        <div style={{
          display: 'grid',
          placeItems: 'center',
          gap: 8,
          borderRadius: 14,
          border: '1px solid var(--line)',
          background: 'linear-gradient(135deg, var(--surface), rgba(0,240,255,0.03))',
          backdropFilter: 'blur(16px)',
          padding: 20,
        }}>
          <Shield size={28} style={{ color: 'var(--cyan)' }} />
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '2rem',
            fontWeight: 900,
            color: 'var(--cyan)',
          }}>
            +{delta}%
          </div>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            Coverage Delta
          </span>
          <span style={{
            padding: '4px 12px',
            borderRadius: 99,
            fontSize: '0.72rem',
            fontWeight: 800,
            color: 'var(--cyan)',
            background: 'var(--cyan-soft)',
            border: '1px solid rgba(0,240,255,0.15)',
          }}>
            {units} UNITS DEPLOYED
          </span>
        </div>
      </section>

      <section className="patrol-layout">
        <article className="panel route-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Deployment</p>
              <h2>Recommended Zones</h2>
            </div>
            <Route size={19} />
          </div>
          {simulation.recommendations.map((item) => (
            <div key={`${item.rank}-${item.station}`} className="station-row">
              <strong>
                {item.rank}. {item.station}
              </strong>
              <span>{item.recommended_units} unit</span>
              <small>{item.reason}</small>
            </div>
          ))}
          <p className="disclaimer">Resource-planning estimate only; field command remains human-led.</p>
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Timing</p>
              <h2>Recommended Windows</h2>
            </div>
            <Clock size={19} />
          </div>
          {simulation.recommendedTimeWindows.map((window) => (
            <div key={window.name} className="station-row">
              <strong>{window.name}</strong>
              <span>{window.count} linked FIR</span>
              <small>Use with field command review and live local context.</small>
            </div>
          ))}
          <p className="disclaimer">Simulation is a scenario stress test, not a field guarantee.</p>
        </article>
      </section>

      <section className="dossier-grid">
        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ACSE Red Team</p>
              <h2>Adjacent-Area Pattern Watch</h2>
            </div>
            <AlertTriangle size={19} />
          </div>
          <div className="lead-banner">
            <strong>{simulation.displacementWatch}</strong>
            <span>aggregate scenario stress test</span>
          </div>
          {simulation.displacementZones.map((zone) => (
            <div key={`${zone.rank}-${zone.station}`} className="station-row">
              <strong>
                {zone.rank}. {zone.station}
              </strong>
              <span style={{ color: 'var(--amber)' }}>+{zone.patternWatchDelta}% watch index</span>
              <small>{zone.reason}</small>
            </div>
          ))}
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Simulation Summary</p>
              <h2>Deployment Brief</h2>
            </div>
            <SlidersHorizontal size={19} />
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              ['District', district],
              ['Crime Type', crimeType],
              ['Units', units],
              ['Coverage Delta', `${simulation.coverageBefore}% -> ${adjustedCoverageAfter}%`],
              ['Adjacent-area watch', simulation.displacementWatch],
              ['Time Windows', simulation.recommendedTimeWindows.map((w) => w.name).join(', ')],
            ].map(([label, value]) => (
              <div key={label} style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'var(--surface-2)',
                fontSize: '0.84rem',
              }}>
                <span style={{ color: 'var(--muted)', fontWeight: 700 }}>{label}</span>
                <span style={{ color: 'var(--text-bright)', fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}

export default PatrolWhatIf
