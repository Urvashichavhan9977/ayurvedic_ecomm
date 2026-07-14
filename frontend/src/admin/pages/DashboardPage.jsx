import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../api/dashboardApi'
import { useAdminAuth } from '../context/AdminAuthContext'
import {
  IconProducts,
  IconCategories,
  IconAlert,
  IconBox,
  IconStar,
  IconTag,
  IconOrders,
  IconUsers,
  IconSparkles,
} from '../components/AdminIcons'

const currency = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const orderStatusTone = (status) => {
  if (status === 'Delivered') return 'adm-badge-success'
  if (status === 'Cancelled' || status === 'Returned' || status === 'Out of Stock') return 'adm-badge-danger'
  return 'adm-badge-warning'
}

// When `to` is passed the whole card becomes a link, so numbers on the
// dashboard double as shortcuts into the page that manages them.
function StatCard({ icon: Icon, tone, label, value, sub, to }) {
  const content = (
    <>
      <span className={`adm-stat-icon ${tone}`}>
        <Icon />
      </span>
      <div className="adm-stat-body">
        <span>{label}</span>
        <strong>{value}</strong>
        {sub && <span className="adm-stat-sub">{sub}</span>}
      </div>
    </>
  )

  if (to) {
    return (
      <Link to={to} className="adm-stat-card adm-stat-card-link">
        {content}
      </Link>
    )
  }

  return <div className="adm-stat-card">{content}</div>
}

