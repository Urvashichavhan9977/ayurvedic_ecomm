import Modal from './Modal'
import { IconAlert } from './AdminIcons'

/**
 * Shared "are you sure" dialog used for deletes and other destructive
 * actions across the Products / Categories / Reviews / Coupons /
 * Inventory management screens.
 */
export default function ConfirmDialog({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  danger = true,
  loading = false,
  error = '',
  onConfirm,
  onCancel,
}) {
  return (
    <Modal title={title} size="sm" onClose={onCancel}>
      {error && (
        <div className="adm-alert adm-alert-error">
          <IconAlert />
          <span>{error}</span>
        </div>
      )}
      <p className="adm-confirm-text">{message}</p>
      <div className="adm-modal-footer" style={{ padding: '1.2rem 0 0', borderTop: 'none' }}>
        <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button
          type="button"
          className={`adm-btn adm-btn-sm ${danger ? 'adm-btn-danger' : 'adm-btn-primary'}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
