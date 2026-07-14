import { useEffect, useState } from 'react'
  import { useNavigate } from 'react-router-dom'
  import { essentialsApi } from '../api/essentialsApi'
  import { productsApi } from '../api/productsApi'
  import Modal from '../components/Modal'
  import ConfirmDialog from '../components/ConfirmDialog'
  import { IconAlert, IconEdit, IconTrash, IconPlus } from '../components/AdminIcons'

  const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

  const OVERLAY_OPTIONS = [
    { label: 'Amber',  value: 'linear-gradient(to top,rgba(180,100,20,.85),rgba(220,150,40,.3))' },
    { label: 'Green',  value: 'linear-gradient(to top,rgba(20,80,40,.88),rgba(40,120,60,.3))' },
    { label: 'Blue',   value: 'linear-gradient(to top,rgba(20,50,100,.88),rgba(50,80,160,.3))' },
    { label: 'Pink',   value: 'linear-gradient(to top,rgba(130,30,80,.88),rgba(200,60,120,.3))' },
    { label: 'Dark',   value: 'linear-gradient(to top,rgba(0,0,0,.8),rgba(0,0,0,.25))' },
  ]

  function EssentialFormModal({ initial, products, onClose, onSaved }) {
    const isEdit = Boolean(initial?._id)
    const [form, setForm] = useState({
      tag: initial?.tag || '', title: initial?.title || '',
      desc: initial?.desc || '',
      image: initial?.image || '',
      overlay: initial?.overlay || OVERLAY_OPTIONS[2].value,
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
        const res = isEdit ? await essentialsApi.update(initial._id, form) : await essentialsApi.create(form)
        onSaved(res.essential)
      } catch (err) { setError(err.message || 'Failed to save essential.') }
      finally { setSaving(false) }
    }

    return (
      <Modal title={isEdit ? 'Edit Daily Essential' : 'New Daily Essential'} onClose={onClose}
        footer={<>
          <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="essential-form" className="adm-btn adm-btn-primary adm-btn-sm" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Essential'}
          </button>
        </>}>
        {error && <div className="adm-alert adm-alert-error"><IconAlert /><span>{error}</span></div>}
        <form id="essential-form" onSubmit={handleSubmit}>
          <div className="adm-form-grid">
            <div className="adm-form-group"><label>Title *</label>
              <input className="adm-input" value={form.title} onChange={set('title')} placeholder="e.g. Summer Care" required />
            </div>
            <div className="adm-form-group"><label>Tag</label>
              <input className="adm-input" value={form.tag} onChange={set('tag')} placeholder="e.g. Season Special" />
            </div>
            <div className="adm-form-group adm-form-group-full"><label>Description</label>
              <input className="adm-input" value={form.desc} onChange={set('desc')} placeholder="e.g. Stay cool, fresh & protected all summer" />
            </div>
            <div className="adm-form-group adm-form-group-full"><label>Background Image URL *</label>
              <input className="adm-input" value={form.image} onChange={set('image')} placeholder="https://..." required />
            </div>
            <div className="adm-form-group"><label>Overlay Color</label>
              <select className="adm-select" style={{width:'100%'}} value={form.overlay} onChange={set('overlay')}>
                {OVERLAY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
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
                  </label>
                ))}
              </div>
            </div>
          </div>
        </form>
      </Modal>
    )
  }

  export default function DailyEssentialsPage() {
    const navigate = useNavigate()
    const [essentials, setEssentials] = useState([])
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
        const [eRes, pRes] = await Promise.all([essentialsApi.list(), productsApi.list({ limit: 200 })])
        setEssentials(eRes.essentials || [])
        setProducts((pRes.products || []).map(p => ({ _id: p.id, name: p.name, img: p.img })))
      } catch (err) { setError(err.message) }
      finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleToggle = async (item) => {
      setTogglingId(item._id)
      try { const res = await essentialsApi.toggleStatus(item._id); setEssentials(p => p.map(x => x._id === item._id ? res.essential : x)) }
      catch (err) { setError(err.message) }
      finally { setTogglingId(null) }
    }

    const handleDelete = async () => {
      setDeleting(true); setDeleteError('')
      try { await essentialsApi.remove(deleteTarget._id); setDeleteTarget(null); load() }
      catch (err) { setDeleteError(err.message) }
      finally { setDeleting(false) }
    }

    const openProduct = (productId) => {
      navigate('/admin/products', { state: { openProductId: productId } })
    }

    return (
      <div>
        <div className="adm-page-header">
          <div><h2>Daily Essentials</h2><p>{loading ? 'Tiles banao aur unme products assign karo — homepage pe dikhega.' : `${essentials.length} tile${essentials.length === 1 ? '' : 's'}`}</p></div>
        </div>
        {error && <div className="adm-alert adm-alert-error" style={{marginBottom:'1.25rem'}}><IconAlert /><span>{error}</span></div>}
        <div className="adm-toolbar">
          <div className="adm-toolbar-filters" />
          <div className="adm-toolbar-right">
            <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setFormTarget({})}>
              <IconPlus width={16} height={16} /> Add Essential
            </button>
          </div>
        </div>
        {loading ? (
          <div className="adm-card"><div className="adm-loading-cell">Loading…</div></div>
        ) : essentials.length === 0 ? (
          <div className="adm-card"><div className="adm-empty-state">Koi essential nahi. "Add Essential" se banao!</div></div>
        ) : (
          <div className="adm-concern-grid">
            {essentials.map(item => (
              <div className={`adm-concern-card${item.isActive ? '' : ' is-inactive'}`} key={item._id}>
                <div className="adm-concern-card-head">
                  {item.image
                    ? <span className="adm-concern-emoji" style={{ backgroundImage: `url('${item.image}')`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 8, width: 40, height: 40, display: 'inline-block' }} />
                    : <span className="adm-concern-emoji">🌿</span>}
                  <div className="adm-concern-card-title">
                    <span className="adm-concern-name">{item.title}</span>
                    {item.tag && <span className="adm-concern-desc">{item.tag}</span>}
                    {item.desc && <span className="adm-concern-desc">{item.desc}</span>}
                  </div>
                  <div className="adm-row-actions">
                    <button type="button" className="adm-icon-btn" onClick={() => setFormTarget(item)} aria-label="Edit">
                      <IconEdit width={15} height={15} />
                    </button>
                    <button type="button" className="adm-icon-btn adm-icon-danger" onClick={() => { setDeleteTarget(item); setDeleteError('') }} aria-label="Delete">
                      <IconTrash width={15} height={15} />
                    </button>
                  </div>
                </div>

                {item.products?.length > 0 ? (
                  <div className="adm-concern-products">
                    {item.products.map((p) => (
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
                  <span className="adm-badge adm-badge-muted">{item.products?.length || 0} product{item.products?.length === 1 ? '' : 's'}</span>
                  <span className="adm-badge adm-badge-muted">Order: {item.order}</span>
                  <button
                    type="button"
                    className={`adm-badge adm-badge-toggle ${item.isActive ? 'adm-badge-success' : 'adm-badge-muted'}`}
                    disabled={togglingId === item._id}
                    onClick={() => handleToggle(item)}
                    title={item.isActive ? 'Click to deactivate' : 'Click to activate'}
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {formTarget !== null && <EssentialFormModal initial={formTarget} products={products} onClose={() => setFormTarget(null)} onSaved={() => { setFormTarget(null); load() }} />}
        {deleteTarget && <ConfirmDialog title="Delete Essential" message={<>Delete <strong>{deleteTarget.title}</strong>?</>} error={deleteError} loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
      </div>
    )
  }