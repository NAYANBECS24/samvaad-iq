import { AlertTriangle, CheckCircle2, ClipboardCheck, CloudOff, History, LockKeyhole, Scale, ShieldAlert, UserCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api.js'
import { demoUsers, getStoredUser } from '../services/prototypeEngine.js'
import { useRuntime } from '../services/runtime.jsx'

const permissions = [
  ['Admin', 'Data configuration, capability checks, audits', 'Data stewardship'],
  ['Investigator', 'Query, dossier, evidence intake, lead review', 'Case follow-up'],
  ['Analyst', 'Command center, area patterns, model evaluation', 'Pattern review'],
  ['Supervisor', 'Approval, reports, patrol scenarios, audits', 'Operational decision'],
]

const controls = [
  ['Source traceability', 'Answers link to exact synthetic FIR fields and excerpts.'],
  ['Confidence framing', 'Scores describe retrieval or similarity strength, never probability of guilt.'],
  ['Person-level restriction', 'Hotspots and scenarios operate only at area/time/category level.'],
  ['Human approval', 'Reports and operational recommendations require a supervisor.'],
  ['Data minimization', 'Public builds contain synthetic identifiers and hashed entity examples only.'],
]

function GovernanceAudit() {
  const user = useMemo(() => getStoredUser(), [])
  const { runtime, offlineCore } = useRuntime()
  const [audit, setAudit] = useState({ events: [], message: 'Audit access has not been requested.' })
  const canReadAudit = runtime.mode === 'catalyst-live' && ['Supervisor', 'Admin'].includes(user?.role)
  const displayedAudit = canReadAudit
    ? audit
    : { events: [], message: runtime.mode === 'catalyst-live' ? 'This role cannot read the server audit trail.' : 'Offline mode has no persisted server audit trail.' }

  useEffect(() => {
    if (!canReadAudit) return
    let active = true
    api.audit().then((payload) => active && setAudit({ events: payload.events, message: `Hash-chain head: ${payload.chainHead}` })).catch((error) => active && setAudit({ events: [], message: error.message }))
    return () => { active = false }
  }, [canReadAudit])

  const capabilityRows = Object.entries(runtime.capabilities || {}).map(([key, value]) => ({ key, ...value }))

  return (
    <div className="page-stack">
      <header className="page-header">
        <div><p className="eyebrow">Governance and accountability</p><h1>Human Authority Stays in the Loop</h1><p>Runtime truth, server-side role boundaries, provenance, limitations, and tamper-evident audit references.</p></div>
        <div className="intent-pill"><ShieldAlert size={16} />Decision support only</div>
      </header>

      <section className="kpi-grid compact-kpis">
        <article className="kpi-card"><UserCheck size={22} /><span>Defined roles</span><strong>{demoUsers.length}</strong></article>
        <article className="kpi-card"><LockKeyhole size={22} /><span>Public records</span><strong>{offlineCore.cases.length} synthetic</strong></article>
        <article className="kpi-card"><ClipboardCheck size={22} /><span>Persisted audit events</span><strong>{displayedAudit.events.length}</strong></article>
        <article className="kpi-card emphasis"><Scale size={22} /><span>Human review</span><strong>Required</strong></article>
      </section>

      <section className="dossier-grid">
        <article className="panel">
          <div className="section-heading"><div><p className="eyebrow">Live capability registry</p><h2>No simulated service claims</h2></div>{runtime.mode === 'catalyst-live' ? <CheckCircle2 size={20} /> : <CloudOff size={20} />}</div>
          {capabilityRows.length ? <div className="table-wrap"><table className="case-table"><thead><tr><th>Capability</th><th>Provider</th><th>Verified status</th></tr></thead><tbody>{capabilityRows.map((item) => <tr key={item.key}><td>{item.key}</td><td>{item.provider}</td><td>{item.available ? 'Available' : 'Unavailable'}</td></tr>)}</tbody></table></div> : <p>Capability details are unavailable because the Catalyst API health check did not complete.</p>}
        </article>

        <article className="panel">
          <div className="section-heading"><div><p className="eyebrow">Role matrix</p><h2>Server-enforced decision boundaries</h2></div><LockKeyhole size={20} /></div>
          <div className="table-wrap"><table className="case-table"><thead><tr><th>Role</th><th>Permitted scope</th><th>Decision boundary</th></tr></thead><tbody>{permissions.map(([role, scope, boundary]) => <tr key={role}><td>{role}</td><td>{scope}</td><td>{boundary}</td></tr>)}</tbody></table></div>
        </article>
      </section>

      <section className="governance-layout">
        <article className="panel">
          <div className="section-heading"><div><p className="eyebrow">Control points</p><h2>Privacy and legal safeguards</h2></div><ClipboardCheck size={20} /></div>
          {controls.map(([name, detail]) => <div key={name} className="station-row"><strong>{name}</strong><span>enabled</span><small>{detail}</small></div>)}
        </article>

        <article className="panel">
          <div className="section-heading"><div><p className="eyebrow">Tamper-evident timeline</p><h2>Latest authorized events</h2></div><History size={20} /></div>
          <p className="query-status">{displayedAudit.message}</p>
          {displayedAudit.events.map((event) => <div key={event.id} className="audit-row"><span>{event.id}</span><p><strong>{event.actor}</strong><br />{event.action} · {event.resource}<br /><small>{event.timestamp}</small></p></div>)}
        </article>
      </section>

      <article className="panel warning-panel">
        <div className="section-heading"><div><p className="eyebrow">Non-negotiable limitations</p><h2>What NETRA does not decide</h2></div><AlertTriangle size={20} /></div>
        <div className="risk-list"><span>No automated guilt label</span><span>No person-level risk score</span><span>No unsupported legal conclusion</span><span>No silent provider fallback</span><span>No public police PII</span></div>
      </article>
    </div>
  )
}

export default GovernanceAudit
