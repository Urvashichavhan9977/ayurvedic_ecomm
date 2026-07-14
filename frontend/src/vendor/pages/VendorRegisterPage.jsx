import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useVendorAuth } from '../context/VendorAuthContext'
import SellerAIHelper from '../components/SellerAIHelper'
import '../styles/vendor.css'

const INITIAL = {
  name: '',
  email: '',
  password: '',
  phone: '',
  shopName: '',
  shopDescription: '',
  gstNumber: '',
}

export default function VendorRegisterPage() {
  const { register } = useVendorAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)
    try {
      await register(form)
      navigate('/vendor/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="vnd-root">
      <div className="vnd-auth-wrap" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div className="vnd-auth-card" style={{ maxWidth: 560 }}>
          <div className="vnd-auth-logo">A</div>
          <h1 className="vnd-auth-title">Become a Seller</h1>
          <p className="vnd-auth-subtitle">Register your shop to start selling on Amrita Ayurveda</p>

          {error && <div className="vnd-alert vnd-alert-error">{error}</div>}
          <div className="vnd-alert vnd-alert-info">
            Your application will be reviewed by our team before your products go live.
          </div>

          <form onSubmit={handleSubmit}>
            <div className="vnd-form-grid">
              <div className="vnd-form-row">
                <label htmlFor="vnd-r-name">Your Name</label>
                <input id="vnd-r-name" className="vnd-input" value={form.name} onChange={update('name')} required />
              </div>
              <div className="vnd-form-row">
                <label htmlFor="vnd-r-phone">Phone</label>
                <input id="vnd-r-phone" className="vnd-input" value={form.phone} onChange={update('phone')} />
              </div>
            </div>

            <div className="vnd-form-row">
              <label htmlFor="vnd-r-email">Email</label>
              <input
                id="vnd-r-email"
                type="email"
                className="vnd-input"
                value={form.email}
                onChange={update('email')}
                required
              />
            </div>

            <div className="vnd-form-row">
              <label htmlFor="vnd-r-password">Password</label>
              <input
                id="vnd-r-password"
                type="password"
                className="vnd-input"
                value={form.password}
                onChange={update('password')}
                required
                minLength={6}
              />
            </div>

            <div className="vnd-form-row">
              <label htmlFor="vnd-r-shop">Shop Name</label>
              <input
                id="vnd-r-shop"
                className="vnd-input"
                value={form.shopName}
                onChange={update('shopName')}
                required
              />
            </div>

            <div className="vnd-form-row">
              <label htmlFor="vnd-r-desc">Shop Description (optional)</label>
              <textarea
                id="vnd-r-desc"
                className="vnd-textarea"
                value={form.shopDescription}
                onChange={update('shopDescription')}
              />
            </div>

            <div className="vnd-form-row">
              <label htmlFor="vnd-r-gst">GST Number (optional)</label>
              <input id="vnd-r-gst" className="vnd-input" value={form.gstNumber} onChange={update('gstNumber')} />
            </div>

            <button type="submit" className="vnd-btn vnd-btn-primary" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Vendor Account'}
            </button>
          </form>

          <p className="vnd-auth-footer">
            Already a seller? <Link to="/vendor/login">Sign in</Link>
          </p>
        </div>

        <SellerAIHelper />
      </div>
    </div>
  )
}
