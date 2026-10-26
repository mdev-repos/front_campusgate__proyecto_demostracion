import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../../api/client'
import type { Course, PageResponse, Profile } from '../../api/types'
import { useAuth } from '../../auth/AuthProvider'
import { usePermissions } from '../../auth/usePermissions'
import { Pagination } from '../../components/Pagination'
import { QueryState } from '../../components/QueryState'
import { RequirePermission } from '../../components/RequirePermission'
import { useMyProfile } from '../../api/useMyProfile'
import { fullName, shortId } from '../../lib/labels'
import { useClampPage } from '../../lib/useClampPage'
import { useNotices } from '../../notices/NoticeProvider'
import { useErrorNotifier } from '../../notices/useErrorNotifier'
import { CourseFormModal, useProfessorsLookup } from './CourseFormModal'

const PAGE_SIZE = 10

export function CourseDetailRoute() {
  const { id = '' } = useParams()
  return <CourseDetail key={id} id={id} />
}

function CourseDetail({ id }: { id: string }) {
  const { request } = useAuth()
  const { can, accountKind } = usePermissions()
  const queryClient = useQueryClient()
  const { notify } = useNotices()
  const notifyError = useErrorNotifier()

  const [page, setPage] = useState(0)
  const [studentId, setStudentId] = useState('')
  const [editing, setEditing] = useState(false)

  const professors = useProfessorsLookup()
  const myProfile = useMyProfile()

  const course = useQuery({
    queryKey: ['course', id],
    queryFn: () => request<Course>(`/courses/${id}`),
  })

  const roster = useQuery({
    queryKey: ['course', id, 'students', page],
    queryFn: () => request<PageResponse<Profile>>(`/courses/${id}/students?page=${page}&size=${PAGE_SIZE}&sort=lastName,asc`),
    placeholderData: keepPreviousData,
    retry: false,
  })

  const students = useQuery({
    queryKey: ['students-lookup'],
    queryFn: () => request<PageResponse<Profile>>('/students?size=50&sort=lastName,asc'),
    enabled: can('STUDENT_READ_ANY'),
  })

  const refreshCourse = () => {
    void queryClient.invalidateQueries({ queryKey: ['course', id] })
    void queryClient.invalidateQueries({ queryKey: ['courses'] })
  }

  const enroll = useMutation({
    mutationFn: () => request<void>(`/courses/${id}/students/${studentId}`, { method: 'POST' }),
    onSuccess: () => {
      refreshCourse()
      setStudentId('')
      notify('success', '204 · Alumno matriculado', 'POST crea la relación curso-alumno. Repetirla devuelve 409 Conflict.')
    },
    onError: notifyError,
  })

  const unenroll = useMutation({
    mutationFn: (student: Profile) => request<void>(`/courses/${id}/students/${student.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      refreshCourse()
      notify('success', '204 · Alumno desmatriculado', 'DELETE elimina solo la matrícula: el perfil del alumno no se toca.')
    },
    onError: notifyError,
  })

  useClampPage(roster.data?.totalPages, page, setPage)

  const professor = professors.data?.content.find((p) => p.id === course.data?.professorId)
  const canManage = can('COURSE_UPDATE_ANY')
  const isOwner = accountKind === 'professor' && myProfile.data?.id === course.data?.professorId
  const rosterDenied = roster.error instanceof ApiError && roster.error.status === 403

  return (
    <RequirePermission permission="COURSE_READ">
      <p className="small">
        <Link to="/panel/cursos">← Volver a cursos</Link>
      </p>

      <QueryState isPending={course.isPending} error={course.error} onRetry={() => void course.refetch()}>
        {course.data && (
          <>
            <div className="toolbar">
              <div>
                <h1 className="page-title">{course.data.title}</h1>
                <p className="muted">{course.data.description ?? 'Sin descripción.'}</p>
                <p className="small muted" style={{ marginTop: 6 }}>
                  Profesor:{' '}
                  {professor ? fullName(professor) : <span className="mono">{shortId(course.data.professorId)}</span>}{' '}
                  · {course.data.studentCount} alumnos matriculados
                </p>
              </div>
              <div className="toolbar-actions">
                {(canManage || isOwner) && (
                  <button type="button" className="btn" onClick={() => setEditing(true)}>
                    Editar curso
                  </button>
                )}
              </div>
            </div>

            <h2 className="section-title">Alumnos matriculados</h2>

            {canManage && (
              <div className="enroll-bar card">
                <label className="inline-field grow">
                  Matricular alumno
                  <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                    <option value="">Elegí un alumno…</option>
                    {students.data?.content.map((s) => (
                      <option key={s.id} value={s.id}>
                        {fullName(s)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!studentId || enroll.isPending}
                  onClick={() => enroll.mutate()}
                >
                  {enroll.isPending ? 'Matriculando…' : 'Matricular'}
                </button>
              </div>
            )}

            {rosterDenied ? (
              <div className="empty" role="alert">
                <strong>La API no te deja ver este listado</strong>
                <p>
                  El listado de alumnos de un curso es para su profesor dueño o para un administrador. Fue la API quien
                  respondió 403, no la interfaz.
                </p>
              </div>
            ) : (
              <QueryState isPending={roster.isPending} error={roster.error} onRetry={() => void roster.refetch()}>
                <div className="table-wrap card">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Alumno</th>
                        <th>Id</th>
                        <th aria-label="Acciones" />
                      </tr>
                    </thead>
                    <tbody>
                      {roster.data?.content.map((s) => (
                        <tr key={s.id}>
                          <td>{fullName(s)}</td>
                          <td className="mono muted">{shortId(s.id)}</td>
                          <td className="row-actions">
                            {canManage && (
                              <button
                                type="button"
                                className="btn btn-sm btn-danger-ghost"
                                disabled={unenroll.isPending}
                                onClick={() => unenroll.mutate(s)}
                              >
                                Desmatricular
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {roster.data?.content.length === 0 && (
                        <tr>
                          <td colSpan={3} className="muted">
                            Todavía no hay alumnos matriculados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {roster.data && (
                  <Pagination
                    page={roster.data.page}
                    totalPages={roster.data.totalPages}
                    totalElements={roster.data.totalElements}
                    onChange={setPage}
                  />
                )}
              </QueryState>
            )}

            <CourseFormModal open={editing} course={course.data} onClose={() => setEditing(false)} />
          </>
        )}
      </QueryState>
    </RequirePermission>
  )
}
