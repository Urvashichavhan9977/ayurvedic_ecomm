import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { productsApi } from '../api/productsApi'
import { useCart } from '../context/CartContext.jsx'
import ProductCard from '../Component/Productcard.jsx'
import ReviewSection from '../Component/ReviewSection.jsx'
import '../styles/pages/Product.css'

export default function ProductPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart, toggleWishlist, isWished } = useCart()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('desc')
  const [added, setAdded] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')
    setActiveImg(0)
    setQty(1)

    productsApi
      .getBySlug(slug)
      .then((p) => {
        if (!mounted) return
        if (!p) {
          setError('Product not found.')
          setProduct(null)
          return
        }
        setProduct(p)
        // fetch a few related products from the same category
        productsApi
          .list({ category: p.category, limit: 8 })
          .then((res) => {
            if (!mounted) return
            setRelated((res.products || []).filter((r) => r.id !== p.id).slice(0, 4))
          })
          .catch(() => { if (mounted) setRelated([]) })
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Failed to load product.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [slug])

  if (loading) {
    return (
      <section className="container" style={{ padding: '5rem 1rem', textAlign: 'center' }}>
        <p>Loading product…</p>
      </section>
    )
  }

  if (error || !product) {
    return (
      <section className="container" style={{ padding: '5rem 1rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--green)', marginBottom: '.75rem' }}>Product Not Found</h2>
        <p style={{ marginBottom: '1.5rem' }}>{error || 'This product may have been removed or is unavailable.'}</p>
        <Link to="/shop" className="btn btn-green">Browse All Products</Link>
      </section>
    )
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.img].filter(Boolean)
  const inStock = (product.stock ?? 0) > 0
  const discount = product.oldPrice && product.oldPrice > product.price
    ? Math.round(100 - (product.price / product.oldPrice) * 100)
    : 0
  const wished = isWished(product.id)

  const handleAddToCart = () => {
    addToCart(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const handleBuyNow = () => {
    addToCart(product, qty)
    navigate('/checkout')
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="product-breadcrumb">
        <div className="container">
          <Link to="/">Home</Link>
          <span> / </span>
          <Link to="/shop">Shop</Link>
          <span> / </span>
          <span>{product.name}</span>
        </div>
      </div>

      {/* Main product detail area */}
      <section className="container product-detail">
        <div>
          <div className="product-main-img-wrap">
            {product.badge && (
              <span className={`product-badge ${product.badgeType === 'gold' ? 'badge-gold' : ''}`}>{product.badge}</span>
            )}
            <img src={images[activeImg]} alt={product.name} className="product-main-img" />
          </div>

          {images.length > 1 && (
            <div className="product-thumb-row">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  className="product-thumb-btn"
                  style={{ borderColor: i === activeImg ? 'var(--green, #1B5E20)' : undefined }}
                  onClick={() => setActiveImg(i)}
                >
                  <img src={img} alt={`${product.name} view ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <div className="breadcrumb">{product.categoryName}</div>
          <h1>{product.name}</h1>
          {product.vendorName && <span className="pc-vendor">Sold by {product.vendorName}</span>}
          <div className="prod-rating">
            <span className="rv-stars">{product.rating}</span>{' '}
            {product.reviews && <span>({product.reviews})</span>}
          </div>

          <div className="price-row">
            <span className="price-now">₹{product.price}</span>
            {product.oldPrice > product.price && <span className="price-old">₹{product.oldPrice}</span>}
            {discount > 0 && <span className="price-save">{discount}% OFF</span>}
          </div>

          <p className="desc">{product.desc || product.description}</p>

          <div className="qty-row">
            <div className="qty-stepper">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty((q) => q + 1)}>+</button>
            </div>
            {!inStock && <span style={{ color: '#e53e3e', fontWeight: 700, fontSize: '.85rem' }}>Out of Stock</span>}
          </div>

          <div className="action-row">
            <button type="button" className={`btn ${added ? 'btn-green' : 'btn-outline'}`} onClick={handleAddToCart} disabled={!inStock}>
              {added ? '✓ Added to Cart' : 'Add to Cart'}
            </button>
            <button type="button" className="btn btn-green" onClick={handleBuyNow} disabled={!inStock}>
              Buy Now
            </button>
            <button
              type="button"
              className="wish-btn-lg"
              aria-label="Toggle wishlist"
              onClick={() => toggleWishlist(product)}
            >
              {wished ? '❤️' : '🤍'}
            </button>
          </div>

          <div className="product-trust">
            <div>🚚 Free shipping over ₹499</div>
            <div>🌿 100% Natural &amp; Ayurvedic</div>
            <div>↩️ 7-day easy returns</div>
          </div>
        </div>
      </section>

      {/* Description / Ingredients / Benefits tabs */}
      <section className="container" style={{ padding: '1rem 1rem 3rem' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e8f0ea', marginBottom: '1.5rem' }}>
          <button type="button" className={`product-tab-btn ${tab === 'desc' ? 'active' : ''}`} onClick={() => setTab('desc')}>Description</button>
          {product.ingredients?.length > 0 && (
            <button type="button" className={`product-tab-btn ${tab === 'ingredients' ? 'active' : ''}`} onClick={() => setTab('ingredients')}>Ingredients</button>
          )}
          {product.benefits?.length > 0 && (
            <button type="button" className={`product-tab-btn ${tab === 'benefits' ? 'active' : ''}`} onClick={() => setTab('benefits')}>Benefits</button>
          )}
        </div>

        <div className="product-tab-content">
          {tab === 'desc' && <p>{product.description || product.desc}</p>}
          {tab === 'ingredients' && (
            <ul className="product-benefits-list">
              {product.ingredients.map((ing, i) => <li key={i}>🌿 {ing}</li>)}
            </ul>
          )}
          {tab === 'benefits' && (
            <ul className="product-how-list">
              {product.benefits.map((b, i) => <li key={i}>✓ {b}</li>)}
            </ul>
          )}
        </div>
      </section>

      {/* Reviews */}
      <section className="container" style={{ paddingBottom: '3rem' }}>
        <ReviewSection
          productId={product.id}
          initialAverage={product.ratingsAverage}
          initialCount={product.ratingsQuantity}
        />
      </section>

      {/* Related products */}
      {related.length > 0 && (
        <section className="section bg-light">
          <div className="container">
            <div className="sec-head">
              <span className="eyebrow">You May Also Like</span>
              <h2>Related Products</h2>
            </div>
            <div className="related-grid">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}