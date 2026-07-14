import { useEffect, useState } from 'react'
import { ordersApi } from '../api/ordersApi'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'
import { IconAlert, IconEye } from '../components/AdminIcons'

// Order Placed → Confirmed → Packed → Shipped → Out For Delivery → Delivered
// is the happy-path flow this page drives. Out of Stock / Cancelled / Returned
// remain available as side statuses, same as the general Orders page.
const STATUSES = [
  'Placed', 'Confirmed', 'Packed', 'Out of Stock', 'Shipped',
  'Out for Delivery', 'Delivered', 'Cancelled', 'Returned',
]

const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

const statusTone = (status) => {
  if (status === 'Delivered') return 'adm-badge-success'
  if (status === 'Cancelled' || status === 'Returned' || status === 'Out of Stock') return 'adm-badge-danger'
  if (status === 'Placed' || status === 'Confirmed') return 'adm-badge-warning'
  return 'adm-badge-muted'
}

function AdminOrderUpdateModal({ order, onClose, onSaved }) {
  const toast = useToast()
  const [status, setStatus] = useState(order.orderStatus)
  const [trackingId, setTrackingId] = useState(order.trackingId || '')
  const [courierName, setCourierName] = useState(order.courierName || '')
  const [shippingPartner, setShippingPartner] = useState(order.shippingPartner || '')
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(
    order.estimatedDelivery ? new Date(order.estimatedDelivery).toISOString().slice(0, 10) : ''
  )
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await ordersApi.updateStatus(order._id, {
        status, trackingId, courierName, shippingPartner, estimatedDeliveryDate, note,
      })
      toast.success(`Order ${order.orderId} updated.`)
      onSaved?.(res.order)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to update order.')
      toast.error(err.message || 'Failed to update order.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Update Order ${order.orderId}`} onClose={onClose} size="lg">
      {error && (
        <div className="adm-alert adm-alert-error" style={{ marginBottom: '1rem' }}>
          <IconAlert />
          <span>{error}</span>
        </div>
      )}

      <div className="adm-order-summary-grid">
        <div className="adm-order-summary-block">
          <h4>Customer</h4>
          <p>{order.customer?.name || 'Deleted user'}</p>
          <p style={{ color: 'var(--adm-muted)', fontSize: '0.82rem' }}>{order.customer?.email}</p>
          <p style={{ color: 'var(--adm-muted)', fontSize: '0.82rem' }}>{order.customer?.phone}</p>
        </div>
        <div className="adm-order-summary-block">
          <h4>Delivery Address</h4>
          <p style={{ color: 'var(--adm-muted)', fontSize: '0.82rem' }}>
            {order.shippingAddress?.name} — {order.shippingAddress?.phone}<br />
            {order.shippingAddress?.line1}
            {order.shippingAddress?.line2 ? `, ${order.shippingAddress.line2}` : ''}, {order.shippingAddress?.city},{' '}
            {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
          </p>
        </div>
      </div>

      <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Products</h4>
      <div style={{ marginBottom: '1.2rem' }}>
        {order.myItems.map((item, i) => (
          <div className="adm-order-item-row" key={i}>
            {item.image && <img src={item.image} alt="" />}
            <span>{item.name}</span>
            <span className="adm-order-item-qty">{item.qty} × {currency(item.price)}</span>
          </div>
        ))}
      </div>

      <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Shipment &amp; Status</h4>
      <div className="adm-form-grid" style={{ marginBottom: '1.2rem' }}>
        <div className="adm-form-group">
          <label>Status</label>
          <select className="adm-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="adm-form-group">
          <label>Tracking Number</label>
          <input className="adm-input" value={trackingId} onChange={(e) => setTrackingId(e.target.value)} placeholder="e.g. TRK123456" />
        </div>
        <div className="adm-form-group">
          <label>Courier Name</label>
          <input className="adm-input" value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="e.g. BlueDart" />
        </div>
        <div className="adm-form-group">
          <label>Shipping Partner</label>
          <input className="adm-input" value={shippingPartner} onChange={(e) => setShippingPartner(e.target.value)} placeholder="e.g. Amrita Express" />
        </div>
        <div className="adm-form-group">
          <label>Estimated Delivery Date</label>
          <input className="adm-input" type="date" value={estimatedDeliveryDate} onChange={(e) => setEstimatedDeliveryDate(e.target.value)} />
        </div>
        <div className="adm-form-group adm-form-group-full">
          <label>Note (optional)</label>
          <input className="adm-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Packed and handed to courier" />
        </div>
      </div>

      <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Update'}
      </button>

      <h4 style={{ fontSize: '0.85rem', margin: '1.4rem 0 0.6rem' }}>Tracking Dates</h4>
      <div className="adm-order-summary-grid">
        <div className="adm-order-summary-block"><h4>Order Date</h4><p>{formatDate(order.createdAt)}</p></div>
        <div className="adm-order-summary-block"><h4>Confirmed</h4><p>{formatDate(order.confirmedAt)}</p></div>
        <div className="adm-order-summary-block"><h4>Packed</h4><p>{formatDate(order.packedAt)}</p></div>
        <div className="adm-order-summary-block"><h4>Shipped</h4><p>{formatDate(order.shippedAt)}</p></div>
        <div className="adm-order-summary-block"><h4>Out for Delivery</h4><p>{formatDate(order.outForDeliveryAt)}</p></div>
        <div className="adm-order-summary-block"><h4>Delivered</h4><p>{formatDate(order.deliveredAt)}</p></div>
      </div>
    </Modal>
  )
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, pages: 1 })
  const [editingOrder, setEditingOrder] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 15 }
      if (status) params.status = status
      const res = await ordersApi.listOwned(params)
      setOrders(res.orders || [])
      setMeta({ total: res.total || 0, pages: res.pages || 1 })
    } catch (err) {
      setError(err.message || 'Failed to load admin orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status])

  const handleSaved = (updated) => {
    setOrders((prev) => prev.map((o) => (o._id === updated._id ? {
      ...o,
      orderStatus: updated.orderStatus,
      trackingId: updated.trackingId,
      courierName: updated.courierName,
      shippingPartner: updated.shippingPartner,
      estimatedDelivery: updated.estimatedDelivery,
      confirmedAt: updated.confirmedAt,
      packedAt: updated.packedAt,
      shippedAt: updated.shippedAt,
      outForDeliveryAt: updated.outForDeliveryAt,
      deliveredAt: updated.deliveredAt,
    } : o)))
  }

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h2>📦 Admin Orders</h2>
          <p>Orders for products owned directly by the platform (not marketplace vendors). Update status, tracking and courier details here.</p>
        </div>
      </div>

      {error && (
        <div className="adm-alert adm-alert-error" style={{ marginBottom: '1.25rem' }}>
          <IconAlert />
          <span>{error}</span>
        </div>
      )}

      <div className="adm-toolbar">
        <div className="adm-toolbar-filters">
          <select className="adm-select" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="adm-card">
        {loading ? (
          <div className="adm-loading-cell">Loading admin orders…</div>
        ) : orders.length === 0 ? (
          <div className="adm-empty-state">No admin-owned orders yet.</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Order Date</th>
                  <th>Tracking</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td className="adm-table-cell-muted">{o.orderId}</td>
                    <td>
                      <div>{o.customer?.name || 'Deleted user'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>{o.customer?.email}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>{o.customer?.phone}</div>
                    </td>
                    <td>
                      {o.myItems.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', marginBottom: 2 }}>
                          {it.image && <img src={it.image} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} />}
                          {it.name}
                        </div>
                      ))}
                    </td>
                    <td>{o.myItems.reduce((s, it) => s + it.qty, 0)}</td>
                    <td>{currency(o.myTotal)}</td>
                    <td>
                      <span style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>{o.paymentMethod}</span>
                      <div>
                        <span className={`adm-badge ${o.isPaid ? 'adm-badge-success' : 'adm-badge-warning'}`}>
                          {o.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                    </td>
                    <td className="adm-table-cell-muted">{formatDate(o.createdAt)}</td>
                    <td style={{ fontSize: '0.78rem' }}>
                      {o.trackingId || '—'}{o.courierName ? ` · ${o.courierName}` : ''}
                    </td>
                    <td><span className={`adm-badge ${statusTone(o.orderStatus)}`}>{o.orderStatus}</span></td>
                    <td>
                      <button type="button" className="adm-icon-btn" onClick={() => setEditingOrder(o)} aria-label="Update order">
                        <IconEye width={16} height={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '1rem' }}>
            <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span style={{ alignSelf: 'center', fontSize: '0.85rem' }}>Page {page} of {meta.pages}</span>
            <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </div>

      {editingOrder && (
        <AdminOrderUpdateModal order={editingOrder} onClose={() => setEditingOrder(null)} onSaved={handleSaved} />
      )}
    </div>
  )
}
