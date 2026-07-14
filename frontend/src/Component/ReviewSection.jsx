import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { reviewsApi } from '../api/reviewsApi.js'
import '../styles/pages/review.css'

const MAX_IMAGES = 4
const MAX_IMAGE_DIM = 900

/** Resizes/compresses an uploaded image file client-side and returns a base64 data-URL. */
function fileToCompressedDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read image.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not load image.'))
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

function StarRow({ value, size = 16, onRate }) {
  const interactive = typeof onRate === 'function'
  return (
    <span className={`rv-stars${interactive ? ' rv-stars-interactive' : ''}`} style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          role={interactive ? 'button' : undefined}
          tabIndex={interactive ? 0 : undefined}
          aria-label={interactive ? `Rate ${n} star${n > 1 ? 's' : ''}` : undefined}
          onClick={interactive ? () => onRate(n) : undefined}
          onKeyDown={interactive ? (e) => (e.key === 'Enter' || e.key === ' ') && onRate(n) : undefined}
        >
          {n <= value ? '★' : '☆'}
        </span>
      ))}
    </span>
  )
}

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?'
}

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest', label: 'Lowest Rated' },
]

export default function ReviewSection({ productId, initialAverage = 0, initialCount = 0 }) {
  const { isAuthenticated } = useAuth()

  const [reviews, setReviews] = useState([])
  const [breakdown, setBreakdown] = useState([])
  const [total, setTotal] = useState(initialCount)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [sort, setSort] = useState('newest')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [lightbox, setLightbox] = useState(null)

  const load = async (targetPage = 1, append = false) => {
    if (!productId) return
    setLoading(true)
    setLoadError('')
    try {
      const res = await reviewsApi.getForProduct(productId, { sort, page: targetPage, limit: 6 })
      setReviews((prev) => (append ? [...prev, ...(res.reviews || [])] : res.reviews || []))
      setTotal(res.total ?? 0)
      setPages(res.pages ?? 1)
      setPage(res.page ?? targetPage)
      setBreakdown(res.ratingBreakdown || [])
    } catch (err) {
      setLoadError(err.message || 'Could not load reviews.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, sort])

  const countFor = (star) => breakdown.find((b) => b._id === star)?.count || 0
  const avgFromBreakdown = total > 0
    ? breakdown.reduce((sum, b) => sum + b._id * b.count, 0) / total
    : initialAverage

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_IMAGES - images.length)
    e.target.value = ''
    if (files.length === 0) return
    setUploading(true)
    setFormError('')
    try {
      const compressed = await Promise.all(files.map(fileToCompressedDataUrl))
      setImages((prev) => [...prev, ...compressed].slice(0, MAX_IMAGES))
    } catch (err) {
      setFormError(err.message || 'Could not attach photo.')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx))

  const resetForm = () => {
    setRating(0)
    setTitle('')
    setComment('')
    setImages([])
    setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!rating) return setFormError('Please select a star rating.')
    if (!comment.trim()) return setFormError('Please write a few words about the product.')

    setSubmitting(true)
    try {
      const res = await reviewsApi.create(productId, { rating, title: title.trim(), comment: comment.trim(), images })
      setReviews((prev) => [res.review, ...prev])
      setTotal((t) => t + 1)
      setBreakdown((prev) => {
        const next = [...prev]
        const idx = next.findIndex((b) => b._id === rating)
        if (idx >= 0) next[idx] = { ...next[idx], count: next[idx].count + 1 }
        else next.push({ _id: rating, count: 1 })
        return next
      })
      resetForm()
      setShowForm(false)
      setSuccessMsg('Thanks! Your review has been posted.')
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setFormError(err.message || 'Could not submit your review.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="section bg-light rv-section">
      <div className="container">
        <div className="sec-head">
          <span className="eyebrow">Verified Feedback</span>
          <h2>Customer Reviews</h2>
        </div>

        <div className="rv-layout">
          {/* Summary column */}
          <div className="rv-summary">
            <div className="rv-summary-score">
              <strong>{avgFromBreakdown ? avgFromBreakdown.toFixed(1) : '0.0'}</strong>
              <StarRow value={Math.round(avgFromBreakdown)} size={18} />
              <span>{total} review{total === 1 ? '' : 's'}</span>
            </div>
            <div className="rv-summary-bars">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = countFor(star)
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div className="rv-bar-row" key={star}>
                    <span className="rv-bar-label">{star}★</span>
                    <span className="rv-bar-track"><span className="rv-bar-fill" style={{ width: `${pct}%` }} /></span>
                    <span className="rv-bar-count">{count}</span>
                  </div>
                )
              })}
            </div>

            {isAuthenticated ? (
              <button type="button" className="btn btn-green rv-write-btn" onClick={() => setShowForm((s) => !s)}>
                {showForm ? 'Cancel' : '✍️ Write a Review'}
              </button>
            ) : (
              <p className="rv-login-hint">
                <Link to="/login">Log in</Link> to share your experience with this product.
              </p>
            )}
            {successMsg && <div className="rv-success">{successMsg}</div>}
          </div>

          {/* Reviews + form column */}
          <div className="rv-content">
            {showForm && isAuthenticated && (
              <form className="rv-form" onSubmit={handleSubmit}>
                <h3>Share Your Experience</h3>
                {formError && <div className="rv-form-error">{formError}</div>}

                <div className="rv-form-group">
                  <label>Your Rating *</label>
                  <StarRow value={rating} size={26} onRate={setRating} />
                </div>

                <div className="rv-form-group">
                  <label htmlFor="rv-title">Review Title</label>
                  <input
                    id="rv-title"
                    type="text"
                    maxLength={120}
                    placeholder="Sum up your experience"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="rv-form-group">
                  <label htmlFor="rv-comment">Your Review *</label>
                  <textarea
                    id="rv-comment"
                    rows={4}
                    maxLength={1000}
                    placeholder="What did you like or dislike? How did it work for you?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                <div className="rv-form-group">
                  <label>Add Photos (optional, up to {MAX_IMAGES})</label>
                  <div className="rv-photo-row">
                    {images.map((src, i) => (
                      <div className="rv-photo-thumb" key={i}>
                        <img src={src} alt={`Upload ${i + 1}`} />
                        <button type="button" onClick={() => removeImage(i)} aria-label="Remove photo">✕</button>
                      </div>
                    ))}
                    {images.length < MAX_IMAGES && (
                      <label className="rv-photo-add">
                        {uploading ? '…' : '+'}
                        <input type="file" accept="image/*" multiple hidden onChange={handleFiles} disabled={uploading} />
                      </label>
                    )}
                  </div>
                </div>

                <button type="submit" className="btn btn-gold" disabled={submitting}>
                  {submitting ? 'Posting…' : 'Submit Review'}
                </button>
              </form>
            )}

            {loadError && <div className="rv-form-error">{loadError}</div>}

            <div className="rv-toolbar">
              <span>{total} review{total === 1 ? '' : 's'}</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {loading && reviews.length === 0 ? (
              <p className="rv-empty">Loading reviews…</p>
            ) : reviews.length === 0 ? (
              <p className="rv-empty">No reviews yet. Be the first to review this product!</p>
            ) : (
              <ul className="rv-list">
                {reviews.map((r) => (
                  <li className="rv-card" key={r._id}>
                    <div className="rv-card-head">
                      <span className="rv-avatar">{initials(r.user?.name)}</span>
                      <div>
                        <div className="rv-card-name">
                          {r.user?.name || 'Amrita Customer'}
                          {r.isVerifiedPurchase && <span className="rv-verified">✓ Verified Purchase</span>}
                        </div>
                        <div className="rv-card-meta">
                          <StarRow value={r.rating} size={13} />
                          <span>{formatDate(r.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    {r.title && <h4 className="rv-card-title">{r.title}</h4>}
                    <p className="rv-card-comment">{r.comment}</p>
                    {r.images?.length > 0 && (
                      <div className="rv-card-photos">
                        {r.images.map((src, i) => (
                          <img key={i} src={src} alt="" onClick={() => setLightbox(src)} />
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {page < pages && (
              <button type="button" className="btn btn-outline rv-load-more" onClick={() => load(page + 1, true)} disabled={loading}>
                {loading ? 'Loading…' : 'Load More Reviews'}
              </button>
            )}
          </div>
        </div>
      </div>

      {lightbox && (
        <div className="rv-lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Review" />
        </div>
      )}
    </section>
  )
}