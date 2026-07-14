import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { vendorApi } from '../api/vendorApi'
import { useVendorAuth } from '../context/VendorAuthContext'

const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export default function VendorDashboardPage() {
  const { vendor } = useVendorAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    vendorApi
      .dashboard()
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load dashboard.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (vendor?.vendorStatus && vendor.vendorStatus !== 'approved') {
    return (
      <div className="vnd-panel">
        <div className={`vnd-alert vnd-alert-${vendor.vendorStatus === 'pending' ? 'info' : 'error'}`}>
          {vendor.vendorStatus === 'pending' &&
            'Your vendor application is under review. You will be able to add products once approved.'}
          {vendor.vendorStatus === 'rejected' &&
            `Your application was rejected.${vendor.rejectionReason ? ' Reason: ' + vendor.rejectionReason : ''}`}
          {vendor.vendorStatus === 'suspended' &&
            'Your vendor account is currently suspended. Please contact support.'}
        </div>
      </div>
    )
  }

  if (loading) return <div className="vnd-empty">Loading dashboard…</div>
  if (error) return <div className="vnd-alert vnd-alert-error">{error}</div>
  if (!data) return null

  return (
    <div>
      <div className="vnd-stats-grid">
        <div className="vnd-stat-card">
          <div className="vnd-stat-label">Total Products</div>
          <div className="vnd-stat-value">{data.products.total}</div>
          <div className="vnd-stat-sub">
            {data.products.approved} live · {data.products.pending} pending
          </div>
        </div>
        <div className="vnd-stat-card">
          <div className="vnd-stat-label">Orders</div>
          <div className="vnd-stat-value">{data.orders.totalOrders}</div>
          <div className="vnd-stat-sub">{data.orders.totalUnitsSold} units sold</div>
        </div>
        <div className="vnd-stat-card">
          <div className="vnd-stat-label">Gross Sales</div>
          <div className="vnd-stat-value">{currency(data.earnings.grossSales)}</div>
          <div className="vnd-stat-sub">From paid orders</div>
        </div>
        <div className="vnd-stat-card">
          <div className="vnd-stat-label">Your Earnings</div>
          <div className="vnd-stat-value">{currency(data.earnings.netEarnings)}</div>
          <div className="vnd-stat-sub">Your {data.earnings.commissionRate}% share of gross sales</div>
        </div>
        <Link to="/vendor/amount" className="vnd-stat-card" style={{ textDecoration: 'none' }}>
          <div className="vnd-stat-label">Wallet Balance</div>
          <div className="vnd-stat-value">{currency(data.earnings.walletBalance)}</div>
          <div className="vnd-stat-sub">Credited on delivered orders · View details →</div>
        </Link>
      </div>

      <div className="vnd-panel">
        <div className="vnd-panel-header">
          <h3>Quick Actions</h3>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/vendor/products" className="vnd-btn vnd-btn-primary" style={{ width: 'auto' }}>
            Manage Products
          </Link>
          <Link to="/vendor/orders" className="vnd-btn vnd-btn-outline">
            View Orders
          </Link>
          <Link to="/vendor/amount" className="vnd-btn vnd-btn-outline">
            View Amount
          </Link>
          <Link to="/vendor/profile" className="vnd-btn vnd-btn-outline">
            Edit Shop Profile
          </Link>
        </div>
      </div>

      {data.products.pending > 0 && (
        <div className="vnd-alert vnd-alert-info">
          You have {data.products.pending} product(s) awaiting admin approval.
        </div>
      )}
    </div>
  )
}
