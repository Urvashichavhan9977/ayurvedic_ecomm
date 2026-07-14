import { useState } from 'react'
import '../styles/Newsletter.css'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubscribed(true)
    setTimeout(() => {
      setSubscribed(false)
      setEmail('')
    }, 3000)
  }

  return (
    <section className="newsletter">
      <div className="container">
        <span className="eyebrow" style={{ color: 'var(--gold2)' }}>Stay Connected</span>
        <h2>Join the Wellness Circle</h2>
        <p>Get exclusive rituals, early offers &amp; Ayurvedic wisdom delivered to your inbox.</p>
        <form className="news-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email address"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <button type="submit" className="btn btn-gold" disabled={subscribed}>
            {subscribed ? '✓ Subscribed!' : 'Subscribe'}
          </button>
        </form>
        <p className="news-note">🔒 No spam. Unsubscribe anytime. We respect your privacy.</p>
      </div>
    </section>
  )
}