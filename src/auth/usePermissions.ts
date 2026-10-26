import { useAuth } from './AuthProvider'

export type AccountKind = 'admin' | 'professor' | 'student'

// The UI hides what the account cannot do, but the API is who actually enforces it.
export function usePermissions() {
  const { decoded } = useAuth()
  const granted = new Set(decoded?.payload.permissions ?? [])

  // Derived from permissions, not from a role name: the token only carries permissions.
  const accountKind: AccountKind = granted.has('USER_CREATE')
    ? 'admin'
    : granted.has('COURSE_UPDATE')
      ? 'professor'
      : 'student'

  return {
    can: (permission: string) => granted.has(permission),
    canAny: (...permissions: string[]) => permissions.some((p) => granted.has(p)),
    accountKind,
  }
}
