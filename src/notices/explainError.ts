import { ApiError, NetworkError } from '../api/client'

export interface ErrorExplanation {
  title: string
  message: string
}

// Known API messages, explained for someone who is learning how the API protects itself.
const CONFLICT_EXPLANATIONS: Record<string, string> = {
  'Email already registered': 'Ya existe una cuenta con ese email. Los emails son únicos.',
  'You cannot modify your own account':
    'Un administrador no puede modificarse a sí mismo: así nunca se queda el sistema sin administradores.',
  'Demo accounts cannot be modified':
    'Las cuentas de ejemplo están protegidas para que la demo siga funcionando para todos.',
  'User does not have the PROFESSOR role': 'Solo un usuario con rol Profesor puede tener perfil de profesor.',
  'User does not have the STUDENT role': 'Solo un usuario con rol Alumno puede tener perfil de alumno.',
  'Professor profile already exists for this user': 'Ese usuario ya tiene perfil de profesor.',
  'Student profile already exists for this user': 'Ese usuario ya tiene perfil de alumno.',
  'User has a professor profile; PROFESSOR role cannot be removed':
    'No se puede quitar el rol Profesor mientras exista su perfil de profesor: el sistema evita estados incoherentes.',
  'User has a student profile; STUDENT role cannot be removed':
    'No se puede quitar el rol Alumno mientras exista su perfil de alumno: el sistema evita estados incoherentes.',
  'Student is already enrolled in this course': 'Ese alumno ya está matriculado en el curso.',
  'The request conflicts with existing data': 'La base de datos rechazó la operación por chocar con datos existentes.',
}

export function explainError(error: unknown): ErrorExplanation {
  if (error instanceof NetworkError) {
    return {
      title: 'Sin conexión con la API',
      message: 'El request no llegó al servidor. Si estaba dormido, esperá a que el indicador diga "API lista".',
    }
  }

  if (error instanceof ApiError) {
    switch (error.status) {
      case 400: {
        const fields = error.errors ? Object.keys(error.errors).join(', ') : ''
        return {
          title: '400 · Datos inválidos',
          message: fields
            ? `El servidor validó el request y rechazó estos campos: ${fields}. No repite los valores que enviaste.`
            : 'El servidor rechazó el request por ser inválido.',
        }
      }
      case 403:
        return {
          title: '403 · Sin permiso',
          message:
            'Tu cuenta no tiene el permiso necesario, o el recurso no es tuyo. Ocultar un botón no alcanza: la API verifica siempre.',
        }
      case 404:
        return {
          title: '404 · No encontrado',
          message: 'El recurso no existe. Para quien no tiene permiso, la API responde 403 antes de buscar.',
        }
      case 409:
        return {
          title: '409 · Conflicto',
          message: CONFLICT_EXPLANATIONS[error.message] ?? error.message,
        }
      default:
        return { title: `${error.status} · Error del servidor`, message: 'Ocurrió un error inesperado en la API.' }
    }
  }

  return { title: 'Error inesperado', message: 'Algo salió mal en la interfaz.' }
}

export function fieldError(error: unknown, field: string): string | undefined {
  return error instanceof ApiError ? error.errors?.[field] : undefined
}
