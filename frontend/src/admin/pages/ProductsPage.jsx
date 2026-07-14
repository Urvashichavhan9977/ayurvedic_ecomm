import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { productsApi } from '../api/productsApi'
import { categoriesApi } from '../api/categoriesApi'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import { IconAlert, IconEdit, IconTrash, IconPlus, IconSearch, IconEye, IconEyeOff, IconBox } from '../components/AdminIcons'

const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const BADGE_TYPES = [
  { value: '', label: 'None' },
  { value: 'red', label: 'Red' },
  { value: 'gold', label: 'Gold' },
]

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

function ProductFormModal({ initial, categories, onClose, onSaved }) {
  const isEdit = Boolean(initial?._id)
  const [form, setForm] = useState(() => ({
    name: initial?.name || '',
    category: initial?.category?._id || initial?.category || '',
    price: initial?.price ?? '',
    oldPrice: initial?.oldPrice ?? '',
    stock: initial?.stock ?? 0,
    sku: initial?.sku || '',
    badge: initial?.badge || '',
    badgeType: initial?.badgeType || '',
    shortDescription: initial?.shortDescription || '',
    description: initial?.description || '',
    images: (initial?.images || []).join(', '),
    ingredients: (initial?.ingredients || []).join(', '),
    benefits: (initial?.benefits || []).join(', '),
    isFeatured: initial?.isFeatured ?? false,
    isBestSeller: initial?.isBestSeller ?? false,
    isNewArrival: initial?.isNewArrival ?? false,
    isTrending: initial?.isTrending ?? false,
    isActive: initial?.isActive ?? true,
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
  }

  const imageUrls = form.images.split(',').map((s) => s.trim()).filter(Boolean)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) return setError('Product name is required.')
    if (!form.category) return setError('Please select a category.')
    if (form.price === '' || Number(form.price) < 0) return setError('Enter a valid price.')
    if (!form.description.trim()) return setError('Description is required.')
    if (imageUrls.length === 0) return setError('At least one image URL is required.')

    const payload = {
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      oldPrice: form.oldPrice === '' ? null : Number(form.oldPrice),
      stock: Number(form.stock) || 0,
      sku: form.sku.trim() || undefined,
      badge: form.badge.trim(),
      badgeType: form.badgeType,
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      images: imageUrls,
      ingredients: form.ingredients.split(',').map((s) => s.trim()).filter(Boolean),
      benefits: form.benefits.split(',').map((s) => s.trim()).filter(Boolean),
      isFeatured: form.isFeatured,
      isBestSeller: form.isBestSeller,
      isNewArrival: form.isNewArrival,
      isTrending: form.isTrending,
      isActive: form.isActive,
    }

    setSaving(true)
    try {
      const res = isEdit
        ? await productsApi.update(initial._id, payload)
        : await productsApi.create(payload)
      onSaved(res.product)
    } catch (err) {
      setError(err.message || 'Failed to save product.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Product' : 'Add Product'}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="product-form" className="adm-btn adm-btn-primary adm-btn-sm" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
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

      <form id="product-form" onSubmit={handleSubmit}>
        <div className="adm-form-grid">
          <div className="adm-form-group adm-form-group-full">
            <label>Product Name *</label>
            <input className="adm-input" value={form.name} onChange={set('name')} maxLength={150} required />
          </div>

          <div className="adm-form-group">
            <label>Category *</label>
            <select className="adm-select" style={{ width: '100%' }} value={form.category} onChange={set('category')} required>
              <option value="">-- Select --</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="adm-form-group">
            <label>SKU</label>
            <input className="adm-input" value={form.sku} onChange={set('sku')} placeholder="Auto if left blank" />
          </div>

          <div className="adm-form-group">
            <label>Price (₹) *</label>
            <input type="number" min="0" className="adm-input" value={form.price} onChange={set('price')} required />
          </div>
          <div className="adm-form-group">
            <label>Old / MRP Price (₹)</label>
            <input type="number" min="0" className="adm-input" value={form.oldPrice} onChange={set('oldPrice')} />
          </div>
          <div className="adm-form-group">
            <label>Stock *</label>
            <input type="number" min="0" className="adm-input" value={form.stock} onChange={set('stock')} required />
          </div>

          <div className="adm-form-group">
            <label>Badge Text</label>
            <input className="adm-input" value={form.badge} onChange={set('badge')} placeholder="e.g. Bestseller" />
          </div>
          <div className="adm-form-group">
            <label>Badge Color</label>
            <select className="adm-select" style={{ width: '100%' }} value={form.badgeType} onChange={set('badgeType')}>
              {BADGE_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>

          <div className="adm-form-group adm-form-group-full">
            <label>Short Description</label>
            <input className="adm-input" value={form.shortDescription} onChange={set('shortDescription')} maxLength={300} />
          </div>
          <div className="adm-form-group adm-form-group-full">
            <label>Full Description *</label>
            <textarea className="adm-textarea" value={form.description} onChange={set('description')} required />
          </div>

          <div className="adm-form-group adm-form-group-full">
            <label>Image URLs * (comma separated)</label>
            <textarea className="adm-textarea" value={form.images} onChange={set('images')} placeholder="https://…, https://…" />
            {imageUrls.length > 0 && (
              <div className="adm-image-list">
                {imageUrls.map((url, i) => (
                  <div className="adm-image-thumb-wrap" key={i}>
                    <img src={url} alt="" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="adm-form-group adm-form-group-full">
            <label>Ingredients (comma separated)</label>
            <input className="adm-input" value={form.ingredients} onChange={set('ingredients')} />
          </div>
          <div className="adm-form-group adm-form-group-full">
            <label>Benefits (comma separated)</label>
            <input className="adm-input" value={form.benefits} onChange={set('benefits')} />
          </div>

          <div className="adm-form-group adm-form-group-full" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
            <label className="adm-checkbox-row"><input type="checkbox" checked={form.isFeatured} onChange={set('isFeatured')} /> Featured</label>
            <label className="adm-checkbox-row"><input type="checkbox" checked={form.isBestSeller} onChange={set('isBestSeller')} /> Best Seller</label>
            <label className="adm-checkbox-row"><input type="checkbox" checked={form.isNewArrival} onChange={set('isNewArrival')} /> New Arrival</label>
            <label className="adm-checkbox-row"><input type="checkbox" checked={form.isTrending} onChange={set('isTrending')} /> Trending</label>
            <label className="adm-checkbox-row"><input type="checkbox" checked={form.isActive} onChange={set('isActive')} /> Active</label>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default function ProductsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, pages: 1, count: 0 })

  const [formTarget, setFormTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 15 }
      if (search) params.search = search
      if (categoryFilter) params.category = categoryFilter
      if (statusFilter === 'active') params.isActive = true
      if (statusFilter === 'inactive') params.isActive = false
      const res = await productsApi.listAdmin(params)
      setProducts(res.products || [])
      setMeta({ total: res.total || 0, pages: res.pages || 1, count: (res.products || []).length })
    } catch (err) {
      setError(err.message || 'Failed to load products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const openId = location.state?.openProductId
    if (!openId) return
    // Clear the nav state immediately so a refresh/back doesn't reopen it.
    navigate(location.pathname, { replace: true, state: null })
    productsApi.getByIdAdmin(openId)
      .then((res) => { if (res.product) setFormTarget(res.product) })
      .catch((err) => setError(err.message || 'Failed to open product.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  useEffect(() => {
    categoriesApi.list().then((res) => setCategories(res.categories || [])).catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, categoryFilter, statusFilter])

  const handleSaved = () => {
    setFormTarget(null)
    load()
  }

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await productsApi.remove(deleteTarget._id)
      setDeleteTarget(null)
      load()
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete product.')
    } finally {
      setDeleting(false)
    }
  }

  const toggleActive = async (p) => {
    try {
      const res = await productsApi.update(p._id, { isActive: !p.isActive })
      setProducts((prev) => prev.map((x) => (x._id === p._id ? res.product : x)))
    } catch (err) {
      setError(err.message || 'Failed to update status.')
    }
  }

  const activeCount = products.filter((p) => p.isActive).length
  const lowStockCount = products.filter((p) => (p.stock ?? 0) <= 10).length

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h2>Products</h2>
          <p>Manage everything customers see on the storefront.</p>
        </div>
      </div>

      <div className="adm-stat-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard icon={IconBox} tone="green" label="Total Products" value={meta.total} />
        <StatCard icon={IconEye} tone="gold" label="Active (this page)" value={activeCount} />
        <StatCard icon={IconEyeOff} tone="warning" label="Inactive (this page)" value={products.length - activeCount} />
        <StatCard icon={IconAlert} tone="muted" label="Low Stock (≤10, this page)" value={lowStockCount} />
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
              placeholder="Search products…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <select className="adm-select" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select className="adm-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="adm-toolbar-right">
          <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setFormTarget({})}>
            <IconPlus width={16} height={16} /> Add Product
          </button>
        </div>
      </div>

      <div className="adm-card">
        {loading ? (
          <div className="adm-loading-cell">Loading products…</div>
        ) : products.length === 0 ? (
          <div className="adm-empty-state">No products found. Click "Add Product" to create one.</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="adm-table-product">
                        {p.images?.[0] && <img src={p.images[0]} alt="" className="adm-table-thumb" />}
                        <div>
                          <div>{p.name}</div>
                          <div className="adm-table-cell-muted">{p.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="adm-table-cell-muted">{p.category?.name || '—'}</td>
                    <td>
                      <strong>{currency(p.price)}</strong>
                      {p.oldPrice > p.price && <div className="adm-table-cell-muted"><s>{currency(p.oldPrice)}</s></div>}
                    </td>
                    <td>
                      <span className={`adm-badge ${(p.stock ?? 0) <= 10 ? 'adm-badge-warning' : 'adm-badge-success'}`}>
                        {p.stock ?? 0}
                      </span>
                    </td>
                    <td>
                      <label className="adm-switch">
                        <input type="checkbox" checked={p.isActive} onChange={() => toggleActive(p)} />
                        <span className="adm-switch-track" />
                      </label>
                    </td>
                    <td>
                      <div className="adm-row-actions">
                        <button type="button" className="adm-icon-btn" onClick={() => setFormTarget(p)} aria-label="Edit">
                          <IconEdit width={16} height={16} />
                        </button>
                        <button
                          type="button"
                          className="adm-icon-btn adm-icon-danger"
                          onClick={() => { setDeleteTarget(p); setDeleteError('') }}
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
        )}
        <Pagination page={page} pages={meta.pages} total={meta.total} count={meta.count} onPageChange={setPage} />
      </div>

      {formTarget !== null && (
        <ProductFormModal initial={formTarget} categories={categories} onClose={() => setFormTarget(null)} onSaved={handleSaved} />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Product"
          message={<>Delete <strong>{deleteTarget.name}</strong>? This cannot be undone.</>}
          error={deleteError}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}