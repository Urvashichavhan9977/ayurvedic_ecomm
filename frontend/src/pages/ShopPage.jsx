import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Leaf, Sprout } from 'lucide-react'
import ProductCard from '../Component/Productcard.jsx'
import { productsApi } from '../api/productsApi.js'
import { categoriesApi } from '../api/categoriesApi.js'
import { fetchActiveConcerns } from '../api/concernsApi.js'
import '../styles/pages/Shop.css'

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' },
]

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [sortBy, setSortBy] = useState('popular')
  const [maxPrice, setMaxPrice] = useState(1000)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const activeCategory = searchParams.get('category') || ''
  const searchQuery = (searchParams.get('search') || '').toLowerCase()
  const bestsellerOnly = searchParams.get('bestseller') === 'true'
  const ingredientFilter = (searchParams.get('ingredient') || '').toLowerCase()
  // Set when a "Daily Essentials" tile is clicked on the homepage
  // (admin-managed, see Component/Essentialsgrid.jsx) -> only that
  // tile's assigned products should show.
  const essentialFilter = searchParams.get('essential') || ''
  const essentialTitle = searchParams.get('essentialTitle') || ''
  // Set when a "Shop by Concern" card is clicked on the homepage
  // (admin-managed, see Component/Concerncard.jsx -> ConcernSwiper) ->
  // only products assigned to that concern in the admin panel should show.
  const concernFilter = (searchParams.get('concern') || '').toLowerCase()
  const [concernProductIds, setConcernProductIds] = useState(null)
  const [concernName, setConcernName] = useState('')
  const [concernLoading, setConcernLoading] = useState(false)

  const setCategory = (catSlug) => {
    const next = new URLSearchParams(searchParams)
    if (catSlug) next.set('category', catSlug)
    else next.delete('category')
    next.delete('essential')
    next.delete('essentialTitle')
    next.delete('concern')
    setSearchParams(next)
  }

  const clearEssentialFilter = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('essential')
    next.delete('essentialTitle')
    setSearchParams(next)
  }

  const clearConcernFilter = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('concern')
    setSearchParams(next)
  }

  const clearFilters = () => {
    setSearchParams(new URLSearchParams())
    setMaxPrice(1000)
  }
  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!concernFilter) {
      setConcernProductIds(null)
      setConcernName('')
      return
    }
    let cancelled = false
    setConcernLoading(true)
    fetchActiveConcerns()
      .then((res) => {
        if (cancelled) return
        const concerns = res.concerns || []
        const match = concerns.find(
          (c) => c.name.toLowerCase().replace(/ /g, '-') === concernFilter
        )
        if (match) {
          setConcernProductIds(new Set((match.products || []).map((p) => p._id || p)))
          setConcernName(match.name)
        } else {
          setConcernProductIds(new Set())
          setConcernName('')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConcernProductIds(new Set())
          setConcernName('')
        }
      })
      .finally(() => {
        if (!cancelled) setConcernLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [concernFilter])

  useEffect(() => {
    let mounted = true
    setLoading(true)

   const params = { limit: 200 }
    if (activeCategory) params.category = activeCategory
    if (searchQuery) params.search = searchQuery.replace(/\+/g, ' ')
    if (bestsellerOnly) params.isBestSeller = true
    if (essentialFilter) params.essential = essentialFilter

    productsApi
      .list(params)
      .then((res) => {
        if (mounted) setProducts(res.products || [])
      })
      .catch(() => {
        if (mounted) setProducts([])
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [activeCategory, searchQuery, bestsellerOnly, essentialFilter])

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.price <= maxPrice)
    if (ingredientFilter) {
  list = list.filter((p) =>
    (p.ingredients || []).some((tag) => (tag || '').toLowerCase().includes(ingredientFilter))
  )
}
    if (concernFilter) {
      list = concernProductIds
        ? list.filter((p) => concernProductIds.has(p.id))
        : []
    }

    switch (sortBy) {
      case 'price-low':
        list = [...list].sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        list = [...list].sort((a, b) => b.price - a.price)
        break
      case 'name':
        list = [...list].sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        break
    }

    return list
}, [products, sortBy, maxPrice, ingredientFilter, concernFilter, concernProductIds])

  return (
    <>
      <section className="shop-hero">
        {/* floating decorative herbs */}
        <div className="hero-leaf leaf-1"><Leaf size={34} /></div>
        <div className="hero-leaf leaf-2"><Sprout size={28} /></div>
        <div className="hero-leaf leaf-3"><Leaf size={40} /></div>
        <div className="hero-leaf leaf-4"><Sprout size={26} /></div>
        <div className="hero-leaf leaf-5"><Leaf size={22} /></div>

        <div className="container">
          <span className="eyebrow">The Herbal Collection</span>
          <h1>Shop All Products</h1>
          <p>Browse our full range of pure Ayurvedic essentials — potent herbs, ancient rituals, modern wellness.</p>
        </div>
      </section>

      <section className="container shop-layout">
        <aside className={`shop-sidebar ${mobileFiltersOpen ? 'mobile-open' : ''}`}>
          <h3>Categories</h3>
          <div className="shop-cat-list">
            <button
              className={`shop-cat-btn ${activeCategory === '' ? 'active' : ''}`}
              onClick={() => setCategory('')}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`shop-cat-btn ${activeCategory === cat.slug ? 'active' : ''}`}
                onClick={() => setCategory(cat.slug)}
              >
                {cat.name} <span className="count">{cat.count}</span>
              </button>
            ))}
          </div>

          <h3>Max Price</h3>
          <div className="shop-price-range">
            <input
              type="range"
              min="50"
              max="1000"
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
            />
            <div className="range-label">
              <span>₹50</span>
              <span>Up to ₹{maxPrice}</span>
            </div>
          </div>

          <button className="shop-clear-btn" onClick={clearFilters}>Clear All Filters</button>
        </aside>

        <div className="shop-main">
          {essentialFilter && (
            <div className="filter-bar" style={{ marginBottom: '.5rem' }}>
              <span className="result-count">
                Showing: <strong>{essentialTitle || 'Daily Essentials'}</strong>
              </span>
              <button className="shop-clear-btn" onClick={clearEssentialFilter}>
                Clear ✕
              </button>
            </div>
          )}
          {concernFilter && (
            <div className="filter-bar" style={{ marginBottom: '.5rem' }}>
              <span className="result-count">
                Showing products for:{' '}
                <strong>
                  {concernLoading ? '…' : concernName || concernFilter}
                </strong>
              </span>
              <button className="shop-clear-btn" onClick={clearConcernFilter}>
                Clear ✕
              </button>
            </div>
          )}
          <div className="filter-bar">
         <span className="result-count">
  <strong>{loading || (concernFilter && concernLoading) ? '…' : filtered.length}</strong> products found
  {searchQuery && <> for "<strong>{searchQuery.replace(/\+/g, ' ')}</strong>"</>}
  {ingredientFilter && <> containing "<strong>{ingredientFilter}</strong>"</>}
</span>

            <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
              <button
                className="filter-mobile-toggle"
                onClick={() => setMobileFiltersOpen((o) => !o)}
              >
                {mobileFiltersOpen ? 'Hide Filters ✕' : 'Filters ☰'}
              </button>
              <div className="filter-sort">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading || (concernFilter && concernLoading) ? (
            <div className="shop-product-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="product-card" style={{ opacity: 0.35 }} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="shop-product-grid">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="shop-empty">
              <h3>No products found</h3>
              <p>Try adjusting your filters or search term.</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
