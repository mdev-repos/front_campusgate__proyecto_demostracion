import { useClampPage } from '../../lib/useClampPage'
import { useState, type FormEvent } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PageResponse, Role, User } from '../../api/types'
import { useAuth } from '../../auth/AuthProvider'
import { usePermissions } from '../../auth/usePermissions'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Modal } from '../../components/Modal'
import { Pagination } from '../../components/Pagination'
import { QueryState } from '../../components/QueryState'
import { RequirePermission } from '../../components/RequirePermission'
import { ALL_ROLES, ROLE_LABELS } from '../../lib/labels'
import { useNotices } from '../../notices/NoticeProvider'
import { fieldError } from '../../notices/explainError'
import { useErrorNotifier } from '../../notices/useErrorNotifier'

const PAGE_SIZE = 10
type SortKey = 'createdAt' | 'email'

function RoleChecks({ value, onChange }: { value: Role[]; onChange: (roles: Role[]) => void }) {
  function toggle(role: Role) {
    onChange(value.includes(role) ? value.filter((r) => r !== role) : [...value, role])
  }
  return (
    <div className="check-group">
      {ALL_ROLES.map((role) => (
        <label key={role} className="check-row">
          <input type="checkbox" checked={value.includes(role)} onChange={() => toggle(role)} />
          {ROLE_LABELS[role]}
        </label>
      ))}
    </div>
  )
}

function CreateUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { request } = useAuth()
  const queryClient = useQueryClient()
  const { notify } = useNotices()
  const notifyError = useErrorNotifier()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roles, setRoles] = useState<Role[]>(['STUDENT'])

  const create = useMutation({
    mutationFn: () => request<User>('/users', { method: 'POST', body: { email: email.trim(), password, roles } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      notify(
        'success',
        '201 · Usuario creado',
        'La API guardó un hash BCrypt de la contraseña (nunca el texto plano) y respondió 201 con la ubicación del nuevo recurso.',
      )
      onClose()
    },
    onError: notifyError,
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    create.mutate()
  }

  return (
    <Modal title="Nuevo usuario" open={open} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="new-email">Email</label>
          <input id="new-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {fieldError(create.error, 'email') && <span className="field-error">{fieldError(create.error, 'email')}</span>}
        </div>
        <div className="field">
          <label htmlFor="new-password">Contraseña (12 a 72 caracteres)</label>
          <input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {fieldError(create.error, 'password') && <span className="field-error">{fieldError(create.error, 'password')}</span>}
        </div>
        <div className="field">
          <span className="label">Roles</span>
          <RoleChecks value={roles} onChange={setRoles} />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={create.isPending}>
            {create.isPending ? 'Creando…' : 'Crear usuario'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function EditUserModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  return (
    <Modal title="Editar usuario" open={user !== null} onClose={onClose}>
      {user && <EditUserForm user={user} onClose={onClose} />}
    </Modal>
  )
}

function EditUserForm({ user, onClose }: { user: User; onClose: () => void }) {
  const { request } = useAuth()
  const queryClient = useQueryClient()
  const { notify } = useNotices()
  const notifyError = useErrorNotifier()
  const [roles, setRoles] = useState<Role[]>(user.roles)
  const [enabled, setEnabled] = useState(user.enabled)
  const [notLocked, setNotLocked] = useState(user.notLocked)

  const update = useMutation({
    mutationFn: (body: Record<string, unknown>) => request<User>(`/users/${user.id}`, { method: 'PATCH', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      notify(
        'success',
        '200 · Cambios guardados',
        'PATCH actualiza solo los campos enviados. Ojo: los roles nuevos rigen desde el próximo login, porque el token que esa persona ya tiene conserva sus permisos anteriores.',
      )
      onClose()
    },
    onError: notifyError,
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const body: Record<string, unknown> = {}
    const sameRoles = roles.length === user.roles.length && roles.every((r) => user.roles.includes(r))
    if (!sameRoles) body.roles = roles
    if (enabled !== user.enabled) body.enabled = enabled
    if (notLocked !== user.notLocked) body.accountNotLocked = notLocked
    if (Object.keys(body).length === 0) {
      onClose()
      return
    }
    update.mutate(body)
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <p className="mono muted">{user.email}</p>
      <div className="field">
        <span className="label">Roles</span>
        <RoleChecks value={roles} onChange={setRoles} />
      </div>
      <label className="check-row">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Cuenta habilitada
      </label>
      <label className="check-row">
        <input type="checkbox" checked={notLocked} onChange={(e) => setNotLocked(e.target.checked)} />
        Cuenta desbloqueada
      </label>
      <div className="modal-actions">
        <button type="button" className="btn" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={update.isPending || roles.length === 0}>
          {update.isPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}

export function Users() {
  const { request } = useAuth()
  const { can } = usePermissions()
  const queryClient = useQueryClient()
  const { notify } = useNotices()
  const notifyError = useErrorNotifier()

  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<SortKey>('createdAt')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [disabling, setDisabling] = useState<User | null>(null)

  const users = useQuery({
    queryKey: ['users', page, sort],
    queryFn: () =>
      request<PageResponse<User>>(
        `/users?page=${page}&size=${PAGE_SIZE}&sort=${sort},${sort === 'createdAt' ? 'desc' : 'asc'}`,
      ),
    placeholderData: keepPreviousData,
  })
  useClampPage(users.data?.totalPages, page, setPage)

  const disable = useMutation({
    mutationFn: (user: User) => request<void>(`/users/${user.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      notify(
        'success',
        '204 · Usuario deshabilitado',
        'Es una baja lógica: el usuario sigue existiendo (para no perder la auditoría ni romper perfiles y cursos), pero ya no puede iniciar sesión.',
      )
      setDisabling(null)
    },
    onError: (error) => {
      notifyError(error)
      setDisabling(null)
    },
  })

  return (
    <RequirePermission permission="USER_READ">
      <div className="toolbar">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="muted">Cuentas que pueden iniciar sesión. Los datos de acceso viven separados de los perfiles.</p>
        </div>
        <div className="toolbar-actions">
          <label className="inline-field">
            Ordenar por
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortKey)
                setPage(0)
              }}
            >
              <option value="createdAt">Más recientes</option>
              <option value="email">Email</option>
            </select>
          </label>
          {can('USER_CREATE') && (
            <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
              Nuevo usuario
            </button>
          )}
        </div>
      </div>

      <QueryState isPending={users.isPending} error={users.error} onRetry={() => void users.refetch()}>
        <div className="table-wrap card">
          <table className="data">
            <thead>
              <tr>
                <th>Email</th>
                <th>Roles</th>
                <th>Estado</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {users.data?.content.map((user) => (
                <tr key={user.id}>
                  <td className="mono">{user.email}</td>
                  <td>
                    <div className="chips">
                      {user.roles.map((role) => (
                        <span className="chip" key={role}>
                          {ROLE_LABELS[role]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {!user.enabled ? (
                      <span className="badge badge-off">Deshabilitado</span>
                    ) : !user.notLocked ? (
                      <span className="badge badge-warn">Bloqueado</span>
                    ) : (
                      <span className="badge badge-ok">Activo</span>
                    )}
                  </td>
                  <td className="row-actions">
                    {can('USER_UPDATE') && (
                      <button type="button" className="btn btn-sm" onClick={() => setEditing(user)}>
                        Editar
                      </button>
                    )}
                    {can('USER_DELETE') && user.enabled && (
                      <button type="button" className="btn btn-sm btn-danger-ghost" onClick={() => setDisabling(user)}>
                        Deshabilitar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.data && (
          <Pagination
            page={users.data.page}
            totalPages={users.data.totalPages}
            totalElements={users.data.totalElements}
            onChange={setPage}
          />
        )}
      </QueryState>

      <CreateUserModal open={creating} onClose={() => setCreating(false)} />
      <EditUserModal user={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={disabling !== null}
        title="Deshabilitar usuario"
        message={`${disabling?.email ?? ''} dejará de poder iniciar sesión. No se borra nada y se puede volver a habilitar.`}
        confirmLabel="Deshabilitar"
        busy={disable.isPending}
        onConfirm={() => disabling && disable.mutate(disabling)}
        onCancel={() => setDisabling(null)}
      />
    </RequirePermission>
  )
}
