import { Navigate, useLocation } from 'react-router-dom'
import { useVendorAuth } from '../context/VendorAuthContext'

export default function ProtectedVendorRoute({ children }) {
  const { isAuthenticated, loading } = useVendorAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="vnd-fullscreen-loader">
        <div className="vnd-spinner" />
        <p>Checking session…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/vendor/login" state={{ from: location }} replace />
  }

  return children
}
