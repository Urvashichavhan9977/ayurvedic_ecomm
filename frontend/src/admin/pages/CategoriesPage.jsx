import { useEffect, useMemo, useState } from 'react'
import { categoriesApi } from '../api/categoriesApi'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { IconAlert, IconEdit, IconTrash, IconPlus, IconSearch } from '../components/AdminIcons'

const EMPTY_FORM = {
  name: '',
  image: '',
  description: '',
  displayOrder: 0,
  isActive: true,
}

function CategoryFormModal({ initial, onClose, onSaved }) {
  const isEdit = Boolean(initial?._id)
  const [form, setForm] = useState(() => ({
    name: initial?.name || '',
    image: initial?.image || '',
    description: initial?.description || '',
    displayOrder: initial?.displayOrder ?? 0,
    isActive: initial?.isActive ?? true,
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Category name is required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        image: form.image.trim(),
        description: form.description.trim(),
        displayOrder: Number(form.displayOrder) || 0,
        isActive: form.isActive,
      }
      const res = isEdit
        ? await categoriesApi.update(initial._id, payload)
        : await categoriesApi.create(payload)
      onSaved(res.category)
    } catch (err) {
      setError(err.message || 'Failed to save category.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit Category' : 'Add Category'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="category-form" className="adm-btn adm-btn-primary adm-btn-sm" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Category'}
          </button>
        </>
      }
    >
      {error && (
        <div className="adm-alert adm-alert-error">
          <IconAlert />
          <span>{error}</span>
        </div>
      )}

      <form id="category-form" onSubmit={handleSubmit}>
        <div className="adm-form-grid">
          <div className="adm-form-group adm-form-group-full">
            <label htmlFor="cat-name">Category Name *</label>
            <input
              id="cat-name"
              className="adm-input"
              value={form.name}
              onChange={handleChange('name')}
              maxLength={60}
              required
            />
          </div>

          <div className="adm-form-group adm-form-group-full">
            <label htmlFor="cat-image">Image URL</label>
            <input
              id="cat-image"
              className="adm-input"
              value={form.image}
              onChange={handleChange('image')}
              placeholder="https://…"
            />
            {form.image && (
              <div className="adm-image-list">
                <div className="adm-image-thumb-wrap">
                  <img src={form.image} alt="" />
                </div>
              </div>
            )}
          </div>

          <div className="adm-form-group adm-form-group-full">
            <label htmlFor="cat-description">Description</label>
            <textarea
              id="cat-description"
              className="adm-textarea"
              value={form.description}
              onChange={handleChange('description')}
            />
          </div>

          <div className="adm-form-group">
            <label htmlFor="cat-order">Display Order</label>
            <input
              id="cat-order"
              type="number"
              className="adm-input"
              value={form.displayOrder}
              onChange={handleChange('displayOrder')}
            />
          </div>

          <div className="adm-form-group">
            <label>Status</label>
            <label className="adm-checkbox-row" style={{ marginTop: '0.5rem' }}>
              <input type="checkbox" checked={form.isActive} onChange={handleChange('isActive')} />
              Active (visible on storefront)
            </label>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [formTarget, setFormTarget] = useState(null) // null = closed, {} = create, {...cat} = edit
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  const load = async (searchTerm = search) => {
    setLoading(true)
    setError('')
    try {
      const res = await categoriesApi.list(searchTerm ? { search: searchTerm } : {})
      setCategories(res.categories || [])
    } catch (err) {
      setError(err.message || 'Failed to load categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(() => load(search), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const handleSaved = (category) => {
    setFormTarget(null)
    setCategories((prev) => {
      const exists = prev.some((c) => c._id === category._id)
      return exists ? prev.map((c) => (c._id === category._id ? category : c)) : [category, ...prev]
    })
  }

  const handleToggle = async (category) => {
    setTogglingId(category._id)
    try {
      const res = await categoriesApi.toggleStatus(category._id)
      setCategories((prev) => prev.map((c) => (c._id === category._id ? res.category : c)))
    } catch (err) {
      setError(err.message || 'Failed to update category status.')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      await categoriesApi.remove(deleteTarget._id)
      setCategories((prev) => prev.filter((c) => c._id !== deleteTarget._id))
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete category.')
    } finally {
      setDeleting(false)
    }
  }

  const rows = useMemo(() => categories, [categories])

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h2>Categories</h2>
          <p>Organize the storefront catalog into browsable categories.</p>
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
              placeholder="Search categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="adm-toolbar-right">
          <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={() => setFormTarget({})}>
            <IconPlus width={16} height={16} /> Add Category
          </button>
        </div>
      </div>

      <div className="adm-card">
        {loading ? (
          <div className="adm-loading-cell">Loading categories…</div>
        ) : rows.length === 0 ? (
          <div className="adm-empty-state">
            {search ? 'No categories match your search.' : 'No categories yet. Create your first one to get started.'}
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Slug</th>
                  <th>Products</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((cat) => (
                  <tr key={cat._id}>
                    <td>
                      <div className="adm-table-product">
                        {cat.image && <img src={cat.image} alt="" className="adm-table-thumb" />}
                        <span>{cat.name}</span>
                      </div>
                    </td>
                    <td className="adm-table-cell-muted">{cat.slug}</td>
                    <td>{cat.productCount ?? 0}</td>
                    <td>{cat.displayOrder ?? 0}</td>
                    <td>
                      <label className="adm-switch">
                        <input
                          type="checkbox"
                          checked={cat.isActive}
                          disabled={togglingId === cat._id}
                          onChange={() => handleToggle(cat)}
                        />
                        <span className="adm-switch-track" />
                      </label>
                    </td>
                    <td>
                      <div className="adm-row-actions">
                        <button type="button" className="adm-icon-btn" onClick={() => setFormTarget(cat)} aria-label="Edit">
                          <IconEdit width={16} height={16} />
                        </button>
                        <button
                          type="button"
                          className="adm-icon-btn adm-icon-danger"
                          onClick={() => {
                            setDeleteTarget(cat)
                            setDeleteError('')
                          }}
                          aria-label="Delete"
                        >
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
      </div>

      {formTarget !== null && (
        <CategoryFormModal initial={formTarget} onClose={() => setFormTarget(null)} onSaved={handleSaved} />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Category"
          message={
            <>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This cannot be undone.
            </>
          }
          error={deleteError}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
