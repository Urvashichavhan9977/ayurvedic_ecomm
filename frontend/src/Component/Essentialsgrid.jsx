import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchActiveEssentials } from '../api/essentialsApi.js'
import '../styles/EssentialsGrid.css'

export default function EssentialsGrid() {
  // Pulled live from the admin panel's "Daily Essentials" page — no code
  // change needed there when the admin adds/edits/reorders tiles or
  // assigns products to them. Clicking a tile routes to /shop?essential=<id>
  // which the Shop page uses to show only that tile's assigned products.
  const [essentials, setEssentials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchActiveEssentials()
      .then(res => { if (!cancelled) setEssentials(res.essentials || []) })
      .catch(err => { if (!cancelled) setError(err.message || 'Could not load essentials right now.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (!loading && !error && essentials.length === 0) return null

  return (
    <section className="section bg-light">
      <div className="container">
        <div className="sec-head">
          <span className="eyebrow">Shop by Need</span>
          <h2>Daily Essentials</h2>
          <p>Curated collections for every wellness need</p>
        </div>

        {loading && (
          <div className="essentials-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="ess-card-skeleton" />
            ))}
          </div>
        )}

        {!loading && error && <p className="ess-state-msg ess-state-error">{error}</p>}

        {!loading && !error && (
          <div className="essentials-grid">
            {essentials.map(item => (
              <Link
                key={item._id}
                to={`/shop?essential=${item._id}&essentialTitle=${encodeURIComponent(item.title)}`}
                className="ess-card"
              >
                <div className="ess-bg" style={{ backgroundImage: `url('${item.image}')` }} />
                <div className="ess-overlay" style={{ background: item.overlay }} />
                <div className="ess-content">
                  {item.tag && <span className="ess-tag">{item.tag}</span>}
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  <span className="ess-cta">Shop Now →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}