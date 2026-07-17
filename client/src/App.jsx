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
      clearApiSession()
      setUser(null)
    },
  }), [user, clearApiSession])

  const landing = user?.role === 'Analyst' || user?.role === 'Admin' ? '/dashboard' : user?.role === 'Supervisor' ? '/analytics' : '/chat'

  return (
    <HashRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to={landing} replace /> : <Login onLogin={setUser} />} />
          <Route path="/" element={<RequireUser user={user}><AppLayout appState={appState} /></RequireUser>}>
            <Route index element={<Navigate to={landing} replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="chat" element={<InvestigationChat />} />
            <Route path="cases" element={<CaseExplorer />} />
            <Route path="cases/:firId" element={<CaseDossier />} />
            <Route path="evidence-lab" element={<EvidenceLab />} />
            <Route path="analytics" element={<IntelligenceAnalytics />} />
            <Route path="map" element={<HotspotMap />} />
            <Route path="network" element={<NetworkGraph />} />
            <Route path="network/:firId" element={<NetworkGraph />} />
            <Route path="evidence" element={<DigitalEvidence />} />
            <Route path="similar" element={<SimilarCases />} />
            <Route path="similar/:firId" element={<SimilarCases />} />
            <Route path="patrol" element={<PatrolWhatIf />} />
            <Route path="tablet" element={<TabletPatrol />} />
            <Route path="report" element={<Report />} />
            <Route path="cold-cases" element={<ColdCases />} />
            <Route path="diffusion" element={<DiffusionRisk />} />
            <Route path="pipeline" element={<SystemPipeline />} />
            <Route path="governance" element={<GovernanceAudit />} />
            <Route path="admin-data" element={<RequireUser user={user} roles={['Admin']}><AdminData /></RequireUser>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
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
