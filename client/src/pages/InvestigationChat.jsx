import { AlertTriangle, BrainCircuit, ClipboardCheck, FileText, GitBranch, Loader2, Map, Mic, Search, Sparkles, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CaseCard from '../components/CaseCard.jsx'
import DetectiveRoom from '../components/DetectiveRoom.jsx'
import EvidencePanel from '../components/EvidencePanel.jsx'
import { useLanguage } from '../i18n.js'
import { answerQuery, cases } from '../services/prototypeEngine.js'

const starterQueries = [
  'Saar, Mysuru alli last 6 months motorcycle theft pattern show maadi',
  'Last 6 months alli Mysuru division chain snatching hotspots show maadi',
  'Are FIR-2025-BLR-001 and FIR-2025-BLR-014 connected?',
  'Show financial fraud links across districts',
  'Find similar cases to FIR-2025-BLR-027',
  'What if 3 patrol units are added to Jayanagar and Banashankari from 9 PM to 12 AM?',
  'Generate PDF report for the motorcycle theft cluster',
]

function TypeWriter({ text, speed = 12 }) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    let idx = 0
    const id = setInterval(() => {
      idx += 1
      setDisplayed(text.slice(0, idx))
      if (idx >= text.length) clearInterval(id)
    }, speed)

    // Reset on first tick
    const resetId = setTimeout(() => setDisplayed(''), 0)
    return () => { clearInterval(id); clearTimeout(resetId) }
  }, [text, speed])

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span style={{
          display: 'inline-block',
          width: 2,
          height: '1em',
          background: 'var(--cyan)',
          marginLeft: 2,
          animation: 'blink 0.8s step-end infinite',
          verticalAlign: 'text-bottom',
        }} />
      )}
      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </span>
  )
}

function ConfidenceRing({ value }) {
  const percent = Math.round(value * 100)
  const color = percent >= 80 ? 'var(--emerald)' : percent >= 60 ? 'var(--amber)' : 'var(--red)'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15" fill="none" stroke="var(--line)" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${percent * 0.942} 94.2`}
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <span className="confidence-badge">{percent}%</span>
    </div>
  )
}

