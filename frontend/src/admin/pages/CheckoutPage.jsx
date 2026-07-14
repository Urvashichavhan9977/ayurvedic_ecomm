import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import '../styles/pages/Checkout.css'

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: '📲' },
  { id: 'gpay', label: 'Google Pay', icon: '🟢' },
  { id: 'phonepe', label: 'PhonePe', icon: '🟣' },
  { id: 'paytm', label: 'Paytm', icon: '🔵' },
  { id: 'credit', label: 'Credit Card', icon: '💳' },
  { id: 'debit', label: 'Debit Card', icon: '💳' },
  { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
  { id: 'wallet', label: 'Wallet', icon: '👛' },
  { id: 'cod', label: 'Cash on Delivery', icon: '💵' },
]

const STEP_LABELS = ['Login', 'Delivery Address', 'Payment', 'Success']

function generateOrderId() {
  return 'AYU' + Math.floor(100000 + Math.random() * 900000)
}

function estimatedDelivery() {
  const d = new Date()
  d.setDate(d.getDate() + 4)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function CheckoutPage() {
  const { isAuthenticated } = useAuth()
  const { cart, cartTotal, clearCart } = useCart()
  const navigate = useNavigate()

  const [step, setStep] = useState(isAuthenticated ? 2 : 1)
  const [address, setAddress] = useState({
    name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', landmark: '', type: 'Home',
  })
  const [saveAddress, setSaveAddress] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [finalOrder, setFinalOrder] = useState(null)

  // existing coupon state kept (logic untouched, UI removed per request)
  const [coupon, setCoupon] = useState('')
  const [discount] = useState(0)
  const [appliedCoupon] = useState('')

  const shipping = cartTotal >= 999 ? 0 : 60
  const total = Math.max(0, cartTotal + shipping - discount)

  if (cart.length === 0 && step < 4) {
    return (
      <section className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--ayur-green)', marginBottom: '.75rem' }}>Your cart is empty</h2>
        <p style={{ color: 'var(--ayur-muted)', marginBottom: '1.5rem' }}>Add some products before checking out.</p>
        <Link to="/shop" className="btn btn-green">Browse Products</Link>
      </section>
    )
  }

  const handleAddressSubmit = (e) => {
    e.preventDefault()
    setStep(3)
  }

  const handlePlaceOrder = () => {
    setFinalOrder({
      id: generateOrderId(),
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      delivery: estimatedDelivery(),
      items: cart,
      subtotal: cartTotal,
      shipping,
      discount,
      coupon: appliedCoupon,
      total,
      paymentMethod,
      address,
    })
    clearCart()
    setStep(4)
  }

  return (
    <section className="ayur-checkout">
      {/* ============ PROMO HERO BANNER ============ */}
      {step < 4 && (
        <div className="ayur-hero">
          <div className="container ayur-hero-inner">
            <div className="ayur-hero-text">
              <span className="ayur-eyebrow">Amrita Ayurveda</span>
              <h1>Experience Pure Ayurveda</h1>
              <p>100% Authentic Herbal Products Crafted with Nature</p>
              <Link to="/shop" className="btn btn-outline-gold">Continue Shopping</Link>

              <div className="ayur-features">
                <div className="ayur-feature"><span>🌿</span> 100% Ayurvedic</div>
                <div className="ayur-feature"><span>🚚</span> Free Delivery above ₹499</div>
                <div className="ayur-feature"><span>🔒</span> Secure Payment</div>
                <div className="ayur-feature"><span>↩️</span> Easy Returns</div>
                <div className="ayur-feature"><span>🎧</span> Expert Support</div>
              </div>
            </div>
            <div className="ayur-hero-art" aria-hidden="true">
              <div className="ayur-leaf leaf-1">🌿</div>
              <div className="ayur-leaf leaf-2">🍃</div>
              <div className="ayur-mortar">⚱️</div>
              <div className="ayur-leaf leaf-3">🌱</div>
            </div>
          </div>
        </div>
      )}

      <div className="container checkout-page">
        {/* ============ STEP PROGRESS ============ */}
        <div className="checkout-steps">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className={`checkout-step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`}>
              <span className="step-num">{step > i + 1 ? '✓' : i + 1}</span>
              <span className="step-label">{label}</span>
            </div>
          ))}
        </div>

        {/* ============ STEP 1 — LOGIN ============ */}
        {step === 1 && (
          <div className="checkout-grid login-grid fade-in">
            <div className="checkout-card glass-card">
              <h3>Sign in to continue</h3>
              <div className="field">
                <label>Email / Mobile</label>
                <input placeholder="Enter email or mobile number" />
              </div>
              <div className="field">
                <label>Password</label>
                <input type="password" placeholder="Enter your password" />
              </div>
              <Link to="#" className="forgot-link">Forgot password?</Link>

              <button type="button" className="btn btn-green ripple" style={{ width: '100%', marginTop: '1rem' }}>
                Login
              </button>

              <div className="divider"><span>or continue with</span></div>

              <div className="social-row">
                <button type="button" className="btn btn-social google">G&nbsp; Google</button>
                <button type="button" className="btn btn-social facebook">f&nbsp; Facebook</button>
              </div>
              <button
                type="button"
                className="btn btn-text"
                style={{ width: '100%', marginTop: '1rem' }}
                onClick={() => setStep(2)}
              >
                Checkout as Guest →
              </button>
            </div>

            <div className="login-side">
              <div className="checkout-card glass-card new-customer-card">
                <h4>New to Amrita Ayurveda?</h4>
                <ul className="benefit-list">
                  <li>⚡ Faster Checkout</li>
                  <li>📦 Track Orders Easily</li>
                  <li>🎁 Exclusive Offers</li>
                </ul>
                <Link to="/signup" className="btn btn-gold ripple" style={{ width: '100%' }}>Create Account</Link>
              </div>

              <div className="checkout-summary-box glass-card">
                <h4>Order Summary</h4>
                {cart.map(item => (
                  <div className="checkout-mini-item" key={item.id}>
                    <span>{item.name} × {item.qty}</span>
                    <span>₹{item.price * item.qty}</span>
                  </div>
                ))}
                <div className="checkout-mini-item total-row">
                  <span>Total</span>
                  <span>₹{cartTotal + shipping}</span>
                </div>
                <div className="trust-badges">
                  <span>🔒 Secure Payment</span>
                  <span>↩️ Easy Returns</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ STEP 2 — ADDRESS ============ */}
        {step === 2 && (
          <div className="checkout-grid fade-in">
            <form className="checkout-card glass-card" onSubmit={handleAddressSubmit}>
              <div className="card-head-row">
                <h3>Delivery Address</h3>
                <button type="button" className="btn btn-text-sm">📍 Detect My Location</button>
              </div>

              <div className="form-row">
                <div className="field">
                  <label>Full Name</label>
                  <input required value={address.name} onChange={e => setAddress({ ...address, name: e.target.value })} />
                </div>
                <div className="field">
                  <label>Mobile</label>
                  <input required value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })} />
                </div>
              </div>

              <div className="field">
                <label>Pincode</label>
                <input required value={address.pincode} onChange={e => setAddress({ ...address, pincode: e.target.value })} />
              </div>

              <div className="field">
                <label>Address Line 1</label>
                <input required value={address.line1} onChange={e => setAddress({ ...address, line1: e.target.value })} />
              </div>
              <div className="field">
                <label>Address Line 2</label>
                <input value={address.line2} onChange={e => setAddress({ ...address, line2: e.target.value })} />
              </div>

              <div className="form-row">
                <div className="field">
                  <label>City</label>
                  <input required value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} />
                </div>
                <div className="field">
                  <label>State</label>
                  <input required value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} />
                </div>
              </div>

              <div className="field">
                <label>Landmark (optional)</label>
                <input value={address.landmark} onChange={e => setAddress({ ...address, landmark: e.target.value })} />
              </div>

              <div className="field">
                <label>Address Type</label>
                <div className="addr-type-row">
                  {['Home', 'Office'].map(t => (
                    <button
                      type="button"
                      key={t}
                      className={`addr-type-btn ${address.type === t ? 'selected' : ''}`}
                      onClick={() => setAddress({ ...address, type: t })}
                    >
                      {t === 'Home' ? '🏠' : '🏢'} {t}
                    </button>
                  ))}
                </div>
              </div>

              <label className="checkbox-row">
                <input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} />
                Save this address for future orders
              </label>

              <button type="submit" className="btn btn-green ripple" style={{ width: '100%' }}>Continue to Payment</button>
            </form>

            <div className="checkout-summary-box glass-card sticky-summary">
              <h4>Order Summary</h4>
              {cart.map(item => (
                <div className="checkout-mini-item" key={item.id}>
                  <span>{item.name} × {item.qty}</span>
                  <span>₹{item.price * item.qty}</span>
                </div>
              ))}
              <div className="checkout-mini-item"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
              <div className="checkout-mini-item total-row">
                <span>Total</span>
                <span>₹{cartTotal + shipping}</span>
              </div>
              <div className="trust-badges">
                <span>🔒 Secure Payment</span>
                <span>↩️ Easy Returns</span>
              </div>
            </div>
          </div>
        )}

        {/* ============ STEP 3 — PAYMENT ============ */}
        {step === 3 && (
          <div className="checkout-grid fade-in">
            <div className="checkout-card glass-card">
              <h3>Payment Method</h3>
              <div className="payment-options">
                {PAYMENT_METHODS.map(opt => (
                  <div
                    key={opt.id}
                    className={`payment-opt ${paymentMethod === opt.id ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod(opt.id)}
                  >
                    <span className="payment-icon">{opt.icon}</span>
                    {opt.label}
                  </div>
                ))}
              </div>

              {paymentMethod === 'upi' && (
                <div className="upi-qr-box">
                  <div className="qr-placeholder">
                    <svg viewBox="0 0 100 100" width="120" height="120">
                      <rect width="100" height="100" fill="#fff" />
                      <rect x="6" y="6" width="22" height="22" fill="#1B5E20" />
                      <rect x="72" y="6" width="22" height="22" fill="#1B5E20" />
                      <rect x="6" y="72" width="22" height="22" fill="#1B5E20" />
                      <rect x="40" y="40" width="20" height="20" fill="#1B5E20" />
                      <rect x="40" y="6" width="10" height="10" fill="#1B5E20" />
                      <rect x="60" y="40" width="10" height="30" fill="#1B5E20" />
                      <rect x="20" y="40" width="10" height="10" fill="#1B5E20" />
                      <rect x="76" y="60" width="10" height="10" fill="#1B5E20" />
                    </svg>
                  </div>
                  <p>Scan with any UPI app to pay <strong>₹{total}</strong></p>
                </div>
              )}

              <div className="security-badge">
                <span>🔐</span> 100% Secure Payments — SSL Encrypted
              </div>

              <button className="btn btn-gold ripple" style={{ width: '100%' }} onClick={handlePlaceOrder}>
                Place Order — ₹{total}
              </button>
            </div>

            <div className="checkout-summary-box glass-card sticky-summary">
              <h4>Order Summary</h4>
              <div className="checkout-mini-item"><span>Subtotal</span><span>₹{cartTotal}</span></div>
              <div className="checkout-mini-item"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
              <div className="checkout-mini-item total-row">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
              <div className="trust-badges">
                <span>🔒 Secure Payment</span>
                <span>↩️ Easy Returns</span>
              </div>
            </div>
          </div>
        )}

        {/* ============ STEP 4 — SUCCESS ============ */}
        {step === 4 && finalOrder && (
          <div className="success-page fade-in">
            <div className="confetti" aria-hidden="true">
              {Array.from({ length: 18 }).map((_, i) => <span key={i} className={`confetti-piece c${i % 6}`} />)}
            </div>

            <div className="success-icon-wrap">
              <div className="success-icon-circle">✓</div>
            </div>
            <h1>Order Placed Successfully!</h1>
            <p className="success-sub">
              Thank you for shopping with Amrita Ayurveda. A confirmation has been sent to your email.
            </p>

            <div className="checkout-summary-box glass-card order-detail-box">
              <div className="order-detail-grid">
                <div><span className="od-label">Order ID</span><span className="od-value">{finalOrder.id}</span></div>
                <div><span className="od-label">Order Date</span><span className="od-value">{finalOrder.date}</span></div>
                <div><span className="od-label">Payment Method</span><span className="od-value" style={{ textTransform: 'capitalize' }}>{finalOrder.paymentMethod}</span></div>
                <div><span className="od-label">Est. Delivery</span><span className="od-value">{finalOrder.delivery}</span></div>
              </div>

              <h4 style={{ marginTop: '1.25rem' }}>Order Summary</h4>
              <div className="checkout-mini-item"><span>Subtotal</span><span>₹{finalOrder.subtotal}</span></div>
              <div className="checkout-mini-item"><span>Shipping</span><span>{finalOrder.shipping === 0 ? 'Free' : `₹${finalOrder.shipping}`}</span></div>
              <div className="checkout-mini-item total-row">
                <span>Total Paid</span>
                <span>₹{finalOrder.total}</span>
              </div>
            </div>

            <div className="success-actions">
              <button
                className="btn btn-green ripple"
                onClick={() => navigate('/track-order', { state: { order: finalOrder } })}
              >
                Track Your Order
              </button>
              <Link to="/shop" className="btn btn-outline">Continue Shopping</Link>
            </div>

            <div className="success-decor" aria-hidden="true">🌿 🍃 🌱</div>
          </div>
        )}
      </div>
    </section>
  )
}