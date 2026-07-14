export default function Pagination({ page, pages, total, count, onPageChange }) {
  if (!pages || pages <= 1) return null

  const start = count === 0 ? 0 : (page - 1) * count + 1
  const end = (page - 1) * count + count > total ? total : (page - 1) * count + count

  return (
    <div className="adm-pagination">
      <span className="adm-pagination-info">
        Showing {start}–{end > total ? total : end} of {total}
      </span>
      <div className="adm-pagination-controls">
        <button
          type="button"
          className="adm-btn adm-btn-outline adm-btn-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <span className="adm-pagination-info">
          Page {page} of {pages}
        </span>
        <button
          type="button"
          className="adm-btn adm-btn-outline adm-btn-sm"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
