interface PaginationProps {
  page: number
  totalPages: number
  totalElements: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, totalElements, onChange }: PaginationProps) {
  if (totalElements === 0) return null
  return (
    <nav className="pager" aria-label="Paginación">
      <span className="muted">
        Página {page + 1} de {Math.max(totalPages, 1)} · {totalElements} en total
      </span>
      <div>
        <button type="button" className="btn btn-sm" onClick={() => onChange(page - 1)} disabled={page <= 0}>
          Anterior
        </button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => onChange(page + 1)}
          disabled={page + 1 >= totalPages}
        >
          Siguiente
        </button>
      </div>
    </nav>
  )
}
