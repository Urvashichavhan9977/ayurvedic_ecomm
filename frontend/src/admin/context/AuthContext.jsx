import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/authApi'
import { getToken, setToken } from '../api/client.js'

const AuthContext = createContext(null)

function readUser() {
  try {
    const raw = localStorage.getItem('amrita_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser)
  const [loading, setLoading] = useState(true)

  // Persist user to localStorage whenever it changes.
  useEffect(() => {
    if (user) localStorage.setItem('amrita_user', JSON.stringify(user))
    else localStorage.removeItem('amrita_user')
  }, [user])

  // On first load, if we have a token, confirm it's still valid and refresh
  // the user's profile from the backend.
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then((res) => setUser(res.user))
      .catch(() => {
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  // Called once the backend has issued a token (after register or login).
  const applySession = ({ token, user: sessionUser }) => {
    setToken(token)
    setUser(sessionUser)
  }

  // Registration logs the user in immediately — no OTP step.
  const register = async ({ name, email, password, phone }) => {
    const res = await authApi.register(name, email, password, phone)
    applySession(res)
    return res
  }

  // Password-based login.
  const login = async ({ email, password }) => {
    const res = await authApi.login(email, password)
    applySession(res)
    return res
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // Even if the network call fails, clear the local session.
    }
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}