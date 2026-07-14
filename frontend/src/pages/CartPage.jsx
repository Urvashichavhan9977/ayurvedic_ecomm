import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import '../styles/pages/Cart.css'

export default function CartPage() {
  const { cart, removeFromCart, updateQty, cartTotal } = useCart()
  const navigate = useNavigate()

  const shipping = cartTotal >= 999 || cartTotal === 0 ? 0 : 60
  const grandTotal = cartTotal + shipping

  if (cart.length === 0) {
    return (
      <section className="container cart-empty">
        <div className="icon">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything to your cart yet.</p>
        <Link to="/shop" className="btn btn-green">Start Shopping</Link>
      </section>
    )
  }

  return (
    <section className="container cart-page">
      <div className="sec-head" style={{ textAlign: 'left', marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: 0 }}>Your Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})</h2>
      </div>

      <div className="cart-grid">
        <div className="cart-items">
          {cart.map(item => (
            <div className="cart-item" key={item.id}>
              <img src={item.img} alt={item.name} />
              <div className="cart-item-body">
                <h4>{item.name}</h4>
                <span className="price">₹{item.price} each</span>
                <div className="cart-item-actions">
                  <div className="qty-stepper">
                    <button onClick={() => updateQty(item.id, item.qty - 1)} aria-label="Decrease">−</button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} aria-label="Increase">+</button>
                  </div>
                  <button className="cart-remove-btn" onClick={() => removeFromCart(item.id)}>Remove</button>
                </div>
              </div>
              <div className="cart-item-total">₹{item.price * item.qty}</div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{cartTotal}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>₹{grandTotal}</span>
          </div>
          <button className="btn btn-gold" onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
          <Link to="/shop" className="btn btn-outline" style={{ width: '100%', marginTop: '.75rem' }}>Continue Shopping</Link>
        </div>
      </div>
    </section>
  )
}
