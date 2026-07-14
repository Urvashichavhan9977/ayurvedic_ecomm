import { IconClose } from './AdminIcons'

/**
 * Generic modal shell shared by every Phase 3 Part 2 management screen
 * (Products / Categories / Reviews / Coupons / Inventory). Keeps the
 * overlay/card/header/footer markup and classes identical everywhere so
 * the design stays consistent with the rest of the admin panel.
 */
export default function Modal({ title, onClose, children, footer, size = '' }) {
  return (
    <div
      className="adm-modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className={`adm-modal${size ? ` adm-modal-${size}` : ''}`}>
        <div className="adm-modal-head">
          <h3>{title}</h3>
          <button type="button" className="adm-modal-close" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </div>
        <div className="adm-modal-body">{children}</div>
        {footer && <div className="adm-modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
