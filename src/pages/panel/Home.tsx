import { Link } from 'react-router-dom'
import { useMyProfile } from '../../api/useMyProfile'
import { useAuth } from '../../auth/AuthProvider'
import { usePermissions } from '../../auth/usePermissions'
import { fullName } from '../../lib/labels'

interface Capability {
  permission: string
  text: string
}

const CAPABILITIES: Capability[] = [
  { permission: 'USER_CREATE', text: 'Crear usuarios y asignarles roles' },
  { permission: 'USER_UPDATE', text: 'Cambiar roles, habilitar o desbloquear cuentas' },
  { permission: 'USER_DELETE', text: 'Deshabilitar usuarios (baja lógica, no se borran)' },
  { permission: 'PROFESSOR_CREATE', text: 'Crear perfiles de profesor y de alumno' },
  { permission: 'COURSE_CREATE', text: 'Crear cursos y asignarles un profesor' },
  { permission: 'COURSE_UPDATE_ANY', text: 'Editar cualquier curso y gestionar matrículas' },
  { permission: 'COURSE_UPDATE', text: 'Editar cursos (solo los propios, si no tenés el permiso global)' },
  { permission: 'COURSE_READ', text: 'Ver el catálogo de cursos' },
  { permission: 'STUDENT_READ', text: 'Ver perfiles de alumnos (solo el propio, si no tenés el permiso global)' },
]

const KIND_LABEL = { admin: 'administrador', professor: 'profesor', student: 'alumno' } as const

export function Home() {
  const { session } = useAuth()
  const { can, accountKind } = usePermissions()
  const profile = useMyProfile()
  const enabled = CAPABILITIES.filter((c) => can(c.permission))

  return (
    <>
      <h1 className="page-title">Hola, {profile.data ? profile.data.firstName : session?.email}</h1>
      <p className="muted">
        Entraste como <strong>{KIND_LABEL[accountKind]}</strong>
        {profile.data && <> ({fullName(profile.data)})</>}. Esta pantalla se arma con los permisos que trae tu token:
        otra cuenta ve otras secciones sobre los mismos datos.
      </p>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <article className="card">
          <h3>Lo que tu cuenta puede hacer</h3>
          <ul className="check-list" style={{ marginTop: 12 }}>
            {enabled.map((c) => (
              <li key={c.permission}>{c.text}</li>
            ))}
          </ul>
        </article>
        <article className="card">
          <h3>Probá esto</h3>
          <ul className="check-list" style={{ marginTop: 12 }}>
            {accountKind !== 'admin' && (
              <li>
                Mirá tus cursos en <Link to="/panel/mis-cursos">Mis cursos</Link>.
              </li>
            )}
            <li>
              Entrá al <Link to="/panel/laboratorio">laboratorio</Link> y lanzá requests prohibidos a propósito para
              ver cómo responde la API.
            </li>
            <li>
              Abrí el <Link to="/panel/token">inspector de token</Link> para ver tus permisos y cuánto falta para que
              venza.
            </li>
            <li>Salí y entrá con otra cuenta de ejemplo: la misma API muestra cosas distintas.</li>
          </ul>
        </article>
      </div>
    </>
  )
}
