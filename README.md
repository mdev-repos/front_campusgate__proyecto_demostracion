<div align="center">
  <img src="./public/campusgate-icon.svg" width="96" alt="CampusGate" />

  # CampusGate · Front
</div>

Interfaz web de [CampusGate](https://github.com/mdev-repos/security_campusgate__proyecto_demostracion), una API
de plataforma educativa construida para dominar Spring Security. El front no simula nada: cada acción llega a la
API real y la interfaz **explica qué respondió y por qué** (un 401 genérico, un 403 por falta de permiso, un token
que vence), con un inspector que muestra el JWT decodificado.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Status](https://img.shields.io/badge/status-deployado-brightgreen)

**🖥️ Demo en vivo**: https://mdev-repos.github.io/front_campusgate__proyecto_demostracion/
**🚀 API**: https://campus-gate-44s4.onrender.com
_(la API corre en el plan gratuito de Render: la primera carga tras un rato sin uso puede tardar ~30-60 s mientras la instancia despierta; el semáforo del encabezado muestra el estado)_

---

## Qué incluye

- **Landing** que explica el proyecto mientras se **despierta la API** (el plan gratuito se duerme): al abrir
  cualquier página se dispara un `GET /ping/ready`, y un semáforo (amarillo "Despertando el servidor…", verde
  "API lista", rojo "Sin respuesta" con reintento) informa el estado.
- **Login** con formulario y tres cuentas de ejemplo (administrador, profesor, alumno) de un clic.
- **Modo oscuro por defecto** y modo claro, con la paleta del logo.
- **Inspector de token**: header, payload y firma del JWT, permisos agrupados y cuenta regresiva hasta el vencimiento.
- **Avisos educativos**: cada respuesta relevante de la API se explica en lenguaje simple.
- **Vistas por tipo de cuenta**: el profesor ve y edita solo sus cursos y la lista de sus alumnos; el alumno ve sus cursos
  matriculados; la API responde 403 ante lo demás y la interfaz lo explica.
- **Laboratorio de seguridad**: botones que lanzan requests prohibidos a propósito (sin token, token adulterado, curso
  ajeno, página gigante, orden no permitido...) y muestran el status, la respuesta real y por qué ocurrió.
- **Panel por permisos**: la navegación y las acciones se arman con los permisos del token; el administrador gestiona
  usuarios, perfiles, cursos y matrículas (con paginación y validación).

## Stack

| Categoría | Tecnología |
|---|---|
| UI | React 19 + TypeScript (modo estricto) |
| Build | Vite |
| Rutas | React Router (`HashRouter`, compatible con GitHub Pages) |
| Estilos | CSS con variables (tokens de tema), sin librería de UI |
| Tipografías | IBM Plex Sans e IBM Plex Mono (autoalojadas con Fontsource) |

## Cómo correrlo en local

**Prerrequisitos**: Node 22+ y la API corriendo (ver su README).

```bash
npm install
cp .env.example .env.local   # y completar VITE_DEMO_PASSWORD
npm run dev
```

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API (por defecto `http://localhost:8080`) |
| `VITE_DEMO_PASSWORD` | Contraseña **pública** de las cuentas de ejemplo; debe coincidir con `DEMO_PASSWORD` de la API |

## Despliegue (GitHub Pages)

El workflow `.github/workflows/deploy.yml` construye y publica el sitio en cada push a `main`. Configuración única:

1. En el repo: **Settings → Pages → Source: GitHub Actions**.
2. En **Settings → Secrets and variables → Actions → Variables**, crear:

| Variable | Valor |
|---|---|
| `VITE_API_URL` | URL pública de la API, sin barra final (`https://campus-gate-44s4.onrender.com`) |
| `VITE_DEMO_PASSWORD` | La misma contraseña que `DEMO_PASSWORD` en la API |

Son variables y no *secrets* porque ambos valores terminan en el bundle público: las cuentas de ejemplo son
públicas a propósito.

3. En la API, `CORS_ALLOWED_ORIGINS` debe incluir el origen del sitio (`https://mdev-repos.github.io`, sin ruta).

Como el sitio vive bajo una subruta, se usa `HashRouter` y `base: './'` en Vite, así las rutas y los assets
funcionan sin configuración extra.

## Estructura

```
src/
├── api/           # cliente HTTP (ProblemDetail), estado de la API (ping)
├── auth/          # sesión, decodificación del JWT
├── components/    # header, semáforo, selector de tema
├── notices/       # avisos educativos
├── lib/           # etiquetas, experimentos del laboratorio
├── pages/         # Landing, Login y panel (usuarios, cursos, laboratorio...)
├── styles/        # tokens de color y estilos globales
└── theme/         # modo oscuro / claro
```

## Decisiones

- **El JWT vive en `sessionStorage`**: se pierde al cerrar la pestaña. Es un compromiso de la demo; con refresh
  tokens en cookie `HttpOnly` sería más seguro (se trabaja en NodoBank).
- **La interfaz oculta, el servidor decide**: los botones aparecen según los permisos del token, pero la
  autorización real siempre la hace la API.
- **Las cuentas de ejemplo son públicas a propósito**: la API las protege (no cambian contraseña ni se
  bloquean) y reinicia los datos cada día.

## Roadmap

- [x] Landing, tema oscuro/claro, semáforo de la API
- [x] Login y cuentas de ejemplo
- [x] Inspector de token
- [x] Vistas del administrador (usuarios, perfiles, cursos, matrículas)
- [x] Vistas del profesor y del alumno
- [x] Laboratorio de acciones prohibidas (para ver los 401, 403 y 400)
- [x] Deploy en GitHub Pages (workflow de GitHub Actions)

## Autor

**Matías Mazzitelli**
_Backend Developer — Java / Spring Boot_

[GitHub] https://github.com/mdev-repos · [LinkedIn] https://www.linkedin.com/in/mnm-dev
