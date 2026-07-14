import { useEffect, useState } from 'react'
import { productsApi, normalizeProduct } from '../api/productsApi'
import { apiPatch } from '../api/client'
import { IconAlert, IconSearch, IconTrendingUp, IconBox, IconTag } from '../components/AdminIcons'

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

export default function TrendingProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [togglingId, setTogglingId] = useState(null)
  const [saved, setSaved] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    try {
      const res = await productsApi.listAdmin({ limit: 5000 })
      setProducts((res.products || []).map(normalizeProduct))
    } catch (err) { setError(err.message || 'Failed to load products.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (product) => {
    setTogglingId(product.id); setSaved('')
    try {
      await apiPatch(`/products/${product.id}`, { isTrending: !product.isTrending })
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isTrending: !p.isTrending } : p))
      setSaved('Saved!')
      setTimeout(() => setSaved(''), 2000)
    } catch (err) { setError(err.message) }
    finally { setTogglingId(null) }
  }

  const categories = [...new Set(products.map(p => p.categoryName || p.category).filter(Boolean))]

  const filtered = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p => !categoryFilter || (p.categoryName || p.category) === categoryFilter)

  const trending = filtered.filter(p => p.isTrending)
  const rest = filtered.filter(p => !p.isTrending)
  const outOfStockTrending = products.filter(p => p.isTrending && (p.stock ?? 0) <= 0).length

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h2>Trending Products</h2>
          <p>Toggle karo konsa product homepage ke Trending section mein dikhega.</p>
        </div>
        {saved && <span className="adm-badge adm-badge-success" style={{ fontSize: '.9rem', padding: '.4rem .9rem' }}>{saved}</span>}
      </div>

      <div className="adm-stat-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard icon={IconBox} tone="green" label="Total Products" value={products.length} />
        <StatCard icon={IconTrendingUp} tone="gold" label="Trending Now" value={products.filter(p => p.isTrending).length} sub="Shown on homepage" />
        <StatCard icon={IconTag} tone="muted" label="Categories" value={categories.length} />
        <StatCard icon={IconAlert} tone="warning" label="Out of Stock (Trending)" value={outOfStockTrending} sub={outOfStockTrending > 0 ? 'Consider un-marking these' : 'All good'} />
      </div>

      {error && <div className="adm-alert adm-alert-error" style={{ marginBottom: '1.25rem' }}><IconAlert /><span>{error}</span></div>}

      <div className="adm-toolbar">
        <div className="adm-toolbar-filters">
          <div className="adm-search-wrap">
            <span className="adm-search-icon"><IconSearch width={16} height={16} /></span>
            <input className="adm-input" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {categories.length > 0 && (
            <select className="adm-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
        <div className="adm-toolbar-right">
          <span className="adm-badge adm-badge-success">{trending.length} Trending</span>
        </div>
      </div>

      {loading ? (
        <div className="adm-card"><div className="adm-loading-cell">Loading products…</div></div>
      ) : filtered.length === 0 ? (
        <div className="adm-card"><div className="adm-empty-state">No products match your search/filter.</div></div>
      ) : (
        <div className="adm-card">
          <div className="adm-table-wrap"><table className="adm-table">
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Trending</th></tr></thead>
            <tbody>
              {[...trending, ...rest].map(p => (
                <tr key={p.id} style={p.isTrending ? { background: '#f0fdf4' } : {}}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                      {p.img && <img src={p.img} alt={p.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />}
                      <strong>{p.name}</strong>
                    </div>
                  </td>
                  <td className="adm-table-cell-muted">{p.categoryName || p.category}</td>
                  <td>₹{p.price}</td>
                  <td>
                    {(p.stock ?? 0) > 0
                      ? <span className="adm-table-cell-muted">{p.stock} in stock</span>
                      : <span className="adm-badge adm-badge-danger">Out of stock</span>}
                  </td>
                  <td>
                    <label className="adm-switch">
                      <input type="checkbox" checked={!!p.isTrending} disabled={togglingId === p.id} onChange={() => handleToggle(p)} />
                      <span className="adm-switch-track" />
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}
    </div>
  )
}