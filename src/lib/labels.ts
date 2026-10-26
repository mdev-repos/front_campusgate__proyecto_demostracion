import type { Role } from '../api/types'

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  PROFESSOR: 'Profesor',
  STUDENT: 'Alumno',
}

export const ALL_ROLES: Role[] = ['ADMIN', 'PROFESSOR', 'STUDENT']

export function fullName(profile: { firstName: string; lastName: string }): string {
  return `${profile.firstName} ${profile.lastName}`
}

export function shortId(id: string): string {
  return id.slice(0, 8)
}