function SkeletonCards({ count = 4 }) {
  return (
    <div className="adm-stat-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="adm-stat-card">
          <div className="adm-skeleton" style={{ width: 46, height: 46 }} />
          <div style={{ flex: 1 }}>
            <div className="adm-skeleton" style={{ width: '60%', height: 10, marginBottom: 8 }} />
            <div className="adm-skeleton" style={{ width: '40%', height: 18 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

const greeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// Lightweight, fully offline "AI Insights" engine — reads the same real
// numbers already on this dashboard (no external API/key needed) and turns
// them into plain-language observations + next-best-actions. Regenerates
// on every load/refresh, so it always reflects the live store data.
function buildInsights({ overview, categoryBreakdown, orderStats, userStats, pendingReviews, lowStock, activeCoupons }) {
  const insights = []

  // Revenue trend (compare last 3 days vs previous 3 of the 7-day window)
  const rev = orderStats?.revenueLast7Days || []
  if (rev.length >= 6) {
    const recent = rev.slice(-3).reduce((s, d) => s + (d.revenue || 0), 0)
    const prior = rev.slice(-6, -3).reduce((s, d) => s + (d.revenue || 0), 0)
    if (prior > 0) {
      const change = Math.round(((recent - prior) / prior) * 100)
      if (change >= 10) {
        insights.push({ type: 'success', text: `Revenue is up ${change}% in the last 3 days vs. the 3 before — momentum is building, consider boosting ad spend or featuring bestsellers.` })
      } else if (change <= -10) {
        insights.push({ type: 'warning', text: `Revenue dropped ${Math.abs(change)}% in the last 3 days. Check for stockouts, a broken coupon, or a slow-loading page.` })
      }
    }
  }

  // Stock risk
  if (overview?.outOfStockCount > 0) {
    insights.push({ type: 'warning', text: `${overview.outOfStockCount} product${overview.outOfStockCount > 1 ? 's are' : ' is'} completely out of stock — these are invisible to shoppers and losing you sales right now.` })
  } else if (overview?.lowStockCount > 0) {
    insights.push({ type: 'tip', text: `${overview.lowStockCount} product${overview.lowStockCount > 1 ? 's are' : ' is'} running low. Restocking the top seller${lowStock?.[0]?.name ? ` ("${lowStock[0].name}")` : ''} first will protect the most revenue.` })
  }

  // Category concentration
  if (categoryBreakdown?.length >= 2) {
    const total = categoryBreakdown.reduce((s, c) => s + (c.totalStockValue || 0), 0)
    const top = [...categoryBreakdown].sort((a, b) => (b.totalStockValue || 0) - (a.totalStockValue || 0))[0]
    if (total > 0 && top) {
      const share = Math.round((top.totalStockValue / total) * 100)
      if (share >= 50) {
        insights.push({ type: 'info', text: `${share}% of your inventory value sits in "${top.categoryName}". Diversifying stock across categories can reduce risk if demand shifts.` })
      }
    }
  }

  // Order fulfilment
  const outOfStockOrders = orderStats?.ordersByStatus?.find((s) => s.status === 'Out of Stock')?.count || 0
  if (outOfStockOrders > 0) {
    insights.push({ type: 'warning', text: `${outOfStockOrders} order${outOfStockOrders > 1 ? 's are' : ' is'} marked "Out of Stock" — resolve these first, they directly hurt customer trust.` })
  }

  // Reviews
  if (pendingReviews > 3) {
    insights.push({ type: 'tip', text: `${pendingReviews} reviews are awaiting approval. Approving genuine reviews quickly builds social proof that helps convert new visitors.` })
  }

  // Growth
  if (userStats?.newUsersThisMonth > 0 && userStats?.totalUsers > 0) {
    const growthShare = Math.round((userStats.newUsersThisMonth / userStats.totalUsers) * 100)
    if (growthShare >= 15) {
      insights.push({ type: 'success', text: `${growthShare}% of your total users joined this month — strong signups. A welcome-offer coupon could convert them into first-time buyers.` })
    }
  }

  // Coupons
  if (activeCoupons === 0) {
    insights.push({ type: 'tip', text: `You have no active coupons right now. A time-limited discount is one of the fastest ways to lift conversion on slow days.` })
  }

  if (insights.length === 0) {
    insights.push({ type: 'success', text: 'Everything looks healthy — stock, orders and reviews are all in good shape. No urgent action needed today.' })
  }

  return insights.slice(0, 5)
}

const insightTone = { warning: 'adm-badge-danger', success: 'adm-badge-success', info: 'adm-badge-muted', tip: 'adm-badge-warning' }
const insightLabel = { warning: 'Attention', success: 'Good News', info: 'Insight', tip: 'Tip' }

export default function DashboardPage() {
  const { admin } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [error, setError] = useState('')
  const [overview, setOverview] = useState(null)
  const [categoryBreakdown, setCategoryBreakdown] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [categoriesTotal, setCategoriesTotal] = useState(null)
  const [pendingReviews, setPendingReviews] = useState(null)
  const [recentReviews, setRecentReviews] = useState([])
  const [activeCoupons, setActiveCoupons] = useState(null)
  const [totalCoupons, setTotalCoupons] = useState(null)
  const [orderStats, setOrderStats] = useState(null)
  const [userStats, setUserStats] = useState(null)

  const load = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const [
        overviewRes,
        categoryRes,
        lowStockRes,
        categoriesRes,
        pendingReviewsRes,
        recentReviewsRes,
        activeCouponsRes,
        totalCouponsRes,
        orderStatsRes,
        userStatsRes,
      ] = await Promise.all([
        dashboardApi.inventoryOverview(),
        dashboardApi.stockByCategory(),
        dashboardApi.lowStockProducts(10),
        dashboardApi.categoriesCount(),
        dashboardApi.pendingReviewsCount(),
        dashboardApi.recentReviews(),
        dashboardApi.activeCouponsCount(),
        dashboardApi.totalCouponsCount(),
        dashboardApi.orderStats(),
        dashboardApi.userStats(),
      ])

      setOverview(overviewRes.overview)
      setCategoryBreakdown(categoryRes.breakdown || [])
      setLowStock((lowStockRes.products || []).slice(0, 6))
      setCategoriesTotal(categoriesRes.count ?? 0)
      setPendingReviews(pendingReviewsRes.total ?? 0)
      setRecentReviews(recentReviewsRes.reviews || [])
      setActiveCoupons(activeCouponsRes.total ?? 0)
      setTotalCoupons(totalCouponsRes.total ?? 0)
      setOrderStats(orderStatsRes)
      setUserStats(userStatsRes)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const ordersNeedingAction =
    (orderStats?.ordersByStatus?.find((s) => s.status === 'Placed')?.count || 0) +
    (orderStats?.ordersByStatus?.find((s) => s.status === 'Confirmed')?.count || 0)
  const outOfStockOrders = orderStats?.ordersByStatus?.find((s) => s.status === 'Out of Stock')?.count || 0

  const maxCategoryValue = Math.max(1, ...categoryBreakdown.map((c) => c.totalStockValue || 0))

  const insights = loading
    ? []
    : buildInsights({ overview, categoryBreakdown, orderStats, userStats, pendingReviews, lowStock, activeCoupons })

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h2>{greeting()}{admin?.name ? `, ${admin.name.split(' ')[0]}` : ''} 👋</h2>
          <p>
            Here's what's happening with your store today.
            {lastUpdated && (
              <span className="adm-dash-updated"> · Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </p>
        </div>
        <button
          type="button"
          className="adm-btn adm-btn-outline adm-btn-sm"
          onClick={() => load(true)}
          disabled={loading || refreshing}
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="adm-quick-actions">
        <Link to="/admin/orders" className="adm-quick-action">
          <IconOrders width={16} height={16} />
          Orders needing action
          {ordersNeedingAction > 0 && <span className="adm-quick-action-count">{ordersNeedingAction}</span>}
        </Link>
        <Link to="/admin/reviews" className="adm-quick-action">
          <IconStar width={16} height={16} />
          Approve reviews
          {pendingReviews > 0 && <span className="adm-quick-action-count">{pendingReviews}</span>}
        </Link>
        <Link to="/admin/inventory" className="adm-quick-action">
          <IconBox width={16} height={16} />
          Restock products
          {overview?.lowStockCount > 0 && <span className="adm-quick-action-count">{overview.lowStockCount}</span>}
        </Link>
        <Link to="/admin/products" className="adm-quick-action">
          <IconProducts width={16} height={16} />
          Add a product
        </Link>
        <Link to="/admin/coupons" className="adm-quick-action">
          <IconTag width={16} height={16} />
          Create a coupon
        </Link>
      </div>

      {error && (
        <div className="adm-alert adm-alert-error" style={{ marginBottom: '1.25rem' }}>
          <IconAlert />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <SkeletonCards count={4} />
      ) : (
        <div className="adm-stat-grid">
          <StatCard
            icon={IconProducts}
            tone="green"
            label="Total Products"
            value={overview?.totalProducts ?? 0}
            sub={`${overview?.totalUnits ?? 0} units in stock`}
            to="/admin/products"
          />
          <StatCard
            icon={IconCategories}
            tone="gold"
            label="Categories"
            value={categoriesTotal ?? 0}
            to="/admin/categories"
          />
          <StatCard
            icon={IconAlert}
            tone="warning"
            label="Low Stock Alerts"
            value={overview?.lowStockCount ?? 0}
            sub={`${overview?.outOfStockCount ?? 0} out of stock`}
            to="/admin/inventory"
          />
          <StatCard
            icon={IconBox}
            tone="green"
            label="Inventory Value"
            value={currency(overview?.totalStockValue)}
            to="/admin/inventory"
          />
        </div>
      )}

      {!loading && (
        <div className="adm-stat-grid">
          <StatCard
            icon={IconStar}
            tone="gold"
            label="Reviews Pending Approval"
            value={pendingReviews ?? 0}
            to="/admin/reviews"
          />
          <StatCard
            icon={IconTag}
            tone="green"
            label="Active Coupons"
            value={activeCoupons ?? 0}
            sub={`${totalCoupons ?? 0} total coupons`}
            to="/admin/coupons"
          />
          <StatCard
            icon={IconOrders}
            tone="green"
            label="Total Orders"
            value={orderStats?.totalOrders ?? 0}
            sub={`${ordersNeedingAction} need action${outOfStockOrders ? ` · ${outOfStockOrders} out of stock` : ''} · ${currency(orderStats?.totalRevenue)} revenue`}
            to="/admin/orders"
          />
          <StatCard
            icon={IconUsers}
            tone="gold"
            label="Registered Users"
            value={userStats?.totalUsers ?? 0}
            sub={`${userStats?.newUsersThisMonth ?? 0} new this month`}
            to="/admin/users"
          />
        </div>
      )}

      {/* AI Insights — auto-generated from live store data, no setup needed */}
      <div className="adm-card" style={{ marginTop: loading ? 0 : '1.25rem' }}>
        <div className="adm-card-head">
          <h3><IconSparkles width={16} height={16} style={{ verticalAlign: '-3px', marginRight: 6, color: 'var(--gold2, #c8a951)' }} />AI Insights</h3>
          <span className="adm-badge adm-badge-muted">Auto-generated</span>
        </div>
        {loading ? (
          <div className="adm-skeleton" style={{ height: 120 }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {insights.map((ins, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                  padding: '0.65rem 0.8rem',
                  borderRadius: 10,
                  background: '#f9fafb',
                  border: '1px solid #eef0f2',
                }}
              >
                <span className={`adm-badge ${insightTone[ins.type]}`} style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {insightLabel[ins.type]}
                </span>
                <span style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.5 }}>{ins.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="adm-grid-2">
        {/* Stock by category chart */}
        <div className="adm-card">
          <div className="adm-card-head">
            <h3>Stock Value by Category</h3>
            <Link to="/admin/inventory" className="adm-link">View inventory</Link>
          </div>

          {loading ? (
            <div className="adm-skeleton" style={{ height: 180 }} />
          ) : categoryBreakdown.length === 0 ? (
            <div className="adm-empty-state">No category stock data yet.</div>
          ) : (
            <div>
              {categoryBreakdown.map((cat) => (
                <div className="adm-bar-row" key={cat.categoryId || cat.categoryName}>
                  <span className="adm-bar-label" title={cat.categoryName}>
                    {cat.categoryName || 'Uncategorized'}
                  </span>
                  <span className="adm-bar-track">
                    <span
                      className="adm-bar-fill"
                      style={{ width: `${Math.max(4, (cat.totalStockValue / maxCategoryValue) * 100)}%` }}
                    />
                  </span>
                  <span className="adm-bar-value">{currency(cat.totalStockValue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock table */}
        <div className="adm-card">
          <div className="adm-card-head">
            <h3>Low Stock Products</h3>
            <Link to="/admin/inventory" className="adm-link">Manage stock</Link>
          </div>

          {loading ? (
            <div className="adm-skeleton" style={{ height: 180 }} />
          ) : lowStock.length === 0 ? (
            <div className="adm-empty-state">Nothing is running low right now. 🎉</div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div className="adm-table-product">
                          {p.images?.[0] && <img src={p.images[0]} alt="" className="adm-table-thumb" />}
                          <span>{p.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`adm-badge ${p.stock === 0 ? 'adm-badge-danger' : 'adm-badge-warning'}`}>
                          {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="adm-grid-2" style={{ marginTop: '1.25rem' }}>
        {/* Revenue trend */}
        <div className="adm-card">
          <div className="adm-card-head">
            <h3>Revenue — Last 7 Days</h3>
            <Link to="/admin/orders" className="adm-link">View orders</Link>
          </div>

          {loading ? (
            <div className="adm-skeleton" style={{ height: 180 }} />
          ) : !orderStats?.revenueLast7Days?.length ? (
            <div className="adm-empty-state">No orders in the last 7 days yet.</div>
          ) : (
            <div>
              {(() => {
                const maxRevenue = Math.max(1, ...orderStats.revenueLast7Days.map((d) => d.revenue || 0))
                return orderStats.revenueLast7Days.map((d) => (
                  <div className="adm-bar-row" key={d.date}>
                    <span className="adm-bar-label" title={d.date}>
                      {new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}
                    </span>
                    <span className="adm-bar-track">
                      <span
                        className="adm-bar-fill"
                        style={{ width: `${Math.max(4, (d.revenue / maxRevenue) * 100)}%` }}
                      />
                    </span>
                    <span className="adm-bar-value">{currency(d.revenue)}</span>
                  </div>
                ))
              })()}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="adm-card">
          <div className="adm-card-head">
            <h3>Recent Orders</h3>
            <Link to="/admin/orders" className="adm-link">View all</Link>
          </div>

          {loading ? (
            <div className="adm-skeleton" style={{ height: 180 }} />
          ) : !orderStats?.recentOrders?.length ? (
            <div className="adm-empty-state">No orders yet.</div>
          ) : (
            <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  minWidth: 0,
                  paddingBottom: 8,
                }}
              >
                {orderStats.recentOrders.map((o) => (
                  <div
                    key={o._id}
                    style={{
                      minWidth: 280,
                      flex: '0 0 280px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 14,
                      padding: '1rem',
                      background: '#fff',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                      <strong style={{ fontSize: '0.95rem', lineHeight: 1.3 }}>{o.orderId}</strong>
                      <span className={`adm-badge ${orderStatusTone(o.orderStatus)}`} style={{ whiteSpace: 'nowrap' }}>
                        {o.orderStatus}
                      </span>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.82rem', marginBottom: 12 }}>
                      <div>{o.user?.name || 'Deleted user'}</div>
                      <div>{o.user?.email || ''}</div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: '1.35rem', fontWeight: 700 }}>{currency(o.totalPrice)}</div>
                      <div style={{ color: '#6b7280', fontSize: '0.82rem' }}>
                        {new Date(o.createdAt).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <span className="adm-badge adm-badge-muted" style={{ padding: '0.4rem 0.65rem', textAlign: 'center' }}>
                        {o.orderItems?.length || 0} items
                      </span>
                      <span className="adm-badge adm-badge-muted" style={{ padding: '0.4rem 0.65rem', textAlign: 'center', textTransform: 'uppercase' }}>
                        {o.paymentMethod || 'COD'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent reviews */}
      <div className="adm-card" style={{ marginTop: '1.25rem' }}>
        <div className="adm-card-head">
          <h3>Recent Reviews</h3>
          <Link to="/admin/reviews" className="adm-link">View all</Link>
        </div>

        {loading ? (
          <div className="adm-skeleton" style={{ height: 140 }} />
        ) : recentReviews.length === 0 ? (
          <div className="adm-empty-state">No reviews yet.</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentReviews.map((r) => (
                  <tr key={r._id}>
                    <td>{r.product?.name || '—'}</td>
                    <td>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
                    <td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.comment}
                    </td>
                    <td>
                      <span className={`adm-badge ${r.isApproved ? 'adm-badge-success' : 'adm-badge-warning'}`}>
                        {r.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
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