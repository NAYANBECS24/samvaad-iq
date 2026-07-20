import {
  BarChart3,
  Bot,
  Camera,
  DatabaseZap,
  FileText,
  FlaskConical,
  FolderSearch,
  GitBranch,
  Map,
  Network,
  RadioTower,
  Route,
  SearchCheck,
  ShieldAlert,
  Sparkles,
  TabletSmartphone,
} from 'lucide-react'

export const ALL_ROLES = ['Admin', 'Investigator', 'Analyst', 'Supervisor']
export const OPERATIONAL_ROLES = ['Admin', 'Investigator', 'Supervisor']
export const ADMIN_ROLES = ['Admin']

export const navigationGroups = [
  {
    id: 'mission-control',
    label: 'Mission Control',
    description: 'Command overview and conversational investigation',
    items: [
      { to: '/dashboard', icon: BarChart3, labelKey: 'nav.dashboard', label: 'Dashboard', shortLabel: 'Home', roles: ALL_ROLES, keywords: 'mission command overview metrics' },
      { to: '/chat', icon: Bot, labelKey: 'nav.askSamvaad', label: 'Ask SAMVAAD', shortLabel: 'Ask', roles: ALL_ROLES, badge: 'AI', keywords: 'chat voice query copilot assistant' },
    ],
  },
  {
    id: 'case-desk',
    label: 'Case Desk',
    description: 'FIR search, dossier review, and evidence intake',
    items: [
      { to: '/cases', icon: FolderSearch, labelKey: 'nav.caseWorkspace', label: 'Case Workspace', shortLabel: 'Cases', roles: ALL_ROLES, keywords: 'fir dossier search case' },
      { to: '/evidence-lab', icon: FlaskConical, labelKey: 'nav.evidenceLab', label: 'Evidence Lab', shortLabel: 'Evidence', roles: OPERATIONAL_ROLES, keywords: 'upload provenance extract file vault' },
    ],
  },
  {
    id: 'intelligence-studio',
    label: 'Intelligence Studio',
    description: 'Explainable pattern, graph, map, and case analysis',
    items: [
      { to: '/analytics', icon: Network, labelKey: 'nav.analytics', label: 'Intelligence Analytics', shortLabel: 'Analytics', roles: ALL_ROLES, keywords: 'analysis trends studio command' },
      { to: '/map', icon: Map, labelKey: 'nav.hotspots', label: 'Hotspots', shortLabel: 'Map', roles: ALL_ROLES, keywords: 'area time category map hotspot' },
      { to: '/network', icon: GitBranch, labelKey: 'nav.network', label: 'Network', shortLabel: 'Graph', roles: ALL_ROLES, keywords: 'relation link entity graph' },
      { to: '/evidence', icon: Camera, labelKey: 'nav.digitalEvidence', label: 'Digital Evidence', shortLabel: 'Media', roles: ALL_ROLES, keywords: 'media artifact metadata file' },
      { to: '/similar', icon: Sparkles, labelKey: 'nav.crimeDna', label: 'Crime DNA', shortLabel: 'DNA', roles: ALL_ROLES, keywords: 'kavach similarity compare explainable' },
      { to: '/cold-cases', icon: SearchCheck, labelKey: 'nav.coldCases', label: 'Cold Cases', shortLabel: 'Cold', roles: ALL_ROLES, keywords: 'unresolved reopen lead' },
      { to: '/diffusion', icon: RadioTower, labelKey: 'nav.diffusion', label: 'Diffusion', shortLabel: 'Signals', roles: ALL_ROLES, keywords: 'aggregate trend spread early warning' },
    ],
  },
  {
    id: 'field-operations',
    label: 'Field Operations',
    description: 'Area-level patrol scenarios and tablet workflow',
    items: [
      { to: '/patrol', icon: Route, labelKey: 'nav.patrol', label: 'Patrol', shortLabel: 'Patrol', roles: OPERATIONAL_ROLES, keywords: 'what if units route scenario' },
      { to: '/tablet', icon: TabletSmartphone, labelKey: 'nav.tabletPatrol', label: 'Tablet Patrol', shortLabel: 'Tablet', roles: OPERATIONAL_ROLES, keywords: 'field mobile dispatch' },
    ],
  },
  {
    id: 'briefing-governance',
    label: 'Briefing & Governance',
    description: 'Reports, human approval, and auditable controls',
    items: [
      { to: '/report', icon: FileText, labelKey: 'nav.reports', label: 'Reports', shortLabel: 'Report', roles: ALL_ROLES, keywords: 'brief pdf export approval' },
      { to: '/governance', icon: ShieldAlert, labelKey: 'nav.governance', label: 'Governance', shortLabel: 'Audit', roles: ALL_ROLES, keywords: 'audit safety capability role' },
      { to: '/alerts', icon: ShieldAlert, labelKey: 'nav.alerts', label: 'Trend Alerts', shortLabel: 'Alerts', roles: ALL_ROLES, keywords: 'anomalies trend alert pattern' },
      { to: '/cohorts', icon: ShieldAlert, labelKey: 'nav.cohorts', label: 'Cohorts', shortLabel: 'Cohorts', roles: ALL_ROLES, keywords: 'safe demographics insight aggregate' },
      { to: '/inbox', icon: ShieldAlert, labelKey: 'nav.inbox', label: 'Inbox', shortLabel: 'Inbox', roles: OPERATIONAL_ROLES, keywords: 'approval review task inbox' },
    ],
  },
  {
    id: 'admin-console',
    label: 'Admin Console',
    description: 'Deployment pipeline and synthetic data administration',
    items: [
      { to: '/pipeline', icon: Network, labelKey: 'nav.pipeline', label: 'Pipeline', shortLabel: 'Pipeline', roles: ADMIN_ROLES, keywords: 'catalyst deployment architecture api' },
      { to: '/admin-data', icon: DatabaseZap, labelKey: 'nav.adminData', label: 'Admin Data', shortLabel: 'Data', roles: ADMIN_ROLES, keywords: 'seed datastore version administration' },
    ],
  },
]

export const navigationItems = navigationGroups.flatMap((group) =>
  group.items.map((item) => ({ ...item, groupId: group.id, groupLabel: group.label })),
)

export function navigationForRole(role) {
  return navigationGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => item.roles.includes(role)) }))
    .filter((group) => group.items.length)
}

export function appsForRole(role) {
  return navigationItems.filter((item) => item.roles.includes(role))
}

export function navigationItemForPath(pathname) {
  return [...navigationItems]
    .sort((left, right) => right.to.length - left.to.length)
    .find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`)) || navigationItems[0]
}

export function canAccessPath(role, pathname) {
  const item = navigationItemForPath(pathname)
  return Boolean(item?.roles.includes(role))
}
