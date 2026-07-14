import { useEffect, useState } from 'react'
import { contactApi } from '../api/contactApi'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'
import { useToast } from '../components/Toast'
import { IconAlert, IconSearch, IconEye, IconTrash } from '../components/AdminIcons'

const statusBadgeClass = {
  new: 'adm-badge-danger',
  read: 'adm-badge-muted',
  resolved: 'adm-badge-success',
}

function ContactDetailModal({ contact, onClose, onStatusChange }) {
  const [updating, setUpdating] = useState(false)
  const toast = useToast()

  const handleStatus = async (status) => {
    setUpdating(true)
    try {
      const res = await contactApi.updateStatus(contact._id, status)
      onStatusChange(res.contact)
      toast.success(`Marked ${status}.`)
    } catch (err) {
      toast.error(err.message || 'Failed to update status.')
    } finally {
      setUpdating(false)
    }
  }

  const handleReply = () => {
    const subject = contact.subject ? `Re: ${contact.subject}` : 'Re: Your message'
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}`
  }

  const handleCopyEmail = async () => {
    try {
      await (navigator.clipboard && navigator.clipboard.writeText(contact.email))
      toast.success('Email address copied to clipboard')
    } catch {
      toast.error('Unable to copy email')
    }
  }

  return (
    <Modal title={`${contact.fname} ${contact.lname || ''}`} onClose={onClose} size="lg">
      <div className="adm-order-summary-grid">
        <div className="adm-order-summary-block">
          <h4>Contact</h4>
          <p style={{ wordBreak: 'break-word' }}>{contact.email}</p>
          <p style={{ color: 'var(--adm-muted)', fontSize: '0.82rem' }}>{contact.phone || 'No phone provided'}</p>
        </div>
        <div className="adm-order-summary-block">
          <h4>Subject</h4>
          <p>{contact.subject || 'General Inquiry'}</p>
        </div>
        <div className="adm-order-summary-block">
          <h4>Received</h4>
          <p style={{ color: 'var(--adm-muted)', fontSize: '0.82rem' }}>
            {new Date(contact.createdAt).toLocaleString('en-IN')} ({new Date(contact.createdAt).toISOString()})
          </p>
        </div>
        <div className="adm-order-summary-block">
          <h4>Status</h4>
          <span className={`adm-badge ${statusBadgeClass[contact.status] || 'adm-badge-muted'}`}>
            {contact.status}
          </span>
        </div>
      </div>

      {contact.ip && (
        <div style={{ marginTop: '0.5rem', color: 'var(--adm-muted)', fontSize: '0.82rem' }}>
          <strong>IP:</strong> {contact.ip}
        </div>
      )}
      {contact.userAgent && (
        <div style={{ marginTop: '0.25rem', color: 'var(--adm-muted)', fontSize: '0.82rem' }}>
          <strong>Agent:</strong> {contact.userAgent}
        </div>
      )}

      <h4 style={{ fontSize: '0.85rem', margin: '1rem 0 0.5rem' }}>Message</h4>
      <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{contact.message}</p>

      <div className="adm-row-actions" style={{ marginTop: '1.25rem', gap: '0.5rem' }}>
        <button type="button" className="btn btn-outline" disabled={updating || contact.status === 'read'} onClick={() => handleStatus('read')}>
          Mark Read
        </button>
        <button type="button" className="btn btn-green" disabled={updating || contact.status === 'resolved'} onClick={() => handleStatus('resolved')}>
          Mark Resolved
        </button>
        <button type="button" className="btn btn-primary" onClick={handleReply}>
          Reply
        </button>
        <button type="button" className="btn" onClick={handleCopyEmail}>
          Copy Email
        </button>
      </div>
    </Modal>
  )
}

export default function ContactsPages() {
  const toast = useToast()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('') // '', 'new', 'read', 'resolved'
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total: 0, pages: 1, count: 0, newCount: 0 })

  const [viewing, setViewing] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 15, sort }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter

      const res = await contactApi.list(params)
      setContacts(res.contacts || [])
      setMeta({
        total: res.total || 0,
        pages: res.pages || 1,
        count: (res.contacts || []).length,
        newCount: res.newCount || 0,
      })
    } catch (err) {
      setError(err.message || 'Failed to load contact messages.')
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

  const handleOpen = async (contact) => {
    // Opening a "new" message auto-flips it to "read" on the backend,
    // so reflect that immediately in the list too.
    setViewing(contact)
    if (contact.status === 'new') {
      setContacts((prev) => prev.map((c) => (c._id === contact._id ? { ...c, status: 'read' } : c)))
    }
  }

  const handleStatusChange = (updated) => {
    setContacts((prev) => prev.map((c) => (c._id === updated._id ? updated : c)))
    setViewing(updated)
  }

  const handleDelete = async () => {
    if (!confirmTarget) return
    setDeletingId(confirmTarget._id)
    try {
      await contactApi.remove(confirmTarget._id)
      setContacts((prev) => prev.filter((c) => c._id !== confirmTarget._id))
      toast.success('Message deleted.')
      setConfirmTarget(null)
    } catch (err) {
      toast.error(err.message || 'Failed to delete message.')
    } finally {
      setDeletingId(null)
    }
  }

  const exportCSV = () => {
    if (!contacts || contacts.length === 0) {
      toast.error('No contacts to export')
      return
    }

    const headers = ['First Name','Last Name','Email','Phone','Subject','Message','Status','Received']
    const rows = contacts.map((c) => [
      c.fname || '',
      c.lname || '',
      c.email || '',
      c.phone || '',
      c.subject || '',
      (c.message || '').replace(/\r?\n/g, ' '),
      c.status || '',
      c.createdAt || '',
    ])

    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contacts-${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success('Export started')
  }

  const copyEmail = async (email) => {
    try {
      await (navigator.clipboard && navigator.clipboard.writeText(email))
      toast.success('Email copied')
    } catch {
      toast.error('Unable to copy email')
    }
  }

  const quickReply = (email, subject) => {
    const sub = subject ? `Re: ${subject}` : 'Re: Your message'
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(sub)}`
  }

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h2>Contact Messages</h2>
          <p>Messages submitted through the storefront "Contact Us" form.</p>
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
              placeholder="Search name, email, or message…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="adm-tab-bar">
            <button type="button" className={`adm-tab-btn${statusFilter === '' ? ' active' : ''}`} onClick={() => { setStatusFilter(''); setPage(1) }}>
              All
            </button>
            <button type="button" className={`adm-tab-btn${statusFilter === 'new' ? ' active' : ''}`} onClick={() => { setStatusFilter('new'); setPage(1) }}>
              New{meta.newCount ? ` (${meta.newCount})` : ''}
            </button>
            <button type="button" className={`adm-tab-btn${statusFilter === 'read' ? ' active' : ''}`} onClick={() => { setStatusFilter('read'); setPage(1) }}>
              Read
            </button>
            <button type="button" className={`adm-tab-btn${statusFilter === 'resolved' ? ' active' : ''}`} onClick={() => { setStatusFilter('resolved'); setPage(1) }}>
              Resolved
            </button>
          </div>
        </div>
        <div className="adm-toolbar-right" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button type="button" className="btn" onClick={exportCSV} title="Export visible messages as CSV">Export CSV</button>
          <select className="adm-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      <div className="adm-card">
        {loading ? (
          <div className="adm-loading-cell">Loading messages…</div>
        ) : contacts.length === 0 ? (
          <div className="adm-empty-state">No contact messages match your filters.</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Subject</th>
                  <th>Received</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c._id}>
                    <td>{c.fname} {c.lname}</td>
                    <td>
                      <div style={{ fontSize: '0.82rem' }}>{c.email}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>{c.phone || '—'}</div>
                    </td>
                    <td>{c.subject || 'General Inquiry'}</td>
                    <td className="adm-table-cell-muted">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <span className={`adm-badge ${statusBadgeClass[c.status] || 'adm-badge-muted'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <div className="adm-row-actions">
                        <button type="button" className="adm-icon-btn" onClick={() => handleOpen(c)} aria-label="View">
                          <IconEye width={16} height={16} />
                        </button>
                        <button type="button" className="adm-icon-btn" title="Reply" onClick={() => quickReply(c.email, c.subject)}>
                          Reply
                        </button>
                        <button type="button" className="adm-icon-btn" title="Copy email" onClick={() => copyEmail(c.email)}>
                          Copy
                        </button>
                        <button type="button" className="adm-icon-btn" onClick={() => setConfirmTarget(c)} aria-label="Delete">
                          <IconTrash width={16} height={16} />
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

      {viewing && (
        <ContactDetailModal
          contact={viewing}
          onClose={() => setViewing(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {confirmTarget && (
        <ConfirmDialog
          title="Delete Message"
          message={
            <>
              Are you sure you want to delete the message from <strong>{confirmTarget.fname} {confirmTarget.lname}</strong>? This cannot be undone.
            </>
          }
          confirmLabel="Delete"
          danger
          loading={deletingId === confirmTarget._id}
          onConfirm={handleDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  )
}