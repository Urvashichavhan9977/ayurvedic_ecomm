import { useEffect, useState } from 'react'
  import { combosApi } from '../api/combosApi'
  import { productsApi } from '../api/productsApi'
  import Modal from '../components/Modal'
  import ConfirmDialog from '../components/ConfirmDialog'
  import Pagination from '../components/Pagination'
  import { IconAlert, IconEdit, IconTrash, IconPlus, IconTag, IconEye, IconEyeOff, IconStar } from '../components/AdminIcons'

  const currency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  const TAG_OPTIONS = ['Best Seller','Top Rated','New Arrival','Fan Favourite','Premium','Limited','Seasonal']

  function StatCard({ icon: Icon, tone, label, value, sub }) {
    return (
      <div className="adm-stat-card">
        <span className={`adm-stat-icon ${tone}`}><Icon /></span>
        <div className="adm-stat-body">
          <span>{label}</span>
          <strong>{value}</strong>
          {sub && <span className="adm-stat-sub">{sub}</span>}
        </div>
      </div>
    )
  }

  function ComboFormModal({ initial, products, onClose, onSaved }) {
    const isEdit = Boolean(initial?._id)
    const [form, setForm] = useState({
      title: initial?.title || '', description: initial?.description || '',
      tag: initial?.tag || 'Best Seller',
      product1: initial?.product1?._id || initial?.product1 || '',
      product2: initial?.product2?._id || initial?.product2 || '',
      originalPrice: initial?.originalPrice ?? '', comboPrice: initial?.comboPrice ?? '',
      isActive: initial?.isActive ?? true, order: initial?.order ?? 0,
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const set = f => e => setForm(p => ({ ...p, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
    const savings = form.originalPrice && form.comboPrice ? Math.round(((Number(form.originalPrice) - Number(form.comboPrice)) / Number(form.originalPrice)) * 100) : 0
    const p1 = products.find(p => p._id === form.product1)
    const p2 = products.find(p => p._id === form.product2)

    const handleSubmit = async (e) => {
      e.preventDefault(); setError('')
      if (form.product1 === form.product2) return setError('Dono products alag honi chahiye!')
      if (Number(form.comboPrice) >= Number(form.originalPrice)) return setError('Combo price original se kam honi chahiye!')
      setSaving(true)
      try {
        const res = isEdit ? await combosApi.update(initial._id, form) : await combosApi.create(form)
        onSaved(res.combo)
      } catch (err) { setError(err.message || 'Failed to save combo.') }
      finally { setSaving(false) }
    }

    return (
      <Modal title={isEdit ? 'Edit Combo Offer' : 'New Combo Offer'} onClose={onClose}
        footer={<>
          <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="combo-form" className="adm-btn adm-btn-primary adm-btn-sm" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Combo'}
          </button>
        </>}>
        {error && <div className="adm-alert adm-alert-error"><IconAlert /><span>{error}</span></div>}
        <form id="combo-form" onSubmit={handleSubmit}>
          <div className="adm-form-grid">
            <div className="adm-form-group"><label>Title *</label><input className="adm-input" value={form.title} onChange={set('title')} required /></div>
            <div className="adm-form-group"><label>Tag</label>
              <select className="adm-select" style={{width:'100%'}} value={form.tag} onChange={set('tag')}>
                {TAG_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="adm-form-group adm-form-group-full"><label>Description *</label><input className="adm-input" value={form.description} onChange={set('description')} required /></div>
            <div className="adm-form-group"><label>Product 1 *</label>
              <select className="adm-select" style={{width:'100%'}} value={form.product1} onChange={set('product1')} required>
                <option value="">-- Select --</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="adm-form-group"><label>Product 2 *</label>
              <select className="adm-select" style={{width:'100%'}} value={form.product2} onChange={set('product2')} required>
                <option value="">-- Select --</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="adm-form-group"><label>Original Price (₹) *</label><input type="number" min="1" className="adm-input" value={form.originalPrice} onChange={set('originalPrice')} required /></div>
            <div className="adm-form-group">
              <label>Combo Price (₹) * {savings > 0 && <span style={{color:'#16a34a',fontWeight:700}}>Save {savings}%</span>}</label>
              <input type="number" min="1" className="adm-input" value={form.comboPrice} onChange={set('comboPrice')} required />
            </div>
            <div className="adm-form-group"><label>Order</label><input type="number" className="adm-input" value={form.order} onChange={set('order')} /></div>
            <div className="adm-form-group"><label>Status</label>
              <label className="adm-checkbox-row" style={{marginTop:'.5rem'}}><input type="checkbox" checked={form.isActive} onChange={set('isActive')} /> Active</label>
            </div>
          </div>
        </form>

        {(p1 || p2) && (
          <div style={{ marginTop: '1.25rem', padding: '.9rem 1rem', background: '#f8f4ed', borderRadius: 10, display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--adm-muted)', width: '100%' }}>Live Preview</span>
            {[p1, p2].map((p, i) => p && (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                {p.img && <img src={p.img} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 8 }} />}
                <span style={{ fontSize: '.82rem', fontWeight: 600 }}>{p.name}</span>
                {i === 0 && p2 && <span style={{ fontWeight: 900, color: '#16a34a' }}>+</span>}
              </div>
            ))}
            {form.comboPrice && (
              <span className="adm-badge adm-badge-success" style={{ marginLeft: 'auto' }}>
                {currency(form.comboPrice)} {savings > 0 && `· Save ${savings}%`}
              </span>
            )}
          </div>
        )}
      </Modal>
    )
  }

  export default function CombosPage() {
    const [combos, setCombos] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [page, setPage] = useState(1)
    const [meta, setMeta] = useState({ total: 0, pages: 1, count: 0 })
    const [formTarget, setFormTarget] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleteError, setDeleteError] = useState('')
    const [deleting, setDeleting] = useState(false)
    const [togglingId, setTogglingId] = useState(null)
    const [search, setSearch] = useState('')
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)

    useEffect(() => {
      const onResize = () => setIsMobile(window.innerWidth < 768)
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    }, [])

    const load = async () => {
      setLoading(true); setError('')
      try {
        const params = { page, limit: 15 }
        if (statusFilter === 'active') params.isActive = true
        if (statusFilter === 'inactive') params.isActive = false
        const res = await combosApi.list(params)
        setCombos(res.combos || []); setMeta({ total: res.total || 0, pages: res.pages || 1, count: (res.combos || []).length })
      } catch (err) { setError(err.message || 'Failed to load combos.') }
      finally { setLoading(false) }
    }

    useEffect(() => { productsApi.list({ limit: 200 }).then(r => setProducts((r.products||[]).map(p => ({ _id: p.id, name: p.name, img: p.img, price: p.price })))) }, [])
    useEffect(() => { load() }, [page, statusFilter])

    const handleToggle = async (c) => {
      setTogglingId(c._id)
      try { const res = await combosApi.toggleStatus(c._id); setCombos(p => p.map(x => x._id === c._id ? res.combo : x)) }
      catch (err) { setError(err.message) }
      finally { setTogglingId(null) }
    }
    const handleDelete = async () => {
      setDeleting(true); setDeleteError('')
      try { await combosApi.remove(deleteTarget._id); setDeleteTarget(null); load() }
      catch (err) { setDeleteError(err.message) }
      finally { setDeleting(false) }
    }

    const visibleCombos = combos.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    const activeCount = combos.filter(c => c.isActive).length
    const avgSavings = combos.length > 0
      ? Math.round(combos.reduce((s, c) => s + ((c.originalPrice - c.comboPrice) / c.originalPrice) * 100, 0) / combos.length)
      : 0

    return (
      <div>
        <div className="adm-page-header">
          <div><h2>Combo Offers</h2><p>Koi bhi 2 products ka combo banao — homepage pe auto dikhega.</p></div>
        </div>
        <div className="adm-stat-grid" style={{marginBottom:'1.5rem'}}>
          <StatCard icon={IconTag} tone="green" label="Total Combos" value={meta.total} />
          <StatCard icon={IconEye} tone="gold" label="Active" value={activeCount} sub="Live on storefront" />
          <StatCard icon={IconEyeOff} tone="warning" label="Inactive" value={combos.length - activeCount} sub="Hidden from customers" />
          <StatCard icon={IconStar} tone="muted" label="Avg. Savings" value={`${avgSavings}%`} sub="Across this page" />
        </div>
        {error && <div className="adm-alert adm-alert-error" style={{marginBottom:'1.25rem'}}><IconAlert /><span>{error}</span></div>}
        <div className="adm-toolbar">
          <div className="adm-toolbar-filters">
            <select className="adm-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
              <option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
            <input className="adm-input" placeholder="Search combo title…" value={search} onChange={e => setSearch(e.target.value)} style={{maxWidth:220}} />
          </div>
          <div className="adm-toolbar-right">
            <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setFormTarget({})}><IconPlus width={16} height={16} /> Add Combo</button>
          </div>
        </div>
        <div className="adm-card">
          {loading ? <div className="adm-loading-cell">Loading combos…</div>
          : visibleCombos.length === 0 ? <div className="adm-empty-state">Koi combo nahi. "Add Combo" se banao!</div>
          : isMobile ? (
            <div style={{display:'grid',gridTemplateColumns:'1fr',gap:'.75rem'}}>
              {visibleCombos.map(c => {
                const save = Math.round(((c.originalPrice - c.comboPrice) / c.originalPrice) * 100)
                return (
                  <div key={c._id} style={{border:'1px solid #e6e6e6',borderRadius:8,padding:12,display:'flex',flexDirection:'column',gap:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                      <div>
                        <strong>{c.title}</strong>
                        <div className="adm-table-cell-muted" style={{fontSize:'.85rem'}}>{c.tag}</div>
                      </div>
                      <div style={{textAlign:'right'}}><div style={{fontSize:'.85rem'}}><s>{currency(c.originalPrice)}</s></div><div><strong>{currency(c.comboPrice)}</strong></div></div>
                    </div>
                    <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                      {c.product1?.images?.[0] && <img src={c.product1.images[0]} alt="" style={{width:40,height:40,objectFit:'cover',borderRadius:6}} />}
                      <span style={{fontSize:'.85rem'}}>{c.product1?.name}</span>
                      <span style={{fontWeight:900,color:'#16a34a'}}>+</span>
                      {c.product2?.images?.[0] && <img src={c.product2.images[0]} alt="" style={{width:40,height:40,objectFit:'cover',borderRadius:6}} />}
                      <span style={{fontSize:'.85rem'}}>{c.product2?.name}</span>
                      <span style={{marginLeft:'auto'}} className="adm-badge adm-badge-success">Save {save}%</span>
                    </div>
                    <div style={{display:'flex',gap:8,justifyContent:'flex-end',alignItems:'center'}}>
                      <label className="adm-switch"><input type="checkbox" checked={c.isActive} disabled={togglingId===c._id} onChange={() => handleToggle(c)} /><span className="adm-switch-track" /></label>
                      <button type="button" className="adm-icon-btn" onClick={() => setFormTarget(c)}><IconEdit width={16} height={16} /></button>
                      <button type="button" className="adm-icon-btn adm-icon-danger" onClick={() => { setDeleteTarget(c); setDeleteError('') }}><IconTrash width={16} height={16} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="adm-table-wrap"><table className="adm-table">
              <thead><tr><th>Combo</th><th>Products</th><th>Original</th><th>Combo Price</th><th>Savings</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {visibleCombos.map(c => {
                  const save = Math.round(((c.originalPrice - c.comboPrice) / c.originalPrice) * 100)
                  return (
                    <tr key={c._id}>
                      <td><strong>{c.title}</strong><div className="adm-table-cell-muted">{c.tag}</div></td>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:'.4rem',flexWrap:'wrap'}}>
                          {c.product1?.images?.[0] && <img src={c.product1.images[0]} alt="" style={{width:32,height:32,objectFit:'cover',borderRadius:6}} />}
                          <span style={{fontSize:'.8rem'}}>{c.product1?.name}</span>
                          <span style={{fontWeight:900,color:'#16a34a'}}>+</span>
                          {c.product2?.images?.[0] && <img src={c.product2.images[0]} alt="" style={{width:32,height:32,objectFit:'cover',borderRadius:6}} />}
                          <span style={{fontSize:'.8rem'}}>{c.product2?.name}</span>
                        </div>
                      </td>
                      <td className="adm-table-cell-muted"><s>{currency(c.originalPrice)}</s></td>
                      <td><strong>{currency(c.comboPrice)}</strong></td>
                      <td><span className="adm-badge adm-badge-success">Save {save}%</span></td>
                      <td><label className="adm-switch"><input type="checkbox" checked={c.isActive} disabled={togglingId===c._id} onChange={() => handleToggle(c)} /><span className="adm-switch-track" /></label></td>
                      <td><div className="adm-row-actions">
                        <button type="button" className="adm-icon-btn" onClick={() => setFormTarget(c)}><IconEdit width={16} height={16} /></button>
                        <button type="button" className="adm-icon-btn adm-icon-danger" onClick={() => { setDeleteTarget(c); setDeleteError('') }}><IconTrash width={16} height={16} /></button>
                      </div></td>
                    </tr>
                  )
                })}
              </tbody>
            </table></div>
          )}
          <Pagination page={page} pages={meta.pages} total={meta.total} count={meta.count} onPageChange={setPage} />
        </div>
        {formTarget !== null && <ComboFormModal initial={formTarget} products={products} onClose={() => setFormTarget(null)} onSaved={() => { setFormTarget(null); load() }} />}
        {deleteTarget && <ConfirmDialog title="Delete Combo" message={<>Delete <strong>{deleteTarget.title}</strong>?</>} error={deleteError} loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
      </div>
    )
  }