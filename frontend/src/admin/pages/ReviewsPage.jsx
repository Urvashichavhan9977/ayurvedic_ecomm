import { useEffect, useRef, useState } from 'react'
import { reviewsApi } from '../api/reviewsApi'
import { productsApi } from '../api/productsApi'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import { IconAlert, IconTrash, IconSearch, IconStar, IconReviews, IconEye, IconEyeOff, IconEdit, IconPlus } from '../components/AdminIcons'

const StarPicker = ({ value, onChange }) => (
  <span className="adm-star-rating adm-star-picker">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        type="button"
        key={n}
        className={`adm-star-btn${n <= value ? ' active' : ''}`}
        onClick={() => onChange(n)}
        aria-label={`${n} star${n > 1 ? 's' : ''}`}
      >
        {n <= value ? '★' : '☆'}
      </button>
    ))}
  </span>
)

/** Product search/picker used by the "Add Review" form — debounced search against the admin products list. */
function ProductPicker({ value, onChange }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const res = await productsApi.listAdmin({ search: query.trim(), limit: 8 })
        setResults(res.products || res.data || [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    const handleClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="adm-product-picker" ref={boxRef}>
      <input
        className="adm-input"
        placeholder="Search product by name…"
        value={value ? value.name : query}
        onChange={(e) => { onChange(null); setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && (query.trim() || searching) && !value && (
        <div className="adm-product-picker-list">
          {searching && <div className="adm-product-picker-empty">Searching…</div>}
          {!searching && results.length === 0 && <div className="adm-product-picker-empty">No products found.</div>}
          {!searching && results.map((p) => (
            <button
              type="button"
              key={p._id || p.id}
              className="adm-product-picker-item"
              onClick={() => { onChange(p); setQuery(''); setOpen(false) }}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const Stars = ({ rating }) => (
  <span className="adm-star-rating">
    {'★'.repeat(rating)}
    {'☆'.repeat(5 - rating)}
  </span>
)

function StatCard({ icon: Icon, tone, label, value, sub }) {
  return (
    <div className="adm-stat-card">
      <span className={`adm-stat-icon ${tone}`}><Icon /></span>
      <div className="adm-stat-body">
        <span>{label}</span>
        <strong>{value}</strong>
        {sub && <span className="adm-stat-sub">{sub}</span>}
      </div>
    </div>
  )
}

/** Small approve/unapprove switch shared by the table row and the mobile card. */
function ApproveSwitch({ review, busy, onToggle }) {
  return (
    <label className="adm-switch" title={review.isApproved ? 'Approved — visible on storefront' : 'Pending — hidden from storefront'}>
      <input
        type="checkbox"
        checked={review.isApproved}
        disabled={busy}
        onChange={() => onToggle(review)}
      />
      <span className="adm-switch-track" />
    </label>
  )
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('') // '', 'true', 'false'
  const [ratingFilter, setRatingFilter] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, pages: 1, count: 0 })

  const [approvingId, setApprovingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [viewTarget, setViewTarget] = useState(null)
  const [lightboxSrc, setLightboxSrc] = useState(null)

  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, avgRating: 0 })

  // ── Add / Edit review form ──────────────────────────────────────
  const [formMode, setFormMode] = useState(null) // null | 'add' | 'edit'
  const [formTarget, setFormTarget] = useState(null) // review being edited (edit mode only)
  const [formProduct, setFormProduct] = useState(null) // selected product (add mode only)
  const [formRating, setFormRating] = useState(5)
  const [formTitle, setFormTitle] = useState('')
  const [formComment, setFormComment] = useState('')
  const [formApproved, setFormApproved] = useState(true)
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const openAddForm = () => {
    setFormMode('add')
    setFormTarget(null)
    setFormProduct(null)
    setFormRating(5)
    setFormTitle('')
    setFormComment('')
    setFormApproved(true)
    setFormError('')
  }

  const openEditForm = (review) => {
    setFormMode('edit')
    setFormTarget(review)
    setFormProduct(null)
    setFormRating(review.rating)
    setFormTitle(review.title || '')
    setFormComment(review.comment || '')
    setFormApproved(review.isApproved)
    setFormError('')
  }

  const closeForm = () => {
    setFormMode(null)
    setFormTarget(null)
  }

  const handleSaveForm = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!formRating) return setFormError('Please select a star rating.')
    if (!formComment.trim()) return setFormError('Please write a comment for the review.')

    setFormSaving(true)
    try {
      if (formMode === 'add') {
        if (!formProduct) { setFormError('Please select a product.'); setFormSaving(false); return }
        await reviewsApi.create(formProduct._id || formProduct.id, {
          rating: formRating,
          title: formTitle.trim(),
          comment: formComment.trim(),
        })
      } else if (formMode === 'edit' && formTarget) {
        const res = await reviewsApi.update(formTarget._id, {
          rating: formRating,
          title: formTitle.trim(),
          comment: formComment.trim(),
          isApproved: formApproved,
        })
        setReviews((prev) => prev.map((r) => (r._id === formTarget._id ? res.review : r)))
      }
      closeForm()
      load()
      loadStats()
    } catch (err) {
      setFormError(err.message || 'Failed to save review.')
    } finally {
      setFormSaving(false)
    }
  }

  const loadStats = async () => {
    try {
      const [all, approved, pending] = await Promise.all([
        reviewsApi.list({ limit: 1 }),
        reviewsApi.list({ limit: 100, isApproved: 'true' }),
        reviewsApi.list({ limit: 1, isApproved: 'false' }),
      ])
      const approvedReviews = approved.reviews || []
      const avgRating = approvedReviews.length > 0
        ? approvedReviews.reduce((s, r) => s + r.rating, 0) / approvedReviews.length
        : 0
      setStats({ total: all.total || 0, approved: approved.total || 0, pending: pending.total || 0, avgRating })
    } catch {
      // Non-critical — stat cards simply stay at their previous values.
    }
  }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 15 }
      if (search) params.search = search
      if (statusFilter) params.isApproved = statusFilter
      if (ratingFilter) params.rating = ratingFilter

      const res = await reviewsApi.list(params)
      setReviews(res.reviews || [])
      setMeta({ total: res.total || 0, pages: res.pages || 1, count: (res.reviews || []).length })
    } catch (err) {
      setError(err.message || 'Failed to load reviews.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, ratingFilter])

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    setPage(1)
    const t = setTimeout(() => load(), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const handleToggleApproval = async (review) => {
    setApprovingId(review._id)
    try {
      const res = await reviewsApi.setApproved(review._id, !review.isApproved)
      setReviews((prev) => prev.map((r) => (r._id === review._id ? res.review : r)))
      setViewTarget((prev) => (prev && prev._id === review._id ? res.review : prev))
      loadStats()
    } catch (err) {
      setError(err.message || 'Failed to update review status.')
    } finally {
      setApprovingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      await reviewsApi.remove(deleteTarget._id)
      setDeleteTarget(null)
      if (viewTarget && viewTarget._id === deleteTarget._id) setViewTarget(null)
      load()
      loadStats()
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete review.')
    } finally {
      setDeleting(false)
    }
  }

  const hasFilters = Boolean(search || statusFilter || ratingFilter)

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h2>Reviews</h2>
          <p>Moderate customer reviews — add, edit, approve, or remove them.</p>
        </div>
        <button type="button" className="adm-btn adm-btn-primary" onClick={openAddForm}>
          <IconPlus width={16} height={16} /> Add Review
        </button>
      </div>

      <div className="adm-stat-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard icon={IconReviews} tone="green" label="Total Reviews" value={stats.total} />
        <StatCard icon={IconEye} tone="gold" label="Approved" value={stats.approved} sub="Visible on storefront" />
        <StatCard icon={IconEyeOff} tone="warning" label="Pending" value={stats.pending} sub="Needs moderation" />
        <StatCard icon={IconStar} tone="muted" label="Avg. Rating" value={stats.avgRating ? stats.avgRating.toFixed(1) : '—'} sub="Across approved reviews" />
      </div>

      {error && (
        <div className="adm-alert adm-alert-error" style={{ marginBottom: '1.25rem' }}>
          <IconAlert />
          <span>{error}</span>
        </div>
      )}

      <div className="adm-toolbar">
        <div className="adm-toolbar-filters">
          <div className="adm-search-wrap">
            <span className="adm-search-icon"><IconSearch width={16} height={16} /></span>
            <input
              className="adm-input"
              placeholder="Search title or comment…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="adm-select" value={ratingFilter} onChange={(e) => { setRatingFilter(e.target.value); setPage(1) }}>
            <option value="">All Ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
        <div className="adm-toolbar-right">
          <div className="adm-tab-bar">
            <button type="button" className={`adm-tab-btn${statusFilter === '' ? ' active' : ''}`} onClick={() => { setStatusFilter(''); setPage(1) }}>
              All
            </button>
            <button type="button" className={`adm-tab-btn${statusFilter === 'false' ? ' active' : ''}`} onClick={() => { setStatusFilter('false'); setPage(1) }}>
              Pending
            </button>
            <button type="button" className={`adm-tab-btn${statusFilter === 'true' ? ' active' : ''}`} onClick={() => { setStatusFilter('true'); setPage(1) }}>
              Approved
            </button>
          </div>
        </div>
      </div>

      <div className="adm-card">
        {loading ? (
          <div className="adm-loading-cell">Loading reviews…</div>
        ) : reviews.length === 0 ? (
          <div className="adm-empty-state">
            {hasFilters ? 'No reviews match your filters.' : 'No reviews yet.'}
          </div>
        ) : (
          <>
            {/* ── Desktop / tablet: table view ───────────────────── */}
            <div className="adm-table-wrap adm-reviews-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Customer</th>
                    <th>Rating</th>
                    <th>Review</th>
                    <th>Photos</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r._id}>
                      <td className="adm-table-cell-muted">{r.product?.name || '—'}</td>
                      <td>
                        <div>{r.user?.name || 'Deleted user'}</div>
                        {r.isVerifiedPurchase && <span className="adm-badge adm-badge-success">Verified</span>}
                      </td>
                      <td><Stars rating={r.rating} /></td>
                      <td style={{ maxWidth: 320 }}>
                        {r.title && <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{r.title}</div>}
                        <div className="adm-review-comment-clip">{r.comment}</div>
                      </td>
                      <td>
                        {r.images?.length > 0 ? (
                          <div style={{ display: 'flex', gap: '.3rem' }}>
                            {r.images.slice(0, 3).map((src, i) => (
                              <img
                                key={i}
                                src={src}
                                alt=""
                                className="adm-review-thumb"
                                onClick={() => setLightboxSrc(src)}
                              />
                            ))}
                            {r.images.length > 3 && (
                              <span style={{ fontSize: '.72rem', color: 'var(--adm-muted)' }}>+{r.images.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '.75rem', color: 'var(--adm-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <ApproveSwitch review={r} busy={approvingId === r._id} onToggle={handleToggleApproval} />
                      </td>
                      <td>
                        <div className="adm-row-actions">
                          <button
                            type="button"
                            className="adm-icon-btn"
                            onClick={() => setViewTarget(r)}
                            aria-label="View review"
                          >
                            <IconEye width={16} height={16} />
                          </button>
                          <button
                            type="button"
                            className="adm-icon-btn"
                            onClick={() => openEditForm(r)}
                            aria-label="Edit review"
                          >
                            <IconEdit width={16} height={16} />
                          </button>
                          <button
                            type="button"
                            className="adm-icon-btn adm-icon-danger"
                            onClick={() => {
                              setDeleteTarget(r)
                              setDeleteError('')
                            }}
                            aria-label="Delete"
                          >
                            <IconTrash width={16} height={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile: stacked card view ───────────────────────── */}
            <div className="adm-review-cards">
              {reviews.map((r) => (
                <div className="adm-review-card" key={r._id}>
                  <div className="adm-review-card-top">
                    <div className="adm-review-card-heading">
                      <span className="adm-review-card-product">{r.product?.name || '—'}</span>
                      <Stars rating={r.rating} />
                    </div>
                    <span className={`adm-badge ${r.isApproved ? 'adm-badge-success' : 'adm-badge-warning'}`}>
                      {r.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>

                  <div className="adm-review-card-user">
                    <span>{r.user?.name || 'Deleted user'}</span>
                    {r.isVerifiedPurchase && <span className="adm-badge adm-badge-success">Verified</span>}
                  </div>

                  {r.title && <div className="adm-review-card-title">{r.title}</div>}
                  <div className="adm-review-comment-clip adm-review-card-comment">{r.comment}</div>

                  {r.images?.length > 0 && (
                    <div className="adm-review-card-photos">
                      {r.images.slice(0, 4).map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt=""
                          className="adm-review-thumb"
                          onClick={() => setLightboxSrc(src)}
                        />
                      ))}
                      {r.images.length > 4 && (
                        <span className="adm-review-card-more">+{r.images.length - 4}</span>
                      )}
                    </div>
                  )}

                  <div className="adm-review-card-footer">
                    <label className="adm-review-card-approve">
                      <ApproveSwitch review={r} busy={approvingId === r._id} onToggle={handleToggleApproval} />
                      <span>{r.isApproved ? 'Approved' : 'Approve'}</span>
                    </label>
                    <div className="adm-row-actions">
                      <button type="button" className="adm-icon-btn" onClick={() => setViewTarget(r)} aria-label="View review">
                        <IconEye width={16} height={16} />
                      </button>
                      <button type="button" className="adm-icon-btn" onClick={() => openEditForm(r)} aria-label="Edit review">
                        <IconEdit width={16} height={16} />
                      </button>
                      <button
                        type="button"
                        className="adm-icon-btn adm-icon-danger"
                        onClick={() => { setDeleteTarget(r); setDeleteError('') }}
                        aria-label="Delete"
                      >
                        <IconTrash width={16} height={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Pagination page={page} pages={meta.pages} total={meta.total} count={meta.count} onPageChange={setPage} />
      </div>

      {viewTarget && (
        <Modal
          title="Review Details"
          onClose={() => setViewTarget(null)}
          footer={
            <button type="button" className="adm-btn adm-btn-outline" onClick={() => { openEditForm(viewTarget); setViewTarget(null) }}>
              <IconEdit width={15} height={15} /> Edit Review
            </button>
          }
        >
          <div className="adm-review-detail">
            <div className="adm-review-detail-row">
              <span className="adm-review-detail-label">Product</span>
              <span>{viewTarget.product?.name || '—'}</span>
            </div>
            <div className="adm-review-detail-row">
              <span className="adm-review-detail-label">Customer</span>
              <span>
                {viewTarget.user?.name || 'Deleted user'}{' '}
                {viewTarget.isVerifiedPurchase && <span className="adm-badge adm-badge-success">Verified</span>}
              </span>
            </div>
            <div className="adm-review-detail-row">
              <span className="adm-review-detail-label">Rating</span>
              <Stars rating={viewTarget.rating} />
            </div>
            {viewTarget.title && (
              <div className="adm-review-detail-row">
                <span className="adm-review-detail-label">Title</span>
                <span style={{ fontWeight: 700 }}>{viewTarget.title}</span>
              </div>
            )}
            <div className="adm-review-detail-row adm-review-detail-comment">
              <span className="adm-review-detail-label">Comment</span>
              <p>{viewTarget.comment}</p>
            </div>
            {viewTarget.images?.length > 0 && (
              <div className="adm-review-detail-row">
                <span className="adm-review-detail-label">Photos</span>
                <div className="adm-review-detail-photos">
                  {viewTarget.images.map((src, i) => (
                    <img key={i} src={src} alt="" onClick={() => setLightboxSrc(src)} />
                  ))}
                </div>
              </div>
            )}
            <div className="adm-review-detail-row">
              <span className="adm-review-detail-label">Status</span>
              <label className="adm-review-card-approve">
                <ApproveSwitch review={viewTarget} busy={approvingId === viewTarget._id} onToggle={handleToggleApproval} />
                <span>{viewTarget.isApproved ? 'Approved — visible on storefront' : 'Pending — not visible yet'}</span>
              </label>
            </div>
          </div>
        </Modal>
      )}

      {lightboxSrc && (
        <div className="adm-review-lightbox" onClick={() => setLightboxSrc(null)}>
          <img src={lightboxSrc} alt="" />
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Review"
          message="Are you sure you want to permanently delete this review? This cannot be undone."
          error={deleteError}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {formMode && (
        <Modal title={formMode === 'add' ? 'Add Review' : 'Edit Review'} onClose={closeForm}>
          <form className="adm-form" onSubmit={handleSaveForm}>
            {formError && (
              <div className="adm-alert adm-alert-error" style={{ marginBottom: '1rem' }}>
                <IconAlert />
                <span>{formError}</span>
              </div>
            )}

            {formMode === 'add' && (
              <div className="adm-form-group">
                <label>Product *</label>
                <ProductPicker value={formProduct} onChange={setFormProduct} />
              </div>
            )}

            {formMode === 'edit' && formTarget && (
              <div className="adm-form-group">
                <label>Product</label>
                <div className="adm-form-static">{formTarget.product?.name || '—'}</div>
              </div>
            )}

            <div className="adm-form-group">
              <label>Rating *</label>
              <StarPicker value={formRating} onChange={setFormRating} />
            </div>

            <div className="adm-form-group">
              <label htmlFor="rv-adm-title">Title</label>
              <input
                id="rv-adm-title"
                className="adm-input"
                maxLength={120}
                placeholder="Sum up the review"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            <div className="adm-form-group">
              <label htmlFor="rv-adm-comment">Comment *</label>
              <textarea
                id="rv-adm-comment"
                className="adm-input"
                rows={4}
                maxLength={1000}
                placeholder="What the customer said about the product…"
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
              />
            </div>

            {formMode === 'edit' && (
              <div className="adm-form-group">
                <label className="adm-review-card-approve">
                  <span className="adm-switch">
                    <input type="checkbox" checked={formApproved} onChange={(e) => setFormApproved(e.target.checked)} />
                    <span className="adm-switch-track" />
                  </span>
                  <span>{formApproved ? 'Approved — visible on storefront' : 'Pending — hidden from storefront'}</span>
                </label>
              </div>
            )}

            <div className="adm-modal-footer" style={{ padding: 0, marginTop: '0.5rem' }}>
              <button type="button" className="adm-btn adm-btn-outline" onClick={closeForm} disabled={formSaving}>Cancel</button>
              <button type="submit" className="adm-btn adm-btn-primary" disabled={formSaving}>
                {formSaving ? 'Saving…' : formMode === 'add' ? 'Add Review' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}