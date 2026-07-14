import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import '../styles/pages/Auth.css'

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [showOtp, setShowOtp] = useState(false)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  // Actually creates the account on the backend. The OTP step below is
  // just a UX confirmation screen — the account (and login session) is
  // already created at this point, so refreshing/closing after this step
  // does not lose the account the way the old demo-only flow did.
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await register(form.name, form.email, form.password, form.phone)
      setShowOtp(true)
    } catch (err) {
      setError(err.message || 'Unable to create account. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerify = () => {
    if (!otp || otp.length < 4) {
      setError('Please enter the OTP sent to your email.')
      return
    }
    setError('')
    navigate('/profile')
  }

  return (
    <section className="auth-section">
      <div className="container">
        <div className="auth-card">
          <h1>Create Account</h1>
          <p className="sub">Join Amrita for exclusive offers & faster checkout</p>

          {error && <div className="auth-error">{error}</div>}

          {!showOtp ? (
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="name">Full Name</label>
                <input id="name" name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" minLength={6} value={form.password} onChange={handleChange} required />
              </div>
              <button type="submit" className="btn btn-green" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          ) : (
            <div>
              <div className="auth-success">✓ OTP sent to {form.email || 'your email'} (Demo: enter any 4+ digits)</div>
              <div className="field">
                <label htmlFor="verifyOtp">Enter OTP sent to email</label>
                <input id="verifyOtp" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} />
              </div>
              <button type="button" className="btn btn-gold" style={{ width: '100%' }} onClick={handleVerify}>
                Verify Email
              </button>
            </div>
          )}

          <p className="auth-foot-note">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
