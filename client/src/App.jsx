import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import { LanguageProvider } from './i18n.js'
import { getStoredUser, storeUser } from './services/prototypeEngine.js'
import { RuntimeProvider, useRuntime } from './services/runtime.jsx'

const AdminData = lazy(() => import('./pages/AdminData.jsx'))
const CaseDossier = lazy(() => import('./pages/CaseDossier.jsx'))
const CaseExplorer = lazy(() => import('./pages/CaseExplorer.jsx'))
const ColdCases = lazy(() => import('./pages/ColdCases.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const DiffusionRisk = lazy(() => import('./pages/DiffusionRisk.jsx'))
const DigitalEvidence = lazy(() => import('./pages/DigitalEvidence.jsx'))
const EvidenceLab = lazy(() => import('./pages/EvidenceLab.jsx'))
const GovernanceAudit = lazy(() => import('./pages/GovernanceAudit.jsx'))
const HotspotMap = lazy(() => import('./pages/HotspotMap.jsx'))
const IntelligenceAnalytics = lazy(() => import('./pages/IntelligenceAnalytics.jsx'))
const InvestigationChat = lazy(() => import('./pages/InvestigationChat.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const NetworkGraph = lazy(() => import('./pages/NetworkGraph.jsx'))
const PatrolWhatIf = lazy(() => import('./pages/PatrolWhatIf.jsx'))
const Report = lazy(() => import('./pages/Report.jsx'))
const SimilarCases = lazy(() => import('./pages/SimilarCases.jsx'))
const SystemPipeline = lazy(() => import('./pages/SystemPipeline.jsx'))
const TabletPatrol = lazy(() => import('./pages/TabletPatrol.jsx'))

function PageLoader() {
  return <div className="page-loader" role="status">Loading secure workspace…</div>
}

function lazyPage(element) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>
}

function RequireUser({ user, roles, children }) {
  if (!user) return <Navigate to="/login" replace />
  if (roles?.length && !roles.includes(user.role)) return <Navigate to="/chat" replace />
  return children
}

function WorkspaceRouter() {
  const [user, setUser] = useState(() => getStoredUser())
  const { logout: clearApiSession } = useRuntime()

  useEffect(() => {
    storeUser(user)
  }, [user])

  const appState = useMemo(() => ({
    user,
    setUser,
    logout: () => {
      clearApiSession(user?.sessionMode)
      setUser(null)
    },
  }), [user, clearApiSession])

  const landing = user?.role === 'Analyst' || user?.role === 'Admin' ? '/dashboard' : user?.role === 'Supervisor' ? '/analytics' : '/chat'

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={landing} replace /> : lazyPage(<Login onLogin={setUser} />)} />
        <Route path="/" element={<RequireUser user={user}><AppLayout appState={appState} /></RequireUser>}>
          <Route index element={<Navigate to={landing} replace />} />
          <Route path="dashboard" element={lazyPage(<Dashboard />)} />
          <Route path="chat" element={lazyPage(<InvestigationChat />)} />
          <Route path="cases" element={lazyPage(<CaseExplorer />)} />
          <Route path="cases/:firId" element={lazyPage(<CaseDossier />)} />
          <Route path="evidence-lab" element={lazyPage(<EvidenceLab />)} />
          <Route path="analytics" element={lazyPage(<IntelligenceAnalytics />)} />
          <Route path="map" element={lazyPage(<HotspotMap />)} />
          <Route path="network" element={lazyPage(<NetworkGraph />)} />
          <Route path="network/:firId" element={lazyPage(<NetworkGraph />)} />
          <Route path="evidence" element={lazyPage(<DigitalEvidence />)} />
          <Route path="similar" element={lazyPage(<SimilarCases />)} />
          <Route path="similar/:firId" element={lazyPage(<SimilarCases />)} />
          <Route path="patrol" element={lazyPage(<PatrolWhatIf />)} />
          <Route path="tablet" element={lazyPage(<TabletPatrol />)} />
          <Route path="report" element={lazyPage(<Report />)} />
          <Route path="cold-cases" element={lazyPage(<ColdCases />)} />
          <Route path="diffusion" element={lazyPage(<DiffusionRisk />)} />
          <Route path="pipeline" element={lazyPage(<SystemPipeline />)} />
          <Route path="governance" element={lazyPage(<GovernanceAudit />)} />
          <Route path="admin-data" element={<RequireUser user={user} roles={['Admin']}>{lazyPage(<AdminData />)}</RequireUser>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

function App() {
  return (
    <LanguageProvider>
      <RuntimeProvider>
        <WorkspaceRouter />
      </RuntimeProvider>
    </LanguageProvider>
  )
}

export default App
