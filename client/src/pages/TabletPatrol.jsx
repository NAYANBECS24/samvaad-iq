import { Clock, MapPin, Mic, Navigation, Radio, Route, Send, ShieldAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { cases, getHotspots, patrolWhatIf } from '../services/prototypeEngine.js'

const activeStatuses = new Set(['Open', 'Under Investigation'])

function TabletPatrol() {
  const [query, setQuery] = useState('Nearby chain snatching alerts')
  const [voiceStatus, setVoiceStatus] = useState('Voice ready')
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

  return (
    <div className="tablet-shell">
      <header className="tablet-topbar">
        <div>
          <p className="eyebrow">Field Officer Tablet</p>
          <h1>Patrol Command View</h1>
        </div>
        <div className="tablet-status-strip">
          <span><Radio size={15} /> Online</span>
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
        onSubmit={(event) => {
          event.preventDefault()
          setVoiceStatus('Query staged')
        }}
      >
        <button type="button" onClick={startVoiceInput} aria-label="Voice query">
          <Mic size={20} />
        </button>
        <input value={query} onChange={(event) => setQuery(event.target.value)} />
        <button type="submit" aria-label="Send query">
          <Send size={20} />
        </button>
        <span>{voiceStatus}</span>
      </form>
    </div>
  )
}

export default TabletPatrol
