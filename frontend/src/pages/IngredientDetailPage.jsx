import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ingredients } from '../data/products.js'
import { ingredientDetails, defaultIngredientDetail } from '../data/ingredientDetails.js'
import { productsApi } from '../api/productsApi.js'
import ProductCard from '../Component/Productcard.jsx'
import '../styles/pages/IngredientDetail.css'

export default function IngredientDetailPage() {
  const { slug } = useParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const ingredient = ingredients.find((i) => i.slug === slug)
  const detail = ingredientDetails[slug] || defaultIngredientDetail

  useEffect(() => {
    let mounted = true
    setLoading(true)

    productsApi
      .list({ limit: 200 })
      .then((res) => {
        if (!mounted) return
        const all = res.products || []
        const name = (ingredient?.name || slug || '').toLowerCase()
        const matched = all.filter((p) =>
          (p.ingredients || []).some((tag) => (tag || '').toLowerCase().includes(name))
        )
        setProducts(matched)
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
  }, [slug, ingredient?.name])

  if (!ingredient) {
    return (
      <section className="container" style={{ padding: '5rem 1rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--green)', marginBottom: '.75rem' }}>Ingredient Not Found</h2>
        <p style={{ marginBottom: '1.5rem' }}>This herb may have been renamed or removed.</p>
        <Link to="/ingredients" className="btn btn-green">Browse All Ingredients</Link>
      </section>
    )
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="product-breadcrumb">
        <div className="container">
          <Link to="/">Home</Link>
          <span> / </span>
          <Link to="/ingredients">Ingredients</Link>
          <span> / </span>
          <span>{ingredient.name}</span>
        </div>
      </div>

      {/* Main ingredient detail area */}
      <section className="container ingredient-detail">
        <div className="ingredient-detail-img-col">
          <div className="ingredient-detail-img-wrap">
            <img src={ingredient.img} alt={ingredient.name} className="ingredient-detail-img" />
          </div>
        </div>

        <div className="ingredient-detail-info-col">
          <span className="ingredient-detail-eyebrow">Know Your Herb</span>
          <h1 className="ingredient-detail-title">{ingredient.name}</h1>
          <p className="ingredient-detail-tagline">{detail.tagline}</p>

          <div className="ingredient-detail-tags">
            {ingredient.benefits.split('·').map((tag, i) => (
              <span className="ingredient-tag" key={i}>{tag.trim()}</span>
            ))}
          </div>

          <p className="ingredient-detail-desc">{detail.description}</p>

          <div className="ingredient-detail-benefits">
            <h3>Key Benefits</h3>
            <ul>
              {detail.benefits.map((b, i) => (
                <li key={i}>✓ {b}</li>
              ))}
            </ul>
          </div>

          <div className="ingredient-detail-usage">
            <h3>How It's Typically Used</h3>
            <p>{detail.usage}</p>
          </div>

          <Link to={`/shop?ingredient=${ingredient.slug}`} className="btn btn-gold" style={{ marginTop: '1rem' }}>
            Shop Products with {ingredient.name}
          </Link>
        </div>
      </section>

      {/* Products containing this ingredient */}
      <section className="section bg-light">
        <div className="container">
          <div className="sec-head">
            <span className="eyebrow">Made With {ingredient.name}</span>
            <h2>Products Featuring This Herb</h2>
          </div>

          {loading ? (
            <div className="related-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="product-card" style={{ opacity: 0.35 }} />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="related-grid">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="shop-empty">
              <p>No products tagged with this ingredient yet.</p>
              <Link to="/shop" className="btn btn-outline" style={{ marginTop: '1rem' }}>Browse All Products</Link>
            </div>
          )}
        </div>
      </section>
    </>
  )
}