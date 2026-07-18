import { Grid2X2 } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { appsForRole } from '../os/navigation.js'

const mobilePaths = ['/dashboard', '/chat', '/cases', '/analytics']

function MobileNav({ role, onOpenApps }) {
  const apps = appsForRole(role).filter((item) => mobilePaths.includes(item.to))
  return (
    <nav className="mobile-os-nav" aria-label="Mobile applications">
      {apps.map((item) => {
        const Icon = item.icon
        return <NavLink key={item.to} to={item.to}><Icon size={20} /><span>{item.shortLabel}</span></NavLink>
      })}
      <button type="button" onClick={onOpenApps} aria-label="Open all NETRA OS applications"><Grid2X2 size={20} /><span>Apps</span></button>
    </nav>
  )
}

export default MobileNav
