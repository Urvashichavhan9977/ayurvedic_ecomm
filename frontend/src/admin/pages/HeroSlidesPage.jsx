import { useEffect, useState } from 'react'
  import { heroSlidesApi } from '../api/heroSlidesApi'
  import Modal from '../components/Modal'
  import ConfirmDialog from '../components/ConfirmDialog'
  import { IconAlert, IconEdit, IconTrash, IconPlus, IconEye, IconEyeOff } from '../components/AdminIcons'

  function SlideFormModal({ initial, onClose, onSaved }) {
    const isEdit = Boolean(initial?._id)
    const [form, setForm] = useState({
      title: initial?.title || '', subtitle: initial?.subtitle || '',
      description: initial?.description || '', imageUrl: initial?.imageUrl || '',
      buttonText: initial?.buttonText || 'Shop Now', buttonLink: initial?.buttonLink || '/shop',
      isActive: initial?.isActive ?? true, order: initial?.order ?? 0,
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const set = f => e => setForm(p => ({ ...p, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

    const handleSubmit = async (e) => {
      e.preventDefault(); setError(''); setSaving(true)
      try {
        const res = isEdit ? await heroSlidesApi.update(initial._id, form) : await heroSlidesApi.create(form)
        onSaved(res.slide)
      } catch (err) { setError(err.message || 'Failed to save slide.') }
      finally { setSaving(false) }
    }

    return (
      <Modal title={isEdit ? 'Edit Hero Slide' : 'New Hero Slide'} onClose={onClose}
        footer={<>
          <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="slide-form" className="adm-btn adm-btn-primary adm-btn-sm" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Slide'}
          </button>
        </>}>
        {error && <div className="adm-alert adm-alert-error"><IconAlert /><span>{error}</span></div>}
        <form id="slide-form" onSubmit={handleSubmit}>
          <div className="adm-form-grid">
            <div className="adm-form-group"><label>Title *</label><input className="adm-input" value={form.title} onChange={set('title')} required /></div>
            <div className="adm-form-group"><label>Subtitle</label><input className="adm-input" value={form.subtitle} onChange={set('subtitle')} /></div>
            <div className="adm-form-group adm-form-group-full"><label>Description</label><input className="adm-input" value={form.description} onChange={set('description')} /></div>
            <div className="adm-form-group adm-form-group-full"><label>Image URL *</label><input className="adm-input" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://..." required /></div>
            <div className="adm-form-group"><label>Button Text</label><input className="adm-input" value={form.buttonText} onChange={set('buttonText')} /></div>
            <div className="adm-form-group"><label>Button Link</label><input className="adm-input" value={form.buttonLink} onChange={set('buttonLink')} /></div>
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

  export default function HeroSlidesPage() {
    const [slides, setSlides] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [formTarget, setFormTarget] = useState(null)
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleteError, setDeleteError] = useState('')
    const [deleting, setDeleting] = useState(false)
    const [togglingId, setTogglingId] = useState(null)

    const load = async () => {
      setLoading(true); setError('')
      try { const res = await heroSlidesApi.list(); setSlides(res.slides || []) }
      catch (err) { setError(err.message || 'Failed to load slides.') }
      finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleToggle = async (slide) => {
      setTogglingId(slide._id)
      try { const res = await heroSlidesApi.toggleStatus(slide._id); setSlides(p => p.map(s => s._id === slide._id ? res.slide : s)) }
      catch (err) { setError(err.message) }
      finally { setTogglingId(null) }
    }

    const handleDelete = async () => {
      setDeleting(true); setDeleteError('')
      try { await heroSlidesApi.remove(deleteTarget._id); setDeleteTarget(null); load() }
      catch (err) { setDeleteError(err.message) }
      finally { setDeleting(false) }
    }

    return (
      <div>
        <div className="adm-page-header">
          <div><h2>Hero Slides</h2><p>Homepage hero slider manage karo — images, text, buttons.</p></div>
        </div>
        {error && <div className="adm-alert adm-alert-error" style={{marginBottom:'1.25rem'}}><IconAlert /><span>{error}</span></div>}
        <div className="adm-toolbar">
          <div className="adm-toolbar-filters" />
          <div className="adm-toolbar-right">
            <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setFormTarget({})}>
              <IconPlus width={16} height={16} /> Add Slide
            </button>
          </div>
        </div>
        <div className="adm-card">
          {loading ? <div className="adm-loading-cell">Loading slides…</div>
          : slides.length === 0 ? <div className="adm-empty-state">Koi slide nahi. "Add Slide" se banao!</div>
          : <div className="adm-table-wrap"><table className="adm-table">
              <thead><tr><th>Preview</th><th>Title</th><th>Button</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {slides.map(s => (
                  <tr key={s._id}>
                    <td>{s.imageUrl ? <img src={s.imageUrl} alt={s.title} style={{width:72,height:44,objectFit:'cover',borderRadius:6}} /> : '—'}</td>
                    <td><strong>{s.title}</strong>{s.subtitle && <div className="adm-table-cell-muted">{s.subtitle}</div>}</td>
                    <td className="adm-table-cell-muted">{s.buttonText} → {s.buttonLink}</td>
                    <td className="adm-table-cell-muted">{s.order}</td>
                    <td><label className="adm-switch"><input type="checkbox" checked={s.isActive} disabled={togglingId===s._id} onChange={() => handleToggle(s)} /><span className="adm-switch-track" /></label></td>
                    <td><div className="adm-row-actions">
                      <button type="button" className="adm-icon-btn" onClick={() => setFormTarget(s)}><IconEdit width={16} height={16} /></button>
                      <button type="button" className="adm-icon-btn adm-icon-danger" onClick={() => { setDeleteTarget(s); setDeleteError('') }}><IconTrash width={16} height={16} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table></div>}
        </div>
        {formTarget !== null && <SlideFormModal initial={formTarget} onClose={() => setFormTarget(null)} onSaved={() => { setFormTarget(null); load() }} />}
        {deleteTarget && <ConfirmDialog title="Delete Slide" message={<>Delete <strong>{deleteTarget.title}</strong>?</>} error={deleteError} loading={deleting} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
      </div>
    )
  }
  