import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import AppLayout from './components/AppLayout.jsx'
import { LanguageProvider } from './i18n.js'
import AdminData from './pages/AdminData.jsx'
import CaseDossier from './pages/CaseDossier.jsx'
import CaseExplorer from './pages/CaseExplorer.jsx'
import ColdCases from './pages/ColdCases.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DiffusionRisk from './pages/DiffusionRisk.jsx'
import DigitalEvidence from './pages/DigitalEvidence.jsx'
import EvidenceLab from './pages/EvidenceLab.jsx'
import GovernanceAudit from './pages/GovernanceAudit.jsx'
import HotspotMap from './pages/HotspotMap.jsx'
import InvestigationChat from './pages/InvestigationChat.jsx'
import Login from './pages/Login.jsx'
import NetworkGraph from './pages/NetworkGraph.jsx'
import PatrolWhatIf from './pages/PatrolWhatIf.jsx'
import Report from './pages/Report.jsx'
import SimilarCases from './pages/SimilarCases.jsx'
import SystemPipeline from './pages/SystemPipeline.jsx'
import TabletPatrol from './pages/TabletPatrol.jsx'
import { getStoredUser, storeUser } from './services/prototypeEngine.js'

function RequireUser({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  const [user, setUser] = useState(() => getStoredUser())

  useEffect(() => {
    storeUser(user)
  }, [user])

  const appState = useMemo(
    () => ({
      user,
      setUser,
      logout: () => setUser(null),
    }),
    [user],
  )

  return (
    <LanguageProvider>
      <HashRouter>
        <Routes>
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to={user.role === 'Analyst' ? '/dashboard' : '/chat'} replace />
              ) : (
                <Login onLogin={setUser} />
              )
            }
          />
          <Route
            path="/"
            element={
              <RequireUser user={user}>
                <AppLayout appState={appState} />
              </RequireUser>
            }
          >
            <Route index element={<Navigate to="/chat" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="chat" element={<InvestigationChat />} />
            <Route path="cases" element={<CaseExplorer />} />
            <Route path="cases/:firId" element={<CaseDossier />} />
            <Route path="map" element={<HotspotMap />} />
            <Route path="network" element={<NetworkGraph />} />
            <Route path="network/:firId" element={<NetworkGraph />} />
            <Route path="evidence-lab" element={<EvidenceLab />} />
            <Route path="evidence" element={<DigitalEvidence />} />
            <Route path="similar" element={<SimilarCases />} />
            <Route path="similar/:firId" element={<SimilarCases />} />
            <Route path="patrol" element={<PatrolWhatIf />} />
            <Route path="tablet" element={<TabletPatrol />} />
            <Route path="report" element={<Report />} />
            <Route path="cold-cases" element={<ColdCases />} />
            <Route path="diffusion" element={<DiffusionRisk />} />
            <Route path="admin-data" element={<AdminData />} />
            <Route path="pipeline" element={<SystemPipeline />} />
            <Route path="governance" element={<GovernanceAudit />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </LanguageProvider>
  )
}

export default App
