import { AlertTriangle, CheckCircle2, FileSearch, GitBranch, Loader2, Mic, Search, ShieldCheck, Sparkles, ThumbsDown, ThumbsUp, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n.js'
import { api } from '../services/api.js'
import { getStoredUser } from '../services/prototypeEngine.js'
import { useRuntime } from '../services/runtime.jsx'

const starterQueries = [
  'Mysuru alli motorcycle theft hotspot show maadi',
  'ಮೈಸೂರು ಬೈಕ್ ಕಳ್ಳತನ ಹಾಟ್‌ಸ್ಪಾಟ್ ತೋರಿಸಿ',
  'Are SYN-2025-BLR-001 and SYN-2025-BLR-014 connected?',
  'Find similar cases to SYN-2025-BLR-001 using Crime DNA',
  'What if 3 patrol units are added in Mysuru?',
  'What is the cricket score?',
]

function Confidence({ confidence }) {
  const score = Math.round((confidence?.score || 0) * 100)
  return <div className={`confidence-summary is-${confidence?.band || 'low'}`}><strong>{score}%</strong><span>{confidence?.band || 'low'} confidence</span></div>
}

function InvestigationChat() {
  const { language, t } = useLanguage()
  const { runtime, runQuery } = useRuntime()
  const user = useMemo(() => getStoredUser(), [])
  const [query, setQuery] = useState(starterQueries[0])
  const [history, setHistory] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [status, setStatus] = useState('Ask a question to start an evidence-grounded investigation.')
  const [feedback, setFeedback] = useState(null)
  const initialized = useRef(false)
  const latest = history[0] || null

  async function execute(nextQuery) {
    const trimmed = nextQuery.trim()
    if (!trimmed || isProcessing) return
    setIsProcessing(true)
    setFeedback(null)
    setStatus('Retrieving and checking cited evidence…')
    try {
      const result = await runQuery(trimmed, {
        previousRequestId: latest?.requestId || null,
        previousIntent: latest?.intent || null,
        interfaceLanguage: language,
      })
      setHistory((current) => [{ ...result, query: trimmed }, ...current].slice(0, 8))
      setStatus(result.mode === 'catalyst-live' ? 'Catalyst response completed.' : 'Offline demo response completed; no changes were persisted.')
    } catch (error) {
      setStatus(`Unable to complete the query: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    execute(starterQueries[0])
    // execute is intentionally called once for the guided opening query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  useEffect(() => {
    if (latest) window.localStorage.setItem('samvaad_last_chat', JSON.stringify(latest))
  }, [latest])

  function submit(event) {
    event.preventDefault()
    execute(query)
  }

  function startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setStatus('Voice input is unavailable in this browser; text input remains available.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = language === 'kn' ? 'kn-IN' : 'en-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onstart = () => { setIsListening(true); setStatus('Listening…') }
    recognition.onresult = (event) => { setQuery(event.results[0][0].transcript); setStatus('Voice query captured. Review it before asking.') }
    recognition.onerror = () => setStatus('Voice capture stopped; use text input if needed.')
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }

  function toggleSpeech() {
    if (!latest || !window.speechSynthesis || typeof window.SpeechSynthesisUtterance === 'undefined') return
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(latest.answer)
    utterance.lang = language === 'kn' ? 'kn-IN' : 'en-IN'
    utterance.rate = 0.94
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  async function recordDecision(decision) {
    if (!latest) return
    setFeedback('Saving review…')
    if (runtime.mode === 'catalyst-live') {
      try {
        await api.feedback({ requestId: latest.requestId, decision })
        setFeedback(`Review recorded: ${decision}`)
      } catch (error) {
        setFeedback(`Review was not persisted: ${error.message}`)
      }
    } else {
      window.localStorage.setItem(`samvaad_feedback_${latest.requestId}`, decision)
      setFeedback(`Local-only review recorded: ${decision}`)
    }
  }

  const dna = latest?.visualizations?.crimeDna || latest?.visualizations?.similar?.[0] || null

  return (
    <div className="page-stack">
      <header className="page-header">
        <div><p className="eyebrow">{t('chat.eyebrow')} · Challenge 1</p><h1>{t('chat.title')}</h1><p>Ask in English, Kannada, or Kanglish. Every supported answer includes traceable synthetic evidence.</p></div>
        <span className="data-label">SYNTHETIC DEMO DATA</span>
      </header>

      <section className="guided-query-strip" aria-label="Guided demonstration queries">
        {starterQueries.map((item) => <button type="button" key={item} onClick={() => { setQuery(item); execute(item) }}>{item}</button>)}
      </section>

      <form className="query-form evidence-query" onSubmit={submit}>
        <Search size={21} aria-hidden="true" />
        <label className="sr-only" htmlFor="investigation-query">Investigation query</label>
        <textarea id="investigation-query" rows="2" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('chat.placeholder')} maxLength="4000" />
        <button type="button" className="voice-button" onClick={startVoiceInput} aria-pressed={isListening}><Mic size={18} />{isListening ? t('chat.listening') : t('chat.voice')}</button>
        <button type="submit" className="primary-button" disabled={isProcessing}>{isProcessing ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}{isProcessing ? t('chat.processing') : t('chat.ask')}</button>
      </form>
      <p className="query-status" role="status">{status}</p>

      {latest ? (
        <section className="answer-layout grounded-answer">
          <article className="panel answer-panel">
            <div className="section-heading">
              <div><p className="eyebrow">{latest.intent.replaceAll('_', ' ')}</p><h2>Evidence-grounded answer</h2></div>
              <Confidence confidence={latest.confidence} />
            </div>
            <p className="answer-copy">{latest.answer}</p>
            <div className="answer-meta-row"><span>{latest.requestId}</span><span>{latest.mode}</span><span>{latest.auditRef || 'No persisted audit reference'}</span></div>
            <button type="button" className="secondary-button" onClick={toggleSpeech}>{isSpeaking ? <VolumeX size={17} /> : <Volume2 size={17} />}{isSpeaking ? 'Stop brief' : 'Speak brief'}</button>
          </article>

          <aside className="panel">
            <div className="section-heading"><div><p className="eyebrow">Human review</p><h2>Accept or challenge the lead</h2></div><ShieldCheck size={20} /></div>
            <div className="review-actions">
              <button type="button" onClick={() => recordDecision('accept')}><ThumbsUp size={17} />Accept for review</button>
              <button type="button" onClick={() => recordDecision('reject')}><ThumbsDown size={17} />Reject lead</button>
            </div>
            {feedback ? <p className="query-status" role="status">{feedback}</p> : null}
            <small>Role: {user?.role}. Acceptance does not establish guilt or authorize action.</small>
          </aside>
        </section>
      ) : null}

      {latest?.citations?.length ? (
        <section className="panel">
          <div className="section-heading"><div><p className="eyebrow">Source citations</p><h2>Why this answer can be checked</h2></div><FileSearch size={20} /></div>
          <div className="citation-grid">
            {latest.citations.map((item) => (
              <Link to={`/cases/${item.firId}`} className="citation-card" key={item.id}>
                <strong>{item.firId}</strong><span>{item.field}</span><p>{item.excerpt}</p><small>{item.dataLabel}</small>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {dna?.factors?.length ? (
        <section className="panel">
          <div className="section-heading"><div><p className="eyebrow">KAVACH Crime DNA</p><h2>Factor-level explanation</h2></div><GitBranch size={20} /></div>
          <div className="factor-table" role="table" aria-label="Crime DNA factors">
            {dna.factors.map((factor) => (
              <div role="row" key={factor.key}><strong role="cell">{factor.label}</strong><span role="cell">Weight {Math.round(factor.weight * 100)}%</span><span role="cell">Contribution {Math.round(factor.contribution * 100)}%</span><small role="cell">{factor.evidence}</small></div>
            ))}
          </div>
        </section>
      ) : null}

      {latest ? (
        <section className="decision-grid">
          <article className="panel"><div className="section-heading"><div><p className="eyebrow">Next actions</p><h2>Human-led follow-up</h2></div><CheckCircle2 size={20} /></div><ol className="action-list">{latest.nextActions.map((item) => <li key={item}>{item}</li>)}</ol></article>
          <article className="panel warning-panel"><div className="section-heading"><div><p className="eyebrow">Limitations</p><h2>Do not over-interpret</h2></div><AlertTriangle size={20} /></div><ul className="action-list">{latest.limitations.map((item) => <li key={item}>{item}</li>)}</ul></article>
        </section>
      ) : null}

      {history.length > 1 ? <section className="panel"><div className="section-heading"><div><p className="eyebrow">Session context</p><h2>Recent evidence requests</h2></div></div><div className="history-list">{history.slice(1).map((item) => <button type="button" key={item.requestId} onClick={() => { setQuery(item.query); execute(item.query) }}><strong>{item.intent.replaceAll('_', ' ')}</strong><span>{item.query}</span></button>)}</div></section> : null}
    </div>
  )
}

export default InvestigationChat
