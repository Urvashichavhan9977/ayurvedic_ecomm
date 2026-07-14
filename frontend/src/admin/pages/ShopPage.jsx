import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../Component/Productcard.jsx'
import { productsApi } from '../api/productsApi.js'
import { categoriesApi } from '../api/categoriesApi.js'
import '../styles/pages/Shop.css'

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' },
]

const SORT_TO_QUERY = {
  popular: '-createdAt',
  'price-low': 'price',
  'price-high': '-price',
  name: 'name',
}

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [sortBy, setSortBy] = useState('popular')
  const [maxPrice, setMaxPrice] = useState(1000)

  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const activeCategorySlug = searchParams.get('category') || ''
  const searchQuery = (searchParams.get('search') || '').toLowerCase()

  const setCategory = (slug) => {
    const next = new URLSearchParams(searchParams)
    if (slug) next.set('category', slug)
    else next.delete('category')
    setSearchParams(next)
  }

  const clearFilters = () => {
    setSearchParams({})
    setMaxPrice(1000)
    setSortBy('popular')
  }

  // Load categories once, for the sidebar and to resolve slug -> id.
  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => setCategories([]))
  }, [])

  const activeCategoryId = useMemo(
    () => categories.find(c => c.slug === activeCategorySlug)?.id || '',
    [categories, activeCategorySlug]
  )

  // Re-fetch products whenever a filter changes.
  useEffect(() => {
    // If a category slug is in the URL but hasn't resolved to an id yet
    // (categories still loading), wait for it instead of showing
    // "all products" for a flash.
    if (activeCategorySlug && !activeCategoryId && categories.length === 0) return

    let cancelled = false
    setLoading(true)

    productsApi
      .list({
        category: activeCategoryId || undefined,
        search: searchQuery ? searchQuery.replace(/\+/g, ' ') : undefined,
        maxPrice,
        sort: SORT_TO_QUERY[sortBy],
        limit: 100,
      })
      .then((res) => { if (!cancelled) setProducts(res.products) })
      .catch(() => { if (!cancelled) setProducts([]) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [activeCategoryId, activeCategorySlug, categories.length, searchQuery, maxPrice, sortBy])

  return (
    <>
      <section className="shop-hero">
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
              className={`shop-cat-btn ${activeCategorySlug === '' ? 'active' : ''}`}
              onClick={() => setCategory('')}
            >
              All Products
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`shop-cat-btn ${activeCategorySlug === cat.slug ? 'active' : ''}`}
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
              onChange={e => setMaxPrice(Number(e.target.value))}
            />
            <div className="range-label">
              <span>₹50</span>
              <span>Up to ₹{maxPrice}</span>
            </div>
          </div>

          <button className="shop-clear-btn" onClick={clearFilters}>Clear All Filters</button>
        </aside>

        <div className="shop-main">
          <div className="filter-bar">
          <span className="result-count">
  <strong>{loading ? '…' : filtered.length}</strong> products found
  {searchQuery && <> for "<strong>{searchQuery.replace(/\+/g, ' ')}</strong>"</>}
  {ingredientFilter && <> containing "<strong>{ingredientFilter}</strong>"</>}
</span>

            <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
              <button
                className="filter-mobile-toggle"
                onClick={() => setMobileFiltersOpen(o => !o)}
              >
                {mobileFiltersOpen ? 'Hide Filters ✕' : 'Filters ☰'}
              </button>
              <div className="filter-sort">
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="shop-empty">
              <h3>Loading products…</h3>
            </div>
          ) : products.length > 0 ? (
            <div className="shop-product-grid">
              {products.map(product => (
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