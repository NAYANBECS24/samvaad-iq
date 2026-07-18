import {
  Bot,
  CheckCircle2,
  Cloud,
  Database,
  FileText,
  GitBranch,
  ListChecks,
  MapPinned,
  Network,
  Rocket,
  ShieldCheck,
  Workflow,
} from 'lucide-react'
import { useState } from 'react'
import architectureImage from '../assets/samvaad_architecture.png'
import workflowImage from '../assets/samvaad_workflow.png'
import catalystBlueprint from '../../../data/catalyst-service-map.json'

const pipelineTabs = ['Data Flow', 'Agent Room', 'API Layer', 'Catalyst Map', 'Deployment']

const layers = [
  { icon: Database, name: 'Synthetic FIR Store', metric: '1,000 FIRs / 6 districts', tone: 'tone-blue' },
  { icon: Bot, name: 'Query Engine', metric: 'English + Kannada + Kanglish', tone: '' },
  { icon: ListChecks, name: 'Evidence Lab', metric: 'Hash + extraction + provenance', tone: 'tone-blue' },
  { icon: GitBranch, name: 'KAVACH Crime DNA', metric: '6-factor scoring model', tone: 'tone-violet' },
  { icon: MapPinned, name: 'Hotspot + Patrol', metric: 'Cluster and what-if outputs', tone: 'tone-amber' },
  { icon: FileText, name: 'Report Builder', metric: 'PDF-ready evidence brief', tone: '' },
]

const apiRoutes = [
  ['GET', '/api/v1/health', 'JSON runtime and data-version health'],
  ['GET', '/api/v1/capabilities', 'Honest live-service capability registry'],
  ['GET', '/api/v1/ai/status', 'Grounded-model status and safeguard summary'],
  ['GET', '/api/v1/auth/me', 'Catalyst-derived user and role'],
  ['GET', '/api/v1/cases/:firId', 'Synthetic FIR case workspace record'],
  ['POST', '/api/v1/query', 'Multilingual, multi-turn, cited investigation answer'],
  ['POST', '/api/v1/analytics/similarity', 'KAVACH factor-level case matches'],
  ['POST', '/api/v1/analytics/graph', 'Evidence-backed entity network'],
  ['POST', '/api/v1/analytics/hotspots', 'Area/time/category clusters'],
  ['POST', '/api/v1/scenarios', 'Human-reviewed patrol what-if'],
  ['POST', '/api/v1/evidence/:id/analyze', 'Validated evidence extraction and provenance'],
  ['POST', '/api/v1/reports', 'Supervisor-gated evidence brief'],
  ['GET', '/api/v1/audit', 'Hash-chained audit timeline'],
  ['POST', '/api/v1/feedback', 'Analyst accept/reject review'],
]

const deploymentStack = [
  ['catalyst.json', 'Whole-app Catalyst deploy map: dist client output plus functions/api'],
  ['catalyst-pipelines.yaml', 'Catalyst Pipeline steps for install, lint, build, smoke test, and deploy'],
  ['client/public/client-package.json', 'Web Client Hosting metadata copied into the Vite build output'],
  ['functions/api', 'Serverless Functions backend target'],
  ['data/catalyst-service-map.json', 'Submission service map shared by API, UI, and docs'],
]

const serviceStatusClass = {
  Implemented: 'status-ready',
  'Runtime-Detected': 'status-console',
  Ready: 'status-ready',
  'Schema Ready': 'status-schema',
  'Console Config': 'status-console',
  'Pipeline Ready': 'status-pipeline',
  'Prototype Ready': 'status-prototype',
  Roadmap: 'status-roadmap',
}

