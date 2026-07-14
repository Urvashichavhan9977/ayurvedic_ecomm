import { useEffect, useState } from 'react'
import { vendorApi } from '../api/vendorApi'

const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')
const STATUS_OPTIONS = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']

function VendorOrderRow({ order, onUpdated }) {
  const item = order.myItems[0] || {}
  const [expanded, setExpanded] = useState(false)
  const [status, setStatus] = useState(item.vendorItemStatus || 'Placed')
  const [trackingNumber, setTrackingNumber] = useState(item.trackingNumber || '')
  const [courierName, setCourierName] = useState(item.courierName || '')
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(
    item.estimatedDeliveryDate ? new Date(item.estimatedDeliveryDate).toISOString().slice(0, 10) : ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await vendorApi.updateOrderItemStatus(order._id, status, {
        trackingNumber, courierName, estimatedDeliveryDate,
      })
      onUpdated?.()
    } catch (err) {
      setError(err.message || 'Failed to update status.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <tr>
        <td>{order.orderId}</td>
        <td className="vnd-table-muted">{order.customer?.name || '—'}</td>
        <td>
          {order.myItems.map((it, idx) => (
            <div key={idx} style={{ fontSize: '0.82rem' }}>{it.name} × {it.qty}</div>
          ))}
        </td>
        <td>{currency(order.myTotal)}</td>
        <td>
          <span className={`vnd-badge vnd-badge-${(item.vendorItemStatus || 'Placed').toLowerCase().replace(/\s+/g, '-')}`}>
            {item.vendorItemStatus || 'Placed'}
          </span>
        </td>
        <td>
          <button type="button" className="vnd-btn vnd-btn-outline" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }} onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Close' : 'Manage'}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} style={{ background: 'rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {error && <div className="vnd-alert vnd-alert-error">{error}</div>}

              <div style={{ fontSize: '0.82rem', color: 'var(--vnd-muted, #666)' }}>
                <div><strong>Customer:</strong> {order.customer?.name} · {order.customer?.email} · {order.customer?.phone}</div>
                <div><strong>Delivery Address:</strong> {order.shippingAddress?.name}, {order.shippingAddress?.line1}
                  {order.shippingAddress?.line2 ? `, ${order.shippingAddress.line2}` : ''}, {order.shippingAddress?.city},{' '}
                  {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                </div>
                <div><strong>Payment:</strong> {order.paymentMethod?.toUpperCase()} · {order.isPaid ? 'Paid' : 'Unpaid'}</div>
                <div><strong>Order Date:</strong> {formatDate(order.createdAt)}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', display: 'block', marginBottom: 4 }}>Status</label>
                  <select className="vnd-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', display: 'block', marginBottom: 4 }}>Tracking Number</label>
                  <input className="vnd-input" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g. TRK123456" />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', display: 'block', marginBottom: 4 }}>Courier Name</label>
                  <input className="vnd-input" value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="e.g. Delhivery" />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', display: 'block', marginBottom: 4 }}>Estimated Delivery</label>
                  <input className="vnd-input" type="date" value={estimatedDeliveryDate} onChange={(e) => setEstimatedDeliveryDate(e.target.value)} />
                </div>
              </div>

              <div>
                <button type="button" className="vnd-btn vnd-btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Update'}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await vendorApi.listOrders({ limit: 50 })
      setOrders(res.orders || [])
    } catch (err) {
      setError(err.message || 'Failed to load orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="vnd-panel">
      <div className="vnd-panel-header">
        <h3>📦 My Orders</h3>
      </div>

      {error && <div className="vnd-alert vnd-alert-error">{error}</div>}

      {loading ? (
        <div className="vnd-empty">Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className="vnd-empty">No orders yet — they'll show up here once customers buy your products.</div>
      ) : (
        <div className="vnd-table-wrap">
          <table className="vnd-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Your Items</th>
                <th>Your Total</th>
                <th>Status</th>
                <th>Update</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <VendorOrderRow key={o._id} order={o} onUpdated={load} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
