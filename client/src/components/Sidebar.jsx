import { Grid2X2, LogOut, PanelLeftClose, PanelLeftOpen, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useLanguage } from '../i18n.js'
import { navigationForRole } from '../os/navigation.js'

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

function Sidebar({ user, onLogout, collapsed, onToggle, onOpenApps }) {
  const { t } = useLanguage()
  const groups = navigationForRole(user?.role)

  return (
    <aside className={`sidebar${collapsed ? ' is-collapsed' : ''}`} aria-label="NETRA OS application dock">
      <div className="brand-block">
        <div className="brand-mark"><ShieldCheck size={22} /></div>
        <div className="brand-copy">
          <p className="brand-title">NETRA OS</p>
          <p className="brand-subtitle">SAMVAAD-IQ · KAVACH</p>
        </div>
        <button className="dock-toggle" type="button" onClick={onToggle} aria-label={collapsed ? 'Expand application dock' : 'Collapse application dock'} title={collapsed ? 'Expand dock' : 'Collapse dock'}>
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>

      <button className="sidebar-app-launcher" type="button" onClick={onOpenApps} title="Open all applications">
        <Grid2X2 size={18} />
        <span>App launcher</span>
        <kbd>Ctrl K</kbd>
      </button>

      <div className="sidebar-status">
        <span className="status-dot" />
        <span>Challenge 1</span>
        <LiveClock />
      </div>

      <div className="sidebar-role-card" aria-label="Current role access">
        <span>Current role</span>
        <strong>{user?.role || 'Demo'}</strong>
        <small>{user?.access || 'Role-aware synthetic investigation workspace'}</small>
      </div>

      <nav className="nav-list" aria-label="Primary workspace">
        {groups.map((group) => (
          <div className="nav-group" key={group.id}>
            <p className="nav-group-label">{group.label}</p>
            {group.items.map((item) => {
              const Icon = item.icon
              const label = t(item.labelKey)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  title={collapsed ? label : undefined}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                  {item.badge ? <span className="nav-badge" aria-hidden="true">{item.badge}</span> : null}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="session-panel">
        <div className="session-copy">
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
