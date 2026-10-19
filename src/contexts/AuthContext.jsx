import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../lib/api.js'

const AuthContext = createContext(null)

function useAuth() {
  return useContext(AuthContext)
}

export { useAuth }

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    checkAuth()

    const handleUnauthorized = (e) => {
      localStorage.removeItem('riskiq-token')
      setUser(prev => {
        if (prev) {
          setError(e.detail || 'Session expired. Please sign in again.')
        }
        return null
      })
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('riskiq-token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const userData = await api('/me')
      setUser(userData)
    } catch (e) {
      localStorage.removeItem('riskiq-token')
      setUser(null)
      setError('Session expired. Please login again.')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    setError('')
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (!supabaseUrl) {
        setError('Supabase is not configured. Please set VITE_SUPABASE_URL in your environment variables.')
        return false
      }
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        const errorText = data.error_description || data.msg || data.message || (data.error ? (data.error.message || data.error) : 'Login failed')
        if (errorText.toLowerCase().includes('email not confirmed')) {
          throw new Error('Your email address has not been confirmed yet. Please check your inbox and click the verification link.')
        } else if (errorText.toLowerCase().includes('invalid login credentials')) {
          throw new Error('Invalid email or password. If you just registered, please verify your email first.')
        }
        throw new Error(errorText)
      }

      localStorage.setItem('riskiq-token', data.access_token)
      const userData = await api('/me', null, false, data.access_token)
      setUser(userData)
      setError('')
      return true
    } catch (e) {
      setError(e.message || 'Login failed. Please check your credentials and try again.')
      return false
    }
  }

  const signup = async (email, password) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (!supabaseUrl) {
        setError('Supabase is not configured. Please set VITE_SUPABASE_URL in your environment variables.')
        return false
      }
      const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error_description || data.msg || data.message || 'Signup failed')

      const accessToken = data.access_token || data.session?.access_token
      if (accessToken) {
        localStorage.setItem('riskiq-token', accessToken)
        const userData = await api('/me', null, false, accessToken)
        setUser(userData)
        setError('')
        return true
      } else {
        // Supabase requires email verification before issuing an access token
        return {
          needsConfirmation: true,
          message: 'Account created! Please check your email to verify your address before signing in.'
        }
      }
    } catch (e) {
      setError(e.message || 'Signup failed. Please try again.')
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('riskiq-token')
    setUser(null)
    setError('')
  }

  const hasPermission = (perm) => {
    if (!user || !user.role) return false
    const rolePerms = {
      super_admin: ['read', 'write', 'approve', 'audit', 'admin', 'super_admin'],
      admin: ['read', 'write', 'approve', 'audit', 'admin'],
      risk_manager: ['read', 'write', 'approve'],
      analyst: ['read', 'write'],
      viewer: ['read'],
      auditor: ['read', 'audit'],
    }
    return (rolePerms[user.role] || []).includes(perm)
  }

  const isPendingApproval = () => {
    return user && !user.role
  }

  const isSuperAdmin = () => user?.role === 'super_admin'
  const isAdmin = () => user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout, hasPermission, checkAuth, isPendingApproval, isSuperAdmin, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}
