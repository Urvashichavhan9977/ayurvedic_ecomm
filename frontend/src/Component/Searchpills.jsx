import { Link } from 'react-router-dom'
import { searchPills } from '../data/products.js'
import '../styles/SearchPills.css'

export default function SearchPills() {
  return (
    <section className="section">
      <div className="container">
        <div className="sec-head">
          <span className="eyebrow">Trending Searches</span>
          <h2>Most Searched Products</h2>
        </div>
        <div className="pills-wrap">
          {searchPills.map((pill, i) => (
            <Link key={i} to={`/shop?search=${pill.search}`} className="pill">
              {pill.emoji} {pill.text}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}