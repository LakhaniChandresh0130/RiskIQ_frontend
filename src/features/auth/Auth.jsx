import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
  }

  return (
    <div className="auth-container">
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
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
