import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'

// Normalizes a backend product doc (_id, images[]) into the shape the
// rest of the storefront expects (id, image) — same fields Productcard.jsx
// relies on, so Add to Cart / Buy Now behave identically everywhere.
function normalize(product) {
  return {
    id: product._id || product.id,
    name: product.name,
    image: product.images?.[0] || product.image || '',
    price: product.price,
    oldPrice: product.oldPrice,
    slug: product.slug,
    description: product.shortDescription || product.description || '',
    ratingsAverage: product.ratingsAverage || 0,
    ratingsQuantity: product.ratingsQuantity || 0,
  }
}

function Stars({ value }) {
  const rounded = Math.round(value || 0)
  return (
    <span className="chatbot-product__stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={13} fill={n <= rounded ? '#d4a017' : 'none'} color="#d4a017" />
      ))}
    </span>
  )
}

export default function ProductRecommendation({ products = [] }) {
  const { addToCart } = useCart()
  const navigate = useNavigate()

  if (!products.length) return null

  const handleAddToCart = (product) => addToCart(product)

  const handleBuyNow = (product) => {
    addToCart(product)
    navigate('/checkout')
  }

  return (
    <div className="chatbot-product-list">
      {products.map((raw) => {
        const product = normalize(raw)
        return (
          <div className="chatbot-product-card" key={product.id}>
            <img className="chatbot-product-card__img" src={product.image} alt={product.name} loading="lazy" />
            <div className="chatbot-product-card__body">
              <div className="chatbot-product-card__name">{product.name}</div>
              <Stars value={product.ratingsAverage} />
              {product.description && (
                <p className="chatbot-product-card__desc">{product.description}</p>
              )}
              <div className="chatbot-product-card__price">
                <span className="chatbot-product-card__price-now">₹{product.price}</span>
                {product.oldPrice > product.price && (
                  <span className="chatbot-product-card__price-old">₹{product.oldPrice}</span>
                )}
              </div>
              <div className="chatbot-product-card__actions">
                <button
                  className="chatbot-product-card__btn chatbot-product-card__btn--ghost"
                  onClick={() => navigate(`/product/${product.slug}`)}
                >
                  View
                </button>
                <button
                  className="chatbot-product-card__btn chatbot-product-card__btn--outline"
                  onClick={() => handleAddToCart(product)}
                >
                  Add to Cart
                </button>
                <button
                  className="chatbot-product-card__btn chatbot-product-card__btn--solid"
                  onClick={() => handleBuyNow(product)}
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
