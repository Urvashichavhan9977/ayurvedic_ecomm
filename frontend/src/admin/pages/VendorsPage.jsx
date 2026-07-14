import { useEffect, useState } from 'react'
import { vendorsApi } from '../api/vendorsApi'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import { useToast } from '../components/Toast'
import { IconAlert, IconEye } from '../components/AdminIcons'

const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const STATUS_BADGE = {
  pending: 'adm-badge-warning',
  approved: 'adm-badge-success',
  rejected: 'adm-badge-danger',
  suspended: 'adm-badge-muted',
}

function VendorDetailModal({ vendorId, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    vendorsApi
      .get(vendorId)
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load vendor.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [vendorId])

  return (
    <Modal title={data ? data.vendor.shopName : 'Vendor Details'} onClose={onClose} size="lg">
      {loading ? (
        <div className="adm-loading-cell">Loading vendor…</div>
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
              <p>{data.vendor.name}</p>
              <p style={{ color: 'var(--adm-muted)', fontSize: '0.82rem' }}>{data.vendor.email}</p>
              <p style={{ color: 'var(--adm-muted)', fontSize: '0.82rem' }}>{data.vendor.phone || 'No phone on file'}</p>
            </div>
            <div className="adm-order-summary-block">
              <h4>Status</h4>
              <span className={`adm-badge ${STATUS_BADGE[data.vendor.vendorStatus] || 'adm-badge-muted'}`}>
                {data.vendor.vendorStatus}
              </span>
              <p style={{ color: 'var(--adm-muted)', fontSize: '0.78rem', marginTop: '0.4rem' }}>
                Joined {new Date(data.vendor.createdAt).toLocaleDateString('en-IN')}
              </p>
            </div>
            <div className="adm-order-summary-block">
              <h4>Products</h4>
              <p style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--adm-green)' }}>{data.products.length}</p>
            </div>
            <div className="adm-order-summary-block">
              <h4>Gross Sales</h4>
              <p style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--adm-green)' }}>{currency(data.grossSales)}</p>
            </div>
          </div>

          {data.vendor.gstNumber && (
            <p style={{ fontSize: '0.82rem', color: 'var(--adm-muted)', marginBottom: '0.75rem' }}>
              GST: {data.vendor.gstNumber}
            </p>
          )}

          <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Products</h4>
          {data.products.length === 0 ? (
            <div className="adm-empty-state">This vendor hasn't added any products yet.</div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((p) => (
                    <tr key={p._id}>
                      <td className="adm-table-cell-muted">{p.name}</td>
                      <td className="adm-table-cell-muted">{p.category?.name || '—'}</td>
                      <td>{currency(p.price)}</td>
                      <td>
                        <span className={`adm-badge ${STATUS_BADGE[p.approvalStatus] || 'adm-badge-muted'}`}>
                          {p.approvalStatus}
                        </span>
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

function VendorsTab() {
  const toast = useToast()
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, pages: 1, count: 0 })

  const [viewingId, setViewingId] = useState(null)
  const [actingId, setActingId] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 15 }
      if (search) params.search = search
      if (statusFilter) params.vendorStatus = statusFilter

      const res = await vendorsApi.list(params)
      setVendors(res.vendors || [])
      setMeta({ total: res.total || 0, pages: res.pages || 1, count: (res.vendors || []).length })
    } catch (err) {
      setError(err.message || 'Failed to load vendors.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    load()
  }

  const runAction = async (id, action, label) => {
    setActingId(id)
    try {
      await action(id)
      toast.push(label, 'success')
      load()
    } catch (err) {
      toast.push(err.message || 'Action failed.', 'error')
    } finally {
      setActingId(null)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    setActingId(rejectTarget)
    try {
      await vendorsApi.reject(rejectTarget, rejectReason)
      toast.push('Vendor application rejected.', 'success')
      setRejectTarget(null)
      setRejectReason('')
      load()
    } catch (err) {
      toast.push(err.message || 'Failed to reject vendor.', 'error')
    } finally {
      setActingId(null)
    }
  }

  return (
    <>
      <form className="adm-toolbar" onSubmit={handleSearchSubmit} style={{ marginBottom: '1rem' }}>
        <input
          className="adm-input"
          placeholder="Search by name, email or shop…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="adm-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
        <button type="submit" className="adm-btn adm-btn-outline">Search</button>
      </form>

      {error && (
        <div className="adm-alert adm-alert-error">
          <IconAlert />
          <span>{error}</span>
        </div>
      )}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Shop</th>
              <th>Owner</th>
              <th>Products</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="adm-loading-cell">Loading vendors…</td></tr>
            ) : vendors.length === 0 ? (
              <tr><td colSpan={5} className="adm-empty-state">No vendors found.</td></tr>
            ) : (
              vendors.map((v) => (
                <tr key={v._id}>
                  <td>{v.shopName}</td>
                  <td className="adm-table-cell-muted">{v.name} · {v.email}</td>
                  <td>{v.productCount}</td>
                  <td>
                    <span className={`adm-badge ${STATUS_BADGE[v.vendorStatus] || 'adm-badge-muted'}`}>
                      {v.vendorStatus}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={() => setViewingId(v._id)}>
                        <IconEye /> View
                      </button>
                      {v.vendorStatus === 'pending' && (
                        <>
                          <button
                            type="button"
                            className="adm-btn adm-btn-primary adm-btn-sm"
                            disabled={actingId === v._id}
                            onClick={() => runAction(v._id, vendorsApi.approve, 'Vendor approved.')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="adm-btn adm-btn-danger adm-btn-sm"
                            disabled={actingId === v._id}
                            onClick={() => setRejectTarget(v._id)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {v.vendorStatus === 'approved' && (
                        <button
                          type="button"
                          className="adm-btn adm-btn-danger adm-btn-sm"
                          disabled={actingId === v._id}
                          onClick={() => runAction(v._id, vendorsApi.suspend, 'Vendor suspended.')}
                        >
                          Suspend
                        </button>
                      )}
                      {v.vendorStatus === 'suspended' && (
                        <button
                          type="button"
                          className="adm-btn adm-btn-primary adm-btn-sm"
                          disabled={actingId === v._id}
                          onClick={() => runAction(v._id, vendorsApi.reactivate, 'Vendor reactivated.')}
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pages={meta.pages} total={meta.total} count={meta.count} onPageChange={setPage} />

      {viewingId && <VendorDetailModal vendorId={viewingId} onClose={() => setViewingId(null)} />}

      {rejectTarget && (
        <ConfirmDialog
          title="Reject Vendor Application"
          message={
            <span>
              Optionally add a reason (shown to the vendor):
              <textarea
                className="adm-textarea"
                style={{ marginTop: '0.6rem', width: '100%' }}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </span>
          }
          confirmLabel="Reject"
          loading={actingId === rejectTarget}
          onConfirm={handleReject}
          onCancel={() => { setRejectTarget(null); setRejectReason('') }}
        />
      )}
    </>
  )
}

function PendingProductsTab() {
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingId, setActingId] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await vendorsApi.listPendingProducts({ limit: 50 })
      setProducts(res.products || [])
    } catch (err) {
      setError(err.message || 'Failed to load pending products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleApprove = async (id) => {
    setActingId(id)
    try {
      await vendorsApi.approveProduct(id)
      toast.push('Product approved and now live on the store.', 'success')
      load()
    } catch (err) {
      toast.push(err.message || 'Failed to approve product.', 'error')
    } finally {
      setActingId(null)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    setActingId(rejectTarget)
    try {
      await vendorsApi.rejectProduct(rejectTarget, rejectReason)
      toast.push('Product rejected.', 'success')
      setRejectTarget(null)
      setRejectReason('')
      load()
    } catch (err) {
      toast.push(err.message || 'Failed to reject product.', 'error')
    } finally {
      setActingId(null)
    }
  }

  return (
    <>
      {error && (
        <div className="adm-alert adm-alert-error">
          <IconAlert />
          <span>{error}</span>
        </div>
      )}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Vendor</th>
              <th>Category</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="adm-loading-cell">Loading…</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={5} className="adm-empty-state">No products awaiting approval. 🎉</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td className="adm-table-cell-muted">{p.vendor?.shopName || '—'}</td>
                  <td className="adm-table-cell-muted">{p.category?.name || '—'}</td>
                  <td>{currency(p.price)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        className="adm-btn adm-btn-primary adm-btn-sm"
                        disabled={actingId === p._id}
                        onClick={() => handleApprove(p._id)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="adm-btn adm-btn-danger adm-btn-sm"
                        disabled={actingId === p._id}
                        onClick={() => setRejectTarget(p._id)}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {rejectTarget && (
        <ConfirmDialog
          title="Reject Product"
          message={
            <span>
              Optionally add a reason (shown to the vendor):
              <textarea
                className="adm-textarea"
                style={{ marginTop: '0.6rem', width: '100%' }}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </span>
          }
          confirmLabel="Reject"
          loading={actingId === rejectTarget}
          onConfirm={handleReject}
          onCancel={() => { setRejectTarget(null); setRejectReason('') }}
        />
      )}
    </>
  )
}

export default function VendorsPage() {
  const [tab, setTab] = useState('vendors')

  return (
    <div>
      <div className="adm-tab-bar" style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          className={`adm-tab-btn ${tab === 'vendors' ? 'active' : ''}`}
          onClick={() => setTab('vendors')}
        >
          Vendors
        </button>
        <button
          type="button"
          className={`adm-tab-btn ${tab === 'pending' ? 'active' : ''}`}
          onClick={() => setTab('pending')}
        >
          Pending Products
        </button>
      </div>

      {tab === 'vendors' ? <VendorsTab /> : <PendingProductsTab />}
    </div>
  )
}
