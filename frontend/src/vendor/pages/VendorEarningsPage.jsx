import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, IndianRupee, Clock3, PackageCheck } from 'lucide-react'
import { vendorApi } from '../api/vendorApi'

const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

function AmountStatCard({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="vnd-stat-card" style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: tone || 'var(--vnd-light)',
          color: '#fff',
        }}
      >
        <Icon size={20} />
      </span>
      <div>
        <div className="vnd-stat-label">{label}</div>
        <div className="vnd-stat-value">{value}</div>
        {sub && <div className="vnd-stat-sub">{sub}</div>}
      </div>
    </div>
  )
}

// This page is the vendor's own view of exactly the same commission
// split the admin sees on the platform-wide "Amount" dashboard — it's
// scoped to just this vendor's account and stays in sync automatically:
// every time an order item of theirs is marked Delivered, the backend
// credits their commissionRate% (default 5%) share and a new row shows
// up here (see backend/src/utils/vendorWallet.js).
export default function VendorEarningsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  const load = async (p = 1) => {
    setLoading(true)
    setError('')
    try {
      const res = await vendorApi.earnings({ page: p, limit: 20 })
      setData(res)
      setPage(p)
    } catch (err) {
      setError(err.message || 'Failed to load your amount details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading && !data) return <div className="vnd-empty">Loading your amount…</div>
  if (error && !data) return <div className="vnd-alert vnd-alert-error">{error}</div>
  if (!data) return null

  const { summary, productBreakdown = [], transactions, pages } = data
  const totalSalesAmount = summary.totalSalesAmount || 0
  const totalVendorAmount = summary.totalVendorAmount || 0
  const vendorPct = totalSalesAmount
    ? Math.round((totalVendorAmount / totalSalesAmount) * 1000) / 10
    : summary.commissionRate
  const platformPct = Math.max(0, Math.round((100 - vendorPct) * 10) / 10)

  return (
    <div>
      <p style={{ color: 'var(--vnd-muted)', fontSize: '0.85rem', marginTop: '-0.25rem', marginBottom: '1.25rem' }}>
        Your commission share is <strong>{summary.commissionRate}%</strong> of every product you sell — credited to
        your wallet the moment an order item is marked Delivered.
      </p>

      <div className="vnd-stats-grid">
        <AmountStatCard
          icon={IndianRupee}
          label="Total Sales Amount"
          value={currency(totalSalesAmount)}
          sub="100% — full value of everything sold"
          tone="var(--vnd-green2)"
        />
        <AmountStatCard
          icon={TrendingUp}
          label={`Your Amount (${summary.commissionRate}%)`}
          value={currency(totalVendorAmount)}
          sub="Your commission share, in total"
          tone="var(--vnd-gold)"
        />
        <AmountStatCard
          icon={Wallet}
          label="Wallet Balance"
          value={currency(summary.walletBalance)}
          sub="Available now"
          tone="var(--vnd-green)"
        />
        <AmountStatCard
          icon={PackageCheck}
          label="Total Earnings"
          value={currency(summary.totalEarnings)}
          sub="Lifetime, credited on delivery"
          tone="#1e8449"
        />
        <AmountStatCard
          icon={Clock3}
          label="Pending Amount"
          value={currency(summary.pendingAmount)}
          sub="Paid orders not yet delivered"
          tone="#a67c00"
        />
      </div>

      {/* Split visualization: your share vs platform's share */}
      {totalSalesAmount > 0 && (
        <div className="vnd-panel">
          <div className="vnd-panel-header">
            <h3>Sales Split</h3>
          </div>
          <div
            style={{
              display: 'flex',
              height: 14,
              borderRadius: 999,
              overflow: 'hidden',
              background: 'var(--vnd-border)',
            }}
          >
            <div
              style={{ width: `${vendorPct}%`, background: 'linear-gradient(90deg, var(--vnd-gold), #e0b23a)' }}
              title={`Your share: ${vendorPct}%`}
            />
            <div
              style={{ width: `${platformPct}%`, background: 'linear-gradient(90deg, #d9e3dc, #c3cfc6)' }}
              title={`Platform share: ${platformPct}%`}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--vnd-gold)', fontWeight: 700 }}>
              ● Your share — {vendorPct}% ({currency(totalVendorAmount)})
            </span>
            <span style={{ color: 'var(--vnd-muted)', fontWeight: 700 }}>
              ● Platform share — {platformPct}% ({currency(summary.platformAmount)})
            </span>
          </div>
        </div>
      )}

      {/* Per-product breakdown */}
      <div className="vnd-panel">
        <div className="vnd-panel-header">
          <h3>Amount By Product</h3>
        </div>
        {productBreakdown.length === 0 ? (
          <div className="vnd-empty">
            No sales yet — once your products start selling, each one's amount will show up here.
          </div>
        ) : (
          <div className="vnd-table-wrap">
            <table className="vnd-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Units Sold</th>
                  <th>Sales Amount</th>
                  <th>Your Amount ({summary.commissionRate}%)</th>
                  <th>Credited</th>
                  <th>Pending</th>
                </tr>
              </thead>
              <tbody>
                {productBreakdown.map((p) => (
                  <tr key={p.productId}>
                    <td>{p.name}</td>
                    <td className="vnd-table-muted">{p.unitsSold}</td>
                    <td>{currency(p.salesAmount)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--vnd-green)' }}>{currency(p.yourAmount)}</td>
                    <td className="vnd-table-muted">{currency(p.creditedAmount)}</td>
                    <td className="vnd-table-muted">{currency(p.pendingAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="vnd-panel">
        <div className="vnd-panel-header">
          <h3>Transaction History</h3>
        </div>

        {error && <div className="vnd-alert vnd-alert-error">{error}</div>}

        {transactions.length === 0 ? (
          <div className="vnd-empty">
            No amount credited yet — this fills in automatically as your delivered orders are settled.
          </div>
        ) : (
          <>
            <div className="vnd-table-wrap">
              <table className="vnd-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Order ID</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Sale Amount</th>
                    <th>Rate</th>
                    <th>Amount Credited</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t._id}>
                      <td className="vnd-table-muted">{formatDate(t.createdAt)}</td>
                      <td>{t.orderId}</td>
                      <td>{t.productName}</td>
                      <td>{t.qty}</td>
                      <td>{currency(t.saleAmount)}</td>
                      <td>{t.commissionRate}%</td>
                      <td style={{ fontWeight: 700, color: '#1e8449' }}>+{currency(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="vnd-btn vnd-btn-outline"
                  style={{ width: 'auto' }}
                  disabled={page <= 1 || loading}
                  onClick={() => load(page - 1)}
                >
                  Previous
                </button>
                <span style={{ alignSelf: 'center', fontSize: '0.85rem', color: 'var(--vnd-muted)' }}>
                  Page {page} of {pages}
                </span>
                <button
                  type="button"
                  className="vnd-btn vnd-btn-outline"
                  style={{ width: 'auto' }}
                  disabled={page >= pages || loading}
                  onClick={() => load(page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
