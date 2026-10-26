import { useApiStatus } from '../api/ApiStatusProvider'

const WAKE_UP_HINT =
  'La API corre en un plan gratuito que se duerme tras un rato sin tráfico. Al abrir la página se le avisa para que despierte mientras navegás.'

export function ApiStatusBadge() {
  const { status, elapsedSeconds, retry } = useApiStatus()

  if (status === 'unconfigured') {
    return (
      <span
        className="status-badge status-down"
        role="status"
        title="Este sitio se publicó sin la variable VITE_API_URL, así que no sabe a qué API llamar."
      >
        <span className="status-dot" aria-hidden="true" />
        API no configurada
      </span>
    )
  }

  if (status === 'ready') {
    return (
      <span className="status-badge status-ready" role="status">
        <span className="status-dot" aria-hidden="true" />
        API lista
      </span>
    )
  }

  if (status === 'down') {
    return (
      <span className="status-badge status-down" role="status">
        <span className="status-dot" aria-hidden="true" />
        Sin respuesta
        <button type="button" onClick={retry}>
          Reintentar
        </button>
      </span>
    )
  }

  return (
    <span className="status-badge status-checking" role="status" title={WAKE_UP_HINT}>
      <span className="status-dot" aria-hidden="true" />
      Despertando el servidor… {elapsedSeconds}s
    </span>
  )
}
