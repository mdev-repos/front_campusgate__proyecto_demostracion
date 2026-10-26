import { useClampPage } from '../../lib/useClampPage'
import { useState, type FormEvent } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PageResponse, Profile, Role, User } from '../../api/types'
import { useAuth } from '../../auth/AuthProvider'
import { usePermissions } from '../../auth/usePermissions'
import { Modal } from '../../components/Modal'
import { Pagination } from '../../components/Pagination'
import { QueryState } from '../../components/QueryState'
import { RequirePermission } from '../../components/RequirePermission'
import { fullName, shortId } from '../../lib/labels'
import { fieldError } from '../../notices/explainError'
import { useNotices } from '../../notices/NoticeProvider'
import { useErrorNotifier } from '../../notices/useErrorNotifier'

export type ProfileKind = 'professors' | 'students'

const PAGE_SIZE = 10

const KIND_CONFIG: Record<
  ProfileKind,
  { title: string; singular: string; role: Role; readPermission: string; createPermission: string; roleLabel: string }
> = {
  professors: {
    title: 'Profesores',
    singular: 'profesor',
    role: 'PROFESSOR',
    readPermission: 'PROFESSOR_READ_ANY',
    createPermission: 'PROFESSOR_CREATE',
    roleLabel: 'Profesor',
  },
  students: {
    title: 'Alumnos',
    singular: 'alumno',
    role: 'STUDENT',
    readPermission: 'STUDENT_READ_ANY',
    createPermission: 'STUDENT_CREATE',
    roleLabel: 'Alumno',
  },
}

function useUsersLookup() {
  const { request } = useAuth()
  const { can } = usePermissions()
  return useQuery({
    queryKey: ['users-lookup'],
    queryFn: () => request<PageResponse<User>>('/users?size=50&sort=createdAt,desc'),
    enabled: can('USER_READ'),
  })
}

function CreateProfileModal({ kind, open, onClose }: { kind: ProfileKind; open: boolean; onClose: () => void }) {
  const config = KIND_CONFIG[kind]
  const { request } = useAuth()
  const queryClient = useQueryClient()
  const { notify } = useNotices()
  const notifyError = useErrorNotifier()
  const lookup = useUsersLookup()
  const [userId, setUserId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const candidates = lookup.data?.content.filter((u) => u.roles.includes(config.role)) ?? []

  const create = useMutation({
    mutationFn: () =>
      request<Profile>(`/${kind}`, { method: 'POST', body: { userId, firstName: firstName.trim(), lastName: lastName.trim() } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [kind] })
      notify(
        'success',
        `201 · Perfil de ${config.singular} creado`,
        `La API comprobó que ese usuario tiene el rol ${config.roleLabel} y que todavía no tenía perfil. Cuenta y perfil son entidades separadas.`,
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
    <Modal title={`Nuevo perfil de ${config.singular}`} open={open} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="profile-user">Usuario (con rol {config.roleLabel})</label>
          <select id="profile-user" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Elegí un usuario…</option>
            {candidates.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email}
              </option>
            ))}
          </select>
          <span className="muted hint">
            Se listan los 50 usuarios más recientes. Si elegís uno que ya tiene perfil, la API responde 409.
          </span>
          {fieldError(create.error, 'userId') && <span className="field-error">{fieldError(create.error, 'userId')}</span>}
        </div>
        <div className="field">
          <label htmlFor="profile-first">Nombre</label>
          <input id="profile-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          {fieldError(create.error, 'firstName') && (
            <span className="field-error">{fieldError(create.error, 'firstName')}</span>
          )}
        </div>
        <div className="field">
          <label htmlFor="profile-last">Apellido</label>
          <input id="profile-last" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          {fieldError(create.error, 'lastName') && (
            <span className="field-error">{fieldError(create.error, 'lastName')}</span>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={create.isPending}>
            {create.isPending ? 'Creando…' : 'Crear perfil'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function Profiles({ kind }: { kind: ProfileKind }) {
  const config = KIND_CONFIG[kind]
  const { request } = useAuth()
  const { can } = usePermissions()
  const [page, setPage] = useState(0)
  const [creating, setCreating] = useState(false)
  const lookup = useUsersLookup()

  const emailById = new Map(lookup.data?.content.map((u) => [u.id, u.email]))

  const profiles = useQuery({
    queryKey: [kind, page],
    queryFn: () => request<PageResponse<Profile>>(`/${kind}?page=${page}&size=${PAGE_SIZE}&sort=lastName,asc`),
    placeholderData: keepPreviousData,
  })
  useClampPage(profiles.data?.totalPages, page, setPage)

  return (
    <RequirePermission permission={config.readPermission}>
      <div className="toolbar">
        <div>
          <h1 className="page-title">{config.title}</h1>
          <p className="muted">
            Perfil académico de cada persona. Está separado de la cuenta: la seguridad no depende del dominio.
          </p>
        </div>
        <div className="toolbar-actions">
          {can(config.createPermission) && (
            <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
              Nuevo perfil
            </button>
          )}
        </div>
      </div>

      <QueryState isPending={profiles.isPending} error={profiles.error} onRetry={() => void profiles.refetch()}>
        <div className="table-wrap card">
          <table className="data">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cuenta</th>
                <th>Id</th>
              </tr>
            </thead>
            <tbody>
              {profiles.data?.content.map((p) => (
                <tr key={p.id}>
                  <td>{fullName(p)}</td>
                  <td className="mono">{emailById.get(p.userId) ?? `usuario ${shortId(p.userId)}`}</td>
                  <td className="mono muted">{shortId(p.id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {profiles.data && (
          <Pagination
            page={profiles.data.page}
            totalPages={profiles.data.totalPages}
            totalElements={profiles.data.totalElements}
            onChange={setPage}
          />
        )}
      </QueryState>

      <CreateProfileModal kind={kind} open={creating} onClose={() => setCreating(false)} />
    </RequirePermission>
  )
}
