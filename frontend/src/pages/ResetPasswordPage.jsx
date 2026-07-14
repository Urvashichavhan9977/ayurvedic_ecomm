import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/pages/Auth.css'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setError('')
    navigate('/login')
  }

  return (
    <section className="auth-section">
      <div className="container">
        <div className="auth-card">
          <h1>Reset Password</h1>
          <p className="sub">Choose a new password for your account</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="password">New Password</label>
              <input id="password" type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="confirm">Confirm Password</label>
              <input id="confirm" type="password" minLength={6} value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-green" style={{ width: '100%' }}>Update Password</button>
          </form>
        </div>
      </div>
    </section>
  )
}
