import { ArrowRight, Check, Clock3, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInvestigation } from '../os/InvestigationContext.jsx'

const missionSteps = [
  { route: '/chat', time: '0:00', title: 'Ask a grounded question', detail: 'Use English, Kannada, or Kanglish by text or voice.' },
  { route: '/cases', time: '0:35', title: 'Inspect the cited FIR', detail: 'Verify source fields and pin the case to shared context.' },
  { route: '/similar', time: '1:05', title: 'Explain the Crime DNA lead', detail: 'Review contributing factors, weights, and exclusions.' },
  { route: '/evidence-lab', time: '1:35', title: 'Prepare synthetic evidence', detail: 'Validate a file, calculate SHA-256, and preserve provenance.' },
  { route: '/governance', time: '2:10', title: 'Check human safeguards', detail: 'Review runtime truth, limitations, and role controls.' },
  { route: '/report', time: '2:35', title: 'Draft the auditable brief', detail: 'Confirm citations, approval state, and safety disclaimer.' },
]

function JudgeMission({ open, onClose }) {
  const navigate = useNavigate()
  const { recentRoutes } = useInvestigation()
  const dialogRef = useRef(null)
  const closeRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const previouslyFocused = document.activeElement
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 0)
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll('button:not(:disabled)') || []
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  const completedRoutes = new Set(recentRoutes.map((item) => `/${item.path.split('/')[1]}`))
  const completeCount = missionSteps.filter((step) => completedRoutes.has(step.route)).length
  const nextStep = missionSteps.find((step) => !completedRoutes.has(step.route)) || missionSteps[missionSteps.length - 1]

  function openStep(route) {
    onClose()
    navigate(route)
  }

  return (
    <div className="os-modal-backdrop mission-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="judge-mission" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="judge-mission-title">
        <header>
          <div><p className="eyebrow">Guided three-minute demonstration</p><h2 id="judge-mission-title">NETRA OS Judge Mission</h2><p>One traceable journey from question to human-reviewed brief.</p></div>
          <button className="os-icon-control" ref={closeRef} type="button" onClick={onClose} aria-label="Close judge mission"><X size={18} /></button>
        </header>
        <div className="mission-progress" aria-label={`${completeCount} of ${missionSteps.length} mission steps visited`}>
          <span style={{ width: `${(completeCount / missionSteps.length) * 100}%` }} />
        </div>
        <ol className="mission-step-list">
          {missionSteps.map((step, index) => {
            const complete = completedRoutes.has(step.route)
            return (
              <li key={step.route} className={complete ? 'is-complete' : ''}>
                <button type="button" onClick={() => openStep(step.route)}>
                  <span className="mission-step-number">{complete ? <Check size={15} /> : index + 1}</span>
                  <span><strong>{step.title}</strong><small>{step.detail}</small></span>
                  <time><Clock3 size={13} />{step.time}</time>
                </button>
              </li>
            )
          })}
        </ol>
        <footer><span>{completeCount}/{missionSteps.length} applications visited</span><button type="button" onClick={() => openStep(nextStep.route)}>Open next step <ArrowRight size={16} /></button></footer>
      </section>
    </div>
  )
}

export default JudgeMission
