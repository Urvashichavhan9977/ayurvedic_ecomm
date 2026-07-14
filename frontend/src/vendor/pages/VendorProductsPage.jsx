import { useEffect, useState } from 'react'
import { vendorApi } from '../api/vendorApi'

const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const EMPTY_FORM = {
  name: '',
  description: '',
  shortDescription: '',
  price: '',
  oldPrice: '',
  category: '',
  images: '',
  stock: '',
  sku: '',
}

function ProductFormModal({ initial, categories, onClose, onSaved }) {
  const isEdit = !!initial
  const [form, setForm] = useState(() =>
    initial
      ? {
          name: initial.name || '',
          description: initial.description || '',
          shortDescription: initial.shortDescription || '',
          price: initial.price ?? '',
          oldPrice: initial.oldPrice ?? '',
          category: initial.category?._id || initial.category || '',
          images: (initial.images || []).join(', '),
          stock: initial.stock ?? '',
          sku: initial.sku || '',
        }
      : EMPTY_FORM
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const images = form.images
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    if (!form.name || !form.description || !form.price || !form.category || images.length === 0) {
      setError('Name, description, price, category and at least one image URL are required.')
      return
    }

    const payload = {
      name: form.name,
      description: form.description,
      shortDescription: form.shortDescription,
      price: Number(form.price),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
      category: form.category,
      images,
      stock: form.stock ? Number(form.stock) : 0,
      sku: form.sku || undefined,
    }

    setSaving(true)
    try {
      if (isEdit) {
        await vendorApi.updateProduct(initial._id, payload)
      } else {
        await vendorApi.createProduct(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.message || 'Failed to save product.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="vnd-modal-overlay" onClick={onClose}>
      <div className="vnd-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{isEdit ? 'Edit Product' : 'Add New Product'}</h3>
        {error && <div className="vnd-alert vnd-alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="vnd-form-row">
            <label>Product Name</label>
            <input className="vnd-input" value={form.name} onChange={update('name')} required />
          </div>
          <div className="vnd-form-row">
            <label>Short Description</label>
            <input className="vnd-input" value={form.shortDescription} onChange={update('shortDescription')} />
          </div>
          <div className="vnd-form-row">
            <label>Full Description</label>
            <textarea className="vnd-textarea" value={form.description} onChange={update('description')} required />
          </div>
          <div className="vnd-form-grid">
            <div className="vnd-form-row">
              <label>Price (₹)</label>
              <input type="number" min="0" className="vnd-input" value={form.price} onChange={update('price')} required />
            </div>
            <div className="vnd-form-row">
              <label>Old Price (₹, optional)</label>
              <input type="number" min="0" className="vnd-input" value={form.oldPrice} onChange={update('oldPrice')} />
            </div>
          </div>
          <div className="vnd-form-grid">
            <div className="vnd-form-row">
              <label>Category</label>
              <select className="vnd-select" value={form.category} onChange={update('category')} required>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="vnd-form-row">
              <label>Stock</label>
              <input type="number" min="0" className="vnd-input" value={form.stock} onChange={update('stock')} />
            </div>
          </div>
          <div className="vnd-form-row">
            <label>Image URLs (comma separated)</label>
            <input className="vnd-input" value={form.images} onChange={update('images')} placeholder="https://... , https://..." required />
            <p className="vnd-help-text">Paste one or more direct image links, separated by commas.</p>
          </div>
          <div className="vnd-form-row">
            <label>SKU (optional)</label>
            <input className="vnd-input" value={form.sku} onChange={update('sku')} />
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
            <button type="submit" className="vnd-btn vnd-btn-primary" style={{ width: 'auto' }} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Submit for Approval'}
            </button>
            <button type="button" className="vnd-btn vnd-btn-outline" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function VendorProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalState, setModalState] = useState(null) // null | 'new' | product
  const [deletingId, setDeletingId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [prodRes, cats] = await Promise.all([vendorApi.listProducts({ limit: 50 }), vendorApi.listCategories()])
      setProducts(prodRes.products || [])
      setCategories(cats)
    } catch (err) {
      setError(err.message || 'Failed to load products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await vendorApi.deleteProduct(id)
      load()
    } catch (err) {
      setError(err.message || 'Failed to delete product.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="vnd-panel">
        <div className="vnd-panel-header">
          <h3>My Products</h3>
          <button type="button" className="vnd-btn vnd-btn-primary" style={{ width: 'auto' }} onClick={() => setModalState('new')}>
            + Add Product
          </button>
        </div>

        {error && <div className="vnd-alert vnd-alert-error">{error}</div>}

        {loading ? (
          <div className="vnd-empty">Loading products…</div>
        ) : products.length === 0 ? (
          <div className="vnd-empty">You haven't added any products yet.</div>
        ) : (
          <div className="vnd-table-wrap">
            <table className="vnd-table">
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
                    <td>{p.name}</td>
                    <td className="vnd-table-muted">{p.category?.name || '—'}</td>
                    <td>{currency(p.price)}</td>
                    <td>{p.stock}</td>
                    <td>
                      <span className={`vnd-badge vnd-badge-${p.approvalStatus}`}>{p.approvalStatus}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button type="button" className="vnd-btn vnd-btn-outline vnd-btn-sm" onClick={() => setModalState(p)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="vnd-btn vnd-btn-danger vnd-btn-sm"
                          disabled={deletingId === p._id}
                          onClick={() => handleDelete(p._id)}
                        >
                          {deletingId === p._id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalState && (
        <ProductFormModal
          initial={modalState === 'new' ? null : modalState}
          categories={categories}
          onClose={() => setModalState(null)}
          onSaved={() => {
            setModalState(null)
            load()
          }}
        />
      )}
    </div>
  )
}
