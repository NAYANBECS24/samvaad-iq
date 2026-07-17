import { GitBranch, MapPinned, RadioTower, Route, SearchCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const tools = [
  { to: '/similar', Icon: Sparkles, title: 'KAVACH Crime DNA', text: 'Compare case fingerprints with factor-level weights, thresholds, and contradictions.' },
  { to: '/network', Icon: GitBranch, title: 'Evidence Network', text: 'Inspect case-to-case links and verify the entity fields behind each edge.' },
  { to: '/map', Icon: MapPinned, title: 'Area Hotspots', text: 'Explore synthetic station-area and time patterns without person-level risk scores.' },
  { to: '/cold-cases', Icon: SearchCheck, title: 'Cold Case Review', text: 'Surface explainable MO matches as review leads, never automated conclusions.' },
  { to: '/patrol', Icon: Route, title: 'Patrol Scenarios', text: 'Compare transparent area-coverage scenarios with supervisor review.' },
  { to: '/diffusion', Icon: RadioTower, title: 'Pattern Diffusion', text: 'Study synthetic geographic and temporal spread with limitations attached.' },
]

function IntelligenceAnalytics() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div><p className="eyebrow">NETRA Intelligence Analytics</p><h1>One Evidence-Grounded Analysis Workspace</h1><p>Every analysis links back to synthetic source records and remains subject to human verification.</p></div>
        <span className="data-label">SYNTHETIC DEMO DATA</span>
      </header>
      <section className="analytics-tool-grid">
        {tools.map(({ to, Icon, title, text }) => (
          <Link className="analytics-tool-card" to={to} key={to}>
            <Icon size={24} />
            <div><h2>{title}</h2><p>{text}</p><span>Open analysis →</span></div>
          </Link>
        ))}
      </section>
      <article className="safety-callout">
        <ShieldCheckCopy />
        <div><strong>Decision-support boundary</strong><p>These tools prioritize review. They do not predict guilt, replace investigation, or authorize operational action.</p></div>
      </article>
    </div>
  )
}

function ShieldCheckCopy() {
  return <span aria-hidden="true" className="safety-icon">✓</span>
}

export default IntelligenceAnalytics
