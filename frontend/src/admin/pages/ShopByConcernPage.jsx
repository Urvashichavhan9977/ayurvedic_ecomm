import { useEffect, useState } from 'react'
  import { useNavigate } from 'react-router-dom'
  import { concernsApi } from '../api/concernsApi'
  import { productsApi, normalizeProduct } from '../api/productsApi'
  import Modal from '../components/Modal'
  import ConfirmDialog from '../components/ConfirmDialog'
  import { IconAlert, IconEdit, IconTrash, IconPlus } from '../components/AdminIcons'

  const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

  const EMOJI_OPTIONS = ['🌿','💚','🌙','❤️','🧠','💧','🌸','⚡','🛡️','🌺','🍃','✨','🌱','💊','🔥']

  function ConcernFormModal({ initial, products, onClose, onSaved }) {
    const isEdit = Boolean(initial?._id)
    const [form, setForm] = useState({
      name: initial?.name || '', emoji: initial?.emoji || '🌿',
      description: initial?.description || '',
      products: (initial?.products || []).map(p => p._id || p),
      isActive: initial?.isActive ?? true, order: initial?.order ?? 0,
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const set = f => e => setForm(p => ({ ...p, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

    const toggleProduct = (id) => setForm(p => ({
      ...p, products: p.products.includes(id) ? p.products.filter(x => x !== id) : [...p.products, id]
    }))

    const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

    const handleSubmit = async (e) => {
      e.preventDefault(); setError(''); setSaving(true)
      try {
        const res = isEdit ? await concernsApi.update(initial._id, form) : await concernsApi.create(form)
        onSaved(res.concern)
      } catch (err) { setError(err.message || 'Failed to save concern.') }
      finally { setSaving(false) }
    }

    return (
      <Modal title={isEdit ? 'Edit Concern' : 'New Concern'} onClose={onClose}
        footer={<>
          <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="concern-form" className="adm-btn adm-btn-primary adm-btn-sm" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Concern'}
          </button>
        </>}>
        {error && <div className="adm-alert adm-alert-error"><IconAlert /><span>{error}</span></div>}
        <form id="concern-form" onSubmit={handleSubmit}>
          <div className="adm-form-grid">
            <div className="adm-form-group"><label>Concern Name *</label>
              <input className="adm-input" value={form.name} onChange={set('name')} placeholder="e.g. Immunity, Sleep, Digestion" required />
            </div>
            <div className="adm-form-group"><label>Emoji</label>
              <select className="adm-select" style={{width:'100%'}} value={form.emoji} onChange={set('emoji')}>
                {EMOJI_OPTIONS.map(e => <option key={e} value={e}>{e} {e}</option>)}
              </select>
            </div>
            <div className="adm-form-group adm-form-group-full"><label>Description</label>
              <input className="adm-input" value={form.description} onChange={set('description')} />
            </div>
            <div className="adm-form-group"><label>Order</label>
              <input type="number" className="adm-input" value={form.order} onChange={set('order')} />
            </div>
            <div className="adm-form-group"><label>Status</label>
              <label className="adm-checkbox-row" style={{marginTop:'.5rem'}}>
                <input type="checkbox" checked={form.isActive} onChange={set('isActive')} /> Active
              </label>
            </div>
            <div className="adm-form-group adm-form-group-full">
              <label>Products ({form.products.length} selected)</label>
              <input className="adm-input" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} style={{marginBottom:'.6rem'}} />
              <div className="adm-product-picker">
                {filtered.length === 0 && <div className="adm-product-picker-empty">No products found.</div>}
                {filtered.map(p => (
                  <label key={p._id} className={`adm-product-picker-item${form.products.includes(p._id) ? ' is-selected' : ''}`}>
                    <input type="checkbox" checked={form.products.includes(p._id)} onChange={() => toggleProduct(p._id)} />
                    <span className="adm-product-picker-thumb">
                      {p.img ? <img src={p.img} alt={p.name} /> : <span className="adm-product-picker-thumb-empty" />}
                    </span>
                    <span className="adm-product-picker-name">{p.name}</span>
                    {p.price != null && <span className="adm-product-tile-price">{currency(p.price)}</span>}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </form>
      </Modal>
    )
  }

  export default function ShopByConcernPage() {
    const navigate = useNavigate()
    const [concerns, setConcerns] = useState([])
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
      try {
        const [cRes, pRes] = await Promise.all([concernsApi.list(), productsApi.listAdmin({ limit: 5000 })])
        setConcerns(cRes.concerns || [])
        setProducts((pRes.products || []).map(normalizeProduct).map(p => ({ _id: p.id, name: p.name, img: p.img, price: p.price })))
      } catch (err) { setError(err.message) }
      finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleToggle = async (c) => {
      setTogglingId(c._id)
      try { const res = await concernsApi.toggleStatus(c._id); setConcerns(p => p.map(x => x._id === c._id ? res.concern : x)) }
      catch (err) { setError(err.message) }
      finally { setTogglingId(null) }
    }

    const handleDelete = async () => {
      setDeleting(true); setDeleteError('')
      try { await concernsApi.remove(deleteTarget._id); setDeleteTarget(null); load() }
      catch (err) { setDeleteError(err.message) }
      finally { setDeleting(false) }
    }

    const openProduct = (productId) => {
      navigate('/admin/products', { state: { openProductId: productId } })
    }

    return (
      <div>
        <div className="adm-page-header">
          <div><h2>Shop by Concern</h2><p>{loading ? 'Concerns banao aur unme products assign karo — homepage pe dikhega.' : `${concerns.length} concern${concerns.length === 1 ? '' : 's'}`}</p></div>
        </div>
        {error && <div className="adm-alert adm-alert-error" style={{marginBottom:'1.25rem'}}><IconAlert /><span>{error}</span></div>}
        <div className="adm-toolbar">
          <div className="adm-toolbar-filters" />
          <div className="adm-toolbar-right">
            <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setFormTarget({})}>
              <IconPlus width={16} height={16} /> Add Concern
            </button>
          </div>
        </div>
        {loading ? (
          <div className="adm-card"><div className="adm-loading-cell">Loading…</div></div>
        ) : concerns.length === 0 ? (
          <div className="adm-card"><div className="adm-empty-state">Koi concern nahi. "Add Concern" se banao!</div></div>
        ) : (
          <div className="adm-concern-grid">
            {concerns.map(c => (
              <div className={`adm-concern-card${c.isActive ? '' : ' is-inactive'}`} key={c._id}>
                <div className="adm-concern-card-head">
                  <span className="adm-concern-emoji">{c.emoji}</span>
                  <div className="adm-concern-card-title">
                    <span className="adm-concern-name">{c.name}</span>
                    {c.description && <span className="adm-concern-desc">{c.description}</span>}
                  </div>
                  <div className="adm-row-actions">
                    <button type="button" className="adm-icon-btn" onClick={() => setFormTarget(c)} aria-label="Edit">
                      <IconEdit width={15} height={15} />
                    </button>
                    <button type="button" className="adm-icon-btn adm-icon-danger" onClick={() => { setDeleteTarget(c); setDeleteError('') }} aria-label="Delete">
                      <IconTrash width={15} height={15} />
                    </button>
                  </div>
                </div>

                {c.products?.length > 0 ? (
                  <div className="adm-concern-products">
                    {c.products.map((p) => (
                      <button
                        type="button"
                        key={p._id}
                        className="adm-product-tile"
                        onClick={() => openProduct(p._id)}
                        title={`Open ${p.name}`}
                      >
                        <span className="adm-product-tile-img">
                          <img src={p.images?.[0]} alt={p.name} loading="lazy" />
                        </span>
                        <span className="adm-product-tile-name">{p.name}</span>
                        {p.price != null && <span className="adm-product-tile-price">{currency(p.price)}</span>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="adm-concern-no-products">No products assigned yet</div>
                )}

                <div className="adm-concern-card-footer">
                  <span className="adm-badge adm-badge-muted">{c.products?.length || 0} product{c.products?.length === 1 ? '' : 's'}</span>
                  <span className="adm-badge adm-badge-muted">Order: {c.order}</span>
                  <button
                    type="button"
                    className={`adm-badge adm-badge-toggle ${c.isActive ? 'adm-badge-success' : 'adm-badge-muted'}`}
                    disabled={togglingId === c._id}
                    onClick={() => handleToggle(c)}
                    title={c.isActive ? 'Click to deactivate' : 'Click to activate'}
                  >
                    {c.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {formTarget !== null && <ConcernFormModal initial={formTarget} products={products} onClose={() => setFormTarget(null)} onSaved={() => { setFormTarget(null); load() }} />}
        {deleteTarget && <ConfirmDialog title="Delete Concern" message={<>Delete <strong>{deleteTarget.emoji} {deleteTarget.name}</strong>?</>} error={deleteError} loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
      </div>
    )
  }