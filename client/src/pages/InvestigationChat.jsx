import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Database,
  FileSearch,
  FileText,
  GitBranch,
  ListChecks,
  Loader2,
  Map,
  Mic,
  MicOff,
  Search,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
  UserRound,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import CaseCard from '../components/CaseCard.jsx'
import DetectiveRoom from '../components/DetectiveRoom.jsx'
import EvidencePanel from '../components/EvidencePanel.jsx'
import { useLanguage } from '../i18n.js'
import { useInvestigation } from '../os/InvestigationContext.jsx'
import { api } from '../services/api.js'
import { getStoredUser } from '../services/intelligenceRepository.js'
import { useRuntime } from '../services/runtime.jsx'

const starterQueries = [
  'Mysuru alli motorcycle theft hotspot show maadi',
  'ಮೈಸೂರು ಬೈಕ್ ಕಳ್ಳತನ ಹಾಟ್‌ಸ್ಪಾಟ್ ತೋರಿಸಿ',
  'Are SYN-2026-BLR-0103 and SYN-2026-BLR-0205 connected?',
  'Find similar cases to SYN-2026-BLR-0103 using Crime DNA',
  'What if 3 patrol units are added in Mysuru?',
  'Summarize SYN-2026-BLR-0205 with cited evidence',
]

const answerModes = [
  { id: 'investigator', label: 'Investigator', detail: 'Finding + evidence + next step' },
  { id: 'brief', label: 'Command Brief', detail: 'Concise supervisor-ready summary' },
  { id: 'timeline', label: 'Timeline', detail: 'Events ordered by date and time' },
  { id: 'contradictions', label: 'Skeptic', detail: 'Conflicts, gaps, alternatives' },
]

function createConversationId() {
  return `CONV-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`
}

const CONVERSATION_STORAGE_KEY = 'samvaad_conversation_current'

function restoredConversation() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(CONVERSATION_STORAGE_KEY) || 'null')
    if (stored?.conversationId && Array.isArray(stored.turns)) {
      return { conversationId: stored.conversationId, history: [...stored.turns].reverse() }
    }
    const last = JSON.parse(window.localStorage.getItem('samvaad_last_chat') || 'null')
    if (last?.requestId && last?.answer) return { conversationId: last.conversationId || createConversationId(), history: [last] }
  } catch {
    // Ignore malformed legacy browser state and start a clean synthetic investigation.
  }
  return { conversationId: createConversationId(), history: [] }
}

function responseLabel(turn) {
  if (turn.answerClass === 'DATABASE_GROUNDED') return `Database Grounded · ${turn.citations?.length || 0} cited synthetic source${turn.citations?.length === 1 ? '' : 's'}`
  if (turn.answerClass === 'APPROVED_KNOWLEDGE') return 'Approved knowledge · verify the applicable KSP SOP'
  if (turn.answerClass === 'GENERAL_AI') return turn.provider?.kind === 'general-ai' ? 'General AI — not a police-database result' : 'General conversation · no database claim made'
  if (turn.answerClass === 'SAFETY_REFUSAL') return 'Safety boundary · no database claim made'
  return 'Clarification requested · no database claim made'
}

