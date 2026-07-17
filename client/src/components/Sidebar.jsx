import { BarChart3, Bot, DatabaseZap, FlaskConical, FolderSearch, LogOut, Network, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useLanguage } from '../i18n.js'

const primaryItems = [
  { to: '/dashboard', icon: BarChart3, labelKey: 'nav.commandCenter', roles: ['Admin', 'Analyst', 'Supervisor'] },
  { to: '/chat', icon: Bot, labelKey: 'nav.askSamvaad', roles: ['Admin', 'Investigator', 'Analyst', 'Supervisor'] },
  { to: '/cases', icon: FolderSearch, labelKey: 'nav.caseWorkspace', roles: ['Admin', 'Investigator', 'Analyst', 'Supervisor'] },
  { to: '/evidence-lab', icon: FlaskConical, labelKey: 'nav.evidenceLab', roles: ['Admin', 'Investigator', 'Supervisor'] },
  { to: '/analytics', icon: Network, labelKey: 'nav.analytics', roles: ['Admin', 'Investigator', 'Analyst', 'Supervisor'] },
  { to: '/governance', icon: ShieldCheck, labelKey: 'nav.governance', roles: ['Admin', 'Investigator', 'Analyst', 'Supervisor'] },
  { to: '/admin-data', icon: DatabaseZap, labelKey: 'nav.adminData', roles: ['Admin'] },
]

function LiveClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    function tick() {
      setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="sidebar-clock">{time}</span>
}

function Sidebar({ user, onLogout }) {
  const { t } = useLanguage()
  const items = primaryItems.filter((item) => item.roles.includes(user?.role))

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark"><ShieldCheck size={22} /></div>
        <div>
          <p className="brand-title">SAMVAAD-IQ</p>
          <p className="brand-subtitle">NETRA · KAVACH engine</p>
        </div>
      </div>
      <div className="sidebar-status">
        <span className="status-dot" />
        <span>Challenge 1</span>
        <LiveClock />
      </div>
      <nav className="nav-list" aria-label="Primary workspace">
        {items.map((item) => {
          const Icon = item.icon
          return <NavLink key={item.to} to={item.to} className="nav-link"><Icon size={17} /><span>{t(item.labelKey)}</span></NavLink>
        })}
      </nav>
      <div className="session-panel">
        <div>
          <p className="eyebrow">{t('shell.signedIn')}</p>
          <p className="session-name">{user?.role}</p>
          <p className="session-email">{user?.email}</p>
        </div>
        <button className="icon-button" type="button" onClick={onLogout} aria-label={t('shell.logout')} title={t('shell.logout')}><LogOut size={18} /></button>
      </div>
    </aside>
  )
}

export default Sidebar
