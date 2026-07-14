import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { categoriesApi } from '../api/categoriesApi'
import { PLACEHOLDER_IMAGE, handleImageError } from '../utils/imageFallback.js'
import '../styles/CategoryGrid.css'

export default function CategoryGrid() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    categoriesApi
      .list()
      .then((data) => {
        if (mounted) setCategories(data.filter(Boolean))
      })
      .catch(() => {
        if (mounted) setCategories([])
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  if (!loading && categories.length === 0) return null

  // Duplicate the list so the marquee loop is seamless (scrolls -50%,
  // which lands exactly back on the start of the duplicated set).
  const loopCategories = [...categories, ...categories]

  return (
    <section className="section">
      <div className="container">
        <div className="sec-head">
          <span className="eyebrow">Browse</span>
          <h2>Shop by Category</h2>
          <p>Explore our wide range of authentic Ayurvedic products</p>
        </div>

        <div className="cat-slider-wrap">
          <div className="cat-grid">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="cat-card" style={{ opacity: 0.4 }}>
                    <div className="cat-card-img" />
                    <div className="cat-card-body">
                      <h3>&nbsp;</h3>
                    </div>
                  </div>
                ))
              : loopCategories.map((cat, i) => (
                  <Link key={`${cat.id}-${i}`} to={`/shop?category=${cat.slug}`} className="cat-card">
                    <div className="cat-card-img">
                      <img src={cat.img || PLACEHOLDER_IMAGE} alt={cat.name} loading="lazy" onError={handleImageError} />
                    </div>
                    <div className="cat-card-body">
                      <h3>{cat.name}</h3>
                      <span className="cat-count">{cat.count}</span>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </div>
    </section>
  )
}