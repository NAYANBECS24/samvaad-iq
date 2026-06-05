import {
  BarChart3,
  Bot,
  Camera,
  DatabaseZap,
  FlaskConical,
  FileText,
  FolderSearch,
  GitBranch,
  LogOut,
  Map,
  Network,
  RadioTower,
  SearchCheck,
  Route,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TabletSmartphone,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useLanguage } from '../i18n.js'

const navItems = [
  { to: '/dashboard', icon: BarChart3, labelKey: 'nav.dashboard' },
  { to: '/chat', icon: Bot, labelKey: 'nav.investigation', badge: 5 },
  { to: '/cases', icon: FolderSearch, labelKey: 'nav.cases', badge: 8 },
  { to: '/map', icon: Map, labelKey: 'nav.hotspots' },
  { to: '/network', icon: GitBranch, labelKey: 'nav.network' },
  { to: '/evidence-lab', icon: FlaskConical, labelKey: 'nav.evidenceLab', badge: 4 },
  { to: '/evidence', icon: Camera, labelKey: 'nav.digitalEvidence' },
  { to: '/similar', icon: Sparkles, labelKey: 'nav.crimeDna' },
  { to: '/cold-cases', icon: SearchCheck, labelKey: 'nav.coldCases' },
  { to: '/diffusion', icon: RadioTower, labelKey: 'nav.diffusion' },
  { to: '/patrol', icon: Route, labelKey: 'nav.patrol' },
  { to: '/tablet', icon: TabletSmartphone, labelKey: 'nav.tabletPatrol' },
  { to: '/report', icon: FileText, labelKey: 'nav.reports' },
  { to: '/admin-data', icon: DatabaseZap, labelKey: 'nav.adminData' },
  { to: '/pipeline', icon: Network, labelKey: 'nav.pipeline' },
  { to: '/governance', icon: ShieldAlert, labelKey: 'nav.governance' },
]

function LiveClock() {
  const [time, setTime] = useState('')

  useEffect(() => {
    function tick() {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return <span className="sidebar-clock">{time}</span>
}

function Sidebar({ user, onLogout }) {
  const { t } = useLanguage()

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">
          <ShieldCheck size={22} />
        </div>
        <div>
          <p className="brand-title">SAMVAAD-IQ</p>
          <p className="brand-subtitle">KAVACH Crime DNA</p>
        </div>
      </div>

      <div className="sidebar-status">
        <span className="status-dot" />
        <span>{t('shell.systems')}</span>
        <LiveClock />
      </div>

      <nav className="nav-list" aria-label="Primary">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink key={item.to} to={item.to} className="nav-link">
              <Icon size={17} />
              <span>{t(item.labelKey)}</span>
              {item.badge ? (
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  minWidth: 20,
                  height: 20,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 99,
                  background: 'var(--cyan-soft)',
                  color: 'var(--cyan)',
                  border: '1px solid rgba(0,240,255,0.15)',
                }}>
                  {item.badge}
                </span>
              ) : null}
            </NavLink>
          )
        })}
      </nav>

      <div className="session-panel">
        <div>
          <p className="eyebrow">{t('shell.signedIn')}</p>
          <p className="session-name">{user?.role}</p>
          <p className="session-email">{user?.email}</p>
        </div>
        <button className="icon-button" type="button" onClick={onLogout} aria-label={t('shell.logout')} title={t('shell.logout')}>
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
