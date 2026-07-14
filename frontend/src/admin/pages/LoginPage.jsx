import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import '../styles/pages/Auth.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')

  const goAfterLogin = () => navigate(redirect ? `/${redirect.replace(/^\/+/, '')}` : '/admin/dashboard')

  const handleLogin = (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setError('')
    login({ email })
    goAfterLogin()
  }

  return (
    <section className="auth-section">
      <div className="container">
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p className="sub">Sign in to track orders, wishlist & addresses</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-green" style={{ width: '100%', marginTop: '.5rem' }}>Sign In</button>
            <p className="auth-foot-note">
              <Link to="/forgot-password">Forgot password?</Link> · <Link to="/signup">Create account</Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}