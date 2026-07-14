import { useEffect, useState } from 'react'
import { blogApi } from '../api/blogApi'
import { productsApi } from '../api/productsApi'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { IconAlert, IconEdit, IconTrash, IconPlus } from '../components/AdminIcons'

const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

// Content is stored as an array of paragraphs on the backend. In the form
// we edit it as plain text with blank lines separating paragraphs, which
// is much easier to type than managing an array of inputs.
const contentToText = (content) => (content || []).join('\n\n')
const textToContent = (text) =>
  text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)

function PostFormModal({ initial, products, onClose, onSaved }) {
  const isEdit = Boolean(initial?._id)
  const [form, setForm] = useState({
    title: initial?.title || '',
    tag: initial?.tag || 'Wellness',
    readTime: initial?.readTime || '3 min read',
    img: initial?.img || '',
    excerpt: initial?.excerpt || '',
    contentText: contentToText(initial?.content),
    product: initial?.product?._id || initial?.product || '',
    isActive: initial?.isActive ?? true,
    order: initial?.order ?? 0,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const linkedProduct = products.find(p => p._id === form.product)

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true)
    const payload = {
      title: form.title,
      tag: form.tag,
      readTime: form.readTime,
      img: form.img,
      excerpt: form.excerpt,
      content: textToContent(form.contentText),
      product: form.product || null,
      isActive: form.isActive,
      order: Number(form.order) || 0,
    }
    try {
      const res = isEdit ? await blogApi.update(initial._id, payload) : await blogApi.create(payload)
      onSaved(res.post)
    } catch (err) { setError(err.message || 'Failed to save post.') }
    finally { setSaving(false) }
  }

  return (
    <Modal title={isEdit ? 'Edit Blog Post' : 'New Blog Post'} onClose={onClose}
      footer={<>
        <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" form="blog-post-form" className="adm-btn adm-btn-primary adm-btn-sm" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Post'}
        </button>
      </>}>
      {error && <div className="adm-alert adm-alert-error"><IconAlert /><span>{error}</span></div>}
      <form id="blog-post-form" onSubmit={handleSubmit}>
        <div className="adm-form-grid">
          <div className="adm-form-group adm-form-group-full"><label>Title *</label><input className="adm-input" value={form.title} onChange={set('title')} required /></div>
          <div className="adm-form-group"><label>Tag</label><input className="adm-input" value={form.tag} onChange={set('tag')} placeholder="e.g. Adaptogens" /></div>
          <div className="adm-form-group"><label>Read Time</label><input className="adm-input" value={form.readTime} onChange={set('readTime')} placeholder="e.g. 4 min read" /></div>
          <div className="adm-form-group adm-form-group-full"><label>Image URL *</label><input className="adm-input" value={form.img} onChange={set('img')} placeholder="https://... or /src/assets/..." required /></div>
          <div className="adm-form-group adm-form-group-full"><label>Excerpt</label><input className="adm-input" value={form.excerpt} onChange={set('excerpt')} placeholder="Short teaser shown in the list" /></div>
          <div className="adm-form-group adm-form-group-full">
            <label>Article Content</label>
            <textarea
              className="adm-input"
              rows={8}
              value={form.contentText}
              onChange={set('contentText')}
              placeholder={'Write each paragraph separated by a blank line.\n\nParagraph one goes here.\n\nParagraph two goes here.'}
            />
          </div>

          <div className="adm-form-group adm-form-group-full">
            <label>Link a Product (optional)</label>
            <select className="adm-select" style={{ width: '100%' }} value={form.product} onChange={set('product')}>
              <option value="">-- No product linked --</option>
              {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
            {linkedProduct && (
              <div className="adm-table-cell-muted" style={{ marginTop: '.5rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                {linkedProduct.img && <img src={linkedProduct.img} alt={linkedProduct.name} style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }} />}
                <span>Readers will see a "Shop This" card for <strong>{linkedProduct.name}</strong> ({currency(linkedProduct.price)}) at the end of this article.</span>
              </div>
            )}
          </div>

          <div className="adm-form-group"><label>Order</label><input type="number" className="adm-input" value={form.order} onChange={set('order')} /></div>
          <div className="adm-form-group"><label>Status</label>
            <label className="adm-checkbox-row" style={{marginTop:'.5rem'}}>
              <input type="checkbox" checked={form.isActive} onChange={set('isActive')} /> Active (visible on site)
            </label>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default function BlogPostsPage() {
  const [posts, setPosts] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formTarget, setFormTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  const load = async () => {
    setLoading(true); setError('')
    try { const res = await blogApi.list(); setPosts(res.posts || []) }
    catch (err) { setError(err.message || 'Failed to load posts.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // Products for the "Link a Product" dropdown — same normalized shape used by CombosPage.
  useEffect(() => {
    productsApi.list({ limit: 200 }).then(r =>
      setProducts((r.products || []).map(p => ({ _id: p.id, name: p.name, img: p.img, price: p.price })))
    )
  }, [])

  const handleToggle = async (post) => {
    setTogglingId(post._id)
    try { const res = await blogApi.toggleStatus(post._id); setPosts(p => p.map(x => x._id === post._id ? res.post : x)) }
    catch (err) { setError(err.message) }
    finally { setTogglingId(null) }
  }

  const handleDelete = async () => {
    setDeleting(true); setDeleteError('')
    try { await blogApi.remove(deleteTarget._id); setDeleteTarget(null); load() }
    catch (err) { setDeleteError(err.message) }
    finally { setDeleting(false) }
  }

  return (
    <div>
      <div className="adm-page-header">
        <div><h2>Blog</h2><p>Website ke "Journal" section ke articles yahan se manage karo — chaho toh har article ke sath ek product bhi link kar sakte ho.</p></div>
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
            <thead><tr><th>Preview</th><th>Title</th><th>Tag</th><th>Linked Product</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {posts.map(p => (
                <tr key={p._id}>
                  <td>{p.img ? <img src={p.img} alt={p.title} style={{width:72,height:44,objectFit:'cover',borderRadius:6}} /> : '—'}</td>
                  <td><strong>{p.title}</strong>{p.excerpt && <div className="adm-table-cell-muted">{p.excerpt}</div>}</td>
                  <td className="adm-table-cell-muted">{p.tag}</td>
                  <td className="adm-table-cell-muted">{p.product ? p.product.name : '—'}</td>
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
      {formTarget !== null && <PostFormModal initial={formTarget} products={products} onClose={() => setFormTarget(null)} onSaved={() => { setFormTarget(null); load() }} />}
      {deleteTarget && <ConfirmDialog title="Delete Post" message={<>Delete <strong>{deleteTarget.title}</strong>?</>} error={deleteError} loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  )
}
