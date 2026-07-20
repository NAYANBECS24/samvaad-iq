import { Bot, CheckCircle2, ExternalLink, FileText, GitBranch, KeyRound, Languages, LogIn, MapPinned, RadioTower, ShieldCheck } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import loginWallpaper from '../assets/ksp-police-command-wallpaper.png'
import { api } from '../services/api.js'
import { demoUsers } from '../services/intelligenceRepository.js'
import { useRuntime } from '../services/runtime.jsx'

const loginCapabilities = [
  { label: 'Natural-language FIR search', Icon: Bot },
  { label: 'English + Kannada + Kanglish', Icon: Languages },
  { label: 'Cited KAVACH explanations', Icon: GitBranch },
  { label: 'Hotspot map + patrol what-if', Icon: MapPinned },
  { label: 'Auditable evidence brief', Icon: FileText },
  { label: 'Human-in-the-loop safeguards', Icon: RadioTower },
]

const loginSignals = [
  { value: '4', label: 'role profiles' },
  { value: '24/7', label: 'command view' },
  { value: 'KSP', label: 'Challenge 1' },
]

const offlineDemoPassword = import.meta.env.VITE_OFFLINE_DEMO_PASSWORD || ''

function CredentialCard({ user, isSelected, onSelect }) {
  return (
    <button
      type="button"
      className={`credential-card${isSelected ? ' is-selected' : ''}`}
      aria-pressed={isSelected}
      onClick={() => onSelect(user)}
    >
      <KeyRound size={16} />
      {isSelected ? <span className="credential-selected"><CheckCircle2 size={13} />Selected</span> : null}
      <span>{user.role}</span>
      <small>{user.email}</small>
      <em>{user.access}</em>
    </button>
  )
}

