import { useEffect, useState } from 'react'
import { ordersApi } from '../api/ordersApi'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import {
  IconAlert, IconSearch, IconEye, IconOrders, IconBox, IconStar, IconUsers,
} from '../components/AdminIcons'

const STATUSES = [
  'Placed', 'Confirmed', 'Packed', 'Out of Stock', 'Shipped',
  'Out for Delivery', 'Delivered', 'Cancelled', 'Returned',
]

const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const statusTone = (status) => {
  if (status === 'Delivered') return 'adm-badge-success'
  if (status === 'Cancelled' || status === 'Returned' || status === 'Out of Stock') return 'adm-badge-danger'
  if (status === 'Placed' || status === 'Confirmed') return 'adm-badge-warning'
  return 'adm-badge-muted'
}

// Quick, one-click next action shown per row so the admin doesn't have to
// open the detail modal just to move a fresh order forward.
const QUICK_ACTION_BY_STATUS = {
  Placed: { label: 'Confirm', next: 'Confirmed', danger: false },
  Confirmed: { label: 'Mark Packed', next: 'Packed', danger: false },
  Packed: { label: 'Mark Shipped', next: 'Shipped', danger: false },
  Shipped: { label: 'Out for Delivery', next: 'Out for Delivery', danger: false },
  'Out for Delivery': { label: 'Mark Delivered', next: 'Delivered', danger: false },
}

function StatCard({ icon: Icon, tone, label, value, sub }) {
  return (
    <div className="adm-stat-card">
      <span className={`adm-stat-icon ${tone}`}><Icon /></span>
      <div className="adm-stat-body">
        <span>{label}</span>
        <strong>{value}</strong>
        {sub && <span className="adm-stat-sub">{sub}</span>}
      </div>
    </div>
  )
}

