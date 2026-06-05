import {
  BadgeCheck,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Cloud,
  Database,
  FileSearch,
  FileText,
  GitBranch,
  Image,
  Mail,
  Mic,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Upload,
  Workflow,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  buildEvidenceAnalysis,
  buildEvidenceChatResponse,
  evidenceBlueprint,
  readEvidenceAudit,
  writeEvidenceAudit,
} from '../services/evidenceIntelligence.js'

const profileIcons = {
  'fir-pdf': FileText,
  'cctv-image': Image,
  'id-document': FileSearch,
  'audio-clip': Mic,
}

function ExtractionCard({ label, value }) {
  return (
    <div className="evidence-lab-fact">
      <span>{label}</span>
      <strong>{Array.isArray(value) ? value.join(', ') : value}</strong>
    </div>
  )
}

function EvidenceLab() {
  const [profileId, setProfileId] = useState('fir-pdf')
  const [file, setFile] = useState(null)
  const [analysis, setAnalysis] = useState(() => buildEvidenceAnalysis({ profileId: 'fir-pdf' }))
  const [audit, setAudit] = useState(() => readEvidenceAudit())
  const [reportResponse, setReportResponse] = useState(null)
  const activeProfile = useMemo(
    () => evidenceBlueprint.evidenceProfiles.find((profile) => profile.id === profileId) || evidenceBlueprint.evidenceProfiles[0],
    [profileId],
  )

  function selectProfile(nextProfileId) {
    setProfileId(nextProfileId)
    setFile(null)
    setReportResponse(null)
    setAnalysis(buildEvidenceAnalysis({ profileId: nextProfileId }))
  }

  function handleFile(event) {
    const nextFile = event.target.files?.[0] || null
    setFile(nextFile)
    setReportResponse(null)
    setAnalysis(buildEvidenceAnalysis({ profileId, file: nextFile }))
  }

  function stageReport() {
    const response = buildEvidenceChatResponse(analysis)
    localStorage.setItem('samvaad_last_chat', JSON.stringify(response))
    setAudit(writeEvidenceAudit(analysis))
    setReportResponse(response)
  }

  const generatedReport = reportResponse?.visuals?.report || analysis.report
  const topMatch = analysis.matchedCases[0]

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">NETRA Evidence Lab</p>
          <h1>Evidence Intelligence Layer</h1>
        </div>
        <div className="intent-pill">
          <Workflow size={16} />
          Evidence to report
        </div>
      </header>

      <section className="kpi-grid compact-kpis">
        {[
          ['Extraction Confidence', `${Math.round(analysis.extracted.confidence * 100)}%`, Sparkles],
          ['Linked FIRs', analysis.matchedCases.length, GitBranch],
          ['QuickML Sources', analysis.sourceChunks.length, BrainCircuit],
          ['Audit Signals', analysis.auditTrail.length, RadioTower],
        ].map(([label, value, Icon]) => (
          <article key={label} className="kpi-card">
            <Icon size={22} />
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="evidence-lab-layout">
        <article className="panel evidence-intake-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Upload Evidence</p>
              <h2>Zia Intake And Stratus Object</h2>
            </div>
            <Upload size={20} />
          </div>

          <div className="evidence-profile-grid">
            {evidenceBlueprint.evidenceProfiles.map((profile) => {
              const Icon = profileIcons[profile.id] || FileText
              return (
                <button
                  key={profile.id}
                  className={profile.id === profileId ? 'active' : ''}
                  type="button"
                  onClick={() => selectProfile(profile.id)}
                >
                  <Icon size={18} />
                  <span>{profile.label}</span>
                  <small>{profile.kind}</small>
                </button>
              )
            })}
          </div>

          <label className="upload-dropzone">
            <input type="file" accept={activeProfile.accepted} onChange={handleFile} />
            <Upload size={22} />
            <strong>{file?.name || activeProfile.sampleFileName}</strong>
            <span>{activeProfile.extractionMode}</span>
          </label>

          <div className="evidence-object-card">
            <div>
              <p className="eyebrow">Stratus Object</p>
              <strong>{analysis.uploaded.checksum}</strong>
              <span>{analysis.uploaded.objectKey}</span>
            </div>
            <Cloud size={22} />
          </div>

          <div className="risk-list">
            {activeProfile.requiredServices.map((service) => (
              <span key={service}>{service}</span>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Zia Extraction</p>
              <h2>Normalized Evidence Entities</h2>
            </div>
            <BadgeCheck size={20} />
          </div>
          <div className="evidence-lab-fact-grid">
            <ExtractionCard label="Crime Type" value={analysis.extracted.crimeType} />
            <ExtractionCard label="District" value={analysis.extracted.district} />
            <ExtractionCard label="Location" value={analysis.extracted.location} />
            <ExtractionCard label="Time Window" value={analysis.extracted.timeWindow} />
            <ExtractionCard label="Vehicle" value={analysis.extracted.vehicle} />
            <ExtractionCard label="Phone Hash" value={analysis.extracted.phoneHash} />
            <ExtractionCard label="Entity Mentions" value={analysis.extracted.suspectMentions} />
            <ExtractionCard label="Legal Hints" value={analysis.extracted.legalHints} />
          </div>
          <p className="evidence-transcript">{activeProfile.sourceText}</p>
        </article>
      </section>

      <section className="evidence-lab-layout">
        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Crime DNA Match</p>
              <h2>Evidence To FIR Links</h2>
            </div>
            <GitBranch size={20} />
          </div>
          <div className="evidence-match-list">
            {analysis.matchedCases.map((match) => (
              <div key={match.caseRecord.fir_id} className="evidence-match-card">
                <div className="match-score">
                  <ShieldCheck size={18} />
                  <strong>{Math.round(match.score * 100)}</strong>
                </div>
                <div>
                  <p className="eyebrow">{match.caseRecord.crime_type}</p>
                  <h3>{match.caseRecord.fir_id}</h3>
                  <span>{match.station}</span>
                  <p>{match.caseRecord.case_summary}</p>
                  <div className="risk-list">
                    {match.reasons.map((reason) => (
                      <span key={reason}>{reason}</span>
                    ))}
                  </div>
                </div>
                <div className="mini-action-row">
                  <Link to={`/cases/${match.caseRecord.fir_id}`}>Dossier</Link>
                  <Link to={`/network/${match.caseRecord.fir_id}`}>Graph</Link>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">QuickML RAG</p>
              <h2>Source Chunks</h2>
            </div>
            <BrainCircuit size={20} />
          </div>
          <div className="rag-source-grid">
            {analysis.sourceChunks.map((chunk) => (
              <div key={chunk.id} className="rag-source-card">
                <span>{chunk.id}</span>
                <strong>{chunk.title}</strong>
                <p>{chunk.text}</p>
                <small>
                  {chunk.service} | {Math.round(chunk.confidence * 100)}%
                </small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="evidence-lab-layout">
        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Signals + Circuits</p>
              <h2>Supervisor Workflow</h2>
            </div>
            <RadioTower size={20} />
          </div>
          <div className="circuits-flow">
            {analysis.workflowEvents.map((event) => (
              <div key={event.id} className="circuit-step">
                <span>{event.id}</span>
                <div>
                  <strong>{event.name}</strong>
                  <p>{event.detail}</p>
                  <small>{event.service}</small>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">SmartBrowz Report</p>
              <h2>Official Brief Handoff</h2>
            </div>
            <ClipboardCheck size={20} />
          </div>
          {[
            ['Render Job', generatedReport.smartBrowz.renderJobId, generatedReport.smartBrowz.service, Zap],
            ['Storage Object', generatedReport.stratusObject.key, generatedReport.stratusObject.service, Database],
            ['Notification', generatedReport.mailEvent.template, generatedReport.mailEvent.service, Mail],
            ['Top FIR', topMatch?.caseRecord.fir_id || 'NA', 'Supervisor review required', ShieldCheck],
          ].map(([label, value, detail, Icon]) => (
            <div key={label} className="evidence-link-row">
              <Icon size={17} />
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{detail}</small>
            </div>
          ))}
          <div className="action-row">
            <button className="primary-button" type="button" onClick={stageReport}>
              <CheckCircle2 size={18} />
              Stage Report
            </button>
            <Link className="secondary-button" to="/report">
              <FileText size={17} />
              Open Report
            </Link>
          </div>
          <p className="disclaimer">
            {reportResponse
              ? `${reportResponse.conversationId} staged with ${analysis.auditTrail.length} audit events.`
              : evidenceBlueprint.summary.disclaimer}
          </p>
        </article>
      </section>

      <section className="dossier-grid">
        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Catalyst Cache</p>
              <h2>Precomputed Intelligence</h2>
            </div>
            <Zap size={20} />
          </div>
          <div className="cache-grid">
            {analysis.cachePlan.map((entry) => (
              <div key={entry.key} className="cache-card">
                <strong>{entry.key}</strong>
                <span>{entry.scope}</span>
                <small>
                  {entry.service} | TTL {entry.ttl} | {entry.status}
                </small>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Audit Log</p>
              <h2>Latest Evidence Events</h2>
            </div>
            <Database size={20} />
          </div>
          {(audit.length ? audit : analysis.auditTrail).slice(0, 6).map((event) => (
            <div key={`${event.id}-${event.timestamp || event.actor}`} className="audit-row">
              <span>{event.id.replace('AUD-EV-', '')}</span>
              <p>
                <strong>{event.actor}</strong>
                <br />
                {event.event}
              </p>
            </div>
          ))}
        </article>
      </section>
    </div>
  )
}

export default EvidenceLab
