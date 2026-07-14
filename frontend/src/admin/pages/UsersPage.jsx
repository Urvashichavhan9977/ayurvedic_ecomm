import { useEffect, useState } from 'react'
import { usersApi } from '../api/usersApi'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import { useToast } from '../components/Toast'
import { IconAlert, IconSearch, IconEye } from '../components/AdminIcons'

const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

function UserDetailModal({ userId, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    usersApi
      .get(userId)
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load user.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  return (
    <Modal title={data ? data.user.name : 'Customer Details'} onClose={onClose} size="lg">
      {loading ? (
        <div className="adm-loading-cell">Loading customer…</div>
      ) : error ? (
        <div className="adm-alert adm-alert-error">
          <IconAlert />
          <span>{error}</span>
        </div>
      ) : data ? (
        <div>
          <div className="adm-order-summary-grid">
            <div className="adm-order-summary-block">
              <h4>Contact</h4>
              <p>{data.user.email}</p>
              <p style={{ color: 'var(--adm-muted)', fontSize: '0.82rem' }}>{data.user.phone || 'No phone on file'}</p>
            </div>
            <div className="adm-order-summary-block">
              <h4>Account</h4>
              <span className={`adm-badge ${data.user.isActive ? 'adm-badge-success' : 'adm-badge-danger'}`}>
                {data.user.isActive ? 'Active' : 'Blocked'}
              </span>{' '}
              <span className={`adm-badge ${data.user.isVerified ? 'adm-badge-success' : 'adm-badge-muted'}`}>
                {data.user.isVerified ? 'Verified' : 'Unverified'}
              </span>
              <p style={{ color: 'var(--adm-muted)', fontSize: '0.78rem', marginTop: '0.4rem' }}>
                Joined {new Date(data.user.createdAt).toLocaleDateString('en-IN')}
              </p>
            </div>
            <div className="adm-order-summary-block">
              <h4>Orders</h4>
              <p style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--adm-green)' }}>{data.orderCount}</p>
            </div>
            <div className="adm-order-summary-block">
              <h4>Total Spent</h4>
              <p style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--adm-green)' }}>{currency(data.totalSpent)}</p>
            </div>
          </div>

          <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Recent Orders</h4>
          {data.orders.length === 0 ? (
            <div className="adm-empty-state">This customer hasn't placed any orders yet.</div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((o) => (
                    <tr key={o._id}>
                      <td className="adm-table-cell-muted">{o.orderId}</td>
                      <td className="adm-table-cell-muted">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>{currency(o.totalPrice)}</td>
                      <td>
                        <span className="adm-badge adm-badge-muted">{o.orderStatus}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  )
}

export default function UsersPage() {
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('') // '', 'true', 'false'
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, pages: 1, count: 0 })

  const [viewingId, setViewingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 15, sort }
      if (search) params.search = search
      if (statusFilter) params.isActive = statusFilter

      const res = await usersApi.list(params)
      setUsers(res.users || [])
      setMeta({ total: res.total || 0, pages: res.pages || 1, count: (res.users || []).length })
    } catch (err) {
      setError(err.message || 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, sort])

  useEffect(() => {
    setPage(1)
    const t = setTimeout(() => load(), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const handleToggleStatus = async () => {
    if (!confirmTarget) return
    setTogglingId(confirmTarget._id)
    try {
      const res = await usersApi.updateStatus(confirmTarget._id, !confirmTarget.isActive)
      setUsers((prev) => prev.map((u) => (u._id === confirmTarget._id ? { ...u, ...res.user } : u)))
      toast.success(`${res.user.name} is now ${res.user.isActive ? 'active' : 'blocked'}.`)
      setConfirmTarget(null)
    } catch (err) {
      toast.error(err.message || 'Failed to update customer status.')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h2>Users</h2>
          <p>Search, review, and manage customer accounts.</p>
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
          <div className="adm-search-wrap">
            <span className="adm-search-icon"><IconSearch width={16} height={16} /></span>
            <input
              className="adm-input"
              placeholder="Search name, email, or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="adm-tab-bar">
            <button type="button" className={`adm-tab-btn${statusFilter === '' ? ' active' : ''}`} onClick={() => { setStatusFilter(''); setPage(1) }}>
              All
            </button>
            <button type="button" className={`adm-tab-btn${statusFilter === 'true' ? ' active' : ''}`} onClick={() => { setStatusFilter('true'); setPage(1) }}>
              Active
            </button>
            <button type="button" className={`adm-tab-btn${statusFilter === 'false' ? ' active' : ''}`} onClick={() => { setStatusFilter('false'); setPage(1) }}>
              Blocked
            </button>
          </div>
        </div>
        <div className="adm-toolbar-right">
          <select className="adm-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </div>
      </div>

      <div className="adm-card">
        {loading ? (
          <div className="adm-loading-cell">Loading customers…</div>
        ) : users.length === 0 ? (
          <div className="adm-empty-state">No customers match your filters.</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>
                      <div style={{ fontSize: '0.82rem' }}>{u.email}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>{u.phone || '—'}</div>
                    </td>
                    <td>{u.orderCount}</td>
                    <td>{currency(u.totalSpent)}</td>
                    <td className="adm-table-cell-muted">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <label className="adm-switch">
                        <input
                          type="checkbox"
                          checked={u.isActive}
                          disabled={togglingId === u._id}
                          onChange={() => setConfirmTarget(u)}
                        />
                        <span className="adm-switch-track" />
                      </label>
                    </td>
                    <td>
                      <div className="adm-row-actions">
                        <button type="button" className="adm-icon-btn" onClick={() => setViewingId(u._id)} aria-label="View">
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

      {viewingId && <UserDetailModal userId={viewingId} onClose={() => setViewingId(null)} />}

      {confirmTarget && (
        <ConfirmDialog
          title={confirmTarget.isActive ? 'Block Customer' : 'Unblock Customer'}
          message={
            <>
              Are you sure you want to {confirmTarget.isActive ? 'block' : 'unblock'} <strong>{confirmTarget.name}</strong>?
              {confirmTarget.isActive ? ' They will not be able to log in until unblocked.' : ' They will regain access to their account.'}
            </>
          }
          confirmLabel={confirmTarget.isActive ? 'Block' : 'Unblock'}
          danger={confirmTarget.isActive}
          loading={togglingId === confirmTarget._id}
          onConfirm={handleToggleStatus}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  )
}
