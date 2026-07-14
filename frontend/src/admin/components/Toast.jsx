import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { IconClose } from './AdminIcons'

/**
 * Lightweight, dependency-free toast/notification system shared by every
 * admin management screen. Wrap the admin app once with <ToastProvider>
 * and call `useToast()` anywhere below it to fire a success/error toast.
 */
const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message, type = 'success', duration = 3500) => {
      const id = ++idRef.current
      setToasts((prev) => [...prev, { id, message, type }])
      if (duration) {
        setTimeout(() => dismiss(id), duration)
      }
      return id
    },
    [dismiss]
  )

  const toast = {
    success: (message, duration) => push(message, 'success', duration),
    error: (message, duration) => push(message, 'error', duration),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="adm-toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`adm-toast adm-toast-${t.type}`}>
            <span>{t.message}</span>
            <button
              type="button"
              className="adm-toast-close"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
            >
              <IconClose width={14} height={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Fail soft rather than crashing the admin panel if a page happens to
    // render outside the provider during development.
    return { success: () => {}, error: () => {} }
  }
  return ctx
}
