import { Languages } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n.js'
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

  return (
    <div className="app-shell">
      <Sidebar user={appState.user} onLogout={appState.logout} />
      <main className="workspace" key={basePath}>
        <div className="workspace-command-bar">
          <LanguageToggle />
        </div>
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