function ConfidenceRing({ confidence }) {
  const percent = Math.round((confidence?.score || 0) * 100)
  const color = percent >= 80 ? 'var(--emerald)' : percent >= 60 ? 'var(--amber)' : 'var(--red)'

  return (
    <div className="confidence-ring" aria-label={`${percent}% ${confidence?.band || 'low'} confidence`}>
      <svg width="42" height="42" viewBox="0 0 42 42" aria-hidden="true">
        <circle cx="21" cy="21" r="17" fill="none" stroke="var(--line)" strokeWidth="4" />
        <circle
          cx="21"
          cy="21"
          r="17"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${percent * 1.068} 106.8`}
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />
      </svg>
      <div><strong>{percent}%</strong><span>{confidence?.band || 'low'}</span></div>
    </div>
  )
}

function analysisStages(result) {
  if (!result) return []
  const filterText = [result.filters?.district, result.filters?.crimeType].filter(Boolean).join(' · ') || 'No narrow filter'
  const hasNetwork = Boolean(result.visualizations?.graph || result.visualizations?.crimeDna || result.visualizations?.similar)

  return [
    { agent: 'Detective Agent', status: 'complete', note: `${result.intent.replaceAll('_', ' ')} selected. ${filterText}.` },
    { agent: 'Data Agent', status: 'complete', note: `${result.citations?.length || 0} cited synthetic FIR excerpts retrieved and attached.` },
    { agent: 'Network Agent', status: 'complete', note: hasNetwork ? 'Explainable graph or Crime DNA factors are ready for inspection.' : 'No network claim was needed for this answer.' },
    { agent: 'Skeptic Agent', status: 'complete', note: `${result.limitations?.length || 0} limitation and safety notes remain visible.` },
    { agent: 'Report Agent', status: 'complete', note: result.auditRef ? `Prepared audit reference ${result.auditRef}.` : 'Offline result is clearly marked as non-persisted.' },
  ]
}

function followUpQuestions(result) {
  const firstFir = result?.citations?.[0]?.firId || result?.evidence?.[0]?.fir_id
  const district = result?.filters?.district || result?.evidence?.[0]?.district || 'Mysuru'
  const crimeType = result?.filters?.crimeType || result?.evidence?.[0]?.crime_type || 'Motorcycle Theft'
  return [
    firstFir ? `Find similar cases to ${firstFir} using Crime DNA` : null,
    firstFir ? `Summarize ${firstFir} with cited evidence` : null,
    `${district} ${crimeType} hotspots show maadi`,
    `What if 3 patrol units are added in ${district}?`,
  ].filter(Boolean)
}

function ChatTranscript({ history, isProcessing, language, endRef }) {
  const welcome = language === 'kn'
    ? 'ನಮಸ್ಕಾರ! ನಾನು SAMVAAD-IQ. ಪ್ರಕರಣ ಹುಡುಕಾಟ, FIR ಸಾರಾಂಶ, Crime DNA ಹೋಲಿಕೆ, ಹಾಟ್‌ಸ್ಪಾಟ್ ಮತ್ತು ಸಾಕ್ಷ್ಯ ಪರಿಶೀಲನೆ ಕುರಿತು ಸಹಜವಾಗಿ ಕೇಳಿ.'
    : 'Hello! I’m SAMVAAD-IQ. Ask me naturally about FIRs, case summaries, Crime DNA matches, network links, hotspots, evidence, or patrol scenarios.'
  const turns = [...history].reverse()

  return (
    <div className="samvaad-chat-thread" aria-live="polite" aria-label="SAMVAAD conversation">
      {!turns.length ? (
        <article className="chat-message is-assistant is-welcome">
          <span className="chat-avatar"><Bot size={18} /></span>
          <div className="chat-bubble">
            <strong>SAMVAAD-IQ</strong>
            <p>{welcome}</p>
            <small>English · ಕನ್ನಡ · Kanglish</small>
          </div>
        </article>
      ) : null}

      {turns.map((turn) => (
        <div className="chat-turn" key={turn.requestId}>
          <article className="chat-message is-user">
            <span className="chat-avatar"><UserRound size={17} /></span>
            <div className="chat-bubble"><strong>You</strong><p>{turn.query}</p></div>
          </article>
          <article className="chat-message is-assistant">
            <span className="chat-avatar"><Bot size={18} /></span>
            <div className="chat-bubble">
              <strong>SAMVAAD-IQ</strong>
              <p>{turn.answer}</p>
              {turn.citations?.length ? (
                <div className="chat-citation-row" aria-label="Cited records">
                  {turn.citations.slice(0, 5).map((citation) => <Link key={citation.id} to={`/cases/${citation.firId}`}>{citation.firId}</Link>)}
                </div>
              ) : null}
              <small>{responseLabel(turn)}</small>
            </div>
          </article>
        </div>
      ))}

      {isProcessing ? (
        <article className="chat-message is-assistant is-typing" role="status">
          <span className="chat-avatar"><Bot size={18} /></span>
          <div className="chat-bubble"><strong>SAMVAAD-IQ</strong><span className="typing-dots" aria-label="Thinking"><i /><i /><i /></span></div>
        </article>
      ) : null}
      <span ref={endRef} />
    </div>
  )
}

function InvestigationChat() {
  const { language, t } = useLanguage()
  const { runtime, runQuery } = useRuntime()
  const investigation = useInvestigation()
  const user = useMemo(() => getStoredUser(), [])
  const restored = useMemo(() => restoredConversation(), [])
  const [query, setQuery] = useState('')
  const [answerMode, setAnswerMode] = useState('investigator')
  const [conversationId, setConversationId] = useState(restored.conversationId)
  const [history, setHistory] = useState(restored.history)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [status, setStatus] = useState('Ready. Ask naturally by text or voice.')
  const [voiceStatus, setVoiceStatus] = useState({ key: 'chat.voiceReady' })
  const [speechStatus, setSpeechStatus] = useState({ key: 'chat.speechReady' })
  const [feedback, setFeedback] = useState(null)
  const recognitionRef = useRef(null)
  const chatEndRef = useRef(null)
  const latest = history[0] || null

  async function execute(nextQuery) {
    const trimmed = String(nextQuery || '').trim()
    if (!trimmed || isProcessing) return null
    setIsProcessing(true)
    setFeedback(null)
    setStatus('KAVACH is retrieving and checking cited evidence…')
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)

    try {
      const result = await runQuery(trimmed, {
        conversationId,
        newConversation: history.length === 0,
        answerMode,
        previousRequestId: latest?.requestId || null,
        previousIntent: latest?.intent || null,
        previousQuery: latest?.query || null,
        previousFirIds: (latest?.citations || []).map((item) => item.firId).filter(Boolean).slice(0, 5),
        contextRefs: investigation.pinnedCases,
        investigationId: investigation.activeInvestigation.id,
        history: history.slice(0, 4).reverse().map((item) => ({
          query: item.query,
          intent: item.intent,
          firIds: (item.citations || []).map((citation) => citation.firId).filter(Boolean).slice(0, 5),
        })),
        interfaceLanguage: language,
      })
      if (!result?.answer) throw new Error('The intelligence engine returned no grounded answer.')
      const recordedResult = { ...result, query: trimmed, conversationId: result.conversationId || conversationId }
      setHistory((current) => [recordedResult, ...current])
      investigation.recordResult(recordedResult)
      setQuery((current) => current.trim() === trimmed ? '' : current)
      const cited = Boolean(result.citations?.length)
      setStatus(result.answerClass === 'GENERAL_AI'
        ? result.provider?.kind === 'general-ai' ? 'SAMVAAD replied in General AI mode; this is not a police-database result.' : 'SAMVAAD replied conversationally without making a database claim.'
        : result.answerClass === 'APPROVED_KNOWLEDGE'
          ? 'SAMVAAD returned approved prototype guidance; verify the applicable KSP SOP.'
          : cited
            ? `SAMVAAD replied with traceable synthetic evidence from ${result.provider?.name || 'KAVACH'}.`
            : 'SAMVAAD needs clarification and did not fabricate evidence.')
      return result
    } catch (error) {
      setStatus(`Unable to complete the query: ${error.message}`)
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => () => {
    recognitionRef.current?.abort?.()
    window.speechSynthesis?.cancel()
  }, [])

  useEffect(() => {
    if (!history.length) return
    window.localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify({ conversationId, turns: [...history].reverse() }))
    window.localStorage.setItem('samvaad_last_chat', JSON.stringify(latest))
  }, [conversationId, history, latest])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
  }, [history, isProcessing])

  function submit(event) {
    event.preventDefault()
    execute(query)
  }

  function runStarter(nextQuery) {
    setQuery(nextQuery)
    execute(nextQuery)
  }

  function startNewInvestigation() {
    window.speechSynthesis?.cancel()
    setConversationId(createConversationId())
    setHistory([])
    window.localStorage.removeItem(CONVERSATION_STORAGE_KEY)
    setFeedback(null)
    setAnswerMode('investigator')
    setQuery('')
    setStatus('New conversation ready. Ask naturally by text or voice.')
  }

  function startVoiceInput() {
    if (isListening) {
      recognitionRef.current?.stop?.()
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setVoiceStatus({ key: 'chat.voiceUnavailable' })
      setStatus('Voice input is unavailable in this browser. Type the same question and press Enter or Ask.')
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = language === 'kn' ? 'kn-IN' : 'en-IN'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onstart = () => {
      setIsListening(true)
      setVoiceStatus({ key: 'chat.voiceListening' })
      setStatus(`Listening in ${recognition.lang}…`)
    }
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim()
      if (!transcript) return
      setQuery(transcript)
      setVoiceStatus({ key: 'chat.voiceCaptured', value: transcript })
      setStatus('Voice captured. Running the evidence-grounded query…')
      execute(transcript)
    }
    recognition.onerror = (event) => {
      const detail = event.error === 'not-allowed'
        ? 'Microphone permission was denied. Allow microphone access for this HTTPS site and try again.'
        : `Voice capture stopped (${event.error || 'browser error'}); text input remains available.`
      setVoiceStatus({ key: 'chat.voiceStopped' })
      setStatus(detail)
      setIsListening(false)
    }
    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
    }

    try {
      recognition.start()
    } catch (error) {
      setIsListening(false)
      setVoiceStatus({ key: 'chat.voiceStopped' })
      setStatus(`Voice input could not start: ${error.message}`)
    }
  }

  function toggleSpeech() {
    if (!latest) return
    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance === 'undefined') {
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
    utterance.onstart = () => { setIsSpeaking(true); setSpeechStatus({ key: 'chat.speechSpeaking' }) }
    utterance.onend = () => { setIsSpeaking(false); setSpeechStatus({ key: 'chat.speechDone' }) }
    utterance.onerror = () => { setIsSpeaking(false); setSpeechStatus({ key: 'chat.speechError' }) }
    setSpeechStatus({ key: 'chat.speechStarting' })
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  async function recordDecision(decision) {
    if (!latest) return
    setFeedback('Saving review…')
    if (runtime.truth?.persistence?.available) {
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

  const firstFir = latest?.citations?.[0]?.firId || latest?.evidence?.[0]?.fir_id || 'SYN-2025-BLR-001'
  const dna = latest?.visualizations?.crimeDna || latest?.visualizations?.similar?.[0] || null
  const sources = [...new Set((latest?.citations || []).map((item) => item.firId))]
  const relatedCases = (latest?.evidence || []).filter((item) => item?.fir_id).slice(0, 4)
  const insights = latest?.investigationInsights
  const coverage = insights?.coverage
  const timeline = insights?.timeline || []
  const consistencyChecks = insights?.consistencyChecks || []
  const languageModel = runtime.truth?.generativeAi
  const voiceStatusText = voiceStatus.value ? `${t(voiceStatus.key)} ${voiceStatus.value}` : t(voiceStatus.key)
  const showInvestigationDetails = Boolean(latest && latest.answerClass === 'DATABASE_GROUNDED' && !['INSUFFICIENT_EVIDENCE', 'AMBIGUOUS_QUERY'].includes(latest.intent))

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t('chat.eyebrow')} · Challenge 1</p>
          <h1>Chat with SAMVAAD-IQ</h1>
          <p>Ask naturally in English, Kannada, or Kanglish. SAMVAAD answers conversationally and cites synthetic FIR evidence whenever it makes a case claim.</p>
        </div>
        <span className="data-label">SYNTHETIC DEMO DATA</span>
      </header>

      <section className="query-console">
        <div className="copilot-command-bar">
          <div>
            <span className={`ai-live-dot${languageModel?.available ? ' is-live' : ''}`} />
            <strong>{languageModel?.available ? `${languageModel.provider} · ${languageModel.model}` : 'SAMVAAD conversational engine'}</strong>
            <small>{languageModel?.available ? 'Verified server AI · grounded answers enforce the uncited-FIR guard' : languageModel?.configured ? 'Server AI configured · availability is confirmed only after a successful response' : 'Deterministic local answers · no external AI claim'}</small>
          </div>
          <button type="button" className="secondary-button" onClick={startNewInvestigation} disabled={isProcessing}><RefreshCw size={16} />New investigation</button>
        </div>
        <ChatTranscript history={history} isProcessing={isProcessing} language={language} endRef={chatEndRef} />
        <form className="query-form evidence-query" onSubmit={submit}>
          <Search size={21} aria-hidden="true" />
          <label className="sr-only" htmlFor="investigation-query">Investigation query</label>
          <textarea
            id="investigation-query"
            rows="2"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) submit(event)
            }}
            placeholder={t('chat.placeholder')}
            maxLength="4000"
          />
          <button type="button" className="voice-button" onClick={startVoiceInput} disabled={isProcessing} aria-pressed={isListening}>
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            {isListening ? t('chat.listening') : t('chat.voice')}
          </button>
          <button type="submit" className="primary-button" disabled={isProcessing || !query.trim()}>
            {isProcessing ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
            {isProcessing ? t('chat.processing') : t('chat.ask')}
          </button>
        </form>
        <div className="answer-mode-selector" role="group" aria-label="Response mode">
          {answerModes.map((mode) => (
            <button type="button" key={mode.id} className={answerMode === mode.id ? 'is-selected' : ''} aria-pressed={answerMode === mode.id} onClick={() => setAnswerMode(mode.id)} disabled={isProcessing}>
              <strong>{mode.label}</strong><span>{mode.detail}</span>
            </button>
          ))}
        </div>
        <div className="query-live-status" aria-live="polite">
          <span className={isListening ? 'is-listening' : ''}>{voiceStatusText}</span>
          <p className="query-status" role="status">{status}</p>
        </div>
        <div className="starter-grid" aria-label="Guided demonstration queries">
          {starterQueries.map((item) => <button type="button" key={item} onClick={() => runStarter(item)} disabled={isProcessing}>{item}</button>)}
        </div>
      </section>

      {showInvestigationDetails ? (
        <section className="answer-layout grounded-answer">
          <article className="panel answer-panel">
            <div className="section-heading">
              <div><p className="eyebrow">{latest.intent.replaceAll('_', ' ')}</p><h2>Investigation details</h2></div>
              <ConfidenceRing confidence={latest.confidence} />
            </div>
            <div className="lead-banner"><strong>{latest.confidence?.band || 'low'} evidence strength</strong><span>{latest.requestId}</span></div>
            {insights?.modeSummary ? <p className="mode-summary"><ListChecks size={17} />{insights.modeSummary}</p> : null}
            <div className="answer-meta-row">
              <span>{latest.mode}</span>
              <span>{latest.responseMode || answerMode} mode</span>
              <span>{latest.auditRef || 'No persisted audit reference'}</span>
              <span>{latest.citations?.length || 0} citations</span>
              <span>{latest.dataVersion || 'Unversioned data'}</span>
              <span>{latest.latency?.totalMs ?? 0} ms</span>
              {latest.modelSignals?.generativeAnswer ? <span>{latest.modelSignals.generativeAnswer.provider} · {latest.modelSignals.generativeAnswer.model} · grounded</span> : null}
            </div>

            <div className={`voice-output-strip ${isSpeaking ? 'is-speaking' : ''}`}>
              <button className="secondary-button voice-output-button" type="button" onClick={toggleSpeech}>
                {isSpeaking ? <VolumeX size={17} /> : <Volume2 size={17} />}
                {isSpeaking ? t('chat.stopVoice') : t('chat.speakSummary')}
              </button>
              <div><strong>{t('chat.kavachVoice')}</strong><span>{t(speechStatus.key)}</span></div>
              <div className="voice-wave" aria-hidden="true"><span /><span /><span /><span /></div>
            </div>

            <div className="action-row investigation-handoffs">
              <Link className="secondary-button" to="/map"><Map size={17} />{t('chat.map')}</Link>
              <Link className="secondary-button" to={`/network/${firstFir}`}><GitBranch size={17} />{t('chat.graph')}</Link>
              <Link className="secondary-button" to={`/similar/${firstFir}`}><Sparkles size={17} />{t('chat.dna')}</Link>
              <Link className="secondary-button" to="/report"><FileText size={17} />{t('chat.report')}</Link>
            </div>

            <div className="suggestion-strip">
              {followUpQuestions(latest).map((item) => <button type="button" key={item} onClick={() => runStarter(item)}>{item}</button>)}
            </div>
          </article>

          <EvidencePanel
            evidence={latest.evidence}
            sources={sources}
            confidence={latest.confidence}
            disclaimer={latest.confidence?.calibration || latest.limitations?.[0]}
          />
        </section>
      ) : null}

      {showInvestigationDetails && latest?.pipeline?.length ? (
        <section className="copilot-insight-grid">
          <article className="panel grounding-scorecard">
            <div className="section-heading"><div><p className="eyebrow">Grounding scorecard</p><h2>Claim-to-source coverage</h2></div><ShieldCheck size={20} /></div>
            <div className="grounding-metrics">
              <div><strong>{coverage?.evidenceCoverage ?? 100}%</strong><span>evidence cited</span></div>
              <div><strong>{coverage?.answerIdCoverage ?? 100}%</strong><span>FIR references supported</span></div>
              <div><strong>{coverage?.citationCount || 0}</strong><span>traceable citations</span></div>
            </div>
            <p className={`grounding-verdict is-${coverage?.status || 'grounded'}`}><ShieldAlert size={16} />{coverage?.unsupportedAnswerIds?.length ? `Review uncited references: ${coverage.unsupportedAnswerIds.join(', ')}` : 'No uncited FIR identifier detected in the answer.'}</p>
          </article>
          <article className="panel">
            <div className="section-heading"><div><p className="eyebrow">Transparent orchestration</p><h2>How this answer was produced</h2></div><Database size={20} /></div>
            <div className="copilot-pipeline">
              {latest.pipeline.map((step, index) => <div key={step.key} className={`is-${step.status}`}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{step.label}</strong><small>{step.detail}</small></div></div>)}
            </div>
          </article>
        </section>
      ) : null}

      {showInvestigationDetails ? (
        <section className="copilot-insight-grid">
          <article className={`panel insight-focus${latest.responseMode === 'timeline' ? ' is-active' : ''}`}>
            <div className="section-heading"><div><p className="eyebrow">Cited chronology</p><h2>Evidence timeline</h2></div><Clock size={20} /></div>
            <div className="evidence-timeline">
              {timeline.length ? timeline.map((item) => (
                <Link to={`/cases/${item.firId}`} key={`${item.firId}-${item.timestamp}`}>
                  <time>{item.date}<small>{item.time}</small></time>
                  <div><strong>{item.crimeType} · {item.district}</strong><span>{item.firId} · {item.status}</span><p>{item.summary}</p></div>
                </Link>
              )) : <p className="empty-insight">No dated cited evidence is available for this query.</p>}
            </div>
          </article>
          <article className={`panel insight-focus${latest.responseMode === 'contradictions' ? ' is-active' : ''}`}>
            <div className="section-heading"><div><p className="eyebrow">Skeptic agent</p><h2>Consistency and contradiction checks</h2></div><ShieldAlert size={20} /></div>
            <div className="consistency-list">
              {consistencyChecks.map((check, index) => <div key={`${check.title}-${index}`} className={`is-${check.severity}`}><span>{check.severity}</span><div><strong>{check.title}</strong><p>{check.detail}</p><small>{check.firIds?.join(' · ')}</small></div></div>)}
            </div>
          </article>
        </section>
      ) : null}

      {showInvestigationDetails && latest?.citations?.length ? (
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

      {showInvestigationDetails ? <DetectiveRoom agents={analysisStages(latest)} /> : null}

      {showInvestigationDetails ? (
        <section className="decision-grid">
          <article className="panel">
            <div className="section-heading"><div><p className="eyebrow">Human review</p><h2>Accept or challenge the lead</h2></div><ShieldCheck size={20} /></div>
            <div className="review-actions">
              <button type="button" onClick={() => recordDecision('accept')}><ThumbsUp size={17} />Accept for review</button>
              <button type="button" onClick={() => recordDecision('reject')}><ThumbsDown size={17} />Reject lead</button>
            </div>
            {feedback ? <p className="query-status" role="status">{feedback}</p> : null}
            <small>Role: {user?.role}. Acceptance does not establish guilt or authorize action.</small>
          </article>
          <article className="panel"><div className="section-heading"><div><p className="eyebrow">Next actions</p><h2>Human-led follow-up</h2></div><CheckCircle2 size={20} /></div><ol className="action-list">{(latest.nextActions || []).map((item) => <li key={item}>{item}</li>)}</ol></article>
          <article className="panel warning-panel"><div className="section-heading"><div><p className="eyebrow">Limitations</p><h2>Do not over-interpret</h2></div><AlertTriangle size={20} /></div><ul className="action-list">{(latest.limitations || []).map((item) => <li key={item}>{item}</li>)}</ul></article>
        </section>
      ) : null}

      {relatedCases.length ? <section className="case-grid">{relatedCases.map((caseRecord) => <CaseCard key={caseRecord.fir_id} caseRecord={caseRecord} compact />)}</section> : null}

      {history.length > 1 ? (
        <section className="panel">
          <div className="section-heading"><div><p className="eyebrow">Session context</p><h2>Recent evidence requests</h2></div></div>
          <div className="history-list">{history.slice(1).map((item) => <button type="button" key={item.requestId} onClick={() => runStarter(item.query)}><strong>{item.intent.replaceAll('_', ' ')}</strong><span>{item.query}</span></button>)}</div>
        </section>
      ) : null}
    </div>
  )
}

export default InvestigationChat
