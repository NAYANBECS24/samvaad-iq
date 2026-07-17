import { CloudOff, Languages, RefreshCw, ServerCog } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n.js'
import { useRuntime } from '../services/runtime.jsx'
import Sidebar from './Sidebar.jsx'

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

  return (
    <div className="app-shell">
      <Sidebar user={appState.user} onLogout={appState.logout} />
      <main className="workspace" key={basePath}>
        <div className="workspace-command-bar">
          <div className={`runtime-badge is-${runtime.tone}`} role="status" title={(runtime.limitations || []).join(' ')}>
            {runtime.mode === 'catalyst-live' ? <ServerCog size={16} /> : <CloudOff size={16} />}
            <span>{runtime.label}</span>
            <button type="button" onClick={probe} aria-label="Recheck Catalyst connection"><RefreshCw size={14} /></button>
          </div>
          <LanguageToggle />
        </div>
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
