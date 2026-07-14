import { useState, useEffect } from 'react'
import { settingsApi } from '../api/settingsApi'
import { useToast } from '../components/Toast'
import { IconAlert, IconHomeContent, IconPlus, IconTrash } from '../components/AdminIcons'

// Common lucide-react icon names already used across the storefront —
// kept as a picklist so admins choose a name that's guaranteed to render.
const ICON_OPTIONS = [
  'Leaf', 'FlaskConical', 'Truck', 'Lock', 'Award', 'RotateCcw',
  'BadgeCheck', 'CreditCard', 'ShieldCheck', 'Heart', 'Star', 'Sparkles',
  'Package', 'Clock', 'Gift', 'Sun',
]

const emptyWhyUs = () => ({ icon: 'Leaf', title: '', desc: '' })
const emptyFeature = () => ({ icon: 'Leaf', title: '', sub: '' })
const emptyTestimonial = () => ({ name: '', location: '', quote: '', rating: 5 })

function ArrayCard({ title, hint, items, onChange, renderFields, addLabel, emptyItem, minItems = 1 }) {
  const update = (i, field, value) => {
    const next = items.slice()
    next[i] = { ...next[i], [field]: value }
    onChange(next)
  }
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i))
  const add = () => onChange([...items, emptyItem()])

  return (
    <div className="adm-card">
      <div className="adm-card-head">
        <h3>{title}</h3>
        <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={add}>
          <IconPlus width={14} height={14} /> {addLabel}
        </button>
      </div>
      {hint && <p className="adm-settings-hint" style={{ marginBottom: '1rem' }}>{hint}</p>}

      {items.length === 0 ? (
        <div className="adm-empty-state">Koi item nahi hai — "{addLabel}" par click karein.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: '0.85rem',
                position: 'relative',
              }}
            >
              {items.length > minItems && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="adm-btn adm-btn-outline adm-btn-sm"
                  style={{ position: 'absolute', top: 10, right: 10, padding: '0.3rem 0.5rem', color: '#dc2626', borderColor: '#fecaca' }}
                  aria-label="Remove"
                >
                  <IconTrash width={14} height={14} />
                </button>
              )}
              {renderFields(item, (field, value) => update(i, field, value))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function HomeContentPage() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [whyUs, setWhyUs] = useState([])
  const [features, setFeatures] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [brandStory, setBrandStory] = useState({
    eyebrow: '', title: '', para1: '', para2: '', tags: [], videoUrl: '', ctaText: '', ctaLink: '',
  })
  const [ctaBand, setCtaBand] = useState({ title: '', subtitle: '', buttonText: '', buttonLink: '' })
  const [tagsInput, setTagsInput] = useState('')

  useEffect(() => {
    let cancelled = false
    settingsApi.getHomeContent()
      .then((res) => {
        if (cancelled) return
        const hc = res.homeContent || {}
        setWhyUs(hc.whyUs?.length ? hc.whyUs : [emptyWhyUs()])
        setFeatures(hc.features?.length ? hc.features : [emptyFeature()])
        setTestimonials(hc.testimonials?.length ? hc.testimonials : [emptyTestimonial()])
        setBrandStory((prev) => ({ ...prev, ...hc.brandStory }))
        setTagsInput((hc.brandStory?.tags || []).join(', '))
        setCtaBand((prev) => ({ ...prev, ...hc.ctaBand }))
      })
      .catch((err) => setError(err.message || 'Failed to load home content.'))
      .finally(() => setLoading(false))
    return () => { cancelled = true }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const payload = {
        whyUs: whyUs.filter((w) => w.title.trim()),
        features: features.filter((f) => f.title.trim()),
        testimonials: testimonials.filter((t) => t.name.trim() && t.quote.trim()),
        brandStory: {
          ...brandStory,
          tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
        },
        ctaBand,
      }
      await settingsApi.updateHomeContent(payload)
      toast.success('Home content updated — live on the site now.')
    } catch (err) {
      setError(err.message || 'Failed to save home content.')
      toast.error(err.message || 'Failed to save home content.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="adm-page-header"><div><h2>Home Content</h2></div></div>
        <div className="adm-skeleton" style={{ height: 220, marginBottom: '1.25rem' }} />
        <div className="adm-skeleton" style={{ height: 220 }} />
      </div>
    )
  }

  return (
    <div>
      <div className="adm-page-header">
        <div>
          <h2><IconHomeContent width={20} height={20} style={{ verticalAlign: '-3px', marginRight: 8 }} />Home Content</h2>
          <p>Storefront home page ke "Why Choose Us", "Features", "Testimonials", "Brand Story" aur "CTA Band" sections yahan se manage karein.</p>
        </div>
        <button type="button" className="adm-btn adm-btn-primary adm-btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save All Changes'}
        </button>
      </div>

      {error && (
        <div className="adm-alert adm-alert-error" style={{ marginBottom: '1.25rem' }}>
          <IconAlert /><span>{error}</span>
        </div>
      )}

      <div className="adm-settings-grid">
        {/* ── Why Choose Us ── */}
        <ArrayCard
          title="Why Choose Us"
          hint="Homepage aur Contact page dono par dikhta hai."
          items={whyUs}
          onChange={setWhyUs}
          addLabel="Add Point"
          emptyItem={emptyWhyUs}
          renderFields={(item, set) => (
            <div className="adm-form-grid">
              <div className="adm-form-group">
                <label>Icon</label>
                <select className="adm-input" value={item.icon} onChange={(e) => set('icon', e.target.value)}>
                  {ICON_OPTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                </select>
              </div>
              <div className="adm-form-group">
                <label>Title *</label>
                <input className="adm-input" value={item.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. 100% Natural" />
              </div>
              <div className="adm-form-group adm-form-group-full">
                <label>Description</label>
                <input className="adm-input" value={item.desc} onChange={(e) => set('desc', e.target.value)} placeholder="Short description" />
              </div>
            </div>
          )}
        />

        {/* ── Features Strip ── */}
        <ArrayCard
          title="Features Strip"
          hint="Homepage ki thin feature-icons row."
          items={features}
          onChange={setFeatures}
          addLabel="Add Feature"
          emptyItem={emptyFeature}
          renderFields={(item, set) => (
            <div className="adm-form-grid">
              <div className="adm-form-group">
                <label>Icon</label>
                <select className="adm-input" value={item.icon} onChange={(e) => set('icon', e.target.value)}>
                  {ICON_OPTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                </select>
              </div>
              <div className="adm-form-group">
                <label>Title *</label>
                <input className="adm-input" value={item.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Free Shipping" />
              </div>
              <div className="adm-form-group adm-form-group-full">
                <label>Subtitle</label>
                <input className="adm-input" value={item.sub} onChange={(e) => set('sub', e.target.value)} placeholder="e.g. Orders above ₹999" />
              </div>
            </div>
          )}
        />

        {/* ── Testimonials ── */}
        <ArrayCard
          title="Testimonials"
          hint="Customer reviews jo homepage par swiper me dikhte hain."
          items={testimonials}
          onChange={setTestimonials}
          addLabel="Add Testimonial"
          emptyItem={emptyTestimonial}
          renderFields={(item, set) => (
            <div className="adm-form-grid">
              <div className="adm-form-group">
                <label>Name *</label>
                <input className="adm-input" value={item.name} onChange={(e) => set('name', e.target.value)} placeholder="Customer name" />
              </div>
              <div className="adm-form-group">
                <label>Location</label>
                <input className="adm-input" value={item.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Mumbai" />
              </div>
              <div className="adm-form-group">
                <label>Rating</label>
                <select className="adm-input" value={item.rating} onChange={(e) => set('rating', Number(e.target.value))}>
                  {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{'★'.repeat(r)}{'☆'.repeat(5 - r)}</option>)}
                </select>
              </div>
              <div className="adm-form-group adm-form-group-full">
                <label>Quote *</label>
                <textarea className="adm-input" rows={2} value={item.quote} onChange={(e) => set('quote', e.target.value)} placeholder="What the customer said" />
              </div>
            </div>
          )}
        />

        {/* ── Brand Story ── */}
        <div className="adm-card">
          <h3 className="adm-settings-card-title">Brand Story</h3>
          <div className="adm-form-grid">
            <div className="adm-form-group">
              <label>Eyebrow</label>
              <input className="adm-input" value={brandStory.eyebrow} onChange={(e) => setBrandStory((s) => ({ ...s, eyebrow: e.target.value }))} />
            </div>
            <div className="adm-form-group adm-form-group-full">
              <label>Title</label>
              <input className="adm-input" value={brandStory.title} onChange={(e) => setBrandStory((s) => ({ ...s, title: e.target.value }))} />
            </div>
            <div className="adm-form-group adm-form-group-full">
              <label>Paragraph 1</label>
              <textarea className="adm-input" rows={2} value={brandStory.para1} onChange={(e) => setBrandStory((s) => ({ ...s, para1: e.target.value }))} />
            </div>
            <div className="adm-form-group adm-form-group-full">
              <label>Paragraph 2</label>
              <textarea className="adm-input" rows={2} value={brandStory.para2} onChange={(e) => setBrandStory((s) => ({ ...s, para2: e.target.value }))} />
            </div>
            <div className="adm-form-group adm-form-group-full">
              <label>Tags (comma separated)</label>
              <input className="adm-input" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Family Recipes, Small Batch, ..." />
            </div>
            <div className="adm-form-group">
              <label>Video URL</label>
              <input className="adm-input" value={brandStory.videoUrl} onChange={(e) => setBrandStory((s) => ({ ...s, videoUrl: e.target.value }))} />
            </div>
            <div className="adm-form-group">
              <label>Button Text</label>
              <input className="adm-input" value={brandStory.ctaText} onChange={(e) => setBrandStory((s) => ({ ...s, ctaText: e.target.value }))} />
            </div>
            <div className="adm-form-group">
              <label>Button Link</label>
              <input className="adm-input" value={brandStory.ctaLink} onChange={(e) => setBrandStory((s) => ({ ...s, ctaLink: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* ── CTA Band ── */}
        <div className="adm-card">
          <h3 className="adm-settings-card-title">CTA Band</h3>
          <div className="adm-form-grid">
            <div className="adm-form-group adm-form-group-full">
              <label>Title</label>
              <input className="adm-input" value={ctaBand.title} onChange={(e) => setCtaBand((s) => ({ ...s, title: e.target.value }))} />
            </div>
            <div className="adm-form-group adm-form-group-full">
              <label>Subtitle</label>
              <input className="adm-input" value={ctaBand.subtitle} onChange={(e) => setCtaBand((s) => ({ ...s, subtitle: e.target.value }))} />
            </div>
            <div className="adm-form-group">
              <label>Button Text</label>
              <input className="adm-input" value={ctaBand.buttonText} onChange={(e) => setCtaBand((s) => ({ ...s, buttonText: e.target.value }))} />
            </div>
            <div className="adm-form-group">
              <label>Button Link</label>
              <input className="adm-input" value={ctaBand.buttonLink} onChange={(e) => setCtaBand((s) => ({ ...s, buttonLink: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>

      <button type="button" className="adm-btn adm-btn-primary adm-settings-btn-full" onClick={handleSave} disabled={saving} style={{ marginTop: '1.25rem' }}>
        {saving ? 'Saving…' : 'Save All Changes'}
      </button>
    </div>
  )
}
