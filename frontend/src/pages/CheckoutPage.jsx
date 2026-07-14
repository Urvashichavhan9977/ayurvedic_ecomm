import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { ordersApi } from '../api/ordersApi.js'
import '../styles/pages/Checkout.css'
import {
  Smartphone,
  Wallet,
  Zap,
  CreditCard,
  Landmark,
  PiggyBank,
  Banknote,
  Leaf,
  Sprout,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Package,
  Gift,
  MapPin,
  Home as HomeIcon,
  Building2,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: Smartphone },
  { id: 'gpay', label: 'Google Pay', icon: Wallet },
  { id: 'phonepe', label: 'PhonePe', icon: Zap },
  { id: 'paytm', label: 'Paytm', icon: Wallet },
  { id: 'credit', label: 'Credit Card', icon: CreditCard },
  { id: 'debit', label: 'Debit Card', icon: CreditCard },
  { id: 'netbanking', label: 'Net Banking', icon: Landmark },
  { id: 'wallet', label: 'Wallet', icon: PiggyBank },
  { id: 'cod', label: 'Cash on Delivery', icon: Banknote },
]

// All online methods open the same Razorpay Checkout widget — Razorpay
// itself shows the right tab (UPI / card / netbanking / wallet) based on
// this hint, but the shopper can still switch inside the popup.
const RAZORPAY_METHOD_HINT = {
  upi: 'upi',
  gpay: 'upi',
  phonepe: 'upi',
  paytm: 'upi',
  credit: 'card',
  debit: 'card',
  netbanking: 'netbanking',
  wallet: 'wallet',
}

const STEP_LABELS = ['Login', 'Delivery Address', 'Payment', 'Success']

