import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { authApi } from '../api/authApi'
import '../styles/pages/Auth.css'

export default function LoginPage() {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login, loginWithPassword, loginWithOtp } = useAuth()
  const navigate = useNavigate()

  // Admin/superadmin accounts always land on the admin panel. Regular
  // users always land on the home page after logging in.
  const goAfterLogin = (role) => {
    if (role === 'admin' || role === 'superadmin') {
      navigate('/admin/dashboard')
      return
    }
    navigate('/')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await loginWithPassword(email, password)
      goAfterLogin(res.role)
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendOtp = async () => {
    if (!identifier) {
      setError('Enter your email first.')
      return
    }
    if (!identifier.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      await authApi.sendOtp(identifier)
      setOtpSent(true)
    } catch (err) {
      setError(err.message || 'Unable to send OTP. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOtpLogin = async (e) => {
    e.preventDefault()
    if (!otp || otp.length < 4) {
      setError('Please enter the OTP sent to you.')
      return
    }
    setError('')
    setSubmitting(true)

    try {
      const res = await loginWithOtp(identifier, otp)
      goAfterLogin(res.role)
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-section">
      <div className="container">
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p className="sub">Sign in to track orders, wishlist & addresses</p>

          <div className="auth-tabs">
            <button className={tab === 'login' ? 'active' : ''} onClick={() => { setTab('login'); setError('') }}>Login</button>
            <button className={tab === 'otp' ? 'active' : ''} onClick={() => { setTab('otp'); setError('') }}>OTP Login</button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-green" style={{ width: '100%', marginTop: '.5rem' }} disabled={submitting}>
                {submitting ? 'Signing in…' : 'Sign In'}
              </button>
              <p className="auth-foot-note">
                <Link to="/forgot-password">Forgot password?</Link> · <Link to="/signup">Create account</Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleOtpLogin}>
              <div className="field">
                <label htmlFor="identifier">Email</label>
                <input
                  id="identifier"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>
              {!otpSent ? (
                <button type="button" className="btn btn-outline" style={{ width: '100%' }} onClick={handleSendOtp}>
                  Send OTP
                </button>
              ) : (
                <>
                  <div className="auth-success">✓ OTP sent! Check your email for the code.</div>
                  <div className="field">
                    <label htmlFor="otp">OTP</label>
                    <input id="otp" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-green" style={{ width: '100%' }}>Verify & Login</button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
