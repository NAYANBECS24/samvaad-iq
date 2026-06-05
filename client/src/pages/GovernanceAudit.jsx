import { AlertTriangle, ClipboardCheck, Cloud, Eye, History, LockKeyhole, Scale, ShieldAlert, UserCheck } from 'lucide-react'
import { cases, demoUsers, getStoredUser, seedSummary } from '../services/prototypeEngine.js'
import catalystBlueprint from '../../../data/catalyst-service-map.json'

const permissions = [
  ['Admin', 'All modules, synthetic data validation, user audit logs', 'Data stewardship'],
  ['Investigator', 'Query, case dossier, graph, DNA, reports', 'Case follow-up'],
  ['Analyst', 'Dashboard, hotspot map, trend analysis, model output', 'Pattern review'],
  ['Supervisor', 'Patrol what-if, reports, approval notes, exports', 'Operational decision'],
]

function buildAuditEvents(userRole) {
  const latestCases = [...cases].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  return [
    ['AUD-LIVE-01', userRole || 'Guest', 'Authenticated session checked local RBAC profile'],
    ['AUD-LIVE-02', 'Data Agent', `${latestCases.length} recent FIR records indexed for command view`],
    ['AUD-LIVE-03', 'Network Agent', 'Shared entity graph paths available for selected FIRs'],
    ['AUD-LIVE-04', 'Skeptic Agent', 'All generated outputs marked as investigative support only'],
    ['AUD-LIVE-05', 'Report Agent', 'PDF brief path records source FIR IDs and human-review note'],
  ]
}

function GovernanceAudit() {
  const user = getStoredUser()
  const summary = seedSummary()
  const auditEvents = buildAuditEvents(user?.role)
  const productionControls = catalystBlueprint.serviceMap.filter((item) =>
    ['Ready', 'Schema Ready', 'Console Config', 'Pipeline Ready'].includes(item.status),
  )

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Governance</p>
          <h1>Audit, RBAC, And Human Review</h1>
        </div>
        <div className="intent-pill">
          <ShieldAlert size={16} />
          Decision support only
        </div>
      </header>

      <section className="kpi-grid compact-kpis">
        <article className="kpi-card">
          <UserCheck size={22} />
          <span>RBAC Roles</span>
          <strong>{demoUsers.length}</strong>
        </article>
        <article className="kpi-card">
          <ClipboardCheck size={22} />
          <span>Audit Events</span>
          <strong>{auditEvents.length}</strong>
        </article>
        <article className="kpi-card">
          <LockKeyhole size={22} />
          <span>Synthetic FIRs</span>
          <strong>{summary.cases}</strong>
        </article>
        <article className="kpi-card">
          <Cloud size={22} />
          <span>Catalyst Controls</span>
          <strong>{productionControls.length}</strong>
        </article>
        <article className="kpi-card emphasis">
          <Scale size={22} />
          <span>Legal Review</span>
          <strong>Required</strong>
        </article>
      </section>

      <section className="dossier-grid">
        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Catalyst Compliance</p>
              <h2>Required Services For This Prototype</h2>
            </div>
            <Cloud size={20} />
          </div>
          <div className="table-wrap">
            <table className="case-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Current Evidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {productionControls.map((item) => (
                  <tr key={item.requiredService}>
                    <td>{item.requiredService}</td>
                    <td>{item.prototypeEvidence}</td>
                    <td>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Submission Gates</p>
              <h2>Human-Controlled Deployment Checks</h2>
            </div>
            <ClipboardCheck size={20} />
          </div>
          {catalystBlueprint.readinessGates.map((gate, index) => (
            <div key={gate} className="audit-row">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{gate}</p>
            </div>
          ))}
        </article>
      </section>

      <section className="governance-layout">
        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Access</p>
              <h2>Role Permission Matrix</h2>
            </div>
            <LockKeyhole size={20} />
          </div>
          <div className="table-wrap">
            <table className="case-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Allowed Scope</th>
                  <th>Decision Boundary</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map(([role, scope, boundary]) => (
                  <tr key={role}>
                    <td>{role}</td>
                    <td>{scope}</td>
                    <td>{boundary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Live Session</p>
              <h2>Audit Timeline</h2>
            </div>
            <History size={20} />
          </div>
          {auditEvents.map(([id, actor, event]) => (
            <div key={id} className="audit-row">
              <span>{id}</span>
              <p>
                <strong>{actor}</strong>
                <br />
                {event}
              </p>
            </div>
          ))}
        </article>
      </section>

      <section className="dossier-grid">
        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Evidence Policy</p>
              <h2>Output Control Points</h2>
            </div>
            <Eye size={20} />
          </div>
          {[
            ['Source Traceability', 'Every answer carries source FIR IDs, evidence rows, and graph/report handoff paths'],
            ['Confidence Framing', 'Lead strength and similarity scores are presented as indicators, not conclusions'],
            ['Sensitive Entity Handling', 'Phone and financial identifiers remain hashed in the prototype dataset'],
            ['Manual Validation', 'Imports validate structure before any Catalyst Data Store upload flow'],
          ].map(([name, detail]) => (
            <div key={name} className="station-row">
              <strong>{name}</strong>
              <span>enabled</span>
              <small>{detail}</small>
            </div>
          ))}
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Risk Notes</p>
              <h2>Skeptic Guardrails</h2>
            </div>
            <AlertTriangle size={20} />
          </div>
          <div className="risk-list">
            <span>No automated guilt label</span>
            <span>Synthetic data only</span>
            <span>Human verification required</span>
            <span>Legal mapping is review support</span>
            <span>Patrol simulation is not a field guarantee</span>
          </div>
          <p className="disclaimer">The prototype is designed to show investigation acceleration while preserving human command authority.</p>
        </article>
      </section>
    </div>
  )
}

export default GovernanceAudit
