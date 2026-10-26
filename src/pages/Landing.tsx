import { Link } from 'react-router-dom'

export function Landing() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="eyebrow">Proyecto de portfolio · Spring Security 7</span>
          <h1>La seguridad de una API, a la vista.</h1>
          <p className="lead">
            CampusGate es una API de una plataforma educativa (alumnos, profesores y cursos). La armé para
            poner en practica, de punta a punta, cómo se autentica y se autoriza en un backend, implementando JWT, roles, permisos y reglas de
            pertenencia. Esta página es su vidriera. Cada acción que hagas llega a la API de verdad y vas a ver
            qué respondió y por qué.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="btn btn-primary">
              Probar la demo
            </Link>
            <span className="muted">No hace falta que te registres, hay tres cuentas de ejemplo para probar todos.</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>Qué vas a poder probar</h2>
          <div className="grid-3">
            <article className="card">
              <h3>Tres roles, tres vistas</h3>
              <p>
                Entrá como administrador, profesor o alumno y compará qué ve y qué puede hacer cada uno sobre los
                mismos datos.
              </p>
            </article>
            <article className="card">
              <h3>Permisos que se hacen cumplir</h3>
              <p>
                Un laboratorio lanza requests prohibidos a propósito (sin token, con un token adulterado, sobre un curso
                ajeno) y la interfaz te explica por qué la API responde como responde.
              </p>
            </article>
            <article className="card">
              <h3>Un token que podés leer</h3>
              <p>
                Un inspector muestra el JWT decodificado. Quién sos, tus permisos y cuánto falta para que venza.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid-2">
            <article className="card">
              <h2>Cómo está protegida</h2>
              <ul className="check-list">
                <li>
                  <strong>JWT sin sesiones:</strong> la API no guarda estado - cada request trae su token.
                </li>
                <li>
                  <strong>Permisos, no roles:</strong> el código pregunta qué se puede hacer, no quién sos.
                </li>
                <li>
                  <strong>Pertenencia:</strong> un profesor edita solo sus cursos - un alumno ve solo su perfil.
                </li>
                <li>
                  <strong>Errores que no filtran:</strong> un login fallido responde siempre lo mismo.
                </li>
                <li>
                  <strong>Bloqueo por intentos</strong> y paginación con orden restringido.
                </li>
              </ul>
            </article>
            <article className="card">
              <h2>Sobre esta demo</h2>
              <ul className="check-list">
                <li>
                  <strong>Datos ficticios:</strong> nombres, cursos y matrículas inventados.
                </li>
                <li>
                  <strong>Se reinicia solo:</strong> todo lo que crees se borra cada día.
                </li>
                <li>
                  <strong>Servidor gratuito:</strong> si estaba dormido, tarda hasta un minuto en despertar. Ya le
                  avisamos al abrir esta página; mirá el indicador arriba a la derecha.
                </li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          Hecho por <strong>Matías Mazzitelli</strong> · Backend Java / Spring Boot ·{' '}
          <a href="https://github.com/mdev-repos" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </footer>
    </>
  )
}
