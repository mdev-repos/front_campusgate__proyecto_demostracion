import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useApiStatus } from '../api/ApiStatusProvider'
import { ApiError, NetworkError } from '../api/client'
import { useAuth } from '../auth/AuthProvider'
import { DEMO_ACCOUNTS, DEMO_PASSWORD, type DemoAccount } from '../config'
import { useNotices } from '../notices/NoticeProvider'

export function Login() {
  const { session, login } = useAuth()
  const { status } = useApiStatus()
  const { notify } = useNotices()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/panel" replace />

  const waiting = status === 'checking'
  const unconfigured = status === 'unconfigured'

  async function attemptLogin(emailValue: string, passwordValue: string) {
    setBusy(true)
    setFormError('')
    setFieldErrors({})
    try {
      await login(emailValue, passwordValue)
      notify(
        'success',
        'Sesión iniciada',
        'La API verificó tu contraseña contra un hash BCrypt y te devolvió un JWT firmado. Mirá el inspector de token.',
      )
      navigate('/panel')
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setFormError('Email o contraseña incorrectos.')
        notify(
          'error',
          '401 · Credenciales inválidas',
          'La API responde lo mismo si la contraseña es incorrecta, el email no existe o la cuenta está bloqueada. Así nadie puede descubrir qué cuentas existen.',
        )
      } else if (error instanceof ApiError && error.status === 400) {
        setFieldErrors(error.errors ?? {})
        notify(
          'error',
          '400 · Datos inválidos',
          'El servidor validó el cuerpo del request y devolvió qué campos fallaron, sin repetir el valor que enviaste.',
        )
      } else if (error instanceof NetworkError) {
        setFormError('No se pudo contactar con la API.')
        notify(
          'error',
          'Sin conexión con la API',
          'El request no llegó al servidor. Si estaba dormido, esperá a que el indicador diga "API lista" y reintentá.',
        )
      } else {
        setFormError('Ocurrió un error inesperado.')
      }
    } finally {
      setBusy(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void attemptLogin(email.trim(), password)
  }

  function handleQuick(account: DemoAccount) {
    setEmail(account.email)
    setPassword('')
    void attemptLogin(account.email, DEMO_PASSWORD)
  }

  return (
    <div className="container">
      <div className="login-layout">
        <section className="card">
          <h1>Iniciar sesión</h1>
          {unconfigured && (
            <p className="form-error" role="alert">
              Este sitio se publicó sin la URL de la API (variable <span className="mono">VITE_API_URL</span>). Hay
              que definirla como variable del repositorio y volver a ejecutar el despliegue.
            </p>
          )}
          <p className="muted">Ingresá con tus credenciales o elegí una cuenta de ejemplo.</p>
          <form className="form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </div>
            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
            </div>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <button type="submit" className="btn btn-primary" disabled={busy || waiting || unconfigured}>
              {waiting ? 'Esperando a la API…' : busy ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </section>

        <section className="card">
          <h2>Cuentas de ejemplo</h2>
          <p className="muted">Un clic y entrás. Los datos son ficticios.</p>
          <div className="quick-list">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.role}
                type="button"
                className="quick-btn"
                onClick={() => handleQuick(account)}
                disabled={busy || waiting || unconfigured || !DEMO_PASSWORD}
              >
                <span className="title">{account.label}</span>
                <span className="email">{account.email}</span>
                <span className="desc">{account.description}</span>
              </button>
            ))}
          </div>
          {!DEMO_PASSWORD && (
            <p className="field-error" role="alert">
              Falta configurar VITE_DEMO_PASSWORD para habilitar el acceso rápido.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
