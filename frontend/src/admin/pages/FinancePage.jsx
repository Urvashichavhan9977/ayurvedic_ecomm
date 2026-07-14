import { useEffect, useState } from 'react'
import { vendorsApi } from '../api/vendorsApi'
import { IconInventory, IconTag, IconUsers, IconTrendingUp } from '../components/AdminIcons'

const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

function StatCard({ icon: Icon, tone, label, value, sub }) {
  return (
    <div className="adm-stat-card">
      <span className={`adm-stat-icon ${tone}`}>
        <Icon />
      </span>
      <div className="adm-stat-body">
        <span>{label}</span>
        <strong>{value}</strong>
        {sub && <span className="adm-stat-sub">{sub}</span>}
      </div>
    </div>
  )
}

export default function FinancePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    vendorsApi
      .financeSummary()
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load finance summary.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <div className="adm-panel">Loading amount dashboard…</div>
  if (error) return <div className="adm-alert adm-alert-error">{error}</div>
  if (!data) return null

  const { summary, vendorBreakdown } = data

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h2>Amount</h2>
          <p>
            Total sales split between the store's own products and vendor products — vendors get
            their commission share (default 5%), the rest stays with the platform.
          </p>
        </div>
      </div>

      <div className="adm-stat-grid">
        <StatCard
          icon={IconTrendingUp}
          tone="green"
          label="Grand Total Revenue"
          value={currency(summary.grandTotalRevenue)}
          sub="Own products + vendor products"
        />
        <StatCard
          icon={IconInventory}
          tone="green"
          label="Store's Own Products Amount"
          value={currency(summary.platformOwnProductsAmount)}
          sub="Sold directly by the platform"
        />
        <StatCard
          icon={IconTag}
          tone="gold"
          label="Vendor Products Amount"
          value={currency(summary.vendorProductsTotalSales)}
          sub="Full sale value of all vendor products"
        />
        <StatCard
          icon={IconUsers}
          tone="warning"
          label="Vendor Amount (their share)"
          value={currency(summary.vendorAmount)}
          sub={`Credited: ${currency(summary.vendorAmountCredited)} · Pending: ${currency(summary.vendorAmountPending)}`}
        />
      </div>

      <div className="adm-panel">
        <div className="adm-panel-header">
          <h3>Admin's Net Amount</h3>
        </div>
        <div className="adm-stat-grid" style={{ marginBottom: 0 }}>
          <StatCard
            icon={IconInventory}
            tone="green"
            label="Platform Share From Vendor Products"
            value={currency(summary.platformShareFromVendorProducts)}
            sub="(100% − vendor's %) of vendor sales"
          />
          <StatCard
            icon={IconTrendingUp}
            tone="green"
            label="Total Amount With Admin"
            value={currency(summary.platformAmount)}
            sub="Own products + share of vendor products (excludes vendor's cut)"
          />
        </div>
      </div>

      <div className="adm-panel">
        <div className="adm-panel-header">
          <h3>Per-Vendor Amount Breakdown</h3>
        </div>
        {vendorBreakdown.length === 0 ? (
          <div className="adm-empty-state">No vendor sales yet.</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Rate</th>
                  <th>Products Amount</th>
                  <th>Vendor Amount</th>
                  <th>Credited</th>
                  <th>Pending</th>
                  <th>Platform's Share</th>
                  <th>Wallet Balance</th>
                </tr>
              </thead>
              <tbody>
                {vendorBreakdown.map((v) => (
                  <tr key={v.vendorId}>
                    <td>
                      {v.vendorName}
                      <div className="adm-table-cell-muted">{v.shopName}</div>
                    </td>
                    <td>{v.commissionRate}%</td>
                    <td>{currency(v.productsAmount)}</td>
                    <td>{currency(v.vendorAmount)}</td>
                    <td>{currency(v.vendorAmountCredited)}</td>
                    <td>{currency(v.vendorAmountPending)}</td>
                    <td>{currency(v.platformAmountFromVendor)}</td>
                    <td>{currency(v.walletBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
