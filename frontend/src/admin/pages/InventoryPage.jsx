import { useEffect, useState } from 'react'
import { inventoryApi } from '../api/inventoryApi'
import { categoriesApi } from '../api/categoriesApi'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import { IconAlert, IconBox, IconProducts, IconSearch } from '../components/AdminIcons'

const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const LOW_STOCK_THRESHOLD = 10

function StatCard({ icon: Icon, tone, label, value }) {
  return (
    <div className="adm-stat-card">
      <span className={`adm-stat-icon ${tone}`}>
        <Icon />
      </span>
      <div className="adm-stat-body">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

function AdjustStockModal({ product, onClose, onSaved }) {
  const [mode, setMode] = useState('set')
  const [quantity, setQuantity] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const preview = () => {
    const qty = Number(quantity) || 0
    if (mode === 'increment') return product.stock + qty
    if (mode === 'decrement') return Math.max(0, product.stock - qty)
    return Math.max(0, qty)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (quantity === '' || Number.isNaN(Number(quantity))) {
      setError('Enter a valid quantity.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await inventoryApi.adjustStock(product._id, { mode, quantity: Number(quantity) })
      onSaved(res.product)
    } catch (err) {
      setError(err.message || 'Failed to update stock.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={`Adjust Stock — ${product.name}`}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="stock-form" className="adm-btn adm-btn-primary adm-btn-sm" disabled={saving}>
            {saving ? 'Saving…' : 'Update Stock'}
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

      <form id="stock-form" onSubmit={handleSubmit}>
        <div className="adm-form-group">
          <label>Current Stock</label>
          <p style={{ fontWeight: 800, color: 'var(--adm-green)', fontSize: '1.1rem' }}>{product.stock} units</p>
        </div>

        <div className="adm-form-group">
          <label htmlFor="stock-mode">Adjustment Mode</label>
          <select id="stock-mode" className="adm-select" style={{ width: '100%' }} value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="set">Set to exact value</option>
            <option value="increment">Add (increment)</option>
            <option value="decrement">Remove (decrement)</option>
          </select>
        </div>

        <div className="adm-form-group">
          <label htmlFor="stock-qty">Quantity</label>
          <input
            id="stock-qty"
            type="number"
            min="0"
            className="adm-input"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
          {quantity !== '' && !Number.isNaN(Number(quantity)) && (
            <p className="adm-field-hint">New stock will be: <strong>{preview()} units</strong></p>
          )}
        </div>
      </form>
    </Modal>
  )
}

export default function InventoryPage() {
  const [overview, setOverview] = useState(null)
  const [overviewLoading, setOverviewLoading] = useState(true)

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sort, setSort] = useState('stock-asc')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, pages: 1, count: 0 })

  const [adjustTarget, setAdjustTarget] = useState(null)

  useEffect(() => {
    categoriesApi.list().then((res) => setCategories(res.categories || [])).catch(() => {})
  }, [])

  const loadOverview = async () => {
    setOverviewLoading(true)
    try {
      const res = await inventoryApi.overview(LOW_STOCK_THRESHOLD)
      setOverview(res.overview)
    } catch (err) {
      setError(err.message || 'Failed to load inventory overview.')
    } finally {
      setOverviewLoading(false)
    }
  }

  const loadList = async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 15, sort, threshold: LOW_STOCK_THRESHOLD }
      if (search) params.search = search
      if (status) params.status = status
      if (categoryFilter) params.category = categoryFilter

      const res = await inventoryApi.list(params)
      setProducts(res.products || [])
      setMeta({ total: res.total || 0, pages: res.pages || 1, count: (res.products || []).length })
    } catch (err) {
      setError(err.message || 'Failed to load inventory.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOverview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, categoryFilter, sort])

  useEffect(() => {
    setPage(1)
    const t = setTimeout(() => loadList(), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const handleStockSaved = (updatedProduct) => {
    setAdjustTarget(null)
    setProducts((prev) => prev.map((p) => (p._id === updatedProduct._id ? { ...p, stock: updatedProduct.stock } : p)))
    loadOverview()
  }

  const stockBadge = (stock) => {
    if (stock === 0) return { cls: 'adm-badge-danger', label: 'Out of stock' }
    if (stock <= LOW_STOCK_THRESHOLD) return { cls: 'adm-badge-warning', label: `${stock} left` }
    return { cls: 'adm-badge-success', label: `${stock} in stock` }
  }

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h2>Inventory</h2>
          <p>Track stock levels across your catalog and adjust quantities.</p>
        </div>
      </div>

      {error && (
        <div className="adm-alert adm-alert-error" style={{ marginBottom: '1.25rem' }}>
          <IconAlert />
          <span>{error}</span>
        </div>
      )}

      {overviewLoading ? (
        <div className="adm-stat-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="adm-stat-card">
              <div className="adm-skeleton" style={{ width: 46, height: 46 }} />
              <div style={{ flex: 1 }}>
                <div className="adm-skeleton" style={{ width: '60%', height: 10, marginBottom: 8 }} />
                <div className="adm-skeleton" style={{ width: '40%', height: 18 }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="adm-stat-grid">
          <StatCard icon={IconProducts} tone="green" label="Total Products" value={overview?.totalProducts ?? 0} />
          <StatCard icon={IconBox} tone="gold" label="Total Units" value={overview?.totalUnits ?? 0} />
          <StatCard icon={IconAlert} tone="warning" label="Low Stock" value={overview?.lowStockCount ?? 0} />
          <StatCard icon={IconAlert} tone="danger" label="Out of Stock" value={overview?.outOfStockCount ?? 0} />
        </div>
      )}

      <div className="adm-card" style={{ marginBottom: '1.25rem' }}>
        <div className="adm-card-head" style={{ marginBottom: '0.5rem' }}>
          <h3>Total Stock Value</h3>
        </div>
        <strong style={{ fontSize: '1.6rem', color: 'var(--adm-green)' }}>
          {currency(overview?.totalStockValue)}
        </strong>
      </div>

      <div className="adm-toolbar">
        <div className="adm-toolbar-filters">
          <div className="adm-search-wrap">
            <span className="adm-search-icon"><IconSearch width={16} height={16} /></span>
            <input
              className="adm-input"
              placeholder="Search by name or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="adm-select" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}>
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <select className="adm-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <option value="">All Stock Levels</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
          <select className="adm-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="stock-asc">Stock: Low to High</option>
            <option value="stock-desc">Stock: High to Low</option>
            <option value="value-asc">Price: Low to High</option>
            <option value="value-desc">Price: High to Low</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <div className="adm-card">
        {loading ? (
          <div className="adm-loading-cell">Loading inventory…</div>
        ) : products.length === 0 ? (
          <div className="adm-empty-state">No products match your filters.</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Stock Value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const badge = stockBadge(p.stock)
                  return (
                    <tr key={p._id}>
                      <td>
                        <div className="adm-table-product">
                          {p.images?.[0] && <img src={p.images[0]} alt="" className="adm-table-thumb" />}
                          <span>{p.name}</span>
                        </div>
                      </td>
                      <td className="adm-table-cell-muted">{p.sku || '—'}</td>
                      <td className="adm-table-cell-muted">{p.category?.name || '—'}</td>
                      <td>{currency(p.price)}</td>
                      <td>
                        <span className={`adm-badge ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td>{currency(p.stock * p.price)}</td>
                      <td>
                        <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={() => setAdjustTarget(p)}>
                          Adjust
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} pages={meta.pages} total={meta.total} count={meta.count} onPageChange={setPage} />
      </div>

      {adjustTarget && (
        <AdjustStockModal product={adjustTarget} onClose={() => setAdjustTarget(null)} onSaved={handleStockSaved} />
      )}
    </div>
  )
}
