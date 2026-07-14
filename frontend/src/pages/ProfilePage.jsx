import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { ordersApi } from '../api/ordersApi'
import ProductCard from '../Component/Productcard.jsx'
import '../styles/pages/Profile.css'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'orders', label: 'Orders' },
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'addresses', label: 'Addresses' },
  { id: 'profile', label: 'Profile' },
  { id: 'password', label: 'Password' },
]

export default function ProfilePage() {
  const { user, logout, isAuthenticated } = useAuth()
  const { wishlist, cart } = useCart()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = TABS.some(t => t.id === searchParams.get('tab')) ? searchParams.get('tab') : 'dashboard'
  const [tab, setTab] = useState(initialTab)
  const navigate = useNavigate()

  // Keep the tab in sync if the URL's ?tab= changes (e.g. clicking the
  // "My Orders" navbar icon while already on the Profile page).
  useEffect(() => {
    const urlTab = searchParams.get('tab')
    if (urlTab && TABS.some(t => t.id === urlTab) && urlTab !== tab) {
      setTab(urlTab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleTabClick = (id) => {
    setTab(id)
    setSearchParams(id === 'dashboard' ? {} : { tab: id })
  }

  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    ordersApi
      .myOrders()
      .then((res) => {
        if (!cancelled) setOrders(res.orders || [])
      })
      .catch((err) => {
        if (!cancelled) setOrdersError(err.message || 'Failed to load your orders.')
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const statusTone = (status) => {
    if (status === 'Delivered') return '#1f8a4c'
    if (status === 'Cancelled' || status === 'Returned' || status === 'Out of Stock') return '#c0392b'
    return '#b8860b'
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!isAuthenticated) {
    return (
      <section className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--green)', marginBottom: '.75rem' }}>You're not signed in</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
          Sign in to view your dashboard, orders, wishlist and saved addresses.
        </p>
        <Link to="/login" className="btn btn-green">Sign In</Link>
      </section>
    )
  }

  return (
    <section className="container profile-page">
      <div className="sec-head" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '.2rem' }}>Hi, {user?.name || 'there'} 👋</h2>
        <p style={{ margin: 0 }}>{user?.email}</p>
      </div>

      <div className="profile-tabs">
        {TABS.map(t => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => handleTabClick(t.id)}>
            {t.label}
          </button>
        ))}
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <div className="profile-content">
        {tab === 'dashboard' && (
          <>
            <h2>Account Overview</h2>
            <div className="dashboard-grid">
              <div className="dash-stat">
                <span className="num">{orders.length}</span>
                <span className="label">Orders Placed</span>
              </div>
              <div className="dash-stat">
                <span className="num">{wishlist.length}</span>
                <span className="label">Wishlist Items</span>
              </div>
              <div className="dash-stat">
                <span className="num">{cart.length}</span>
                <span className="label">Items in Cart</span>
              </div>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '.88rem' }}>
              Welcome back! Use the tabs above to track orders, manage your wishlist, update saved
              addresses or change your password.
            </p>
          </>
        )}

        {tab === 'orders' && (
          <>
            <h2>Your Orders</h2>
            {ordersLoading ? (
              <div className="profile-empty"><p>Loading your orders…</p></div>
            ) : ordersError ? (
              <div className="profile-empty"><p>{ordersError}</p></div>
            ) : orders.length === 0 ? (
              <div className="profile-empty">
                <p>You haven't placed any orders yet.</p>
                <Link to="/shop" className="btn btn-green" style={{ marginTop: '1rem' }}>Start Shopping</Link>
              </div>
            ) : (
              <div className="profile-orders-list">
                {orders.map((o) => (
                  <div key={o._id} className="profile-order-card" style={{ border: '1px solid #eee', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.5rem' }}>
                      <div>
                        <strong>{o.orderId}</strong>
                        <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{formatDate(o.createdAt)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, color: statusTone(o.orderStatus) }}>{o.orderStatus}</span>
                        <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{currency(o.totalPrice)}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: '.75rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                      {o.orderItems?.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '.85rem', display: 'flex', justifyContent: 'space-between', gap: '.5rem' }}>
                          <span>{item.name} × {item.qty}</span>
                          <span style={{ color: 'var(--muted)' }}>
                            {item.vendor ? `Seller item · ${item.vendorItemStatus}` : o.orderStatus}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Link
                      to={`/track-order/${o.orderId}`}
                      className="btn btn-outline"
                      style={{ marginTop: '.85rem', display: 'inline-block' }}
                    >
                      Track This Order
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'wishlist' && (
          <>
            <h2>Your Wishlist</h2>
            {wishlist.length === 0 ? (
              <div className="profile-empty">
                <p>Your wishlist is empty. Tap the heart icon on any product to save it here.</p>
                <Link to="/shop" className="btn btn-green" style={{ marginTop: '1rem' }}>Browse Products</Link>
              </div>
            ) : (
              <div className="wishlist-grid">
                {wishlist.map(item => (
                  <ProductCard key={item.id} product={{ ...item, priceLabel: `₹${item.price}` }} showQuick={false} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'addresses' && (
          <>
            <h2>Saved Addresses</h2>
            <div className="profile-empty">
              <p>You don't have any saved addresses yet. Add one at checkout to save it here.</p>
              <Link to="/checkout" className="btn btn-green" style={{ marginTop: '1rem' }}>Add Address at Checkout</Link>
            </div>
          </>
        )}

        {tab === 'profile' && (
          <>
            <h2>Profile Details</h2>
            <div className="profile-form">
              <div className="field">
                <label>Full Name</label>
                <input defaultValue={user?.name || ''} />
              </div>
              <div className="field">
                <label>Email</label>
                <input defaultValue={user?.email || ''} type="email" />
              </div>
              <div className="field">
                <label>Phone</label>
                <input placeholder="+91 98765 43210" />
              </div>
              <button className="btn btn-green">Save Changes</button>
            </div>
          </>
        )}

        {tab === 'password' && (
          <>
            <h2>Change Password</h2>
            <div className="profile-form">
              <div className="field">
                <label>Current Password</label>
                <input type="password" />
              </div>
              <div className="field">
                <label>New Password</label>
                <input type="password" minLength={6} />
              </div>
              <button className="btn btn-green">Update Password</button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
