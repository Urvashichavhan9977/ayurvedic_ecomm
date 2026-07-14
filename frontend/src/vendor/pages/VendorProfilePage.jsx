import { useEffect, useState } from 'react'
import { vendorAuthApi } from '../api/vendorAuthApi'
import { useVendorAuth } from '../context/VendorAuthContext'

export default function VendorProfilePage() {
  const { vendor, refresh } = useVendorAuth()
  const [form, setForm] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (vendor) {
      setForm({
        name: vendor.name || '',
        phone: vendor.phone || '',
        shopName: vendor.shopName || '',
        shopDescription: vendor.shopDescription || '',
        gstNumber: vendor.gstNumber || '',
        businessAddress: {
          line1: vendor.businessAddress?.line1 || '',
          city: vendor.businessAddress?.city || '',
          state: vendor.businessAddress?.state || '',
          pincode: vendor.businessAddress?.pincode || '',
        },
        bankDetails: {
          accountHolder: vendor.bankDetails?.accountHolder || '',
          accountNumber: vendor.bankDetails?.accountNumber || '',
          ifsc: vendor.bankDetails?.ifsc || '',
          bankName: vendor.bankDetails?.bankName || '',
        },
      })
    }
  }, [vendor])

  if (!form) return <div className="vnd-empty">Loading profile…</div>

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const updateNested = (group, field) => (e) =>
    setForm((f) => ({ ...f, [group]: { ...f[group], [field]: e.target.value } }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setSaving(true)
    try {
      await vendorAuthApi.updateProfile(form)
      await refresh()
      setMessage('Profile updated successfully.')
    } catch (err) {
      setError(err.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="vnd-panel">
      <div className="vnd-panel-header">
        <h3>Shop Profile</h3>
      </div>

      {message && <div className="vnd-alert vnd-alert-success">{message}</div>}
      {error && <div className="vnd-alert vnd-alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="vnd-form-grid">
          <div className="vnd-form-row">
            <label>Your Name</label>
            <input className="vnd-input" value={form.name} onChange={update('name')} />
          </div>
          <div className="vnd-form-row">
            <label>Phone</label>
            <input className="vnd-input" value={form.phone} onChange={update('phone')} />
          </div>
        </div>

        <div className="vnd-form-row">
          <label>Shop Name</label>
          <input className="vnd-input" value={form.shopName} onChange={update('shopName')} />
        </div>

        <div className="vnd-form-row">
          <label>Shop Description</label>
          <textarea className="vnd-textarea" value={form.shopDescription} onChange={update('shopDescription')} />
        </div>

        <div className="vnd-form-row">
          <label>GST Number</label>
          <input className="vnd-input" value={form.gstNumber} onChange={update('gstNumber')} />
        </div>

        <h4 style={{ margin: '1.25rem 0 0.75rem', color: 'var(--vnd-green)', fontSize: '0.95rem' }}>
          Business Address
        </h4>
        <div className="vnd-form-row">
          <label>Address Line</label>
          <input className="vnd-input" value={form.businessAddress.line1} onChange={updateNested('businessAddress', 'line1')} />
        </div>
        <div className="vnd-form-grid">
          <div className="vnd-form-row">
            <label>City</label>
            <input className="vnd-input" value={form.businessAddress.city} onChange={updateNested('businessAddress', 'city')} />
          </div>
          <div className="vnd-form-row">
            <label>State</label>
            <input className="vnd-input" value={form.businessAddress.state} onChange={updateNested('businessAddress', 'state')} />
          </div>
        </div>
        <div className="vnd-form-row">
          <label>Pincode</label>
          <input className="vnd-input" value={form.businessAddress.pincode} onChange={updateNested('businessAddress', 'pincode')} />
        </div>

        <h4 style={{ margin: '1.25rem 0 0.75rem', color: 'var(--vnd-green)', fontSize: '0.95rem' }}>
          Bank Details (for payouts)
        </h4>
        <div className="vnd-form-grid">
          <div className="vnd-form-row">
            <label>Account Holder Name</label>
            <input className="vnd-input" value={form.bankDetails.accountHolder} onChange={updateNested('bankDetails', 'accountHolder')} />
          </div>
          <div className="vnd-form-row">
            <label>Bank Name</label>
            <input className="vnd-input" value={form.bankDetails.bankName} onChange={updateNested('bankDetails', 'bankName')} />
          </div>
        </div>
        <div className="vnd-form-grid">
          <div className="vnd-form-row">
            <label>Account Number</label>
            <input className="vnd-input" value={form.bankDetails.accountNumber} onChange={updateNested('bankDetails', 'accountNumber')} />
          </div>
          <div className="vnd-form-row">
            <label>IFSC Code</label>
            <input className="vnd-input" value={form.bankDetails.ifsc} onChange={updateNested('bankDetails', 'ifsc')} />
          </div>
        </div>

        <button type="submit" className="vnd-btn vnd-btn-primary" style={{ width: 'auto' }} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
