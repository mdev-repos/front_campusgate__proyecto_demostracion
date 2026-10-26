import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthProvider'
import { usePermissions } from '../auth/usePermissions'
import type { Profile } from './types'

// Professor or student profile of the signed-in account (admins have none).
export function useMyProfile() {
  const { request } = useAuth()
  const { accountKind } = usePermissions()
  return useQuery({
    queryKey: ['my-profile', accountKind],
    queryFn: () => request<Profile>(accountKind === 'professor' ? '/professors/me' : '/students/me'),
    enabled: accountKind !== 'admin',
  })
}
