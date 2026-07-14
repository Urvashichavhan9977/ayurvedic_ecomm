import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { adminAuthApi } from '../api/adminAuthApi'
import { getAdminToken, setAdminToken } from '../api/client'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // On mount, if a token is already stored, validate it against /admin/auth/me
  // so a page refresh doesn't kick the admin back to the login screen.
  useEffect(() => {
    const token = getAdminToken()
    if (!token) {
      setLoading(false)
      return
    }

    adminAuthApi
      .me()
      .then((res) => setAdmin(res.admin))
      .catch(() => {
        setAdminToken(null)
        setAdmin(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    setError('')
    const res = await adminAuthApi.login(email, password)
    setAdminToken(res.token)
    setAdmin(res.user || res.admin)
    return res
  }, [])

  const logout = useCallback(async () => {
    try {
      await adminAuthApi.logout()
    } catch {
      // Even if the network call fails, clear local session state.
    }
    setAdminToken(null)
    setAdmin(null)
  }, [])

  const value = {
    admin,
    loading,
    error,
    isAuthenticated: !!admin,
    login,
    logout,
  }

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
