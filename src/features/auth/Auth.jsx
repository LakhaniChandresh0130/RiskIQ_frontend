import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import ThemeToggle from '../../components/ThemeToggle.jsx'

function EyeIcon({ off }) {
  return off ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
      <path d="M9.9 5.1A9.8 9.8 0 0112 5c5 0 9.3 3.1 11 7.5a11.7 11.7 0 01-4.2 5.1" />
      <path d="M6.7 6.7C4.1 8.3 2.3 10.7 1 12.5c1.6 3.2 4.6 6.2 8.2 7.3 1.2.4 2.5.5 3.8.4" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [infoMsg, setInfoMsg] = useState('')
  const { login, signup, error, loading } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isLogin) {
      setInfoMsg('')
    }
    const res = isLogin ? await login(email, password) : await signup(email, password)
    if (res && res.needsConfirmation) {
      setInfoMsg(res.message || 'Registration successful! Please check your email to confirm your account, then sign in.')
      setIsLogin(true)
    } else if (res) {
      setInfoMsg('')
      setEmail('')
      setPassword('')
    }
  }

  const handleSwitch = () => {
    setIsLogin(!isLogin)
    setInfoMsg('')
    setShowPassword(false)
  }

  return (
    <div className="auth-container">
      <ThemeToggle className="theme-fab" />
      <div className="aurora"><i /><i /><i /><div className="gridfx" /></div>
      <div className="auth-card">
        <div className="brand"><span className="logo" /><div><b>RiskIQ</b><small>quant risk platform</small></div></div>

        <h1>{isLogin ? 'Sign In' : 'Create Account'}</h1>

        {infoMsg && <div className="card-b okmsg" style={{ marginBottom: '12px' }}>{infoMsg}</div>}
        {error && <div className="card-b neg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon off={showPassword} />
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={handleSwitch} className="link">
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
