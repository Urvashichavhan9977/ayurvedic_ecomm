import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useVendorAuth } from '../context/VendorAuthContext'
import '../styles/vendor.css'

export default function VendorLoginPage() {
  const { login } = useVendorAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/vendor/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="vnd-root">
      <div className="vnd-auth-wrap">
        <div className="vnd-auth-card">
          <div className="vnd-auth-logo">A</div>
          <h1 className="vnd-auth-title">Vendor Login</h1>
          <p className="vnd-auth-subtitle">Sign in to manage your Amrita Ayurveda store</p>

          {error && <div className="vnd-alert vnd-alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="vnd-form-row">
              <label htmlFor="vnd-email">Email</label>
              <input
                id="vnd-email"
                type="email"
                className="vnd-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="vnd-form-row">
              <label htmlFor="vnd-password">Password</label>
              <input
                id="vnd-password"
                type="password"
                className="vnd-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="vnd-btn vnd-btn-primary" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="vnd-auth-footer">
            New seller? <Link to="/vendor/register">Register your shop</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
