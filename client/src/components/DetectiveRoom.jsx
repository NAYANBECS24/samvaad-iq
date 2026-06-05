import { BrainCircuit, CheckCircle2, Database, GitBranch, Search, ShieldAlert } from 'lucide-react'

const agentIcons = {
  'Detective Agent': Search,
  'Data Agent': Database,
  'Network Agent': GitBranch,
  'Skeptic Agent': ShieldAlert,
  'Report Agent': BrainCircuit,
}

const agentColors = ['var(--cyan)', 'var(--blue)', 'var(--violet)', 'var(--amber)', 'var(--emerald)']

function DetectiveRoom({ agents }) {
  if (!agents?.length) return null

  return (
    <section className="detective-room">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Detective Room</p>
          <h2>KAVACH Agent Reasoning</h2>
        </div>
        <BrainCircuit size={19} style={{ color: 'var(--cyan)' }} />
      </div>
      <div className="agent-grid">
        {agents.map((agent, index) => {
          const Icon = agentIcons[agent.agent] || BrainCircuit
          const color = agentColors[index % agentColors.length]
          return (
            <div key={agent.agent} className="agent-card">
              <div className="agent-title">
                <Icon size={17} style={{ color }} />
                <strong style={{ fontSize: '0.82rem', color: 'var(--text-bright)' }}>{agent.agent}</strong>
              </div>
              <p>{agent.note}</p>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 'auto',
                paddingTop: 6,
              }}>
                <CheckCircle2 size={14} style={{ color: 'var(--emerald)' }} />
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--emerald)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  {agent.status === 'complete' ? 'Complete' : 'Ready'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default DetectiveRoom
