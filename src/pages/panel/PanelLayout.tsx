import { NavLink, Outlet } from 'react-router-dom'
import { usePermissions, type AccountKind } from '../../auth/usePermissions'

interface NavItem {
  to: string
  label: string
  permission?: string
  kind?: AccountKind[]
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/panel', label: 'Inicio', end: true },
  { to: '/panel/mis-cursos', label: 'Mis cursos', kind: ['professor', 'student'] },
  { to: '/panel/cursos', label: 'Cursos', permission: 'COURSE_READ' },
  { to: '/panel/usuarios', label: 'Usuarios', permission: 'USER_READ' },
  { to: '/panel/profesores', label: 'Profesores', permission: 'PROFESSOR_READ_ANY' },
  { to: '/panel/alumnos', label: 'Alumnos', permission: 'STUDENT_READ_ANY' },
  { to: '/panel/laboratorio', label: 'Laboratorio' },
  { to: '/panel/token', label: 'Token' },
]

export function PanelLayout() {
  const { can, accountKind } = usePermissions()
  const items = NAV_ITEMS.filter(
    (item) => (!item.permission || can(item.permission)) && (!item.kind || item.kind.includes(accountKind)),
  )

  return (
    <>
      <nav className="panel-nav" aria-label="Secciones">
        <div className="container">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="panel-link">
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <div className="container page">
        <Outlet />
      </div>
    </>
  )
}
