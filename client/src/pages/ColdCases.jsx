import { AlertTriangle, ArchiveRestore, Sparkles } from 'lucide-react'
import CaseCard from '../components/CaseCard.jsx'
import { findColdCaseMatches } from '../services/intelligenceRepository.js'

function ColdCases() {
  const matches = findColdCaseMatches()

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Cold Case Resurrector</p>
          <h1>Unsolved Case Pattern Revival</h1>
        </div>
        <div className="intent-pill">Investigative leads only</div>
      </header>

      <section className="cold-grid">
        {matches.map((item) => (
          <article key={item.coldCase.fir_id} className="panel cold-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Cold Match Found</p>
                <h2>{item.coldCase.fir_id}</h2>
              </div>
              <ArchiveRestore size={20} />
            </div>

            <div className="cold-match-row">
              <div>
                <strong>Old Case</strong>
                <p>{item.coldCase.case_summary}</p>
              </div>
              <div className="match-score compact-score">
                <Sparkles size={18} />
                <strong>{Math.round(item.match.score * 100)}</strong>
              </div>
              <div>
                <strong>New Match</strong>
                <p>
                  {item.match.case.fir_id}: {item.match.case.case_summary}
                </p>
              </div>
            </div>

            <div className="risk-list">
              {item.match.reasons.slice(0, 5).map((reason) => (
                <span key={reason}>{reason}</span>
              ))}
            </div>

            <p className="disclaimer">
              <AlertTriangle size={14} /> {item.disclaimer}
            </p>
          </article>
        ))}
      </section>

      <section className="case-grid">
        {matches.map((item) => (
          <CaseCard key={item.match.case.fir_id} caseRecord={item.match.case} compact />
        ))}
      </section>
    </div>
  )
}

export default ColdCases
