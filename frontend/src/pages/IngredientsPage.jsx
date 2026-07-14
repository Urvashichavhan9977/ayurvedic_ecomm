import { Link } from 'react-router-dom'
import { Leaf, Sprout } from 'lucide-react'
import { ingredients } from '../data/products.js'
import { ingredientDetails, defaultIngredientDetail } from '../data/ingredientDetails.js'
import '../styles/pages/Ingredients.css'

export default function IngredientsPage() {
  return (
    <>
      <section className="ingredients-hero">
        {/* floating decorative herbs */}
        <div className="hero-leaf leaf-1"><Leaf size={34} /></div>
        <div className="hero-leaf leaf-2"><Sprout size={28} /></div>
        <div className="hero-leaf leaf-3"><Leaf size={40} /></div>
        <div className="hero-leaf leaf-4"><Sprout size={26} /></div>
        <div className="hero-leaf leaf-5"><Leaf size={22} /></div>

        <div className="container">
          <span className="eyebrow">Nature's Pharmacy</span>
          <h1>The herbs we <em>trust</em></h1>
          <p>Every formulation begins with whole, traceable herbs — chosen for their potency and prepared with care.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="sec-head">
            <span className="eyebrow">Know Your Herbs</span>
            <h2>Shop by Ingredient</h2>
            <p>Click any herb to see its full benefits, or shop products made with it</p>
          </div>

          <div className="ingredients-grid">
            {ingredients.map(item => {
              const detail = ingredientDetails[item.slug] || defaultIngredientDetail
              return (
                <Link
                  to={`/ingredients/${item.slug}`}
                  className="ingredient-card"
                  key={item.id}
                >
                  <div className="ingredient-card-img">
                    <img src={item.img} alt={item.name} loading="lazy" />
                  </div>
                  <div className="ingredient-card-body">
                    <h3>{item.name}</h3>
                    <div className="benefits">{item.benefits}</div>
                    <p>{detail.description}</p>
                    <span className="btn btn-outline" style={{ width: '100%' }}>
                      View Benefits &amp; Details
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Not sure where to begin?</h2>
              <p>Tell us your goals and we'll recommend your perfect ritual.</p>
            </div>
            <Link to="/contact" className="btn btn-gold">Get a Recommendation</Link>
          </div>
        </div>
      </section>
    </>
  )
}