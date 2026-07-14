import { useEffect, useRef, useState } from 'react'
import { useLocation, useParams, Link } from 'react-router-dom'
import { Search, Truck, Phone, MessageCircle, Mail, Check, Store } from 'lucide-react'
import { ordersApi } from '../api/ordersApi'
import { useAuth } from '../context/AuthContext.jsx'
import ProductCard from '../Component/Productcard.jsx'
import '../styles/pages/Checkout.css'
import '../styles/pages/TrackOrder.css'
import '../styles/pages/Product.css'

// Real order-lifecycle stages this timeline visualizes. Special statuses
// (Cancelled / Returned / Out of Stock) are shown as a standalone banner
// instead of a position on this happy-path timeline.
const STAGES = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered']
const ISSUE_STATUSES = ['Cancelled', 'Returned', 'Out of Stock']

// How often to silently re-fetch the order while this page stays open, so
// an Admin/Vendor status update shows up here without the customer having
// to refresh the page themselves.
const LIVE_REFRESH_MS = 15000

const isCod = (order) => order?.paymentMethod === 'cod'

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export default function TrackOrderPage() {
  const location = useLocation()
  const { orderId: routeOrderId } = useParams()
  const { isAuthenticated } = useAuth()
  // The customer never types a Tracking ID. The order to show comes
  // straight from the URL (clicked "Track Order" in My Orders, or the
  // redirect right after checkout) — falling back to router state only
  // for older links that still pass the order this way.
  const targetOrderId = routeOrderId || location.state?.order?.id || ''

  const [order, setOrder] = useState(null)
  const [recommendedProducts, setRecommendedProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pollRef = useRef(null)

  const fetchOrder = async (orderId, { silent = false } = {}) => {
    if (!orderId || !orderId.trim()) return
    if (!silent) {
      setLoading(true)
      setError('')
    }
    try {
      const res = await ordersApi.getByOrderId(orderId.trim())
      setOrder(res.order)
      setRecommendedProducts(res.recommendedProducts || [])
    } catch (err) {
      if (!silent) {
        setOrder(null)
        setError(err.message || 'No order found. Please check the details and try again.')
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !targetOrderId) return undefined

    fetchOrder(targetOrderId)

    // Keep the tracking timeline live: whenever the Admin or Vendor moves
    // this order forward, the customer sees it here automatically.
    pollRef.current = setInterval(() => {
      fetchOrder(targetOrderId, { silent: true })
    }, LIVE_REFRESH_MS)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, targetOrderId])

  if (!isAuthenticated) {
    return (
      <section className="container track-order-page">
        <div className="track-hero">
          <h1>Track Your Order</h1>
          <p>Stay updated on your Ayurvedic essentials, every step of the way.</p>
        </div>
        <div className="track-empty">
          <Search size={32} />
          <p>Please sign in to track your orders.</p>
          <Link to="/login" className="btn btn-green ripple" style={{ marginTop: '1rem' }}>Sign In</Link>
        </div>
      </section>
    )
  }

  const currentStageIndex = order ? STAGES.indexOf(order.orderStatus) : -1
  const hasIssue = order && ISSUE_STATUSES.includes(order.orderStatus)

  return (
    <section className="container track-order-page">
      <div className="track-hero">
        <h1>Track Your Order</h1>
        <p>Stay updated on your Ayurvedic essentials, every step of the way.</p>
      </div>

      {loading && (
        <div className="track-empty">
          <Search size={32} />
          <p>Loading your order details…</p>
        </div>
      )}

      {!order && !loading && (
        <div className="track-empty">
          <Search size={32} />
          <p>
            {targetOrderId
              ? (error || 'No order found. Please check My Orders and try again.')
              : 'Open "Track Order" from My Orders to see live tracking for that order.'}
          </p>
          <Link to="/profile" className="btn btn-outline" style={{ marginTop: '1rem' }}>View My Orders</Link>
        </div>
      )}

      {order && (
        <div className="track-result fade-in">
          <div className="track-order-card glass-card">
            <div className="track-order-head">
              <div>
                <span className="od-label">Order ID</span>
                <span className="od-value">{order.orderId}</span>
              </div>
              <div>
                <span className="od-label">Order Date</span>
                <span className="od-value">{formatDate(order.createdAt)}</span>
              </div>
              <div>
                <span className="od-label">Payment Method</span>
                <span className="od-value" style={{ textTransform: 'capitalize' }}>{order.paymentMethod}</span>
              </div>
              <div>
                <span className="od-label">Shipping Partner</span>
                <span className="od-value">{order.shippingPartner || 'Amrita Express'}</span>
              </div>
              <div>
                <span className="od-label">Tracking Number</span>
                <span className="od-value">{order.trackingId || `TRK${order.orderId.replace('AYU', '')}`}</span>
              </div>
              {order.courierName && (
                <div>
                  <span className="od-label">Courier Name</span>
                  <span className="od-value">{order.courierName}</span>
                </div>
              )}
            </div>

            {order.estimatedDelivery && !hasIssue && (
              <div className="track-countdown">
                <Truck size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Expected Delivery: <strong>{formatDate(order.estimatedDelivery)}</strong>
              </div>
            )}

            {/* TIMELINE */}
            {hasIssue ? (
              <div
                className="track-cod-note"
                style={{
                  marginTop: '1rem',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: order.orderStatus === 'Cancelled' ? '#c0392b' : '#b8860b',
                }}
              >
                This order is currently marked "{order.orderStatus}". Contact support if you have questions.
              </div>
            ) : (
              <div className="track-timeline">
                {STAGES.map((stage, i) => (
                  <div
                    key={stage}
                    className={`track-stage ${i < currentStageIndex ? 'done' : ''} ${i === currentStageIndex ? 'current' : ''}`}
                  >
                    <div className="track-dot">
                      {i < currentStageIndex && <Check size={14} strokeWidth={3} />}
                      {i === currentStageIndex && <span className="track-dot-active" />}
                    </div>
                    <span className="track-stage-label">{stage}</span>
                  </div>
                ))}
              </div>
            )}

            {isCod(order) && !hasIssue && (
              <p className="track-cod-note" style={{ fontSize: '0.85rem', color: '#7a7a7a', marginTop: '0.75rem' }}>
                This is a Cash on Delivery order — packing &amp; shipping updates will appear here as they happen.
              </p>
            )}

            <div className="track-address-row">
              <div>
                <span className="od-label">Delivery Address</span>
                <p className="track-address-text">
                  {order.shippingAddress?.name}, {order.shippingAddress?.line1} {order.shippingAddress?.line2},<br />
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                </p>
              </div>
            </div>

            <h4 style={{ marginTop: '1.5rem' }}>Ordered Products</h4>
            <div className="track-products">
              {order.orderItems?.map((item, idx) => (
                <div className="track-product-item" key={idx}>
                  <img src={item.image || '/placeholder-product.png'} alt={item.name} />
                  <div style={{ flex: 1 }}>
                    <div className="track-product-name">{item.name}</div>
                    <div className="track-product-qty">Qty: {item.qty} &nbsp;|&nbsp; ₹{item.price * item.qty}</div>
                    {/* Every product — platform's own or a marketplace seller's —
                        shows its own real tracking status here. */}
                    <div className="track-product-vendor-status">
                      {item.vendor ? (
                        <>
                          <Store size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                          Marketplace seller · Status: <strong>{item.vendorItemStatus}</strong>
                          {(item.trackingNumber || item.courierName) && (
                            <div style={{ fontSize: '0.78rem', marginTop: 2 }}>
                              {item.courierName && <>Courier: <strong>{item.courierName}</strong>{item.trackingNumber ? ' · ' : ''}</>}
                              {item.trackingNumber && <>Tracking: <strong>{item.trackingNumber}</strong></>}
                            </div>
                          )}
                        </>
                      ) : (
                        <>Sold by Amrita Ayurveda · Status: <strong>{order.orderStatus}</strong></>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="track-side">
            <div className="track-illustration glass-card">
              <div className="truck-anim"><Truck size={40} /></div>
              <p>
                {hasIssue
                  ? `Order ${order.orderStatus}`
                  : isCod(order) ? 'Your order is confirmed!' : 'Your order is on its way!'}
              </p>
            </div>

            <div className="checkout-summary-box glass-card">
              <h4>Need Help?</h4>
              <div className="help-row"><Phone size={16} /> Customer Care: 1800-571-1751</div>
              <div className="help-row"><MessageCircle size={16} /> WhatsApp Support: +91 98765 43210</div>
              <div className="help-row"><Mail size={16} /> Email: support@amritaayurveda.com</div>
              <Link to="/shop" className="btn btn-outline" style={{ width: '100%', marginTop: '1rem' }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Continue Shopping — same category first, then Best Sellers /
          Latest Products, straight from MongoDB via the order API. */}
      {order && recommendedProducts.length > 0 && (
        <section style={{ marginTop: '2.5rem' }}>
          <div className="sec-head">
            <span className="eyebrow">Continue Shopping</span>
            <h2>You May Also Like</h2>
          </div>
          <div className="related-grid">
            {recommendedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </section>
  )
}
