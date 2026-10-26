import type { ReactNode } from 'react'
import { explainError } from '../notices/explainError'

interface QueryStateProps {
  isPending: boolean
  error: unknown
  onRetry: () => void
  children: ReactNode
}

export function QueryState({ isPending, error, onRetry, children }: QueryStateProps) {
  if (isPending) {
    return (
      <div className="skeleton-list" aria-busy="true" aria-label="Cargando">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    )
  }
  if (error) {
    const { title, message } = explainError(error)
    return (
      <div className="empty" role="alert">
        <strong>{title}</strong>
        <p>{message}</p>
        <button type="button" className="btn btn-sm" onClick={onRetry}>
          Reintentar
        </button>
      </div>
    )
  }
  return <>{children}</>
}
