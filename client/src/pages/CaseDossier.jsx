import {
  AlertTriangle,
  CalendarClock,
  ClipboardCheck,
  Database,
  FileSearch,
  GitBranch,
  History,
  MapPin,
  Scale,
  ShieldCheck,
  Sparkles,
  UserRoundSearch,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DetectiveRoom from '../components/DetectiveRoom.jsx'
import {
  accused,
  answerQuery,
  buildGraph,
  cases,
  findSimilarCases,
  getStation,
  legalExplainabilityForCase,
  relations,
} from '../services/intelligenceRepository.js'

const tabs = ['Overview', 'Evidence', 'Crime DNA', 'Legal XAI', 'Action Plan', 'Audit']

function statusTone(status) {
  if (status === 'Open') return 'Needs investigator review'
  if (status === 'Under Investigation') return 'Active follow-up running'
  if (status === 'Closed') return 'Closure needs linkage review'
  return 'Record available for reference'
}

function buildActionPlan(caseRecord, matches) {
  return [
    {
      id: 'ACT-01',
      title: 'Verify FIR source fields',
      detail: `${caseRecord.fir_id} includes MO, date, time, station, vehicle, phone hash, victim, and legal section fields.`,
    },
    {
      id: 'ACT-02',
      title: 'Check repeated entities',
      detail: `Review accused ${caseRecord.accused_ids.join(', ')}, vehicle ${caseRecord.vehicle}, and phone ${caseRecord.phone_hash}.`,
    },
    {
      id: 'ACT-03',
      title: 'Compare top Crime DNA match',
      detail: matches[0]
        ? `${matches[0].case.fir_id} is the nearest synthetic match at ${Math.round(matches[0].score * 100)}.`
        : 'No high-confidence match found in the synthetic seed.',
    },
    {
      id: 'ACT-04',
      title: 'Prepare human-reviewed brief',
      detail: 'Export a report only after the investigating officer verifies evidence and legal mapping.',
    },
  ]
}

function CaseDossier() {
  const { firId } = useParams()
  const [activeTab, setActiveTab] = useState('Overview')
  const caseRecord = cases.find((item) => item.fir_id === firId)
  const activeCase = caseRecord || cases[0]
  const station = getStation(activeCase)
  const matches = useMemo(() => findSimilarCases(activeCase.fir_id).matches, [activeCase.fir_id])
  const graph = useMemo(() => buildGraph(activeCase.fir_id), [activeCase.fir_id])
  const agentResponse = useMemo(
    () => answerQuery(`Find similar cases to ${activeCase.fir_id}`, 'Investigator'),
    [activeCase.fir_id],
  )
  const accusedRecords = accused.filter((person) => activeCase.accused_ids.includes(person.accused_id))
  const entityRelations = relations.filter(
    (relation) =>
      relation.target === activeCase.fir_id ||
      relation.source === activeCase.fir_id ||
      activeCase.accused_ids.includes(relation.source) ||
      [activeCase.vehicle, activeCase.phone_hash].includes(relation.target),
  )
  const actionPlan = buildActionPlan(activeCase, matches)
  const legalXai = legalExplainabilityForCase(activeCase)
  const evidenceRows = [
    ['FIR ID', activeCase.fir_id],
    ['Crime Type', activeCase.crime_type],
    ['District', activeCase.district],
    ['Station', station?.station_name || activeCase.station_id],
    ['Date / Time', `${activeCase.date} ${activeCase.time}`],
    ['BNS / Legal Mapping', activeCase.bns_sections],
    ['Victim ID', activeCase.victim_id],
    ['Vehicle', activeCase.vehicle],
    ['Phone Hash', activeCase.phone_hash],
    ['MO', activeCase.mo],
  ]

  if (!caseRecord) {
    return (
      <div className="page-stack">
        <header className="page-header">
          <div>
            <p className="eyebrow">FIR Dossier</p>
            <h1>Record Not Found</h1>
          </div>
          <Link className="primary-button" to="/cases">
            <FileSearch size={17} />
            Case Explorer
          </Link>
        </header>
        <article className="panel">
          <p className="disclaimer">No synthetic FIR record is available for {firId}.</p>
        </article>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">FIR Dossier</p>
          <h1>{caseRecord.fir_id}</h1>
        </div>
        <div className="header-actions">
          <Link className="secondary-button" to="/cases">
            <FileSearch size={17} />
            Cases
          </Link>
          <Link className="secondary-button" to={`/network/${caseRecord.fir_id}`}>
            <GitBranch size={17} />
            Graph
          </Link>
          <Link className="primary-button" to="/report">
            <ClipboardCheck size={17} />
            Brief
          </Link>
        </div>
      </header>

      <section className="dossier-hero">
        <div>
          <p className="eyebrow">{caseRecord.crime_type}</p>
          <h2>{caseRecord.case_summary}</h2>
          <p className="kannada-text">{caseRecord.case_summary_kn}</p>
          <hr style={{ margin: '1rem 0', opacity: 0.1 }} />
          <p>{caseRecord.mo}</p>
          <p className="kannada-text"><small>{caseRecord.mo_kn}</small></p>
        </div>
        <div className="dossier-status">
          <span className="status-pill">{caseRecord.status}</span>
          <strong>{statusTone(caseRecord.status)}</strong>
          <small>{station?.station_name || caseRecord.station_id}</small>
        </div>
      </section>

      <nav className="tab-strip" aria-label="Dossier sections">
        {tabs.map((tab) => (
          <button key={tab} className={activeTab === tab ? 'active' : ''} type="button" onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === 'Overview' ? (
        <section className="dossier-grid">
          <article className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Case Snapshot</p>
                <h2>Operational Context</h2>
              </div>
              <ShieldCheck size={20} />
            </div>
            <div className="fact-grid">
              <div>
                <MapPin size={18} />
                <span>District</span>
                <strong>{caseRecord.district}</strong>
              </div>
              <div>
                <CalendarClock size={18} />
                <span>Incident Time</span>
                <strong>{caseRecord.time}</strong>
              </div>
              <div>
                <Scale size={18} />
                <span>Legal Mapping</span>
                <strong>{caseRecord.bns_sections}</strong>
              </div>
              <div>
                <GitBranch size={18} />
                <span>Graph Nodes</span>
                <strong>{graph.nodes.length}</strong>
              </div>
            </div>
          </article>

          <article className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Entities</p>
                <h2>People, Assets, Hashes</h2>
              </div>
              <UserRoundSearch size={20} />
            </div>
            <div className="entity-grid">
              {accusedRecords.map((person) => (
                <div key={person.accused_id} className="entity-card">
                  <strong>{person.display_name}</strong>
                  <span>{person.accused_id}</span>
                  <small>{person.known_mo}</small>
                </div>
              ))}
              <div className="entity-card">
                <strong>{caseRecord.vehicle}</strong>
                <span>Vehicle</span>
                <small>Linked synthetic asset in case registry</small>
              </div>
              <div className="entity-card">
                <strong>{caseRecord.phone_hash}</strong>
                <span>Phone Hash</span>
                <small>Hash-only prototype identifier</small>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      {activeTab === 'Evidence' ? (
        <section className="dossier-grid">
          <article className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Evidence Matrix</p>
                <h2>Structured FIR Fields</h2>
              </div>
              <Database size={20} />
            </div>
            <div className="table-wrap">
              <table>
                <tbody>
                  {evidenceRows.map(([label, value]) => (
                    <tr key={label}>
                      <th>{label}</th>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Relations</p>
                <h2>Source Graph Edges</h2>
              </div>
              <GitBranch size={20} />
            </div>
            {entityRelations.map((relation, index) => (
              <div key={`${relation.source}-${relation.target}-${index}`} className="station-row">
                <strong>
                  {relation.source} {'->'} {relation.target}
                </strong>
                <span>{relation.type}</span>
                <small>weight {relation.weight}</small>
              </div>
            ))}
          </article>
        </section>
      ) : null}

      {activeTab === 'Crime DNA' ? (
        <section className="match-grid">
          {matches.map((match) => (
            <article key={match.case.fir_id} className="match-card">
              <div className="match-score">
                <Sparkles size={18} />
                <strong>{Math.round(match.score * 100)}</strong>
              </div>
              <div>
                <h3>{match.case.fir_id}</h3>
                <p>{match.case.case_summary}</p>
                <ul>
                  {match.reasons.slice(0, 5).map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {activeTab === 'Legal XAI' ? (
        <section className="dossier-grid">
          <article className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Legal-Grounded XAI</p>
                <h2>BNS / IPC Review Support</h2>
              </div>
              <Scale size={20} />
            </div>
            <div className="fact-grid">
              <div>
                <Scale size={18} />
                <span>BNS</span>
                <strong>{legalXai.bns}</strong>
              </div>
              <div>
                <Scale size={18} />
                <span>Legacy IPC</span>
                <strong>{legalXai.ipc}</strong>
              </div>
              <div>
                <ShieldCheck size={18} />
                <span>Privacy Tag</span>
                <strong>{legalXai.privacyTag}</strong>
              </div>
              <div>
                <AlertTriangle size={18} />
                <span>Human Action</span>
                <strong>{legalXai.humanActionNote}</strong>
              </div>
            </div>
            <p className="disclaimer">{legalXai.legalNote}</p>
          </article>

          <article className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Evidence IDs</p>
                <h2>Export Trace</h2>
              </div>
              <FileSearch size={20} />
            </div>
            <div className="source-list">
              {legalXai.evidenceIds.map((source) => (
                <span key={source} className="source-chip">
                  <FileSearch size={14} />
                  {source}
                </span>
              ))}
            </div>
            <div className="risk-list">
              <span>Evidence-grounded</span>
              <span>DPDP-aware demo tag</span>
              <span>No unsupported legal claim</span>
            </div>
          </article>
        </section>
      ) : null}

      {activeTab === 'Action Plan' ? (
        <section className="dossier-grid">
          <article className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Investigation Steps</p>
                <h2>Human-Led Checklist</h2>
              </div>
              <ClipboardCheck size={20} />
            </div>
            <div className="next-step-list">
              {actionPlan.map((item) => (
                <div key={item.id} className="next-step">
                  <span>{item.id}</span>
                  <p>
                    <strong>{item.title}</strong>
                    <br />
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </article>
          <DetectiveRoom agents={agentResponse.agents} />
        </section>
      ) : null}

      {activeTab === 'Audit' ? (
        <section className="dossier-grid">
          <article className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Audit Trail</p>
                <h2>Explainability Events</h2>
              </div>
              <History size={20} />
            </div>
            {[
              ['AUD-01', 'FIR record loaded from synthetic seed data'],
              ['AUD-02', `${matches.length} Crime DNA candidates scored`],
              ['AUD-03', `${graph.nodes.length} graph nodes and ${graph.edges.length} edges generated`],
              ['AUD-04', 'Skeptic Agent marked output as investigative support only'],
            ].map(([id, text]) => (
              <div key={id} className="audit-row">
                <span>{id}</span>
                <p>{text}</p>
              </div>
            ))}
          </article>

          <article className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Guardrails</p>
                <h2>Legal Review Notes</h2>
              </div>
              <AlertTriangle size={20} />
            </div>
            <div className="risk-list">
              <span>Synthetic dataset only</span>
              <span>No guilt prediction</span>
              <span>Hash fields require verification</span>
              <span>BNS mapping needs human review</span>
            </div>
            <p className="disclaimer">All generated links are investigative leads for prototype review.</p>
          </article>
        </section>
      ) : null}
    </div>
  )
}

export default CaseDossier
