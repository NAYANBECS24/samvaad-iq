import { Clock, MapPin, Mic, Navigation, Radio, Route, Send, ShieldAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { cases, getHotspots, patrolWhatIf } from '../services/intelligenceRepository.js'
import { useRuntime } from '../services/runtime.jsx'

const activeStatuses = new Set(['Open', 'Under Investigation'])

function TabletPatrol() {
  const { runtime, runQuery } = useRuntime()
  const [query, setQuery] = useState('Nearby chain snatching alerts')
  const [voiceStatus, setVoiceStatus] = useState('Voice ready')
  const [result, setResult] = useState(null)
  const [isQuerying, setIsQuerying] = useState(false)
  const alerts = useMemo(() => cases.filter((caseRecord) => activeStatuses.has(caseRecord.status)).slice(0, 5), [])
  const hotspots = useMemo(() => getHotspots({ district: 'Bengaluru South', crimeType: 'Motorcycle Theft' }), [])
  const patrol = useMemo(() => patrolWhatIf({ district: 'Bengaluru South', crimeType: 'Motorcycle Theft', units: 4 }), [])

  function startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setVoiceStatus('Voice unavailable')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    setVoiceStatus('Listening')
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setQuery(transcript)
      setVoiceStatus('Captured')
    }
    recognition.onerror = () => setVoiceStatus('Text input ready')
    recognition.onend = () => setVoiceStatus('Voice ready')
    recognition.start()
  }

  async function submitQuery(event) {
    event.preventDefault()
    const message = query.trim()
    if (!message || isQuerying) return
    setIsQuerying(true)
    setVoiceStatus('SAMVAAD is checking the shared synthetic case repository…')
    try {
      const nextResult = await runQuery(message, {
        answerMode: 'brief',
        interfaceLanguage: 'en',
        source: 'tablet-patrol',
      })
      setResult(nextResult)
      setVoiceStatus(nextResult?.citations?.length
        ? `Answered with ${nextResult.citations.length} cited synthetic source${nextResult.citations.length === 1 ? '' : 's'}`
        : 'Answered without making a case-database claim')
    } catch (error) {
      setResult(null)
      setVoiceStatus(`Query failed safely: ${error.message}`)
    } finally {
      setIsQuerying(false)
    }
  }

  return (
    <div className="tablet-shell">
      <header className="tablet-topbar">
        <div>
          <p className="eyebrow">Field Officer Tablet</p>
          <h1>Patrol Command View</h1>
        </div>
        <div className="tablet-status-strip">
          <span><Radio size={15} /> {runtime.label}</span>
          <span><Clock size={15} /> 21:00-00:00</span>
        </div>
      </header>

      <section className="tablet-grid">
        <article className="tablet-map">
          <div className="dispatch-grid" />
          {hotspots.points.slice(0, 5).map((caseRecord, index) => (
            <Link
              key={caseRecord.fir_id}
              className="tablet-pin"
              to={`/cases/${caseRecord.fir_id}`}
              style={{
                '--pin-left': `${[18, 44, 68, 32, 76][index]}%`,
                '--pin-top': `${[28, 52, 34, 72, 66][index]}%`,
              }}
            >
              <MapPin size={18} />
              <span>{caseRecord.fir_id.slice(-3)}</span>
            </Link>
          ))}
          <div className="tablet-route-card">
            <Navigation size={20} />
            <div>
              <strong>{patrol.coverageAfter}% coverage</strong>
              <span>{patrol.recommendations[0]?.station || 'Mobile patrol'}</span>
            </div>
          </div>
        </article>

        <aside className="tablet-alerts">
          {alerts.map((caseRecord) => (
            <Link key={caseRecord.fir_id} className="tablet-alert-card" to={`/cases/${caseRecord.fir_id}`}>
              <ShieldAlert size={18} />
              <div>
                <strong>{caseRecord.crime_type}</strong>
                <span>{caseRecord.district} - {caseRecord.time}</span>
              </div>
              <small>{caseRecord.fir_id.slice(-3)}</small>
            </Link>
          ))}
        </aside>
      </section>

      <section className="tablet-dispatch-row">
        {patrol.recommendations.slice(0, 3).map((item) => (
          <div key={item.station}>
            <Route size={18} />
            <strong>{item.station}</strong>
            <span>{item.recommended_units} unit</span>
          </div>
        ))}
      </section>

      <form
        className="tablet-query-dock"
        onSubmit={submitQuery}
      >
        <button type="button" onClick={startVoiceInput} aria-label="Voice query">
          <Mic size={20} />
        </button>
        <input value={query} onChange={(event) => setQuery(event.target.value)} />
        <button type="submit" aria-label="Send query" disabled={isQuerying || !query.trim()}>
          <Send size={20} />
        </button>
        <span>{voiceStatus}</span>
      </form>

      {result ? (
        <section className="panel" aria-live="polite">
          <div className="section-heading">
            <div>
              <p className="eyebrow">SAMVAAD field brief · {result.mode}</p>
              <h2>{result.intent?.replaceAll('_', ' ') || 'Query response'}</h2>
            </div>
          </div>
          <p>{result.answer}</p>
          {result.citations?.length ? (
            <div className="mini-action-row">
              {result.citations.slice(0, 4).map((citation) => (
                <Link key={citation.id} to={`/cases/${citation.firId}`}>{citation.firId}</Link>
              ))}
            </div>
          ) : null}
          <p className="disclaimer">Area/time/category decision support only. Field action and case conclusions require human verification.</p>
        </section>
      ) : null}
    </div>
  )
}

export default TabletPatrol
