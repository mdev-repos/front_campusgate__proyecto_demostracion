import { useState } from 'react'
import { NetworkError } from '../../api/client'
import { useAuth } from '../../auth/AuthProvider'
import { usePermissions } from '../../auth/usePermissions'
import { EXPERIMENTS, type Experiment, type LabContext, type LabResult } from '../../lib/labExperiments'

function statusTone(status: number): string {
  if (status >= 200 && status < 300) return 'badge-ok'
  if (status >= 400 && status < 500) return 'badge-warn'
  return 'badge-off'
}

function ExperimentCard({ experiment, context }: { experiment: Experiment; context: LabContext }) {
  const [result, setResult] = useState<LabResult | null>(null)
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)

  async function run() {
    setBusy(true)
    setFailure('')
    try {
      setResult(await experiment.run(context))
    } catch (error) {
      setResult(null)
      setFailure(error instanceof NetworkError ? 'El request no llegó a la API.' : 'Ocurrió un error inesperado.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="card lab-card">
      <h3>{experiment.title}</h3>
      <p>{experiment.description}</p>
      <div>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => void run()} disabled={busy}>
          {busy ? 'Probando…' : 'Probar'}
        </button>
      </div>
      <div aria-live="polite">
        {failure && <p className="form-error">{failure}</p>}
        {result && (
          <div className="lab-result">
            <div className="lab-request">
              <span className={`badge ${statusTone(result.status)}`}>{result.status}</span>
              <span className="mono">
                {result.method} {result.path.length > 44 ? `${result.path.slice(0, 44)}…` : result.path}
              </span>
            </div>
            {result.highlight && <p className="lab-highlight">{result.highlight}</p>}
            <p className="lab-explain">{experiment.explain(result, context)}</p>
            <details>
              <summary>Respuesta de la API</summary>
              <pre className="code">{JSON.stringify(result.data, null, 2) ?? '(sin cuerpo)'}</pre>
            </details>
          </div>
        )}
      </div>
    </article>
  )
}

export function Lab() {
  const { session, decoded } = useAuth()
  const { accountKind } = usePermissions()

  if (!session || !decoded) return null
  const context: LabContext = { token: session.token, userId: decoded.payload.sub, accountKind }
  const experiments = EXPERIMENTS.filter((e) => !e.kinds || e.kinds.includes(accountKind))

  return (
    <>
      <h1 className="page-title">Laboratorio de seguridad</h1>
      <p className="muted">
        Cada botón dispara un request real a la API, a propósito, con algo que no debería funcionar (o que depende de
        quién seas). Compará los resultados entrando con otra cuenta de ejemplo.
      </p>
      <div className="callout" style={{ marginTop: 20 }}>
        <strong>Los resultados cambian según tu cuenta.</strong> Un administrador ve más 200 y 400; un alumno ve
        sobre todo 403. Todo se decide en el servidor: la interfaz solo muestra lo que respondió.
      </div>
      <div className="grid-2 lab-grid" style={{ marginTop: 20 }}>
        {experiments.map((experiment) => (
          <ExperimentCard key={experiment.id} experiment={experiment} context={context} />
        ))}
      </div>
    </>
  )
}