function InvestigationChat() {
  const { language, t } = useLanguage()
  const [query, setQuery] = useState(starterQueries[0])
  const [history, setHistory] = useState(() => [answerQuery(starterQueries[0], 'Investigator')])
  const [isListening, setIsListening] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState({ key: 'chat.voiceReady' })
  const [speechStatus, setSpeechStatus] = useState({ key: 'chat.speechReady' })
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const latest = history[0]

  useEffect(() => {
    localStorage.setItem('samvaad_last_chat', JSON.stringify(latest))
  }, [latest])

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [])

  const selectedCases = useMemo(() => {
    const sourceSet = new Set(latest.sources)
    return cases.filter((caseRecord) => sourceSet.has(caseRecord.fir_id)).slice(0, 4)
  }, [latest])

  function resetVoiceOutput() {
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
    setSpeechStatus({ key: 'chat.speechReady' })
  }

  function runQuery(event) {
    event?.preventDefault()
    if (!query.trim()) return
    resetVoiceOutput()
    setIsProcessing(true)
    setTimeout(() => {
      setHistory((current) => [answerQuery(query, 'Investigator'), ...current].slice(0, 6))
      setIsProcessing(false)
    }, 600)
  }

  function runStarter(nextQuery) {
    setQuery(nextQuery)
    resetVoiceOutput()
    setIsProcessing(true)
    setTimeout(() => {
      setHistory((current) => [answerQuery(nextQuery, 'Investigator'), ...current].slice(0, 6))
      setIsProcessing(false)
    }, 600)
  }

  function startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setVoiceStatus({ key: 'chat.voiceUnavailable' })
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    setIsListening(true)
    setVoiceStatus({ key: 'chat.voiceListening' })

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setQuery(transcript)
      setVoiceStatus({ key: 'chat.voiceCaptured', value: transcript })
    }
    recognition.onerror = () => {
      setVoiceStatus({ key: 'chat.voiceStopped' })
      setIsListening(false)
    }
    recognition.onend = () => {
      setIsListening(false)
    }
    recognition.start()
  }

  function toggleVoiceOutput() {
    if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance === 'undefined') {
      setSpeechStatus({ key: 'chat.speechUnsupported' })
      return
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setSpeechStatus({ key: 'chat.speechStopped' })
      return
    }

    const utterance = new window.SpeechSynthesisUtterance(latest.answer)
    utterance.lang = language === 'kn' ? 'kn-IN' : 'en-IN'
    utterance.rate = 0.94
    utterance.pitch = 0.95

    utterance.onstart = () => {
      setIsSpeaking(true)
      setSpeechStatus({ key: 'chat.speechSpeaking' })
    }
    utterance.onend = () => {
      setIsSpeaking(false)
      setSpeechStatus({ key: 'chat.speechDone' })
    }
    utterance.onerror = () => {
      setIsSpeaking(false)
      setSpeechStatus({ key: 'chat.speechError' })
    }

    window.speechSynthesis.cancel()
    setIsSpeaking(true)
    setSpeechStatus({ key: 'chat.speechStarting' })
    window.speechSynthesis.speak(utterance)
  }

  const voiceStatusText = voiceStatus.value
    ? `${t(voiceStatus.key)} ${voiceStatus.value}`
    : t(voiceStatus.key)

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t('chat.eyebrow')}</p>
          <h1>{t('chat.title')}</h1>
        </div>
        <div className="intent-pill">{latest.intent}</div>
      </header>

      <section className="query-console">
        <form className="query-form" onSubmit={runQuery}>
          <Search size={19} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('chat.placeholder')} />
          <button className="secondary-button" type="button" onClick={startVoiceInput}>
            <Mic size={18} />
            {isListening ? t('chat.listening') : t('chat.voice')}
          </button>
          <button className="primary-button" type="submit" disabled={isProcessing}>
            {isProcessing ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
            {isProcessing ? t('chat.processing') : t('chat.ask')}
          </button>
        </form>
        <p className="voice-status">{voiceStatusText}</p>
        <div className="starter-grid">
          {starterQueries.map((item) => (
            <button key={item} type="button" onClick={() => runStarter(item)}>
              {item}
            </button>
          ))}
        </div>
      </section>

      {isProcessing && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          borderRadius: 14,
          border: '1px solid var(--line)',
          background: 'var(--surface)',
          backdropFilter: 'blur(16px)',
          animation: 'agent-enter 0.3s ease both',
        }}>
          <Loader2 size={20} className="spin" style={{ color: 'var(--cyan)' }} />
          <span style={{ color: 'var(--muted)' }}>{t('chat.agentAnalyzing')}</span>
        </div>
      )}

      <section className="answer-layout">
        <article className="panel answer-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t('chat.answer')}</p>
              <h2>{latest.intent.replace(/_/g, ' ')}</h2>
            </div>
            <ConfidenceRing value={latest.confidence} />
          </div>
          <div className="lead-banner">
            <strong>{latest.leadStrength}</strong>
            <span>{latest.conversationId}</span>
          </div>
          <p className="answer-text">
            <TypeWriter text={latest.answer} key={latest.conversationId} />
          </p>
          {latest.sourceChunks?.length ? (
            <div className="quickml-rag-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">QuickML RAG</p>
                  <h2>Retrieved Source Chunks</h2>
                </div>
                <BrainCircuit size={18} />
              </div>
              <div className="rag-source-grid compact-rag">
                {latest.sourceChunks.slice(0, 3).map((chunk) => (
                  <div key={chunk.id} className="rag-source-card">
                    <span>{chunk.id}</span>
                    <strong>{chunk.title}</strong>
                    <p>{chunk.text}</p>
                    <small>
                      {chunk.service} | {Math.round(chunk.confidence * 100)}%
                    </small>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className={`voice-output-strip ${isSpeaking ? 'is-speaking' : ''}`}>
            <button className="secondary-button voice-output-button" type="button" onClick={toggleVoiceOutput}>
              {isSpeaking ? <VolumeX size={17} /> : <Volume2 size={17} />}
              {isSpeaking ? t('chat.stopVoice') : t('chat.speakSummary')}
            </button>
            <div>
              <strong>{t('chat.kavachVoice')}</strong>
              <span>{t(speechStatus.key)}</span>
            </div>
            <div className="voice-wave" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="action-row">
            <Link className="secondary-button" to="/map">
              <Map size={17} />
              {t('chat.map')}
            </Link>
            <Link className="secondary-button" to={`/network/${latest.sources[0] || 'FIR-2025-BLR-001'}`}>
              <GitBranch size={17} />
              {t('chat.graph')}
            </Link>
            <Link className="secondary-button" to={`/similar/${latest.sources[0] || 'FIR-2025-BLR-027'}`}>
              <Sparkles size={17} />
              {t('chat.dna')}
            </Link>
            <Link className="secondary-button" to="/report">
              <FileText size={17} />
              {t('chat.report')}
            </Link>
          </div>
          <div className="suggestion-strip">
            {latest.suggestedQuestions.map((item) => (
              <button key={item} type="button" onClick={() => runStarter(item)}>
                {item}
              </button>
            ))}
          </div>
        </article>

        <EvidencePanel
          evidence={latest.evidence}
          sources={latest.sources}
          confidence={latest.confidence}
          disclaimer={latest.disclaimer}
        />
      </section>

      <DetectiveRoom agents={latest.agents} />

      <section className="decision-grid">
        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t('chat.nextActions')}</p>
              <h2>{t('chat.followUp')}</h2>
            </div>
            <ClipboardCheck size={19} />
          </div>
          <div className="next-step-list">
            {latest.nextSteps.map((item) => (
              <div key={item.id} className="next-step">
                <span>{item.id}</span>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t('chat.skepticNotes')}</p>
              <h2>{t('chat.guardrails')}</h2>
            </div>
            <AlertTriangle size={19} />
          </div>
          <div className="risk-list">
            {latest.riskFlags.map((flag) => (
              <span key={flag}>{flag}</span>
            ))}
          </div>
        </article>
      </section>

      {history.length > 1 && (
        <section className="panel" style={{ padding: 16 }}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t('chat.sessionHistory')}</p>
              <h2>{t('chat.recentQueries')}</h2>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {history.slice(1, 4).map((item) => (
              <div key={item.conversationId} style={{
                display: 'grid',
                gridTemplateColumns: '86px minmax(0,1fr) auto',
                gap: 12,
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--line)',
                background: 'var(--surface-2)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => runStarter(item.query)}
              >
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: 'var(--cyan)',
                }}>
                  {item.intent.split('_')[0]}
                </span>
                <p style={{
                  color: 'var(--muted)',
                  fontSize: '0.84rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {item.query}
                </p>
                <span className="confidence-badge" style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                  {Math.round(item.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="case-grid">
        {selectedCases.map((caseRecord) => (
          <CaseCard key={caseRecord.fir_id} caseRecord={caseRecord} compact />
        ))}
      </section>
    </div>
  )
}

export default InvestigationChat