function Login({ onLogin }) {
  const [accessMode, setAccessMode] = useState('demo')
  const [email, setEmail] = useState(demoUsers[1].email)
  const [password, setPassword] = useState(offlineDemoPassword)
  const [error, setError] = useState('')
  const [accessGranted, setAccessGranted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpeningSecure, setIsOpeningSecure] = useState(false)
  const navigate = useNavigate()
  const { login, runtime } = useRuntime()
  const passwordRequired = Boolean(offlineDemoPassword)
  const grantingRef = useRef(false)

  function selectAccessMode(mode) {
    setAccessMode(mode)
    setError('')
  }

  function handleAccessModeKeyDown(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const nextMode = event.key === 'Home'
      ? 'demo'
      : event.key === 'End'
        ? 'secure'
        : accessMode === 'demo' ? 'secure' : 'demo'
    selectAccessMode(nextMode)
    window.requestAnimationFrame(() => document.getElementById(`access-tab-${nextMode}`)?.focus())
  }

  const grantAccess = useCallback((user) => {
    if (grantingRef.current) return
    grantingRef.current = true
    setAccessGranted(true)
    window.setTimeout(() => {
      onLogin(user)
      navigate(user.landing, { replace: true })
    }, 600)
  }, [navigate, onLogin])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const user = await login(email, password, { allowOfflineProfile: true })
      grantAccess(user)
    } catch (err) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  function fillDemo(user) {
    setEmail(user.email)
    setPassword(offlineDemoPassword)
    setError('')
  }

  async function openSecureSignIn() {
    setError('')
    setIsOpeningSecure(true)
    try {
      const response = await api.secureLogin()
      if (!response?.url) throw new Error('Secure invited-user sign-in is not configured for this environment.')
      window.location.assign(response.url)
    } catch (err) {
      setError(err.message)
      setIsOpeningSecure(false)
    }
  }

  return (
    <main className="login-screen" style={{ '--login-wallpaper': `url(${loginWallpaper})` }}>
      <div className="login-backdrop" aria-hidden="true">
        <div className="grid-map">
          <span className="node node-1" />
          <span className="node node-2" />
          <span className="node node-3" />
          <span className="route route-1" />
          <span className="route route-2" />
        </div>
      </div>

      {accessGranted ? (
        <div style={{
          display: 'grid',
          placeItems: 'center',
          gap: 16,
          animation: 'agent-enter 0.4s ease both',
          textAlign: 'center',
          zIndex: 10,
        }}>
          <div className="brand-mark large" style={{ width: 80, height: 80, borderRadius: 20 }}>
            <ShieldCheck size={40} />
          </div>
          <h1 style={{
            fontSize: '2.5rem',
            background: 'linear-gradient(135deg, #fff, #00f0ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Access Granted
          </h1>
          <p style={{ color: 'var(--muted)' }}>Initializing command workspace...</p>
        </div>
      ) : (
        <section className="login-panel" aria-labelledby="login-title">
          <div className="login-intro">
            <div className="login-brand">
              <div className="brand-mark large">
                <ShieldCheck size={30} />
              </div>
              <div>
                <p className="eyebrow">NETRA Intelligence Command</p>
                <h1 id="login-title">SAMVAAD-IQ</h1>
              <p>NETRA's evidence-grounded conversational workspace, powered by the explainable KAVACH Crime DNA engine.</p>
              </div>
            </div>

            <div className="login-signal-strip" aria-label="Prototype status">
              {loginSignals.map((signal) => (
                <div key={signal.label}>
                  <strong>{signal.value}</strong>
                  <span>{signal.label}</span>
                </div>
              ))}
            </div>

            <div className="login-capabilities">
              {loginCapabilities.map(({ label, Icon }) => (
                <div key={label}>
                  <Icon size={17} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="login-action-panel auth-view-demo">
            <div className="login-form-heading">
              <p className="eyebrow">Secure Demo Gateway</p>
              <h2>{accessMode === 'demo' ? 'Role-Based Demo Access' : 'Invited Secure Access'}</h2>
              <p>{accessMode === 'demo'
                ? offlineDemoPassword
                  ? 'Choose a demo profile and enter the private demo password.'
                  : 'Choose a demo profile and enter NETRA OS. No password is required.'
                : 'Continue through the branded secure redirect. Public registration is disabled and no Catalyst form is embedded here.'}</p>
            </div>

            <div className="login-access-switch" role="tablist" aria-label="NETRA OS access mode" onKeyDown={handleAccessModeKeyDown}>
              <button id="access-tab-demo" type="button" role="tab" aria-selected={accessMode === 'demo'} aria-controls="access-panel-demo" tabIndex={accessMode === 'demo' ? 0 : -1} className={accessMode === 'demo' ? 'is-selected' : ''} onClick={() => selectAccessMode('demo')}>Demo Access</button>
              <button id="access-tab-secure" type="button" role="tab" aria-selected={accessMode === 'secure'} aria-controls="access-panel-secure" tabIndex={accessMode === 'secure' ? 0 : -1} className={accessMode === 'secure' ? 'is-selected' : ''} onClick={() => selectAccessMode('secure')}>Secure sign-in</button>
            </div>

            {accessMode === 'demo' ? (
              <div id="access-panel-demo" className="login-access-panel" role="tabpanel" aria-labelledby="access-tab-demo" tabIndex="0">
                <form className="login-form" onSubmit={submit}>
                  <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" autoCapitalize="none" spellCheck="false" /></label>
                  <label>{passwordRequired ? 'Password' : 'Password (not required for demo)'}<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" disabled={!passwordRequired} required={passwordRequired} placeholder={passwordRequired ? 'Enter password' : 'Choose a role profile below'} /></label>
                  {!passwordRequired ? <p className="form-notice compact">No password is needed for this synthetic demonstration. The server assigns the selected demo role when available.</p> : null}
                  {error ? <p className="form-error" role="alert">{error}</p> : null}
                  <button type="submit" className="primary-button" disabled={isSubmitting}><LogIn size={18} />{isSubmitting ? 'Opening NETRA OS…' : 'Enter NETRA OS'}</button>
                </form>
                <div className="credential-header"><p className="eyebrow">Choose Access Role</p><span>{demoUsers.length} profiles</span></div>
                <div className="credential-grid">
                  {demoUsers.map((user) => <CredentialCard key={user.email} user={user} isSelected={email.trim().toLowerCase() === user.email} onSelect={fillDemo} />)}
                </div>
                <small className="demo-access-note"><ShieldCheck size={14} /> Synthetic demonstration data only. {runtime.apiReachable ? 'A short-lived server demo session will enforce the selected role.' : 'Offline role selection changes visible modules but is not operational authentication.'}</small>
              </div>
            ) : (
              <div id="access-panel-secure" className="secure-signin-card" role="tabpanel" aria-labelledby="access-tab-secure" tabIndex="0">
                <div className="secure-signin-icon"><ShieldCheck size={28} /></div>
                <h3>Invited KSP workspace</h3>
                <p>Use an invited account whose role is derived by the server. The browser cannot promote itself and public account creation is disabled.</p>
                <ul><li>No embedded third-party login panel</li><li>No password or token stored in this repository</li><li>Returns to the canonical Catalyst NETRA OS workspace</li></ul>
                {error ? <p className="form-error" role="alert">{error}</p> : null}
                <button type="button" className="primary-button" onClick={openSecureSignIn} disabled={isOpeningSecure || runtime.apiReachable === false}><ExternalLink size={18} />{isOpeningSecure ? 'Opening secure sign-in…' : 'Continue to secure sign-in'}</button>
                {runtime.apiReachable === false ? <p className="form-notice compact">Secure access is unavailable in Offline Demo. Use a demo profile or open the canonical Catalyst deployment.</p> : null}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  )
}

export default Login
