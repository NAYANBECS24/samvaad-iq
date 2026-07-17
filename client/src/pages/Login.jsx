import { Bot, FileText, GitBranch, KeyRound, Languages, LogIn, MapPinned, RadioTower, ShieldCheck, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import loginWallpaper from '../assets/ksp-police-command-wallpaper.png'
import { demoUsers } from '../services/prototypeEngine.js'
import { useRuntime } from '../services/runtime.jsx'
import { loadCatalystWebSdk, renderCatalystSignIn } from '../services/catalystAuth.js'

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
      <span>{user.role}</span>
      <small>{user.email}</small>
      <em>{user.access}</em>
    </button>
  )
}

function Login({ onLogin }) {
  const localBrowser = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  const [email, setEmail] = useState(demoUsers[1].email)
  const [password, setPassword] = useState(offlineDemoPassword)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [accessGranted, setAccessGranted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authView, setAuthView] = useState(localBrowser ? 'demo' : 'catalyst')
  const [sdkState, setSdkState] = useState(localBrowser ? 'unavailable' : 'checking')
  const [registration, setRegistration] = useState({ firstName: '', lastName: '', email: '' })
  const navigate = useNavigate()
  const { runtime, login, completeCatalystLogin, register } = useRuntime()
  const passwordRequired = runtime.mode === 'catalyst-live' || Boolean(offlineDemoPassword)
  const checkingRuntime = runtime.mode === 'checking'
  const grantingRef = useRef(false)
  const signInRenderedRef = useRef(false)

  const grantAccess = useCallback((user) => {
    if (grantingRef.current) return
    grantingRef.current = true
    setAccessGranted(true)
    window.setTimeout(() => {
      onLogin(user)
      navigate(user.landing, { replace: true })
    }, 600)
  }, [navigate, onLogin])

  const continueCatalystSession = useCallback(async ({ silent = false } = {}) => {
    if (grantingRef.current) return
    try {
      const user = await completeCatalystLogin()
      grantAccess(user)
    } catch (err) {
      if (!silent) setError(err.message || 'Complete the Catalyst sign-in form first.')
    }
  }, [completeCatalystLogin, grantAccess])

  useEffect(() => {
    if (localBrowser) return undefined
    let cancelled = false
    loadCatalystWebSdk()
      .then(() => {
        if (!cancelled) setSdkState('ready')
      })
      .catch((err) => {
        if (!cancelled) {
          setSdkState('unavailable')
          setError(`Catalyst Auth is unavailable on this deployment: ${err.message}`)
        }
      })
    return () => { cancelled = true }
  }, [localBrowser])

  useEffect(() => {
    if (sdkState !== 'ready' || authView !== 'catalyst' || signInRenderedRef.current) return undefined
    signInRenderedRef.current = true
    renderCatalystSignIn('catalyst-signin').catch((err) => {
      signInRenderedRef.current = false
      setError(err.message)
    })
    return undefined
  }, [sdkState, authView])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const user = await login(email, password)
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

  async function submitRegistration(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setIsSubmitting(true)
    try {
      await register(registration)
      setNotice(`Activation instructions were sent to ${registration.email.trim().toLowerCase()}. The account starts with Investigator access.`)
      setAuthView('catalyst')
      signInRenderedRef.current = false
    } catch (err) {
      setError(`${err.message || 'Registration could not be completed.'} If public signup is disabled, enable it in Catalyst Authentication or invite the user from the console.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  function selectAuthView(view) {
    setAuthView(view)
    setError('')
    setNotice('')
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

          <div className="login-action-panel">
            <div className="login-form-heading">
              <p className="eyebrow">Secure Demo Gateway</p>
              <h2>{authView === 'register' ? 'Register Catalyst Account' : authView === 'demo' ? 'Read-Only Judge Demo' : 'Catalyst Role-Based Access'}</h2>
              <p>{authView === 'catalyst'
                ? 'Sign in through Zoho Catalyst. The server derives your role; the browser cannot promote it.'
                : authView === 'register'
                  ? 'Create a low-privilege account and activate it from the email sent by Catalyst.'
                  : offlineDemoPassword
                    ? 'Offline demo access uses the password configured by the host; changes are not persisted.'
                    : 'Select a profile for read-only offline access. This is a demo persona, not an authenticated police account.'}</p>
            </div>

            <div className="login-auth-tabs" role="tablist" aria-label="Authentication method">
              <button type="button" role="tab" aria-selected={authView === 'catalyst'} className={authView === 'catalyst' ? 'active' : ''} onClick={() => selectAuthView('catalyst')}>Catalyst Login</button>
              <button type="button" role="tab" aria-selected={authView === 'register'} className={authView === 'register' ? 'active' : ''} onClick={() => selectAuthView('register')} disabled={sdkState === 'unavailable'}>Register</button>
              <button type="button" role="tab" aria-selected={authView === 'demo'} className={authView === 'demo' ? 'active' : ''} onClick={() => selectAuthView('demo')}>Offline Demo</button>
            </div>

            {authView === 'catalyst' ? (
              <div className="catalyst-auth-panel">
                <div id="catalyst-signin" className="catalyst-signin-frame">
                  {sdkState === 'checking' ? <p>Loading secure Catalyst authentication…</p> : null}
                  {sdkState === 'unavailable' ? <p>Catalyst Auth is not configured for this hosted origin. The offline judge demo remains available.</p> : null}
                </div>
                {error ? <p className="form-error" role="alert">{error}</p> : null}
                {notice ? <p className="form-notice" role="status">{notice}</p> : null}
                <button type="button" className="primary-button" disabled={sdkState !== 'ready' || isSubmitting} onClick={() => continueCatalystSession()}>
                  <LogIn size={18} /> Continue after sign in
                </button>
                <small className="auth-safety-note">Complete the Catalyst form above, then use Continue after sign in to open your role-controlled workspace.</small>
                <small className="auth-safety-note"><ShieldCheck size={14} /> Authentication, password reset, and session cookies are handled by Catalyst—not stored in Git or browser application code.</small>
              </div>
            ) : null}

            {authView === 'register' ? (
              <form className="login-form" onSubmit={submitRegistration}>
                <div className="registration-name-grid">
                  <label>First name<input value={registration.firstName} onChange={(event) => setRegistration((current) => ({ ...current, firstName: event.target.value }))} autoComplete="given-name" maxLength={80} /></label>
                  <label>Last name<input value={registration.lastName} onChange={(event) => setRegistration((current) => ({ ...current, lastName: event.target.value }))} autoComplete="family-name" required maxLength={80} /></label>
                </div>
                <label>Email<input value={registration.email} onChange={(event) => setRegistration((current) => ({ ...current, email: event.target.value }))} type="email" autoComplete="email" required /></label>
                {error ? <p className="form-error" role="alert">{error}</p> : null}
                {notice ? <p className="form-notice" role="status">{notice}</p> : null}
                <button type="submit" className="primary-button" disabled={isSubmitting || sdkState !== 'ready'}><UserPlus size={18} />{isSubmitting ? 'Creating account…' : 'Register as Investigator'}</button>
              </form>
            ) : null}

            {authView === 'demo' ? (
              <>
                <form className="login-form" onSubmit={submit}>
                  <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" autoCapitalize="none" spellCheck="false" /></label>
                  <label>{passwordRequired ? 'Password' : 'Password (not required for read-only demo)'}<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" disabled={!passwordRequired} required={passwordRequired} placeholder={passwordRequired ? 'Enter password' : 'Profile selection only'} /></label>
                  {error ? <p className="form-error" role="alert">{error}</p> : null}
                  <button type="submit" className="primary-button" disabled={isSubmitting || checkingRuntime}><LogIn size={18} />{checkingRuntime ? 'Checking runtime…' : isSubmitting ? 'Opening workspace…' : 'Enter Command Workspace'}</button>
                </form>
                <div className="credential-header"><p className="eyebrow">Demo Profiles</p><span>{demoUsers.length} available</span></div>
                <div className="credential-grid">
                  {demoUsers.map((user) => <CredentialCard key={user.email} user={user} isSelected={email.trim().toLowerCase() === user.email} onSelect={fillDemo} />)}
                </div>
              </>
            ) : null}
          </div>
        </section>
      )}
    </main>
  )
}

export default Login
