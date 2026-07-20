import {
  Activity,
  AlertTriangle,
  BellRing,
  Bot,
  BrainCircuit,
  Database,
  FileCheck2,
  FileText,
  FolderSearch,
  MapPinned,
  RadioTower,
  Route,
  ShieldAlert,
  ShieldCheck,
  UserRoundSearch,
  Workflow,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import CaseCard from '../components/CaseCard.jsx'
import LiveFieldMetrics from '../components/LiveFieldMetrics.jsx'
import OperationalReadiness from '../components/OperationalReadiness.jsx'
import { canAccessPath } from '../os/navigation.js'
import { buildDashboardSummary, getStoredUser, seedSummary } from '../services/intelligenceRepository.js'

const palette = ['#00f0ff', '#f59e0b', '#a78bfa', '#ef4444', '#60a5fa', '#10b981']

const quickWorkflow = [
  { to: '/chat', title: 'Ask SAMVAAD', text: 'Natural question, grounded answer, citations.', Icon: Bot },
  { to: '/cases', title: 'Case Explorer', text: 'Search FIR records, inspect narratives, entities.', Icon: FolderSearch },
  { to: '/evidence-lab', title: 'Evidence Lab', text: 'Upload files and preserve chain of custody.', Icon: FileCheck2 },
  { to: '/similar', title: 'Crime DNA', text: 'Explain weights, matched fields, and exclusions.', Icon: BrainCircuit },
  { to: '/patrol', title: 'Patrol Scenario', text: 'Area and time pattern planning.', Icon: Route },
  { to: '/report', title: 'Report Builder', text: 'Export a supervisor-reviewed evidence brief.', Icon: FileText },
]

function AnimatedCounter({ target, suffix = '' }) {
  return <strong>{target}{suffix}</strong>
}

function ActivityShareGauge({ level }) {
  const percent = Math.min(100, Math.max(0, level))
  const color = 'var(--cyan)'

  return (
    <div style={{
      display: 'grid',
      placeItems: 'center',
      gap: 8,
      padding: 20,
      borderRadius: 14,
      border: '1px solid var(--line)',
      background: 'var(--surface)',
      backdropFilter: 'blur(16px)',
    }}>
      <p className="eyebrow">Active Case Share</p>
      <div style={{
        position: 'relative',
        width: 120,
        height: 120,
      }}>
        <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--line)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${percent * 3.27} 327`}
            style={{
              filter: `drop-shadow(0 0 8px ${color})`,
              transition: 'stroke-dasharray 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '1.5rem',
          fontWeight: 900,
          color: 'var(--text-bright)',
        }}>
          {percent}
        </div>
      </div>
      <span style={{
        padding: '4px 12px',
        borderRadius: 99,
        fontSize: '0.72rem',
        fontWeight: 800,
        letterSpacing: '0.1em',
        color,
        background: 'var(--cyan-soft)',
        border: `1px solid ${color}22`,
      }}>
        HISTORICAL STATUS
      </span>
    </div>
  )
}

function IntelTicker({ cases: casesData }) {
  return (
    <div style={{
      display: 'flex',
      gap: 12,
      overflow: 'hidden',
      padding: '10px 0',
    }}>
      <div style={{
        display: 'flex',
        gap: 12,
        animation: 'ticker-scroll 30s linear infinite',
      }}>
        {[...casesData, ...casesData].map((c, i) => (
          <div key={`${c.fir_id}-${i}`} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
            padding: '6px 14px',
            borderRadius: 99,
            border: '1px solid var(--line)',
            background: 'var(--surface-2)',
            fontSize: '0.78rem',
          }}>
            <Zap size={13} style={{ color: 'var(--amber)' }} />
            <span style={{ color: 'var(--cyan)', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem' }}>
              {c.fir_id}
            </span>
            <span style={{ color: 'var(--muted)' }}>{c.crime_type}</span>
            <span style={{ color: 'var(--dim)' }}>{c.district}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

function Dashboard() {
  const summary = buildDashboardSummary()
  const counts = seedSummary()
  const activeShare = Math.round(summary.activeShare * 100)
  const role = getStoredUser()?.role || 'Investigator'
  const visibleQuickWorkflow = quickWorkflow.filter((item) => canAccessPath(role, item.to))

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">NETRA OS</p>
          <h1>Crime Intelligence Dashboard</h1>
        </div>
        <div className="header-actions">
          <span className="data-pill">
            <Database size={16} />
            {counts.cases} FIR seed
          </span>
        </div>
      </header>

      <section className="ops-hero">
        <div className="ops-copy">
          <p className="eyebrow">SAMVAAD-IQ Intelligence Workspace</p>
          <h2>Conversational intelligence, graph reasoning, hotspot analysis, and evidence-backed reporting in one platform.</h2>
          <p>
            Built for KSP Datathon Challenge 1: login, ask, retrieve, reason, visualize, run scenarios, and export. All FIR records are
            synthetic and cite source IDs.
          </p>
          <div className="mini-action-row">
            <Link to="/cases">
              <FolderSearch size={15} />
              Case Explorer
            </Link>
            {canAccessPath(role, '/pipeline') ? <Link to="/pipeline"><Workflow size={15} />Pipeline</Link> : null}
            <Link to="/diffusion">
              <RadioTower size={15} />
              Diffusion
            </Link>
            <Link to="/governance">
              <ShieldAlert size={15} />
              Governance
            </Link>
          </div>
        </div>
        <div className="ops-pipeline">
          {['Query', 'Retrieve', 'Crime DNA', 'Skeptic', 'Report'].map((item, index) => (
            <div key={item} className="pipeline-step">
              <span>{index + 1}</span>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-journey-grid" aria-label="Quick access modules">
        {visibleQuickWorkflow.map(({ to, title, text, Icon }, index) => (
          <Link to={to} className="journey-card" key={to}>
            <span className="journey-step">{String(index + 1).padStart(2, '0')}</span>
            <Icon size={20} />
            <strong>{title}</strong>
            <p>{text}</p>
          </Link>
        ))}
      </section>

      <IntelTicker cases={summary.latestCases} />

      <div className="dashboard-kpi-layout">
        <section className="kpi-grid">
          <article className="kpi-card">
            <ShieldCheck size={22} />
            <span>Total FIR Records</span>
            <AnimatedCounter target={summary.totalCases} />
          </article>
          <article className="kpi-card">
            <Activity size={22} />
            <span>Active Cases</span>
            <AnimatedCounter target={summary.activeCases} />
          </article>
          <article className="kpi-card">
            <UserRoundSearch size={22} />
            <span>Repeat Offenders</span>
            <AnimatedCounter target={summary.repeatOffenders} />
          </article>
          <article className="kpi-card">
            <MapPinned size={22} />
            <span>Hotspot Zones</span>
            <AnimatedCounter target={summary.hotspotZones} />
          </article>
          <article className="kpi-card">
            <AlertTriangle size={22} />
            <span>Most Frequent Category</span>
            <strong style={{ fontSize: '0.95rem' }}>{summary.mostFrequentCrimeType}</strong>
          </article>
          <article className="kpi-card emphasis">
            <Database size={22} />
            <span>Pending Investigations</span>
            <AnimatedCounter target={summary.pendingInvestigations} />
          </article>
          <article className="kpi-card emphasis">
            <BellRing size={22} />
            <span>Similar Case Alerts</span>
            <AnimatedCounter target={summary.similarCaseAlerts} />
          </article>
          <article className="kpi-card emphasis">
            <Route size={22} />
            <span>Patrol Recommendations</span>
            <AnimatedCounter target={summary.patrolRecommendationCount} />
          </article>
          <article className="kpi-card emphasis">
            <BrainCircuit size={22} />
            <span>Mean Top Crime DNA Match</span>
            <strong>{summary.averageTopSimilarity.toFixed(2)}</strong>
          </article>
          <article className="kpi-card emphasis">
            <RadioTower size={22} />
            <span>Similarity Rows Measured</span>
            <strong>{summary.similarityCandidatesMeasured}</strong>
          </article>
        </section>
        <ActivityShareGauge level={activeShare} />
      </div>

      <OperationalReadiness />
      <LiveFieldMetrics />

      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Districts</p>
              <h2>Case Spread</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={summary.districtData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {summary.districtData.map((entry, index) => (
                  <Cell key={entry.name} fill={palette[index % palette.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="panel chart-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Crime Mix</p>
              <h2>Seed Distribution</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={summary.crimeTypeData} dataKey="value" nameKey="name" outerRadius={88} label>
                {summary.crimeTypeData.map((entry, index) => (
                  <Cell key={entry.name} fill={palette[index % palette.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </article>

        <article className="panel chart-panel wide">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Timeline</p>
              <h2>Monthly Synthetic FIR Volume</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={summary.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#00f0ff" strokeWidth={3} dot={{ r: 5, fill: '#00f0ff', strokeWidth: 2, stroke: '#0a0e1a' }} />
            </LineChart>
          </ResponsiveContainer>
        </article>

        <article className="panel chart-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Time Pattern</p>
              <h2>Time-of-Day Crime Pattern</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={summary.timeOfDayData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="panel chart-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Stations</p>
              <h2>Top Police Stations</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={summary.stationData} layout="vertical" margin={{ left: 64 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={124} />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
      </section>

      <section className="case-grid">
        {summary.latestCases.map((caseRecord) => (
          <CaseCard key={caseRecord.fir_id} caseRecord={caseRecord} compact />
        ))}
      </section>
    </div>
  )
}

export default Dashboard
