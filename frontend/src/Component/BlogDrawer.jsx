import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchBlogPosts } from '../api/blogApi.js'
import '../styles/BlogDrawer.css'

const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export default function BlogDrawer({ open, onClose }) {
  const [activePost, setActivePost] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset to list view every time the drawer is closed
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setActivePost(null), 350)
      return () => clearTimeout(t)
    }
  }, [open])

  // Lock background scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Fetch posts fresh every time the drawer opens, so admin edits show up
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError('')
    fetchBlogPosts()
      .then(res => { if (!cancelled) setPosts(res.posts || []) })
      .catch(err => { if (!cancelled) setError(err.message || 'Could not load articles right now.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open])

  if (!open) return null

  return (
    <div className="blog-drawer-overlay" onClick={onClose}>
      <div className="blog-drawer-panel" onClick={e => e.stopPropagation()}>
        <div className="blog-drawer-header">
          {activePost ? (
            <button className="blog-back-btn" onClick={() => setActivePost(null)}>
              ← Back to all articles
            </button>
          ) : (
            <div className="blog-drawer-title">
              <span className="eyebrow">From Our Journal</span>
              <h2>Ayurvedic Herbs &amp; Wellness</h2>
            </div>
          )}
          <button className="blog-close-btn" aria-label="Close" onClick={onClose}>✕</button>
        </div>

        <div className="blog-drawer-body">
          {!activePost && (
            <div className="blog-list fade-slide">
              {loading && (
                <div className="blog-state-msg">Loading articles…</div>
              )}
              {!loading && error && (
                <div className="blog-state-msg blog-state-error">{error}</div>
              )}
              {!loading && !error && posts.length === 0 && (
                <div className="blog-state-msg">No articles yet. Check back soon!</div>
              )}
              {!loading && !error && posts.map(post => (
                <button
                  key={post._id}
                  className="blog-list-item"
                  onClick={() => setActivePost(post)}
                >
                  <div className="blog-thumb">
                    <img src={post.img} alt={post.title} loading="lazy" />
                  </div>
                  <div className="blog-item-info">
                    <span className="blog-tag">{post.tag}</span>
                    <h3>{post.title}</h3>
                    <p>{post.excerpt}</p>
                    <span className="blog-read-time">{post.readTime}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {activePost && (
            <article className="blog-detail fade-slide">
              <div className="blog-detail-hero">
                <img src={activePost.img} alt={activePost.title} />
              </div>
              <span className="blog-tag">{activePost.tag}</span>
              <h1>{activePost.title}</h1>
              <span className="blog-read-time">{activePost.readTime}</span>

              {(activePost.content || []).map((para, i) => (
                <p key={i}>{para}</p>
              ))}

              {activePost.product && (
                <Link
                  to={`/product/${activePost.product.slug}`}
                  className="blog-shop-card"
                  onClick={onClose}
                >
                  {activePost.product.images?.[0] && (
                    <img src={activePost.product.images[0]} alt={activePost.product.name} />
                  )}
                  <div className="blog-shop-card-info">
                    <span className="blog-shop-card-label">Featured in this article</span>
                    <strong>{activePost.product.name}</strong>
                    {activePost.product.price != null && <span className="blog-shop-card-price">{currency(activePost.product.price)}</span>}
                  </div>
                  <span className="blog-shop-card-cta">Shop Now →</span>
                </Link>
              )}

              <div className="blog-detail-footer">
                <p className="blog-disclaimer">
                  This content is for general wellness information and does not replace advice from a qualified Ayurvedic practitioner or doctor.
                </p>
              </div>
            </article>
          )}
        </div>
      </div>
    </div>
  )
}
