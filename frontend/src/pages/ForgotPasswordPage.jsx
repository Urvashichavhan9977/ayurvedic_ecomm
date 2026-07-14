import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api/authApi'
import '../styles/pages/Auth.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.message || 'Unable to send reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-section">
      <div className="container">
        <div className="auth-card">
          <h1>Forgot Password</h1>
          <p className="sub">We'll send a reset link to your email</p>

          {sent ? (
            <div className="auth-success">
              ✓ If an account exists for {email}, a reset link has been sent.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button
                type="submit"
                className="btn btn-green"
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p className="auth-foot-note">
            <Link to="/login">Back to login</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
