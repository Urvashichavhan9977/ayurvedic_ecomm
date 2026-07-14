import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, X, ShoppingCart, Zap, Check } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { PLACEHOLDER_IMAGE, handleImageError } from '../utils/imageFallback.js'
import '../styles/ProductCard.css'

export default function ProductCard({ product, showQuick = true }) {
  const { addToCart, toggleWishlist, isWished } = useCart()
  const navigate = useNavigate()
  const [quickView, setQuickView] = useState(false)
  const [added, setAdded] = useState(false)

  const img         = product.img || product.image || ''
  const name        = product.name || ''
  const price       = product.price
  const oldPrice    = product.oldPrice
  const rating      = product.rating  || '★★★★☆'
  const reviews     = product.reviews || ''
  const description = product.desc || product.description || ''
  const badge       = product.badge
  const badgeType   = product.badgeType || 'red'
  const category    = product.category || ''
  const id          = product.id
  const slug        = product.slug || String(id)
  const inStock     = (product.stock ?? 10) > 0
  const vendorName  = product.vendor?.shopName || ''

  const priceStr    = typeof price === 'number' ? `₹${price}` : (price || '')
  const oldPriceStr = typeof oldPrice === 'number' ? `₹${oldPrice}` : (oldPrice || '')

  const numericPrice    = typeof price    === 'number' ? price    : parseFloat(String(price).replace(/[^0-9.]/g, ''))
  const numericOldPrice = typeof oldPrice === 'number' ? oldPrice : parseFloat(String(oldPrice).replace(/[^0-9.]/g, ''))
  const discount = numericOldPrice > numericPrice
    ? Math.round(100 - (numericPrice / numericOldPrice) * 100)
    : 0

  const wished = isWished(id)

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const handleBuyNow = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product)
    navigate('/checkout')
  }

  const handleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product)
  }

  return (
    <>
      <Link to={`/product/${slug}`} className="product-card">
        <div className="pc-image-wrap">
          {badge && (
            <span className={`pc-badge ${badgeType === 'gold' ? 'badge-gold' : 'badge-red'}`}>
              {badge}
            </span>
          )}

          <button
            type="button"
            className={`pc-wishlist ${wished ? 'active' : ''}`}
            onClick={handleWishlist}
            aria-label="Toggle wishlist"
          >
            <Heart size={16} fill={wished ? '#e63946' : 'none'} color={wished ? '#e63946' : '#6b7d73'} />
          </button>

          <img src={img || PLACEHOLDER_IMAGE} alt={name} className="pc-image" loading="lazy" onError={handleImageError} />

          {showQuick && (
            <button
              type="button"
              className="pc-quickview"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickView(true) }}
            >
              Quick View
            </button>
          )}
        </div>

        <div className="pc-body">
          {category && <span className="pc-category">{category.replace(/-/g, ' ')}</span>}
          <h4 className="pc-name">{name}</h4>
          {vendorName && <span className="pc-vendor">Sold by {vendorName}</span>}

          <div className="pc-rating-row">
            <span className="pc-stars">{rating}</span>
            {reviews && <span className="pc-reviews">({reviews})</span>}
          </div>

          {description && <p className="pc-desc">{description}</p>}

          <div className="pc-price-row">
            <span className="pc-price">{priceStr}</span>
            {oldPriceStr && numericOldPrice > numericPrice && (
              <s className="pc-old-price">{oldPriceStr}</s>
            )}
            {discount > 0 && (
              <span className="pc-discount-pct">{discount}% off</span>
            )}
          </div>

          <div className="pc-actions">
            <button
              type="button"
              className={`btn pc-btn ${added ? 'btn-green' : 'btn-outline'}`}
              onClick={handleAddToCart}
              disabled={!inStock}
            >
              {added ? <><Check size={15} /> Added</> : <><ShoppingCart size={15} /> Add to Cart</>}
            </button>
            <button
              type="button"
              className="btn btn-green pc-btn"
              onClick={handleBuyNow}
              disabled={!inStock}
            >
              <Zap size={15} /> Buy Now
            </button>
          </div>
        </div>
      </Link>

      {quickView && (
        <div className="pc-quickview-overlay" onClick={() => setQuickView(false)}>
          <div className="pc-quickview-modal" onClick={e => e.stopPropagation()}>
            <button className="pc-qv-close" onClick={() => setQuickView(false)} aria-label="Close quick view">
              <X size={18} />
            </button>
            <img src={img || PLACEHOLDER_IMAGE} alt={name} onError={handleImageError} />
            <div>
              {category && <span className="pc-category">{category.replace(/-/g, ' ')}</span>}
              <h3>{name}</h3>
              {vendorName && <span className="pc-vendor">Sold by {vendorName}</span>}
              <div className="pc-rating-row">
                <span className="pc-stars">{rating}</span>
                {reviews && <span className="pc-reviews">({reviews})</span>}
              </div>
              {description && <p className="pc-desc">{description}</p>}
              <div className="pc-price-row">
                <span className="pc-price">{priceStr}</span>
                {oldPriceStr && numericOldPrice > numericPrice && (
                  <s className="pc-old-price">{oldPriceStr}</s>
                )}
              </div>
              <div className="pc-actions">
                <button className="btn btn-outline pc-btn" onClick={handleAddToCart} disabled={!inStock}>
                  {added ? <><Check size={15} /> Added</> : <><ShoppingCart size={15} /> Add to Cart</>}
                </button>
                <button className="btn btn-green pc-btn" onClick={handleBuyNow} disabled={!inStock}>
                  <Zap size={15} /> Buy Now
                </button>
              </div>
              <Link to={`/product/${slug}`} className="pc-view-full">View Full Details →</Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}