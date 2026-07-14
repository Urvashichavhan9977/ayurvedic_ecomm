import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { categoriesApi } from '../api/categoriesApi.js'
import '../styles/CategoryGrid.css'

export default function CategoryGrid() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    categoriesApi.list()
      .then((data) => { if (!cancelled) setCategories(data) })
      .catch(() => { if (!cancelled) setCategories([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Nothing added in the admin panel yet — show nothing rather than
  // fake/dummy categories.
  if (!loading && categories.length === 0) return null

  return (
    <section className="section">
      <div className="container">
        <div className="sec-head">
          <span className="eyebrow">Browse</span>
          <h2>Shop by Category</h2>
          <p>Explore our wide range of authentic Ayurvedic products</p>
        </div>
        <div className="cat-grid">
          {categories.map(cat => (
            <Link key={cat.id} to={`/shop?category=${cat.slug}`} className="cat-card">
              <div className="cat-card-img">
                <img src={cat.img} alt={cat.name} loading="lazy" />
              </div>
              <div className="cat-card-body">
                <h3>{cat.name}</h3>
                <span className="cat-count">{cat.count}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}