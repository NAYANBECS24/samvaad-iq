import {
  Bot,
  CheckCircle2,
  Cloud,
  Database,
  FileText,
  GitBranch,
  MapPinned,
  Network,
  ShieldCheck,
  Workflow,
} from 'lucide-react'
import { useState } from 'react'
import architectureImage from '../assets/samvaad_architecture.png'
import workflowImage from '../assets/samvaad_workflow.png'

const pipelineTabs = ['Data Flow', 'Agent Room', 'API Layer', 'Deployment']

const layers = [
  { icon: Database, name: 'Synthetic FIR Store', metric: '12 FIR / 7 station records', tone: 'tone-blue' },
  { icon: Bot, name: 'Query Engine', metric: 'English + Kanglish intents', tone: '' },
  { icon: GitBranch, name: 'KAVACH Crime DNA', metric: '6-factor scoring model', tone: 'tone-violet' },
  { icon: MapPinned, name: 'Hotspot + Patrol', metric: 'Cluster and what-if outputs', tone: 'tone-amber' },
  { icon: FileText, name: 'Report Builder', metric: 'PDF-ready evidence brief', tone: '' },
]

const apiRoutes = [
  ['POST', '/api/auth/login', 'Role-based demo login'],
  ['GET', '/api/dashboard/summary', 'KPIs and chart data'],
  ['POST', '/api/chat', 'Intent detection and answer response'],
  ['GET', '/api/similar/:firId', 'Crime DNA matches'],
  ['POST', '/api/crime-dna/similar', 'NETRA-style Crime DNA alias'],
  ['GET', '/api/graph/:firId', 'Entity network graph'],
  ['GET', '/api/hotspots', 'Geospatial clusters'],
  ['GET', '/api/diffusion', 'Rc diffusion risk model'],
  ['POST', '/api/whatif', 'Patrol simulation'],
  ['POST', '/api/simulate/patrol', 'ACSE patrol simulation alias'],
  ['POST', '/api/legal/map', 'Legal XAI mapping'],
  ['GET', '/api/audit/logs', 'Supervisor audit timeline'],
  ['POST', '/api/report', 'HTML investigation brief'],
]

function SystemPipeline() {
  const [activeTab, setActiveTab] = useState('Data Flow')

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">System Operations</p>
          <h1>Intelligence Pipeline</h1>
        </div>
        <div className="intent-pill">
          <Workflow size={16} />
          Prototype-ready
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
                ['02', 'Query parser resolves intent, location, crime type, FIR IDs, and requested output'],
                ['03', 'KAVACH scoring compares crime type, MO, location, time, shared entities, and FIR text'],
                ['04', 'Graph and hotspot services convert evidence into visual investigation views'],
                ['05', 'Skeptic and Report agents attach guardrails, source FIR IDs, and export-ready structure'],
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
              ['Skeptic Agent', 'Adds confidence and guardrail notes before any operational action'],
              ['Report Agent', 'Formats the final answer with evidence trail and source identifiers'],
            ].map(([agent, detail]) => (
              <div key={agent} className="station-row">
                <strong>{agent}</strong>
                <span>active</span>
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

      {activeTab === 'Deployment' ? (
        <section className="dossier-grid">
          <article className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Catalyst</p>
                <h2>Function Compatibility</h2>
              </div>
              <Cloud size={20} />
            </div>
            {[
              ['functions/api', 'Working local Node API used by npm run api:dev'],
              ['functions/samvaad-api', 'Guide-aligned Catalyst function wrapper'],
              ['client/dist', 'Vite build output for hosting'],
              ['data/seed-data.json', 'Synthetic dataset for local and API modules'],
            ].map(([name, detail]) => (
              <div key={name} className="station-row">
                <strong>{name}</strong>
                <span>ready</span>
                <small>{detail}</small>
              </div>
            ))}
          </article>
          <article className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Controls</p>
                <h2>Readiness Gates</h2>
              </div>
              <ShieldCheck size={20} />
            </div>
            <div className="risk-list">
              <span>Auth route present</span>
              <span>API smoke tests pass</span>
              <span>PDF report path ready</span>
              <span>Synthetic-only data</span>
              <span>Catalyst login pending owner account</span>
            </div>
          </article>
        </section>
      ) : null}
    </div>
  )
}

export default SystemPipeline
