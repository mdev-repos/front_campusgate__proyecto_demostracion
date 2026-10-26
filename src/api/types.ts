export type Role = 'ADMIN' | 'PROFESSOR' | 'STUDENT'

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface User {
  id: string
  email: string
  roles: Role[]
  enabled: boolean
  notLocked: boolean
}

export interface Profile {
  id: string
  userId: string
  firstName: string
  lastName: string
}

export interface Course {
  id: string
  title: string
  description: string | null
  professorId: string
  studentCount: number
}
