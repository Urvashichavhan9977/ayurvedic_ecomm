import { useEffect, useState } from 'react'
  import { instagramApi } from '../api/instagramApi'
  import Modal from '../components/Modal'
  import ConfirmDialog from '../components/ConfirmDialog'
  import { IconAlert, IconEdit, IconTrash, IconPlus } from '../components/AdminIcons'

  function PostFormModal({ initial, onClose, onSaved }) {
    const isEdit = Boolean(initial?._id)
    const [form, setForm] = useState({
      imageUrl: initial?.imageUrl || '', postLink: initial?.postLink || '',
      caption: initial?.caption || '', isActive: initial?.isActive ?? true,
      order: initial?.order ?? 0,
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const set = f => e => setForm(p => ({ ...p, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

    const handleSubmit = async (e) => {
      e.preventDefault(); setError(''); setSaving(true)
      try {
        const res = isEdit ? await instagramApi.update(initial._id, form) : await instagramApi.create(form)
        onSaved(res.post)
      } catch (err) { setError(err.message || 'Failed to save post.') }
      finally { setSaving(false) }
    }

    return (
      <Modal title={isEdit ? 'Edit Instagram Post' : 'New Instagram Post'} onClose={onClose}
        footer={<>
          <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="insta-form" className="adm-btn adm-btn-primary adm-btn-sm" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Post'}
          </button>
        </>}>
        {error && <div className="adm-alert adm-alert-error"><IconAlert /><span>{error}</span></div>}
        <form id="insta-form" onSubmit={handleSubmit}>
          <div className="adm-form-grid">
            <div className="adm-form-group adm-form-group-full"><label>Image URL *</label><input className="adm-input" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://..." required /></div>
            <div className="adm-form-group adm-form-group-full"><label>Instagram Post Link</label><input className="adm-input" value={form.postLink} onChange={set('postLink')} placeholder="https://instagram.com/p/..." /></div>
            <div className="adm-form-group adm-form-group-full"><label>Caption</label><input className="adm-input" value={form.caption} onChange={set('caption')} /></div>
            <div className="adm-form-group"><label>Order</label><input type="number" className="adm-input" value={form.order} onChange={set('order')} /></div>
            <div className="adm-form-group"><label>Status</label>
              <label className="adm-checkbox-row" style={{marginTop:'.5rem'}}>
                <input type="checkbox" checked={form.isActive} onChange={set('isActive')} /> Active
              </label>
            </div>
          </div>
        </form>
      </Modal>
    )
  }

  export default function InstagramPage() {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [formTarget, setFormTarget] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleteError, setDeleteError] = useState('')
    const [deleting, setDeleting] = useState(false)
    const [togglingId, setTogglingId] = useState(null)

    const load = async () => {
      setLoading(true); setError('')
      try { const res = await instagramApi.list(); setPosts(res.posts || []) }
      catch (err) { setError(err.message || 'Failed to load posts.') }
      finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleToggle = async (post) => {
      setTogglingId(post._id)
      try { const res = await instagramApi.toggleStatus(post._id); setPosts(p => p.map(x => x._id === post._id ? res.post : x)) }
      catch (err) { setError(err.message) }
      finally { setTogglingId(null) }
    }

    const handleDelete = async () => {
      setDeleting(true); setDeleteError('')
      try { await instagramApi.remove(deleteTarget._id); setDeleteTarget(null); load() }
      catch (err) { setDeleteError(err.message) }
      finally { setDeleting(false) }
    }

    return (
      <div>
        <div className="adm-page-header">
          <div><h2>Instagram Gallery</h2><p>Homepage Instagram gallery manage karo — images, links, order.</p></div>
        </div>
        {error && <div className="adm-alert adm-alert-error" style={{marginBottom:'1.25rem'}}><IconAlert /><span>{error}</span></div>}
        <div className="adm-toolbar">
          <div className="adm-toolbar-filters" />
          <div className="adm-toolbar-right">
            <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setFormTarget({})}>
              <IconPlus width={16} height={16} /> Add Post
            </button>
          </div>
        </div>
        <div className="adm-card">
          {loading ? <div className="adm-loading-cell">Loading posts…</div>
          : posts.length === 0 ? <div className="adm-empty-state">Koi post nahi. "Add Post" se banao!</div>
          : <div className="adm-table-wrap"><table className="adm-table">
              <thead><tr><th>Preview</th><th>Caption</th><th>Link</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {posts.map(p => (
                  <tr key={p._id}>
                    <td>{p.imageUrl ? <img src={p.imageUrl} alt={p.caption} style={{width:56,height:56,objectFit:'cover',borderRadius:6}} /> : '—'}</td>
                    <td><strong>{p.caption || '—'}</strong></td>
                    <td className="adm-table-cell-muted">{p.postLink || '—'}</td>
                    <td className="adm-table-cell-muted">{p.order}</td>
                    <td><label className="adm-switch"><input type="checkbox" checked={p.isActive} disabled={togglingId===p._id} onChange={() => handleToggle(p)} /><span className="adm-switch-track" /></label></td>
                    <td><div className="adm-row-actions">
                      <button type="button" className="adm-icon-btn" onClick={() => setFormTarget(p)}><IconEdit width={16} height={16} /></button>
                      <button type="button" className="adm-icon-btn adm-icon-danger" onClick={() => { setDeleteTarget(p); setDeleteError('') }}><IconTrash width={16} height={16} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table></div>}
        </div>
        {formTarget !== null && <PostFormModal initial={formTarget} onClose={() => setFormTarget(null)} onSaved={() => { setFormTarget(null); load() }} />}
        {deleteTarget && <ConfirmDialog title="Delete Post" message={<>Delete this Instagram post?</>} error={deleteError} loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
      </div>
    )
  }