function SystemPipeline() {
  const [activeTab, setActiveTab] = useState('Data Flow')
  const serviceCounts = catalystBlueprint.serviceMap.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {})
  const readyCount =
    (serviceCounts.Implemented || 0) +
    (serviceCounts.Ready || 0) +
    (serviceCounts['Schema Ready'] || 0) +
    (serviceCounts['Pipeline Ready'] || 0) +
    (serviceCounts['Prototype Ready'] || 0)

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">System Operations</p>
          <h1>Intelligence Pipeline</h1>
        </div>
        <div className="intent-pill">
          <Workflow size={16} />
          Capability blueprint
        </div>
      </header>

      <section className="system-layer-grid">
        {layers.map((layer) => {
          const Icon = layer.icon
          return (
            <article key={layer.name} className={`readiness-card ${layer.tone}`}>
              <Icon size={22} />
              <div>
                <span>{layer.name}</span>
                <strong>{layer.metric}</strong>
              </div>
              <CheckCircle2 size={18} />
            </article>
          )
        })}
      </section>

      <section className="readiness-grid">
        {[
          ['Catalyst Services', catalystBlueprint.serviceMap.length, Cloud, 'tone-blue'],
          ['Code / schema artifacts', readyCount, CheckCircle2, ''],
          ['GitHub Auto-Fetch Steps', catalystBlueprint.githubFlow.length, GitBranch, 'tone-violet'],
          ['Readiness Gates', catalystBlueprint.readinessGates.length, ListChecks, 'tone-amber'],
        ].map(([label, value, Icon, tone]) => (
          <article key={label} className={`readiness-card ${tone}`}>
            <Icon size={22} />
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
            <CheckCircle2 size={18} />
          </article>
        ))}
      </section>

      <nav className="tab-strip" aria-label="Pipeline sections">
        {pipelineTabs.map((tab) => (
          <button key={tab} className={activeTab === tab ? 'active' : ''} type="button" onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === 'Data Flow' ? (
        <section className="pipeline-layout">
          <article className="panel image-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Architecture</p>
                <h2>System Layer Map</h2>
              </div>
              <Network size={20} />
            </div>
            <img src={architectureImage} alt="SAMVAAD-IQ architecture" />
          </article>
          <article className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Processing</p>
                <h2>Case-To-Insight Flow</h2>
              </div>
            </div>
            <div className="timeline-list">
              {[
                ['01', 'FIR fields indexed with district, station, MO, time, entity hashes, and legal sections'],
                ['02', 'Language normalizer resolves English, Kannada, Kanglish, follow-up context, intent, and filters'],
                ['03', 'KAVACH retrieves citations and scores crime type, MO, location, time, shared entities, and narrative'],
                ['04', 'NVIDIA NIM optionally phrases only the cited result; uncited FIR identifiers are rejected'],
                ['05', 'Timeline, contradiction, coverage, graph, hotspot, and scenario views remain linked to source FIRs'],
                ['06', 'Skeptic and Report agents attach limitations, audit reference, review state, and human next actions'],
              ].map(([step, text]) => (
                <div key={step} className="audit-row">
                  <span>{step}</span>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      {activeTab === 'Agent Room' ? (
        <section className="pipeline-layout">
          <article className="panel image-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Workflow</p>
                <h2>Multi-Agent Reasoning Flow</h2>
              </div>
              <Bot size={20} />
            </div>
            <img src={workflowImage} alt="SAMVAAD-IQ workflow" />
          </article>
          <article className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Agents</p>
                <h2>Responsibilities</h2>
              </div>
            </div>
            {[
              ['Detective Agent', 'Frames the investigative question and chooses the intent path'],
              ['Data Agent', 'Retrieves FIR records, station data, accused data, and relation rows'],
              ['Network Agent', 'Finds repeated accused, phones, vehicles, victims, locations, and bank/account links'],
              ['Skeptic Agent', 'Finds structured conflicts, missing evidence, unsupported FIR mentions, and alternative explanations'],
              ['Language Agent', 'Uses NVIDIA NIM only to phrase server-retrieved evidence in English, Kannada, or Kanglish'],
              ['Report Agent', 'Formats the final answer with evidence trail and source identifiers'],
            ].map(([agent, detail]) => (
              <div key={agent} className="station-row">
                <strong>{agent}</strong>
                <span>defined role</span>
                <small>{detail}</small>
              </div>
            ))}
          </article>
        </section>
      ) : null}

      {activeTab === 'API Layer' ? (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Backend Contract</p>
              <h2>Prototype API Routes</h2>
            </div>
            <Cloud size={20} />
          </div>
          <div className="table-wrap">
            <table className="case-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Route</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                {apiRoutes.map(([method, route, purpose]) => (
                  <tr key={route}>
                    <td>{method}</td>
                    <td>{route}</td>
                    <td>{purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === 'Catalyst Map' ? (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Zoho Catalyst Alignment</p>
              <h2>Required Service Map</h2>
            </div>
            <Cloud size={20} />
          </div>
          <div className="risk-list catalyst-summary">
            <span>{catalystBlueprint.summary.deploymentMode}</span>
            <span>Build output: {catalystBlueprint.summary.buildOutput}</span>
            <span>{catalystBlueprint.summary.githubAutoFetch}</span>
          </div>
          <div className="table-wrap">
            <table className="case-table catalyst-table">
              <thead>
                <tr>
                  <th>Capability</th>
                  <th>Required Catalyst Service</th>
                  <th>Prototype Evidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {catalystBlueprint.serviceMap.map((item) => (
                  <tr key={`${item.capability}-${item.requiredService}`}>
                    <td>{item.capability}</td>
                    <td>{item.requiredService}</td>
                    <td>{item.prototypeEvidence}</td>
                    <td>
                      <span className={`service-status ${serviceStatusClass[item.status] || ''}`}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === 'Deployment' ? (
        <section className="dossier-grid">
          <article className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">GitHub To Catalyst</p>
                <h2>Auto-Fetch Deployment Flow</h2>
              </div>
              <Rocket size={20} />
            </div>
            {catalystBlueprint.githubFlow.map((item) => (
              <div key={item.step} className="audit-row">
                <span>{item.step}</span>
                <p>
                  <strong>{item.name}</strong>
                  <br />
                  {item.detail}
                </p>
              </div>
            ))}
          </article>
          <article className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Deploy Package</p>
                <h2>Catalyst Files And Gates</h2>
              </div>
              <ShieldCheck size={20} />
            </div>
            {deploymentStack.map(([name, detail]) => (
              <div key={name} className="station-row">
                <strong>{name}</strong>
                <span>repository artifact</span>
                <small>{detail}</small>
              </div>
            ))}
            <div className="compact-heading">
              <p className="eyebrow">Readiness Gates</p>
            </div>
            <div className="risk-list">
              {catalystBlueprint.readinessGates.map((gate) => (
                <span key={gate}>{gate}</span>
              ))}
            </div>
          </article>
        </section>
      ) : null}
    </div>
  )
}

export default SystemPipeline
