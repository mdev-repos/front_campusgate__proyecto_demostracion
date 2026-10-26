import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { ApiStatusBadge } from './ApiStatusBadge'
import { ThemeToggle } from './ThemeToggle'

export function SiteHeader() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="site-header">
      <div className="container">
        <Link to="/" className="brand" aria-label="CampusGate, inicio">
          <img src="./campusgate-icon.svg" alt="" />
          CampusGate
        </Link>
        <div className="header-actions">
          <ApiStatusBadge />
          {session && <span className="user-chip">{session.email}</span>}
          <ThemeToggle />
          {session && (
            <button type="button" className="btn btn-sm" onClick={handleLogout}>
              Salir
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
