import { ArrowRight, Command, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { appsForRole, navigationItemForPath } from '../os/navigation.js'

function CommandPalette({ open, onClose, role, recentRoutes, onOpenInspector }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const dialogRef = useRef(null)
  const navigate = useNavigate()
  const apps = useMemo(() => appsForRole(role), [role])

  const filteredApps = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return apps
    return apps.filter((item) =>
      `${item.label} ${item.groupLabel} ${item.keywords}`.toLowerCase().includes(normalized),
    )
  }, [apps, query])

  const recentApps = useMemo(() => {
    const seen = new Set()
    return (recentRoutes || []).map((route) => navigationItemForPath(route.path)).filter((item) => {
      if (!item?.roles.includes(role) || seen.has(item.to)) return false
      seen.add(item.to)
      return true
    }).slice(0, 4)
  }, [recentRoutes, role])

  useEffect(() => {
    if (!open) return undefined
    const previouslyFocused = document.activeElement
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0)

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll('button:not(:disabled), input, a[href]') || []
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

  function closePalette() {
    setQuery('')
    onClose()
  }

  function openApp(path) {
    closePalette()
    navigate(path)
  }

  return (
    <div className="os-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closePalette()}>
      <section className="command-palette" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="command-palette-title">
        <header className="command-palette-header">
          <div>
            <p className="eyebrow">NETRA OS launcher</p>
            <h2 id="command-palette-title">Open an application or command</h2>
          </div>
          <button className="os-icon-control" type="button" onClick={closePalette} aria-label="Close app launcher"><X size={18} /></button>
        </header>

        <label className="command-search">
          <Search size={19} aria-hidden="true" />
          <span className="sr-only">Search NETRA OS applications</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search apps, cases, evidence, maps, reports…"
          />
          <kbd>Esc</kbd>
        </label>

        {!query && recentApps.length ? (
          <div className="command-section">
            <p>Recently used</p>
            <div className="command-recent-row">
              {recentApps.map((item) => {
                const Icon = item.icon
                return <button key={item.to} type="button" onClick={() => openApp(item.to)}><Icon size={16} />{item.shortLabel}</button>
              })}
            </div>
          </div>
        ) : null}

        <div className="command-section command-results">
          <p>{query ? `${filteredApps.length} matching applications` : 'All role-authorized applications'}</p>
          {filteredApps.length ? filteredApps.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.to} type="button" className="command-result" onClick={() => openApp(item.to)}>
                <span className="command-result-icon"><Icon size={18} /></span>
                <span><strong>{item.label}</strong><small>{item.groupLabel} · {item.keywords.split(' ').slice(0, 4).join(' ')}</small></span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            )
          }) : <div className="command-empty"><Search size={22} /><strong>No authorized application matched</strong><span>Try “case”, “map”, “evidence”, or “report”.</span></div>}
        </div>

        <footer className="command-palette-footer">
          <button type="button" onClick={() => { closePalette(); onOpenInspector('tasks') }}><Command size={15} />Open review and task inspector</button>
          <span><kbd>Ctrl</kbd><kbd>K</kbd> from anywhere</span>
        </footer>
      </section>
    </div>
  )
}

export default CommandPalette
