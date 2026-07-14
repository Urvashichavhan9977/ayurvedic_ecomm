import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { categoriesApi } from '../api/categoriesApi.js'
import { productsApi } from '../api/productsApi.js'
import { concerns } from '../data/products.js'
import '../styles/MegaMenu.css'

export default function MegaMenu({ onNavigate }) {
  const [categories, setCategories] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [loading, setLoading] = useState(true)

  // Real data only — same pattern as HomePage.jsx (categoriesApi + productsApi).
  // No static/dummy product data, so every click below opens a real, working product page.
  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const [cats, best] = await Promise.all([
          categoriesApi.list(),
          productsApi.list({ isBestSeller: true, limit: 4 }),
        ])
        if (!mounted) return
        setCategories(cats || [])
        setBestSellers(best.products || [])
      } catch {
        // Network/API failure — sections simply render nothing rather than fake data.
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  const close = () => onNavigate && onNavigate()

  return (
    <div className="mega-menu-inner" onClick={close}>

      {/* Column 1 — Shop by Category (real categories from admin panel) */}
      <div className="mega-col">
        <h4 className="mega-col-title">Shop by Category</h4>
        {categories.length > 0 ? (
          <>
            <ul className="mega-list">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link to={`/shop?category=${cat.slug}`}>
                    {cat.img && <img src={cat.img} alt={cat.name} className="mega-thumb" />}
                    <span>
                      {cat.name}
                      <em>{cat.count} products</em>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/shop" className="mega-view-all">View All Categories →</Link>
          </>
        ) : (
          !loading && <p className="mega-empty">Categories coming soon.</p>
        )}
      </div>

      {/* Column 2 — Shop by Concern (site content, filters via search) */}
      <div className="mega-col">
        <h4 className="mega-col-title">Shop by Concern</h4>
        <ul className="mega-list mega-list-plain">
          {concerns.slice(0, 8).map((c) => {
            const primaryHerb = c.herbs.split('·')[0].trim()
            return (
              <li key={c.id}>
                <Link to={`/shop?search=${encodeURIComponent(primaryHerb)}`}>
                  {c.name}
                  <em>{c.herbs}</em>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Column 3 — Best Sellers (real products, real slugs — clicking opens the real product page) */}
      <div className="mega-col mega-col-wide">
        <h4 className="mega-col-title">Best Sellers</h4>
        {bestSellers.length > 0 ? (
          <div className="mega-product-grid">
            {bestSellers.map((p) => (
              <Link to={`/product/${p.slug}`} className="mega-product-card" key={p.id}>
                <div className="mega-product-img-wrap">
                  <img src={p.img} alt={p.name} loading="lazy" />
                  {p.badge && (
                    <span className={`mega-badge mega-badge-${p.badgeType}`}>{p.badge}</span>
                  )}
                </div>
                <p className="mega-product-name">{p.name}</p>
                <p className="mega-product-price">
                  ₹{p.price} {p.oldPrice && <span>₹{p.oldPrice}</span>}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          !loading && <p className="mega-empty">No best sellers yet.</p>
        )}
      </div>

      {/* Column 4 — Promo banner */}
      <div className="mega-promo">
        <span className="mega-promo-eyebrow">Limited Time</span>
        <h3>Immunity Season Sale</h3>
        <p>Up to 30% off on Ayurvedic wellness essentials</p>
        <Link to="/shop" className="mega-promo-btn">Shop the Sale</Link>
      </div>

    </div>
  )
}