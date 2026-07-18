import { BarChart3, CloudOff, FileText, FolderSearch, Languages, MessageSquareText, RefreshCw, Scale, ServerCog, ShieldCheck } from 'lucide-react'
import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n.js'
import { useRuntime } from '../services/runtime.jsx'
import Sidebar from './Sidebar.jsx'

const quickWorkflow = [
  { to: '/dashboard', label: 'Dashboard', ariaLabel: 'Open overview workspace', Icon: BarChart3 },
  { to: '/chat', label: 'Ask SAMVAAD', ariaLabel: 'Open chat workspace', Icon: MessageSquareText },
  { to: '/cases', label: 'Cases', ariaLabel: 'Open case search workspace', Icon: FolderSearch },
  { to: '/evidence-lab', label: 'Evidence', ariaLabel: 'Open evidence intake workspace', Icon: ShieldCheck, roles: ['Admin', 'Investigator', 'Supervisor'] },
  { to: '/analytics', label: 'Analytics', ariaLabel: 'Open intelligence analysis workspace', Icon: Scale },
  { to: '/report', label: 'Report', ariaLabel: 'Open report builder workspace', Icon: FileText },
]

function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="language-toggle" aria-label={t('language.label')}>
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
  const { runtime, probe } = useRuntime()
  const visibleQuickWorkflow = quickWorkflow.filter((item) => !item.roles || item.roles.includes(appState.user?.role))

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
  }, [pathname])

  return (
    <div className="app-shell">
      <Sidebar user={appState.user} onLogout={appState.logout} />
      <main className="workspace" key={basePath}>
        <div className="workspace-command-bar">
          <div className="command-context" aria-label="Current workspace">
            <span className="command-role">{appState.user?.role || 'Demo'}</span>
            <span className="command-copy">Challenge 1 · Synthetic FIR intelligence workspace</span>
          </div>
          <nav className="quick-route-strip" aria-label="Fast judge workflow">
            {visibleQuickWorkflow.map(({ to, label, ariaLabel, Icon }) => (
              <Link
                key={to}
                to={to}
                className={basePath === to ? 'is-active' : ''}
                aria-label={ariaLabel}
              >
                <Icon size={15} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="workspace-utilities">
            <div className={`runtime-badge is-${runtime.tone}`} role="status" title={(runtime.limitations || []).join(' ')}>
              {runtime.mode === 'catalyst-live' ? <ServerCog size={16} /> : <CloudOff size={16} />}
              <span>{runtime.label}</span>
              <button type="button" onClick={probe} aria-label="Recheck Catalyst connection"><RefreshCw size={14} /></button>
            </div>
            <LanguageToggle />
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
