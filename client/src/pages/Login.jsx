import { Bot, FileText, GitBranch, KeyRound, Languages, LogIn, MapPinned, RadioTower, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import loginWallpaper from '../assets/ksr-police-command-wallpaper.png'
import { demoUsers, login } from '../services/prototypeEngine.js'

const loginCapabilities = [
  { label: 'Natural-language FIR search', Icon: Bot },
  { label: 'English + Kanglish demo prompts', Icon: Languages },
  { label: 'Network + Crime DNA reasoning', Icon: GitBranch },
  { label: 'Hotspot map + patrol what-if', Icon: MapPinned },
  { label: 'Legal-style PDF brief', Icon: FileText },
  { label: 'Live field context', Icon: RadioTower },
]

const loginSignals = [
  { value: '4', label: 'role profiles' },
  { value: '24/7', label: 'command view' },
  { value: 'KSR', label: 'police theme' },
]

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
  const [email, setEmail] = useState(demoUsers[1].email)
  const [password, setPassword] = useState('demo123')
  const [error, setError] = useState('')
  const [accessGranted, setAccessGranted] = useState(false)
  const navigate = useNavigate()

  function submit(event) {
    event.preventDefault()
    setError('')

    try {
      const user = login(email, password)
      setAccessGranted(true)
      setTimeout(() => {
        onLogin(user)
        navigate(user.landing, { replace: true })
      }, 800)
    } catch (err) {
      setError(err.message)
    }
  }

  function fillDemo(user) {
    setEmail(user.email)
    setPassword(user.password)
    setError('')
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
                <p>Karnataka-focused crime intelligence workspace powered by KAVACH Crime DNA engine.</p>
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
              <h2>Role-Based Access</h2>
              <p>Prototype identities are scoped for investigator, analyst, supervisor, and admin workflows.</p>
            </div>

            <form className="login-form" onSubmit={submit}>
              <label>
                Email
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                />
              </label>
              <label>
                Password
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                />
              </label>
              {error ? (
                <p className="form-error" role="alert">
                  {error}
                </p>
              ) : null}
              <button type="submit" className="primary-button">
                <LogIn size={18} />
                Enter Command Workspace
              </button>
            </form>

            <div className="credential-header">
              <p className="eyebrow">Demo Profiles</p>
              <span>{demoUsers.length} available</span>
            </div>
            <div className="credential-grid">
              {demoUsers.map((user) => (
                <CredentialCard
                  key={user.email}
                  user={user}
                  isSelected={email.trim().toLowerCase() === user.email}
                  onSelect={fillDemo}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

export default Login
