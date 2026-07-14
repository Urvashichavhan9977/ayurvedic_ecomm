import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import ProductCard from '../Component/Productcard.jsx'
import '../styles/pages/Wishlist.css'

export default function WishlistPage() {
  const { wishlist } = useCart()

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">
        <h1>Your Wishlist</h1>

        {wishlist.length === 0 ? (
          <div className="wishlist-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <p>Your wishlist is empty. Tap the heart icon on any product to save it here.</p>
            <Link to="/shop" className="btn btn-green">Browse Products</Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.map(item => (
              <ProductCard
                key={item.id}
                product={{ ...item, priceLabel: `₹${item.price}` }}
                showQuick={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}