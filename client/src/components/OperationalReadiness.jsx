import { CheckCircle2, FileText, LockKeyhole, Network, ShieldCheck } from 'lucide-react'
import { seedSummary } from '../services/intelligenceRepository.js'

function OperationalReadiness() {
  const counts = seedSummary()

  const items = [
    { icon: ShieldCheck, label: 'Synthetic Data', value: 'No real PII', tone: 'teal' },
    { icon: Network, label: 'Graph Links', value: `${counts.relations} seeded edges`, tone: 'blue' },
    { icon: FileText, label: 'PDF Brief', value: 'Client export', tone: 'amber' },
    { icon: LockKeyhole, label: 'RBAC Demo', value: `${counts.users} roles`, tone: 'violet' },
  ]

  return (
    <section className="readiness-grid">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <article key={item.label} className={`readiness-card tone-${item.tone}`}>
            <Icon size={20} />
            <div>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
            <CheckCircle2 size={18} />
          </article>
        )
      })}
    </section>
  )
}

export default OperationalReadiness