function estimatedDelivery() {
  const d = new Date()
  d.setDate(d.getDate() + 4)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date()
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function CheckoutPage() {
  const { isAuthenticated, user } = useAuth()
  const { cart, cartTotal, clearCart } = useCart()
  const navigate = useNavigate()

  const [step, setStep] = useState(isAuthenticated ? 2 : 1)
  const [address, setAddress] = useState({
    name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', landmark: '', type: 'Home',
  })
  const [saveAddress, setSaveAddress] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [finalOrder, setFinalOrder] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [payError, setPayError] = useState('')

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

  // Builds the minimal cart payload the backend needs — id + qty only.
  // Price, name, image are re-derived server-side from the DB so a
  // tampered client payload can never change what gets charged.
  const buildItemsPayload = () => cart.map((item) => ({ id: item.id, qty: item.qty }))

  // Shared shape builder used by both the online-payment success screen
  // and the COD direct-to-tracking flow.
  const buildFinalOrder = (order) => ({
    id: order.orderId,
    date: formatDate(order.createdAt),
    delivery: estimatedDelivery(),
    items: cart,
    subtotal: order.itemsPrice,
    shipping: order.shippingPrice,
    discount: order.discountPrice || 0,
    coupon: appliedCoupon,
    total: order.totalPrice,
    paymentMethod: order.paymentMethod,
    address: order.shippingAddress,
  })

  // Online payments (Razorpay): payment → verified → show the
  // "Order Placed Successfully" step so the shopper sees their payment
  // went through, then they move on to the tracking page from there.
  const finalizeOrder = (order) => {
    setFinalOrder(buildFinalOrder(order))
    clearCart()
    setStep(4)
  }

  // Cash on Delivery: nothing was paid online, so skip the payment
  // success screen entirely and go straight to the tracking page.
  const finalizeCodOrder = (order) => {
    const orderData = buildFinalOrder(order)
    clearCart()
    navigate(`/track-order/${orderData.id}`, { state: { order: orderData } })
  }

  const openRazorpayCheckout = async () => {
    const { key, amount, razorpayOrder } = await ordersApi.createRazorpayOrder({
      items: buildItemsPayload(),
      address,
    })

    if (!window.Razorpay) {
      setPayError('Payment SDK failed to load. Please check your internet connection and try again.')
      setPlacing(false)
      return
    }

    const rzp = new window.Razorpay({
      key,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      order_id: razorpayOrder.id,
      name: 'Amrita Ayurveda',
      description: `Order payment — ₹${amount}`,
      method: RAZORPAY_METHOD_HINT[paymentMethod]
        ? { [RAZORPAY_METHOD_HINT[paymentMethod]]: true }
        : undefined,
      prefill: {
        name: address.name,
        contact: address.phone,
        email: user?.email || '',
      },
      theme: { color: '#1a3a28' },
      handler: async (response) => {
        try {
          setPlacing(true)
          const verifyRes = await ordersApi.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            items: buildItemsPayload(),
            address,
            paymentMethod,
          })
          finalizeOrder(verifyRes.order)
        } catch (err) {
          setPayError(err.message || 'Payment succeeded but verification failed. Please contact support with your payment ID.')
        } finally {
          setPlacing(false)
        }
      },
      modal: {
        ondismiss: () => setPlacing(false),
      },
    })

    rzp.on('payment.failed', (resp) => {
      setPayError(resp.error?.description || 'Payment failed. Please try again.')
      setPlacing(false)
    })

    rzp.open()
  }

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      setPayError('Please login to place your order.')
      return
    }

    setPayError('')
    setPlacing(true)
    try {
      if (paymentMethod === 'cod') {
        const res = await ordersApi.createCodOrder({ items: buildItemsPayload(), address })
        finalizeCodOrder(res.order)
        setPlacing(false)
      } else {
        // placing stays true until the Razorpay handler/dismiss resolves it
        await openRazorpayCheckout()
      }
    } catch (err) {
      setPayError(err.message || 'Something went wrong while placing your order. Please try again.')
      setPlacing(false)
    }
  }

  // Reusable, responsive order summary block used across steps 1-3
  const renderOrderSummary = ({ sticky = false } = {}) => (
    <div className={`checkout-summary-box glass-card${sticky ? ' sticky-summary' : ''}`}>
      <h4>Order Summary</h4>
      <div className="summary-items-scroll">
        {cart.map(item => (
          <div className="checkout-mini-item" key={item.id}>
            <span className="mini-item-name">{item.name} × {item.qty}</span>
            <span>₹{item.price * item.qty}</span>
          </div>
        ))}
      </div>
      <div className="checkout-mini-item"><span>Subtotal</span><span>₹{cartTotal}</span></div>
      <div className="checkout-mini-item"><span>Shipping Charges</span><span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
      <div className="checkout-mini-item total-row">
        <span>Total</span>
        <span>₹{cartTotal + shipping}</span>
      </div>
      <div className="trust-badges">
        <span><ShieldCheck size={16} /> Secure Payment</span>
        <span><RotateCcw size={16} /> Easy Returns</span>
      </div>
    </div>
  )

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
                <div className="ayur-feature"><Leaf size={18} /> 100% Ayurvedic</div>
                <div className="ayur-feature"><Truck size={18} /> Free Delivery above ₹499</div>
                <div className="ayur-feature"><Lock size={18} /> Secure Payment</div>
                <div className="ayur-feature"><RotateCcw size={18} /> Easy Returns</div>
                <div className="ayur-feature"><Headphones size={18} /> Expert Support</div>
              </div>
            </div>
            <div className="ayur-hero-art" aria-hidden="true">
              <div className="ayur-leaf leaf-1"><Leaf size={32} /></div>
              <div className="ayur-leaf leaf-2"><Sprout size={28} /></div>
              <div className="ayur-mortar"><Leaf size={40} /></div>
              <div className="ayur-leaf leaf-3"><Sprout size={26} /></div>
            </div>
          </div>
        </div>
      )}

      <div className="container checkout-page">
        {/* ============ STEP PROGRESS ============ */}
        <div className="checkout-steps">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className={`checkout-step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`}>
              <span className="step-num">{step > i + 1 ? <CheckCircle2 size={16} /> : i + 1}</span>
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
              <Link to="/login" className="btn btn-text" style={{ width: '100%', marginTop: '1rem', display: 'block', textAlign: 'center' }}>
                Go to Login Page →
              </Link>
            </div>

            <div className="login-side">
              <div className="checkout-card glass-card new-customer-card">
                <h4>New to Amrita Ayurveda?</h4>
                <ul className="benefit-list">
                  <li><Zap size={16} /> Faster Checkout</li>
                  <li><Package size={16} /> Track Orders Easily</li>
                  <li><Gift size={16} /> Exclusive Offers</li>
                </ul>
                <Link to="/signup" className="btn btn-gold ripple" style={{ width: '100%' }}>Create Account</Link>
              </div>

              {renderOrderSummary()}
            </div>
          </div>
        )}

        {/* ============ STEP 2 — ADDRESS ============ */}
        {step === 2 && (
          <div className="checkout-grid fade-in">
            <form className="checkout-card glass-card" onSubmit={handleAddressSubmit}>
              <div className="card-head-row">
                <h3>Delivery Address</h3>
                <button type="button" className="btn btn-text-sm"><MapPin size={16} /> Detect My Location</button>
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
                      {t === 'Home' ? <HomeIcon size={16} /> : <Building2 size={16} />} {t}
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

            {renderOrderSummary({ sticky: true })}
          </div>
        )}

        {/* ============ STEP 3 — PAYMENT ============ */}
        {step === 3 && (
          <div className="checkout-grid fade-in">
            <div className="checkout-card glass-card">
              <h3>Payment Method</h3>
              <div className="payment-options">
                {PAYMENT_METHODS.map(opt => {
                  const Icon = opt.icon
                  return (
                    <div
                      key={opt.id}
                      className={`payment-opt ${paymentMethod === opt.id ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod(opt.id)}
                    >
                      <span className="payment-icon"><Icon size={20} /></span>
                      {opt.label}
                    </div>
                  )
                })}
              </div>

              <div className="security-badge">
                <ShieldCheck size={18} /> 100% Secure Payments — SSL Encrypted
              </div>

              {payError && (
                <div className="security-badge" style={{ background: '#fdecea', color: '#c0392b', marginTop: '.5rem' }}>
                  <AlertCircle size={18} /> {payError}
                </div>
              )}

              <button
                className="btn btn-gold ripple"
                style={{ width: '100%' }}
                onClick={handlePlaceOrder}
                disabled={placing}
              >
                {placing ? 'Processing…' : `Place Order — ₹${total}`}
              </button>
            </div>

            {renderOrderSummary({ sticky: true })}
          </div>
        )}

        {/* ============ STEP 4 — SUCCESS ============ */}
        {step === 4 && finalOrder && (
          <div className="success-page fade-in">
            <div className="confetti" aria-hidden="true">
              {Array.from({ length: 18 }).map((_, i) => <span key={i} className={`confetti-piece c${i % 6}`} />)}
            </div>

            <div className="success-icon-wrap">
              <div className="success-icon-circle"><CheckCircle2 size={40} /></div>
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
              <div className="checkout-mini-item"><span>Shipping Charges</span><span>{finalOrder.shipping === 0 ? 'Free' : `₹${finalOrder.shipping}`}</span></div>
              <div className="checkout-mini-item total-row">
                <span>Total Paid</span>
                <span>₹{finalOrder.total}</span>
              </div>
            </div>

            <div className="success-actions">
              <button
                className="btn btn-green ripple"
                onClick={() => navigate(`/track-order/${finalOrder.id}`, { state: { order: finalOrder } })}
              >
                Track Your Order
              </button>
              <Link to="/shop" className="btn btn-outline">Continue Shopping</Link>
            </div>

            <div className="success-decor" aria-hidden="true"><Leaf size={20} /> <Sprout size={20} /> <Leaf size={20} /></div>
          </div>
        )}
      </div>
    </section>
  )
}