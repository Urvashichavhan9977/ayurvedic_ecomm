import { createContext, useContext, useEffect, useState } from 'react'
import { themeApi } from '../api/themeApi'

const ThemeContext = createContext(null)

const STORAGE_KEY = 'amrita_theme'
const POLL_MS = 30000

function readCachedTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'light'
  } catch {
    return 'light'
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readCachedTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {}
  }, [theme])

  useEffect(() => {
    let cancelled = false
    const sync = () => {
      themeApi
        .get()
        .then((res) => {
          if (!cancelled && (res?.theme === 'light' || res?.theme === 'dark')) {
            setTheme(res.theme)
          }
        })
        .catch(() => {})
    }
    sync()
    const interval = setInterval(sync, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}