import type { ReactNode } from 'react'
import { usePermissions } from '../auth/usePermissions'

export function RequirePermission({ permission, children }: { permission: string; children: ReactNode }) {
  const { can } = usePermissions()
  if (can(permission)) return <>{children}</>
  return (
    <div className="empty">
      <strong>Tu cuenta no tiene acceso a esta sección</strong>
      <p>
        Falta el permiso <span className="mono">{permission}</span>. La interfaz lo oculta, pero aunque llegaras por la
        URL la API respondería 403.
      </p>
    </div>
  )
}
