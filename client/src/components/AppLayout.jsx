import {
  Bell,
  CloudOff,
  Command,
  Database,
  Grid2X2,
  Languages,
  ListChecks,
  LogOut,
  PlayCircle,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n.js'
import { useInvestigation } from '../os/InvestigationContext.jsx'
import { appsForRole, navigationItemForPath } from '../os/navigation.js'
import { useRuntime } from '../services/runtime.jsx'
import CommandPalette from './CommandPalette.jsx'
import ContextInspector from './ContextInspector.jsx'
import JudgeMission from './JudgeMission.jsx'
import MobileNav from './MobileNav.jsx'
import Sidebar from './Sidebar.jsx'

const quickPaths = ['/dashboard', '/chat', '/cases', '/evidence-lab', '/analytics', '/report']
const quickAria = {
  '/dashboard': 'Open overview workspace',
  '/chat': 'Open conversational workspace',
  '/cases': 'Open case search workspace',
  '/evidence-lab': 'Open evidence intake workspace',
  '/analytics': 'Open intelligence analysis workspace',
  '/report': 'Open report builder workspace',
}

function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="language-toggle" role="group" aria-label={t('language.label')}>
      <Languages size={17} />
      <span>{t('language.mode')}</span>
      <div className="language-options">
        <button
          className={language === 'en' ? 'active' : ''}
          type="button"
          onClick={() => setLanguage('en')}
          aria-pressed={language === 'en'}
        >
          {t('language.enShort')}
        </button>
        <button
          className={language === 'kn' ? 'active' : ''}
          type="button"
          onClick={() => setLanguage('kn')}
          aria-pressed={language === 'kn'}
        >
          {t('language.knShort')}
        </button>
      </div>
    </div>
  )
}

