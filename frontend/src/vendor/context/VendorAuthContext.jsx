import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { vendorAuthApi } from '../api/vendorAuthApi'
import { getVendorToken, setVendorToken } from '../api/client'

const VendorAuthContext = createContext(null)

export function VendorAuthProvider({ children }) {
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = getVendorToken()
    if (!token) {
      setLoading(false)
      return
    }

    vendorAuthApi
      .me()
      .then((res) => setVendor(res.vendor))
      .catch(() => {
        setVendorToken(null)
        setVendor(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    setError('')
    const res = await vendorAuthApi.login(email, password)
    setVendorToken(res.token)
    setVendor(res.user || res.vendor)
    return res
  }, [])

  const register = useCallback(async (payload) => {
    setError('')
    const res = await vendorAuthApi.register(payload)
    setVendorToken(res.token)
    setVendor(res.user || res.vendor)
    return res
  }, [])

  const logout = useCallback(async () => {
    try {
      await vendorAuthApi.logout()
    } catch {
      // Even if the network call fails, clear local session state.
    }
    setVendorToken(null)
    setVendor(null)
  }, [])

  const refresh = useCallback(async () => {
    const res = await vendorAuthApi.me()
    setVendor(res.vendor)
    return res.vendor
  }, [])

  const value = {
    vendor,
    loading,
    error,
    isAuthenticated: !!vendor,
    login,
    register,
    logout,
    refresh,
  }

  return <VendorAuthContext.Provider value={value}>{children}</VendorAuthContext.Provider>
}

export function useVendorAuth() {
  const ctx = useContext(VendorAuthContext)
  if (!ctx) throw new Error('useVendorAuth must be used within VendorAuthProvider')
  return ctx
}