function OrderDetailModal({ orderId, onClose, onStatusChanged }) {
  const toast = useToast()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [nextStatus, setNextStatus] = useState('')
  const [note, setNote] = useState('')
  const [trackingId, setTrackingId] = useState('')
  const [courierName, setCourierName] = useState('')
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await ordersApi.get(orderId)
      setOrder(res.order)
      setNextStatus(res.order.orderStatus)
      setTrackingId(res.order.trackingId || '')
      setCourierName(res.order.courierName || '')
      setEstimatedDeliveryDate(res.order.estimatedDelivery ? new Date(res.order.estimatedDelivery).toISOString().slice(0, 10) : '')
    } catch (err) {
      setError(err.message || 'Failed to load order.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  const handleUpdateStatus = async () => {
    if (!order) return
    setSaving(true)
    setError('')
    try {
      const res = await ordersApi.updateStatus(order._id, { status: nextStatus, note, trackingId, courierName, estimatedDeliveryDate })
      setOrder(res.order)
      setNote('')
      toast.success(`Order ${res.order.orderId} marked as "${nextStatus}".`)
      onStatusChanged?.(res.order)
    } catch (err) {
      setError(err.message || 'Failed to update order status.')
      toast.error(err.message || 'Failed to update order status.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={order ? `Order ${order.orderId}` : 'Order Details'} onClose={onClose} size="lg">
      {loading ? (
        <div className="adm-loading-cell">Loading order…</div>
      ) : error && !order ? (
        <div className="adm-alert adm-alert-error">
          <IconAlert />
          <span>{error}</span>
        </div>
      ) : order ? (
        <div>
          {error && (
            <div className="adm-alert adm-alert-error" style={{ marginBottom: '1rem' }}>
              <IconAlert />
              <span>{error}</span>
            </div>
          )}

          <div className="adm-order-summary-grid">
            <div className="adm-order-summary-block">
              <h4>Customer</h4>
              <p>{order.user?.name || 'Deleted user'}</p>
              <p style={{ color: 'var(--adm-muted)', fontSize: '0.82rem' }}>{order.user?.email}</p>
              <p style={{ color: 'var(--adm-muted)', fontSize: '0.82rem' }}>{order.user?.phone}</p>
            </div>
            <div className="adm-order-summary-block">
              <h4>Shipping Address</h4>
              <p>{order.shippingAddress?.name} — {order.shippingAddress?.phone}</p>
              <p style={{ color: 'var(--adm-muted)', fontSize: '0.82rem' }}>
                {order.shippingAddress?.line1}
                {order.shippingAddress?.line2 ? `, ${order.shippingAddress.line2}` : ''}, {order.shippingAddress?.city},{' '}
                {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
              </p>
            </div>
            <div className="adm-order-summary-block">
              <h4>Payment</h4>
              <p style={{ textTransform: 'uppercase' }}>{order.paymentMethod}</p>
              <span className={`adm-badge ${order.isPaid ? 'adm-badge-success' : 'adm-badge-warning'}`}>
                {order.isPaid ? 'Paid' : 'Unpaid'}
              </span>
            </div>
            <div className="adm-order-summary-block">
              <h4>Order Total</h4>
              <p style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--adm-green)' }}>
                {currency(order.totalPrice)}
              </p>
              <p style={{ color: 'var(--adm-muted)', fontSize: '0.78rem' }}>
                Items {currency(order.itemsPrice)} · Shipping {currency(order.shippingPrice)} · Discount −{currency(order.discountPrice)}
              </p>
            </div>
          </div>

          <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Items</h4>
          <div style={{ marginBottom: '1.2rem' }}>
            {order.orderItems.map((item, i) => (
              <div className="adm-order-item-row" key={i}>
                {item.image && <img src={item.image} alt="" />}
                <span>{item.name}</span>
                <span className="adm-order-item-qty">
                  {item.qty} × {currency(item.price)}
                </span>
              </div>
            ))}
          </div>

          <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Update Status</h4>
          <div className="adm-form-grid" style={{ marginBottom: '1.2rem' }}>
            <div className="adm-form-group">
              <label>Status</label>
              <select className="adm-select" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="adm-form-group">
              <label>Tracking ID</label>
              <input className="adm-input" value={trackingId} onChange={(e) => setTrackingId(e.target.value)} placeholder="Optional" />
            </div>
            <div className="adm-form-group">
              <label>Courier Name</label>
              <input className="adm-input" value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="Optional" />
            </div>
            <div className="adm-form-group">
              <label>Estimated Delivery Date</label>
              <input className="adm-input" type="date" value={estimatedDeliveryDate} onChange={(e) => setEstimatedDeliveryDate(e.target.value)} />
            </div>
            <div className="adm-form-group adm-form-group-full">
              <label>Note (optional)</label>
              <input className="adm-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Shipped via BlueDart" />
            </div>
          </div>
          <button
            type="button"
            className="adm-btn adm-btn-primary adm-btn-sm"
            onClick={handleUpdateStatus}
            disabled={saving || (nextStatus === order.orderStatus && trackingId === (order.trackingId || '') && courierName === (order.courierName || '') && !note)}
          >
            {saving ? 'Updating…' : 'Update Status'}
          </button>

          <h4 style={{ fontSize: '0.85rem', margin: '1.4rem 0 0.6rem' }}>Status History</h4>
          <ul className="adm-order-timeline">
            {[...order.statusHistory].reverse().map((h, i) => (
              <li key={i}>
                <div className="adm-tl-status">{h.status}</div>
                <div className="adm-tl-meta">{new Date(h.date).toLocaleString('en-IN')}</div>
                {h.note && <div className="adm-tl-note">{h.note}</div>}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Modal>
  )
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [sort, setSort] = useState('newest')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, pages: 1, count: 0 })

  const [viewingId, setViewingId] = useState(null)

  // Top summary cards — pulled once from the existing /orders/admin/stats
  // endpoint (already used by the Dashboard) so this page opens with
  // useful numbers instead of just a bare table.
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const loadStats = async () => {
    setStatsLoading(true)
    try {
      const res = await ordersApi.stats()
      setStats(res)
    } catch {
      // Non-fatal — the table below still works without the summary cards.
    } finally {
      setStatsLoading(false)
    }
  }

  // Quick action / out-of-stock confirmation dialog state. `pendingAction`
  // holds { order, next, danger, label } for whichever row's button was
  // clicked, and the dialog fires the same PATCH the detail modal uses.
  const [pendingAction, setPendingAction] = useState(null)
  const [actionSaving, setActionSaving] = useState(false)
  const [actionError, setActionError] = useState('')

  const applyStatusChange = async (order, next, note) => {
    setActionSaving(true)
    setActionError('')
    try {
      const res = await ordersApi.updateStatus(order._id, { status: next, note })
      setOrders((prev) => prev.map((o) => (o._id === res.order._id ? { ...o, ...res.order } : o)))
      toast.success(`Order ${res.order.orderId} marked as "${next}".`)
      setPendingAction(null)
      loadStats()
    } catch (err) {
      setActionError(err.message || 'Failed to update order status.')
      toast.error(err.message || 'Failed to update order status.')
    } finally {
      setActionSaving(false)
    }
  }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 15, sort }
      if (search) params.search = search
      if (status) params.status = status
      if (paymentMethod) params.paymentMethod = paymentMethod
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo

      const res = await ordersApi.list(params)
      setOrders(res.orders || [])
      setMeta({ total: res.total || 0, pages: res.pages || 1, count: (res.orders || []).length })
    } catch (err) {
      setError(err.message || 'Failed to load orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, paymentMethod, sort, dateFrom, dateTo])

  useEffect(() => {
    setPage(1)
    const t = setTimeout(() => load(), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const handleStatusChanged = (updatedOrder) => {
    setOrders((prev) => prev.map((o) => (o._id === updatedOrder._id ? { ...o, ...updatedOrder } : o)))
  }

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h2>Orders</h2>
          <p>Track, filter, and update the status of every customer order.</p>
        </div>
      </div>

      {statsLoading ? (
        <div className="adm-stat-grid" style={{ marginBottom: '1.5rem' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="adm-stat-card">
              <div className="adm-skeleton" style={{ width: 46, height: 46 }} />
              <div style={{ flex: 1 }}>
                <div className="adm-skeleton" style={{ width: '60%', height: 10, marginBottom: 8 }} />
                <div className="adm-skeleton" style={{ width: '40%', height: 18 }} />
              </div>
            </div>
          ))}
        </div>
      ) : stats && (
        <div className="adm-stat-grid" style={{ marginBottom: '1.5rem' }}>
          <StatCard icon={IconOrders} tone="gold" label="Total Orders" value={stats.totalOrders} />
          <StatCard
            icon={IconBox}
            tone="warning"
            label="Needs Action"
            value={stats.pendingOrders}
            sub="Placed + Confirmed"
          />
          <StatCard
            icon={IconStar}
            tone="danger"
            label="Out of Stock"
            value={stats.ordersByStatus?.find((s) => s.status === 'Out of Stock')?.count || 0}
          />
          <StatCard icon={IconUsers} tone="green" label="Delivered" value={stats.ordersByStatus?.find((s) => s.status === 'Delivered')?.count || 0} />
        </div>
      )}

      {error && (
        <div className="adm-alert adm-alert-error" style={{ marginBottom: '1.25rem' }}>
          <IconAlert />
          <span>{error}</span>
        </div>
      )}

      <div className="adm-toolbar">
        <div className="adm-toolbar-filters">
          <div className="adm-search-wrap">
            <span className="adm-search-icon"><IconSearch width={16} height={16} /></span>
            <input
              className="adm-input"
              placeholder="Search order ID, customer name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="adm-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select className="adm-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="">All Payment Methods</option>
            {['cod', 'upi', 'gpay', 'phonepe', 'paytm', 'credit', 'debit', 'netbanking', 'wallet'].map((m) => (
              <option key={m} value={m}>{m.toUpperCase()}</option>
            ))}
          </select>
          <input className="adm-input" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ maxWidth: 150 }} />
          <input className="adm-input" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ maxWidth: 150 }} />
        </div>
        <div className="adm-toolbar-right">
          <select className="adm-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount-desc">Amount: High to Low</option>
            <option value="amount-asc">Amount: Low to High</option>
          </select>
        </div>
      </div>

      <div className="adm-card">
        {loading ? (
          <div className="adm-loading-cell">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="adm-empty-state">No orders match your filters.</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td className="adm-table-cell-muted">{o.orderId}</td>
                    <td>
                      <div>{o.user?.name || 'Deleted user'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>{o.user?.email}</div>
                    </td>
                    <td className="adm-table-cell-muted">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>{o.orderItems?.length || 0}</td>
                    <td>{currency(o.totalPrice)}</td>
                    <td>
                      <span className={`adm-badge ${o.isPaid ? 'adm-badge-success' : 'adm-badge-warning'}`}>
                        {o.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td>
                      <span className={`adm-badge ${statusTone(o.orderStatus)}`}>{o.orderStatus}</span>
                    </td>
                    <td>
                      <div className="adm-row-actions">
                        {QUICK_ACTION_BY_STATUS[o.orderStatus] && (
                          <button
                            type="button"
                            className="adm-btn adm-btn-outline adm-btn-sm"
                            onClick={() => {
                              setActionError('')
                              setPendingAction({ order: o, ...QUICK_ACTION_BY_STATUS[o.orderStatus] })
                            }}
                          >
                            {QUICK_ACTION_BY_STATUS[o.orderStatus].label}
                          </button>
                        )}
                        {['Placed', 'Confirmed'].includes(o.orderStatus) && (
                          <button
                            type="button"
                            className="adm-icon-btn adm-icon-danger"
                            title="Confirm Out of Stock"
                            aria-label="Confirm Out of Stock"
                            onClick={() => {
                              setActionError('')
                              setPendingAction({ order: o, next: 'Out of Stock', danger: true, label: 'Mark Out of Stock' })
                            }}
                          >
                            <IconBox width={16} height={16} />
                          </button>
                        )}
                        <button type="button" className="adm-icon-btn" onClick={() => setViewingId(o._id)} aria-label="View">
                          <IconEye width={16} height={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} pages={meta.pages} total={meta.total} count={meta.count} onPageChange={setPage} />
      </div>

      {viewingId && (
        <OrderDetailModal orderId={viewingId} onClose={() => setViewingId(null)} onStatusChanged={handleStatusChanged} />
      )}

      {pendingAction && (
        <ConfirmDialog
          title={pendingAction.label}
          message={
            pendingAction.next === 'Out of Stock'
              ? `Mark order ${pendingAction.order.orderId} as Out of Stock? The customer will need to be informed separately — this only updates the order status.`
              : `Move order ${pendingAction.order.orderId} to "${pendingAction.next}"?`
          }
          confirmLabel={pendingAction.label}
          danger={pendingAction.danger}
          loading={actionSaving}
          error={actionError}
          onConfirm={() => applyStatusChange(pendingAction.order, pendingAction.next, pendingAction.next === 'Out of Stock' ? 'Marked out of stock by admin' : '')}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  )
}