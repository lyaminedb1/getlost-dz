import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('glz_token')
    if (token) {
      api('/auth/me')
        .then(u => setUser(u))
        .catch(() => localStorage.removeItem('glz_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } })
    localStorage.setItem('glz_token', data.token)
    const fullUser = await api('/auth/me')
    setUser(fullUser)
    return fullUser
  }

  const register = async (form) => {
    const data = await api('/auth/register', { method: 'POST', body: form })
    if (data.needsVerification) {
      return { needsVerification: true, email: data.email }
    }
    // Fallback (shouldn't normally happen)
    localStorage.setItem('glz_token', data.token)
    const fullUser = await api('/auth/me')
    setUser(fullUser)
    return fullUser
  }

  const verifyEmail = async (email, code) => {
    const data = await api('/auth/verify-email', { method: 'POST', body: { email, code } })
    localStorage.setItem('glz_token', data.token)
    const fullUser = await api('/auth/me')
    setUser(fullUser)
    return fullUser
  }

  const resendCode = async (email) => {
    return await api('/auth/resend-code', { method: 'POST', body: { email } })
  }

  const logout = () => {
    localStorage.removeItem('glz_token')
    setUser(null)
  }

  const updateUser = (updates) => setUser(u => ({ ...u, ...updates }))

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyEmail, resendCode, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
