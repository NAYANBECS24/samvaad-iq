import { Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CaseCard from '../components/CaseCard.jsx'
import { cases, findSimilarCases } from '../services/prototypeEngine.js'

function SimilarCases() {
  const { firId } = useParams()
  const [selected, setSelected] = useState(firId || 'SYN-2025-BLR-027')
  const result = useMemo(() => findSimilarCases(selected), [selected])

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">KAVACH Crime DNA</p>
          <h1>Similar Case Matching</h1>
        </div>
        <select value={selected} onChange={(event) => setSelected(event.target.value)}>
          {cases.map((caseRecord) => (
            <option key={caseRecord.fir_id} value={caseRecord.fir_id}>
              {caseRecord.fir_id}
            </option>
          ))}
        </select>
      </header>

      {result.source ? <CaseCard caseRecord={result.source} /> : null}

      <section className="match-grid">
        {result.matches.map((match) => (
          <article key={match.case.fir_id} className="match-card">
            <div className="match-score">
              <Sparkles size={18} />
              <strong>{Math.round(match.score * 100)}</strong>
            </div>
            <div>
              <h3>{match.case.fir_id}</h3>
              <p>{match.case.crime_type}</p>
              <ul>
                {match.reasons.slice(0, 5).map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              <div className="mini-action-row">
                <Link to={`/cases/${match.case.fir_id}`}>Dossier</Link>
                <Link to={`/network/${match.case.fir_id}`}>Graph</Link>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

export default SimilarCases
