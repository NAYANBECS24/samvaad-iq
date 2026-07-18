import {
  BarChart3,
  Bot,
  Camera,
  DatabaseZap,
  FileText,
  FlaskConical,
  FolderSearch,
  GitBranch,
  LogOut,
  Map,
  Network,
  RadioTower,
  Route,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TabletSmartphone,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useLanguage } from '../i18n.js'

const allRoles = ['Admin', 'Investigator', 'Analyst', 'Supervisor']

const navigationGroups = [
  {
    label: 'Core workspaces',
    items: [
      { to: '/dashboard', icon: BarChart3, labelKey: 'nav.dashboard', roles: allRoles },
      { to: '/chat', icon: Bot, labelKey: 'nav.askSamvaad', roles: allRoles, badge: 'AI' },
      { to: '/cases', icon: FolderSearch, labelKey: 'nav.caseWorkspace', roles: allRoles },
      { to: '/evidence-lab', icon: FlaskConical, labelKey: 'nav.evidenceLab', roles: ['Admin', 'Investigator', 'Supervisor'] },
    ],
  },
  {
    label: 'Intelligence tools',
    items: [
      { to: '/analytics', icon: Network, labelKey: 'nav.analytics', roles: allRoles },
      { to: '/map', icon: Map, labelKey: 'nav.hotspots', roles: allRoles },
      { to: '/network', icon: GitBranch, labelKey: 'nav.network', roles: allRoles },
      { to: '/evidence', icon: Camera, labelKey: 'nav.digitalEvidence', roles: allRoles },
      { to: '/similar', icon: Sparkles, labelKey: 'nav.crimeDna', roles: allRoles },
      { to: '/cold-cases', icon: SearchCheck, labelKey: 'nav.coldCases', roles: allRoles },
      { to: '/diffusion', icon: RadioTower, labelKey: 'nav.diffusion', roles: allRoles },
    ],
  },
  {
    label: 'Field and reporting',
    items: [
      { to: '/patrol', icon: Route, labelKey: 'nav.patrol', roles: allRoles },
      { to: '/tablet', icon: TabletSmartphone, labelKey: 'nav.tabletPatrol', roles: ['Admin', 'Investigator', 'Supervisor'] },
      { to: '/report', icon: FileText, labelKey: 'nav.reports', roles: allRoles },
    ],
  },
  {
    label: 'System and governance',
    items: [
      { to: '/pipeline', icon: Network, labelKey: 'nav.pipeline', roles: allRoles },
      { to: '/governance', icon: ShieldAlert, labelKey: 'nav.governance', roles: allRoles },
      { to: '/admin-data', icon: DatabaseZap, labelKey: 'nav.adminData', roles: ['Admin'] },
    ],
  },
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
  const groups = navigationGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => item.roles.includes(user?.role)) }))
    .filter((group) => group.items.length)

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
        {groups.map((group) => (
          <div className="nav-group" key={group.label}>
            <p className="nav-group-label">{group.label}</p>
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink key={item.to} to={item.to} className="nav-link">
                  <Icon size={17} />
                  <span>{t(item.labelKey)}</span>
                  {item.badge ? <span className="nav-badge" aria-hidden="true">{item.badge}</span> : null}
                </NavLink>
              )
            })}
          </div>
        ))}
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
