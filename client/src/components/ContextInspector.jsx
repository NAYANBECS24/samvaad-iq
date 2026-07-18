import { Check, ClipboardList, FileCheck2, Link2, NotebookPen, Pin, PinOff, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useInvestigation } from '../os/InvestigationContext.jsx'

function ContextInspector({ open, onClose, tab, onTabChange }) {
  const [note, setNote] = useState('')
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const { pathname } = useLocation()
  const {
    activeInvestigation,
    pinnedCases,
    lastResult,
    tasks,
    notes,
    analysisRuns,
    pinCase,
    unpinCase,
    addNote,
    toggleTask,
  } = useInvestigation()
  const caseMatch = pathname.match(/^\/cases\/([^/]+)$/)
  const currentFirId = caseMatch ? decodeURIComponent(caseMatch[1]) : null
  const currentPinned = currentFirId && pinnedCases.includes(currentFirId)

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
      const focusable = panelRef.current?.querySelectorAll('button:not(:disabled), textarea, a[href]') || []
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

  function saveNote(event) {
    event.preventDefault()
    addNote(note)
    setNote('')
  }

  function handleTabKeyDown(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const nextTab = event.key === 'Home'
      ? 'evidence'
      : event.key === 'End'
        ? 'tasks'
        : tab === 'evidence' ? 'tasks' : 'evidence'
    onTabChange(nextTab)
    window.requestAnimationFrame(() => document.getElementById(`inspector-tab-${nextTab}`)?.focus())
  }

  return (
    <>
      <button className="context-inspector-scrim" type="button" onClick={onClose} aria-label="Close context inspector" />
      <aside className="context-inspector" ref={panelRef} role="dialog" aria-modal="true" aria-label="Investigation evidence and task inspector">
        <header className="context-inspector-header">
          <div>
            <p className="eyebrow">Shared investigation context</p>
            <h2>{activeInvestigation.title}</h2>
            <small>{activeInvestigation.id} · {activeInvestigation.status}</small>
          </div>
          <button className="os-icon-control" ref={closeRef} type="button" onClick={onClose} aria-label="Close context inspector"><X size={18} /></button>
        </header>

        <div className="inspector-tabs" role="tablist" aria-label="Inspector views" onKeyDown={handleTabKeyDown}>
          <button id="inspector-tab-evidence" type="button" role="tab" aria-selected={tab === 'evidence'} aria-controls="inspector-panel-evidence" tabIndex={tab === 'evidence' ? 0 : -1} onClick={() => onTabChange('evidence')}><FileCheck2 size={16} />Evidence</button>
          <button id="inspector-tab-tasks" type="button" role="tab" aria-selected={tab === 'tasks'} aria-controls="inspector-panel-tasks" tabIndex={tab === 'tasks' ? 0 : -1} onClick={() => onTabChange('tasks')}><ClipboardList size={16} />Tasks <span>{tasks.filter((task) => task.status !== 'complete').length}</span></button>
        </div>

        {tab === 'evidence' ? (
          <div id="inspector-panel-evidence" className="inspector-content" role="tabpanel" aria-labelledby="inspector-tab-evidence" tabIndex="0">
            {currentFirId ? (
              <section className="inspector-card is-highlighted">
                <div className="inspector-card-heading"><span>Open case</span><Link to={`/cases/${currentFirId}`}>{currentFirId}</Link></div>
                <button className="inspector-action" type="button" onClick={() => currentPinned ? unpinCase(currentFirId) : pinCase(currentFirId)}>
                  {currentPinned ? <PinOff size={15} /> : <Pin size={15} />}
                  {currentPinned ? 'Remove from context' : 'Pin to investigation'}
                </button>
              </section>
            ) : null}

            <section className="inspector-card">
              <div className="inspector-card-heading"><span>Pinned FIR context</span><strong>{pinnedCases.length}</strong></div>
              {pinnedCases.length ? <div className="inspector-case-list">{pinnedCases.map((firId) => <div key={firId}><Link to={`/cases/${firId}`}>{firId}</Link><button type="button" onClick={() => unpinCase(firId)} aria-label={`Unpin ${firId}`}><X size={13} /></button></div>)}</div> : <p>No case is pinned. Open a dossier and pin it here to keep context across tools.</p>}
            </section>

            <section className="inspector-card">
              <div className="inspector-card-heading"><span>Latest source trail</span><strong>{lastResult?.citations?.length || 0}</strong></div>
              {lastResult ? (
                <>
                  <p className="inspector-query">“{lastResult.query}”</p>
                  {lastResult.citations?.length ? <div className="inspector-citation-list">{lastResult.citations.map((citation) => <Link key={citation.firId || citation.id} to={`/cases/${citation.firId}`}><Link2 size={14} />{citation.firId}</Link>)}</div> : <p>This conversational answer made no database claim and therefore attached no FIR citation.</p>}
                  <small>{lastResult.requestId}{lastResult.auditRef ? ` · ${lastResult.auditRef}` : ''}</small>
                </>
              ) : <p>Ask SAMVAAD a grounded question to populate this source trail.</p>}
            </section>

            <section className="inspector-card compact">
              <div className="inspector-card-heading"><span>Analysis runs in context</span><strong>{analysisRuns.length}</strong></div>
              <p>Results remain investigative leads and require human verification before action.</p>
            </section>
          </div>
        ) : (
          <div id="inspector-panel-tasks" className="inspector-content" role="tabpanel" aria-labelledby="inspector-tab-tasks" tabIndex="0">
            <section className="inspector-card">
              <div className="inspector-card-heading"><span>Human review queue</span><strong>{tasks.filter((task) => task.status !== 'complete').length} open</strong></div>
              {tasks.length ? <div className="inspector-task-list">{tasks.map((task) => (
                <button key={task.id} type="button" className={task.status === 'complete' ? 'is-complete' : ''} onClick={() => toggleTask(task.id)} aria-pressed={task.status === 'complete'}>
                  <span className="task-check">{task.status === 'complete' ? <Check size={14} /> : null}</span>
                  <span><strong>{task.title}</strong><small>{task.detail}</small></span>
                </button>
              ))}</div> : <p>No review task is open. Cited SAMVAAD results create a human-verification task here.</p>}
            </section>

            <section className="inspector-card">
              <div className="inspector-card-heading"><span>Analyst notes</span><NotebookPen size={16} /></div>
              <form className="inspector-note-form" onSubmit={saveNote}>
                <label htmlFor="investigation-note">Add a local investigation note</label>
                <textarea id="investigation-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={320} placeholder="Record a question, verification gap, or supervisor handoff…" />
                <button type="submit" disabled={!note.trim()}>Save note</button>
              </form>
              {notes.length ? <div className="inspector-note-list">{notes.map((item) => <article key={item.id}><p>{item.text}</p><small>{new Date(item.createdAt).toLocaleString('en-IN')}</small></article>)}</div> : null}
            </section>
          </div>
        )}
      </aside>
    </>
  )
}

export default ContextInspector