function AppLayout({ appState }) {
  const { pathname } = useLocation()
  const basePath = '/' + pathname.split('/')[1]
  const activeApp = navigationItemForPath(pathname)
  const { runtime, probe } = useRuntime()
  const investigation = useInvestigation()
  const { recordWorkspace, setDataVersion, syncLastResult } = investigation
  const [dockCollapsed, setDockCollapsed] = useState(() => window.localStorage.getItem('netra_os_dock_collapsed') === 'true')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [missionOpen, setMissionOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [inspectorTab, setInspectorTab] = useState('evidence')
  const roleApps = useMemo(() => appsForRole(appState.user?.role), [appState.user?.role])
  const visibleQuickWorkflow = roleApps.filter((item) => quickPaths.includes(item.to))
  const openTaskCount = investigation.tasks.filter((task) => task.status !== 'complete').length
  const dataVersion = runtime.dataVersion || investigation.dataVersion || 'SYN-DEMO-250'
  const apiConnected = runtime.mode === 'catalyst-live' || runtime.apiReachable === true

  const closePalette = useCallback(() => setPaletteOpen(false), [])
  const closeInspector = useCallback(() => setInspectorOpen(false), [])
  const closeMission = useCallback(() => setMissionOpen(false), [])
  const openInspector = useCallback((tab = 'evidence') => {
    setInspectorTab(tab)
    setInspectorOpen(true)
  }, [])

  useEffect(() => {
    window.localStorage.setItem('netra_os_dock_collapsed', String(dockCollapsed))
  }, [dockCollapsed])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
    const timer = window.setTimeout(() => {
      recordWorkspace(pathname, activeApp.label)
      syncLastResult()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [pathname, activeApp.label, recordWorkspace, syncLastResult])

  useEffect(() => {
    if (!runtime.dataVersion) return undefined
    const timer = window.setTimeout(() => setDataVersion(runtime.dataVersion), 0)
    return () => window.clearTimeout(timer)
  }, [runtime.dataVersion, setDataVersion])

  useEffect(() => {
    function openCommandPalette(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen(true)
      }
    }
    document.addEventListener('keydown', openCommandPalette)
    return () => document.removeEventListener('keydown', openCommandPalette)
  }, [])

  function skipToContent(event) {
    event.preventDefault()
    document.getElementById('workspace-content')?.focus()
  }

  return (
    <div className={`app-shell${dockCollapsed ? ' is-dock-collapsed' : ''}${inspectorOpen ? ' is-inspector-open' : ''}`}>
      <a className="skip-link" href="#workspace-content" onClick={skipToContent}>Skip to main content</a>
      <Sidebar
        user={appState.user}
        onLogout={appState.logout}
        collapsed={dockCollapsed}
        onToggle={() => setDockCollapsed((current) => !current)}
        onOpenApps={() => setPaletteOpen(true)}
      />

      <main className="workspace">
        <header className="workspace-command-bar" aria-label="NETRA OS system bar">
          <div className="os-systembar-main">
            <button className="os-app-launcher" type="button" onClick={() => setPaletteOpen(true)} aria-label="Open NETRA OS application launcher">
              <Grid2X2 size={18} />
              <span>NETRA OS</span>
            </button>

            <div className="command-context" aria-label="Current application">
              <span className="command-role">{appState.user?.role || 'Demo'}</span>
              <span className="command-copy"><strong>{activeApp.label}</strong><small>{activeApp.groupLabel}</small></span>
            </div>

            <button className="os-command-trigger" type="button" onClick={() => setPaletteOpen(true)} aria-label="Search NETRA OS applications and commands">
              <Command size={17} />
              <span>Search apps and commands</span>
              <kbd>Ctrl K</kbd>
            </button>

            <div className="os-system-actions">
              <button className="os-mission-button" type="button" onClick={() => setMissionOpen(true)}><PlayCircle size={17} /><span>3-min mission</span></button>
              <button className="os-task-button" type="button" onClick={() => openInspector('tasks')} aria-label={`Open review inbox${openTaskCount ? `, ${openTaskCount} pending` : ''}`}>
                <Bell size={18} />
                {openTaskCount ? <span>{openTaskCount}</span> : null}
              </button>
              <details className="os-user-menu">
                <summary aria-label={`User menu for ${appState.user?.role}`}>
                  <span className="os-user-avatar"><UserRound size={16} /></span>
                  <span>{appState.user?.role}</span>
                </summary>
                <div className="os-user-popover">
                  <p className="eyebrow">Signed in securely</p>
                  <strong>{appState.user?.role}</strong>
                  <small>{appState.user?.email}</small>
                  <p>{appState.user?.access}</p>
                  <button type="button" onClick={appState.logout}><LogOut size={16} />Log out</button>
                </div>
              </details>
            </div>
          </div>

          <div className="os-systembar-secondary">
            <button className="os-investigation-chip" type="button" onClick={() => openInspector('evidence')} title="Open shared investigation context">
              <ShieldCheck size={16} />
              <span><small>Active investigation</small><strong>{investigation.activeInvestigation.title}</strong></span>
              <span className="os-context-count">{investigation.pinnedCases.length}</span>
            </button>

            <nav className="quick-route-strip" aria-label="Fast judge workflow">
              {visibleQuickWorkflow.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.to} to={item.to} className={basePath === item.to ? 'is-active' : ''} aria-label={quickAria[item.to]}>
                    <Icon size={15} /><span>{item.shortLabel}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="workspace-utilities">
              <div className="os-data-version" title="Active synthetic data version"><Database size={15} /><span>{dataVersion}</span></div>
              <div className={`runtime-badge is-${runtime.tone}`} role="status" title={(runtime.limitations || []).join(' ')}>
                {apiConnected ? <ServerCog size={16} /> : <CloudOff size={16} />}
                <span>{runtime.label}</span>
                <button type="button" onClick={probe} aria-label="Recheck Catalyst connection"><RefreshCw size={14} /></button>
              </div>
              <LanguageToggle />
              <button className="os-inspector-button" type="button" onClick={() => openInspector('evidence')} aria-label="Open evidence and task inspector"><ListChecks size={17} /><span>Context</span></button>
            </div>
          </div>
        </header>

        <div id="workspace-content" className="workspace-content" tabIndex="-1">
          <Outlet />
        </div>
        <span className="sr-only" aria-live="polite">{activeApp.label} workspace open</span>
      </main>

      <MobileNav role={appState.user?.role} onOpenApps={() => setPaletteOpen(true)} />
      <ContextInspector open={inspectorOpen} onClose={closeInspector} tab={inspectorTab} onTabChange={setInspectorTab} />
      <CommandPalette open={paletteOpen} onClose={closePalette} role={appState.user?.role} recentRoutes={investigation.recentRoutes} onOpenInspector={openInspector} />
      <JudgeMission open={missionOpen} onClose={closeMission} />
    </div>
  )
}

export default AppLayout
