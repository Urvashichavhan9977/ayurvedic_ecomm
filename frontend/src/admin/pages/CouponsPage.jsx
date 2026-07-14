import { useEffect, useState } from 'react'
import { couponsApi } from '../api/couponsApi'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import { IconAlert, IconEdit, IconTrash, IconPlus, IconSearch } from '../components/AdminIcons'

const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const toDateInputValue = (date) => {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function CouponFormModal({ initial, onClose, onSaved }) {
  const isEdit = Boolean(initial?._id)
  const [form, setForm] = useState(() => ({
    code: initial?.code || '',
    description: initial?.description || '',
    discountType: initial?.discountType || 'percentage',
    discountValue: initial?.discountValue ?? '',
    minPurchase: initial?.minPurchase ?? 0,
    maxDiscount: initial?.maxDiscount ?? '',
    expiryDate: toDateInputValue(initial?.expiryDate),
    usageLimit: initial?.usageLimit ?? '',
    isActive: initial?.isActive ?? true,
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.code.trim() || form.discountValue === '' || !form.expiryDate) {
      setError('Code, discount value, and expiry date are required.')
      return
    }
    if (form.discountType === 'percentage' && Number(form.discountValue) > 100) {
      setError('Percentage discount cannot exceed 100.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minPurchase: form.minPurchase === '' ? 0 : Number(form.minPurchase),
        maxDiscount: form.maxDiscount === '' ? null : Number(form.maxDiscount),
        expiryDate: form.expiryDate,
        usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
        isActive: form.isActive,
      }

      const res = isEdit
        ? await couponsApi.update(initial._id, payload)
        : await couponsApi.create(payload)
      onSaved(res.coupon)
    } catch (err) {
      setError(err.message || 'Failed to save coupon.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Coupon' : 'Add Coupon'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="coupon-form" className="adm-btn adm-btn-primary adm-btn-sm" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Coupon'}
          </button>
        </>
      }
    >
      {error && (
        <div className="adm-alert adm-alert-error">
          <IconAlert />
          <span>{error}</span>
        </div>
      )}

      <form id="coupon-form" onSubmit={handleSubmit}>
        <div className="adm-form-grid">
          <div className="adm-form-group">
            <label htmlFor="c-code">Coupon Code *</label>
            <input
              id="c-code"
              className="adm-input"
              value={form.code}
              onChange={(e) => set('code')({ target: { type: 'text', value: e.target.value.toUpperCase() } })}
              required
            />
          </div>

          <div className="adm-form-group">
            <label htmlFor="c-type">Discount Type *</label>
            <select id="c-type" className="adm-select" style={{ width: '100%' }} value={form.discountType} onChange={set('discountType')}>
              <option value="percentage">Percentage</option>
              <option value="flat">Flat Amount</option>
            </select>
          </div>

          <div className="adm-form-group adm-form-group-full">
            <label htmlFor="c-desc">Description</label>
            <input id="c-desc" className="adm-input" value={form.description} onChange={set('description')} />
          </div>

          <div className="adm-form-group">
            <label htmlFor="c-value">
              Discount Value {form.discountType === 'percentage' ? '(%)' : '(₹)'} *
            </label>
            <input id="c-value" type="number" min="0" step="0.01" className="adm-input" value={form.discountValue} onChange={set('discountValue')} required />
          </div>

          <div className="adm-form-group">
            <label htmlFor="c-max">Max Discount (₹)</label>
            <input id="c-max" type="number" min="0" step="0.01" className="adm-input" value={form.maxDiscount} onChange={set('maxDiscount')} placeholder="No cap" />
          </div>

          <div className="adm-form-group">
            <label htmlFor="c-min">Minimum Purchase (₹)</label>
            <input id="c-min" type="number" min="0" step="0.01" className="adm-input" value={form.minPurchase} onChange={set('minPurchase')} />
          </div>

          <div className="adm-form-group">
            <label htmlFor="c-usage">Usage Limit</label>
            <input id="c-usage" type="number" min="0" className="adm-input" value={form.usageLimit} onChange={set('usageLimit')} placeholder="Unlimited" />
          </div>

          <div className="adm-form-group">
            <label htmlFor="c-expiry">Expiry Date *</label>
            <input id="c-expiry" type="date" className="adm-input" value={form.expiryDate} onChange={set('expiryDate')} required />
          </div>

          <div className="adm-form-group">
            <label>Status</label>
            <label className="adm-checkbox-row" style={{ marginTop: '0.5rem' }}>
              <input type="checkbox" checked={form.isActive} onChange={set('isActive')} />
              Active
            </label>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, pages: 1, count: 0 })

  const [formTarget, setFormTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 15 }
      if (search) params.search = search
      if (statusFilter === 'active') params.isActive = true
      if (statusFilter === 'inactive') params.isActive = false

      const res = await couponsApi.list(params)
      setCoupons(res.coupons || [])
      setMeta({ total: res.total || 0, pages: res.pages || 1, count: (res.coupons || []).length })
    } catch (err) {
      setError(err.message || 'Failed to load coupons.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter])

  useEffect(() => {
    setPage(1)
    const t = setTimeout(() => load(), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const handleSaved = () => {
    setFormTarget(null)
    load()
  }

  const handleToggle = async (coupon) => {
    setTogglingId(coupon._id)
    try {
      const res = await couponsApi.toggleStatus(coupon._id)
      setCoupons((prev) => prev.map((c) => (c._id === coupon._id ? res.coupon : c)))
    } catch (err) {
      setError(err.message || 'Failed to update coupon status.')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      await couponsApi.remove(deleteTarget._id)
      setDeleteTarget(null)
      load()
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete coupon.')
    } finally {
      setDeleting(false)
    }
  }

  const isExpired = (coupon) => new Date(coupon.expiryDate) < new Date()

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h2>Coupons</h2>
          <p>{loading ? 'Create and manage discount coupons for your storefront.' : `${meta.total} total coupon${meta.total === 1 ? '' : 's'}`}</p>
        </div>
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
              placeholder="Search coupon code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="adm-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="adm-toolbar-right">
          <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setFormTarget({})}>
            <IconPlus width={16} height={16} /> Add Coupon
          </button>
        </div>
      </div>

      {loading ? (
        <div className="adm-card">
          <div className="adm-loading-cell">Loading coupons…</div>
        </div>
      ) : coupons.length === 0 ? (
        <div className="adm-card">
          <div className="adm-empty-state">No coupons match your filters.</div>
        </div>
      ) : (
        <>
          <div className="adm-coupon-grid">
            {coupons.map((c) => {
              const expired = isExpired(c)
              return (
                <div className={`adm-coupon-card${!c.isActive || expired ? ' is-inactive' : ''}`} key={c._id}>
                  <div className="adm-coupon-card-head">
                    <span className="adm-coupon-code">{c.code}</span>
                    <div className="adm-row-actions">
                      <button type="button" className="adm-icon-btn" onClick={() => setFormTarget(c)} aria-label="Edit">
                        <IconEdit width={15} height={15} />
                      </button>
                      <button
                        type="button"
                        className="adm-icon-btn adm-icon-danger"
                        onClick={() => {
                          setDeleteTarget(c)
                          setDeleteError('')
                        }}
                        aria-label="Delete"
                      >
                        <IconTrash width={15} height={15} />
                      </button>
                    </div>
                  </div>

                  {c.description && <p className="adm-coupon-desc">{c.description}</p>}

                  <div className="adm-coupon-badges">
                    <span className="adm-badge adm-badge-success">
                      {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `${currency(c.discountValue)} OFF`}
                    </span>
                    <span className="adm-badge adm-badge-info">
                      {c.minPurchase ? `Min ${currency(c.minPurchase)}` : 'No minimum'}
                    </span>
                    <span className="adm-badge adm-badge-muted">
                      {c.usedCount ?? 0}{c.usageLimit != null ? `/${c.usageLimit}` : ''} used
                    </span>
                    <button
                      type="button"
                      className={`adm-badge adm-badge-toggle ${expired ? 'adm-badge-danger' : c.isActive ? 'adm-badge-success' : 'adm-badge-muted'}`}
                      disabled={togglingId === c._id || expired}
                      onClick={() => handleToggle(c)}
                      title={expired ? 'Expired coupons cannot be reactivated' : c.isActive ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {expired ? 'Expired' : c.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <div className="adm-coupon-expiry">
                    Expires: {new Date(c.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="adm-card" style={{ marginTop: '1.25rem' }}>
            <Pagination page={page} pages={meta.pages} total={meta.total} count={meta.count} onPageChange={setPage} />
          </div>
        </>
      )}

      {formTarget !== null && (
        <CouponFormModal initial={formTarget} onClose={() => setFormTarget(null)} onSaved={handleSaved} />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Coupon"
          message={
            <>
              Are you sure you want to delete <strong>{deleteTarget.code}</strong>? This cannot be undone.
            </>
          }
          error={deleteError}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}