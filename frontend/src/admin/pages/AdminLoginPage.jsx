import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import { IconAlert, IconEye, IconEyeOff } from '../components/AdminIcons'

export default function AdminLoginPage() {
  const { login, isAuthenticated, loading: sessionLoading } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Already logged in? Skip straight past the login screen.
  if (!sessionLoading && isAuthenticated) {
    const redirectTo = location.state?.from?.pathname || '/admin/dashboard'
    return <Navigate to={redirectTo} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }

    setSubmitting(true)
    try {
      await login(email, password)
      const redirectTo = location.state?.from?.pathname || '/admin/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="adm-root">
      <div className="adm-login-screen">
        <div className="adm-login-card">
          <div className="adm-login-brand">
            <div className="adm-login-logo">A</div>
            <h1>Amrita Ayurveda</h1>
            <p>Admin Panel Sign In</p>
          </div>

          {error && (
            <div className="adm-alert adm-alert-error">
              <IconAlert />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="adm-form-group">
              <label htmlFor="admin-email">Email address</label>
              <input
                id="admin-email"
                type="email"
                className="adm-input"
                placeholder="admin@amritaayurveda.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="adm-form-group">
              <label htmlFor="admin-password">Password</label>
              <div className="adm-input-wrap">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  className="adm-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  style={{ paddingRight: '2.6rem' }}
                />
                <button
                  type="button"
                  className="adm-input-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="adm-btn adm-btn-primary" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="adm-login-footer">
            Authorized personnel only. This panel is separate from the customer storefront login.
          </p>
        </div>
      </div>
    </div>
  )
}
