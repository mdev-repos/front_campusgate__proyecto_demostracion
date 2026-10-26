import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'

const TOKEN_LIFETIME_SECONDS = 1800

function groupPermissions(permissions: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {}
  for (const permission of permissions) {
    const resource = permission.split('_')[0]
    ;(groups[resource] ??= []).push(permission)
  }
  return groups
}

function formatRemaining(totalSeconds: number): string {
  const safe = Math.max(totalSeconds, 0)
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function Token() {
  const { session, decoded } = useAuth()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  if (!session || !decoded) return null

  const { header, payload, signature } = decoded
  const remaining = Math.floor(payload.exp - now / 1000)
  const percent = Math.min(100, Math.max(0, (remaining / TOKEN_LIFETIME_SECONDS) * 100))
  const groups = groupPermissions(payload.permissions ?? [])

  return (
    <>
      <h1 className="page-title">Inspector de token</h1>
      <p className="muted">
        Sesión de <span className="mono">{session.email}</span>. Esto es lo que la API te entregó al iniciar sesión.
      </p>

      <div className="callout" style={{ marginTop: 20 }}>
        <strong>Un JWT está firmado, no cifrado.</strong> Cualquiera puede leer su contenido (por eso nunca lleva
        contraseñas ni datos sensibles), pero nadie puede modificarlo sin que la firma deje de coincidir.
      </div>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <article className="card expiry">
          <h3>Vence en</h3>
          <div className="expiry-time">{formatRemaining(remaining)}</div>
          <div className="expiry-bar" aria-hidden="true">
            <div style={{ width: `${percent}%` }} />
          </div>
          <p>
            Al vencer hay que iniciar sesión de nuevo: esta versión de la API todavía no tiene refresh tokens.
          </p>
        </article>

        <article className="card">
          <h3>Tus permisos ({payload.permissions?.length ?? 0})</h3>
          <p>La API decide con permisos, no con nombres de rol. Los de abajo viajan dentro del token.</p>
          {Object.entries(groups).map(([resource, perms]) => (
            <div className="perm-group" key={resource}>
              <span className="group-name">{resource}</span>
              <div className="chips">
                {perms.map((p) => (
                  <span className="chip" key={p}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </article>
      </div>

      <div className="token-parts">
        <article className="card">
          <div className="part-label">
            Header <span className="part-tag">algoritmo de firma</span>
          </div>
          <pre className="code">{JSON.stringify(header, null, 2)}</pre>
        </article>
        <article className="card">
          <div className="part-label">
            Payload <span className="part-tag">claims</span>
          </div>
          <pre className="code">{JSON.stringify(payload, null, 2)}</pre>
          <p style={{ marginTop: 10 }}>
            <span className="mono">sub</span> es el id del usuario, <span className="mono">iss</span> quién emitió el
            token, <span className="mono">exp</span> cuándo vence y <span className="mono">jti</span> su identificador
            único.
          </p>
        </article>
        <article className="card">
          <div className="part-label">
            Firma <span className="part-tag">HMAC-SHA256</span>
          </div>
          <pre className="code">{signature}</pre>
          <p style={{ marginTop: 10 }}>
            Solo el servidor conoce la clave que la generó. Si alguien cambia un claim, la firma deja de coincidir y la
            API responde 401.
          </p>
        </article>
      </div>
    </>
  )
}
