const configuredApiUrl = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/$/, '')

// In development the local API is the default. A production build without the variable is a deploy mistake,
// so it is reported instead of silently calling the wrong place.
export const API_URL = configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:8080' : '')
export const API_CONFIGURED = API_URL !== ''

// Public on purpose: the demo accounts are meant to be tried by anyone.
export const DEMO_PASSWORD: string = import.meta.env.VITE_DEMO_PASSWORD ?? ''

export type DemoRole = 'admin' | 'professor' | 'student'

export interface DemoAccount {
  role: DemoRole
  label: string
  email: string
  description: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'admin',
    label: 'Administrador',
    email: 'admin@campusgate.demo',
    description: 'Gestiona usuarios, perfiles, cursos y matrículas. Tiene todos los permisos.',
  },
  {
    role: 'professor',
    label: 'Profesor',
    email: 'profesor@campusgate.demo',
    description: 'Ve sus cursos y sus alumnos. Solo puede editar los cursos que le pertenecen.',
  },
  {
    role: 'student',
    label: 'Alumno',
    email: 'alumno@campusgate.demo',
    description: 'Ve sus cursos y su propio perfil. No puede modificar nada.',
  },
]
