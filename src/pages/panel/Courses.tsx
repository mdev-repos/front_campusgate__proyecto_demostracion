import { useClampPage } from '../../lib/useClampPage'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Course, PageResponse } from '../../api/types'
import { useAuth } from '../../auth/AuthProvider'
import { usePermissions } from '../../auth/usePermissions'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Pagination } from '../../components/Pagination'
import { QueryState } from '../../components/QueryState'
import { RequirePermission } from '../../components/RequirePermission'
import { useMyProfile } from '../../api/useMyProfile'
import { fullName, shortId } from '../../lib/labels'
import { useNotices } from '../../notices/NoticeProvider'
import { useErrorNotifier } from '../../notices/useErrorNotifier'
import { CourseFormModal, useProfessorsLookup } from './CourseFormModal'

const PAGE_SIZE = 10

export function Courses() {
  const { request } = useAuth()
  const { can, accountKind } = usePermissions()
  const queryClient = useQueryClient()
  const { notify } = useNotices()
  const notifyError = useErrorNotifier()

  const [page, setPage] = useState(0)
  const [formCourse, setFormCourse] = useState<Course | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<Course | null>(null)

  const professors = useProfessorsLookup()
  const myProfile = useMyProfile()
  // A professor owns a course when it is assigned to their own profile; the API checks it again on every edit.
  const isOwner = (course: Course) => accountKind === 'professor' && myProfile.data?.id === course.professorId
  const professorName = new Map(professors.data?.content.map((p) => [p.id, fullName(p)]))
  // Only accounts that can list professors can see who teaches each course.
  const showProfessor = can('PROFESSOR_READ_ANY')

  const courses = useQuery({
    queryKey: ['courses', page],
    queryFn: () => request<PageResponse<Course>>(`/courses?page=${page}&size=${PAGE_SIZE}&sort=title,asc`),
    placeholderData: keepPreviousData,
  })
  useClampPage(courses.data?.totalPages, page, setPage)

  const remove = useMutation({
    mutationFn: (course: Course) => request<void>(`/courses/${course.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
      notify(
        'success',
        '204 · Curso eliminado',
        'DELETE responde 204 sin cuerpo. Las matrículas del curso se eliminaron con él; los alumnos y el profesor siguen existiendo.',
      )
      setDeleting(null)
    },
    onError: (error) => {
      notifyError(error)
      setDeleting(null)
    },
  })

  function openForm(course: Course | null) {
    setFormCourse(course)
    setFormOpen(true)
  }

  return (
    <RequirePermission permission="COURSE_READ">
      <div className="toolbar">
        <div>
          <h1 className="page-title">Cursos</h1>
          <p className="muted">Catálogo de cursos. Las acciones que ves dependen de los permisos de tu cuenta.</p>
        </div>
        <div className="toolbar-actions">
          {can('COURSE_CREATE') && (
            <button type="button" className="btn btn-primary" onClick={() => openForm(null)}>
              Nuevo curso
            </button>
          )}
        </div>
      </div>

      <QueryState isPending={courses.isPending} error={courses.error} onRetry={() => void courses.refetch()}>
        <div className="table-wrap card">
          <table className="data">
            <thead>
              <tr>
                <th>Curso</th>
                {showProfessor && <th>Profesor</th>}
                <th>Alumnos</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {courses.data?.content.map((course) => (
                <tr key={course.id}>
                  <td>
                    <Link to={`/panel/cursos/${course.id}`} className="row-title">
                      {course.title}
                    </Link>
                    {course.description && <div className="muted small">{course.description}</div>}
                  </td>
                  {showProfessor && (
                    <td>
                      {professorName.get(course.professorId) ?? (
                        <span className="mono muted">{shortId(course.professorId)}</span>
                      )}
                    </td>
                  )}
                  <td>{course.studentCount}</td>
                  <td className="row-actions">
                    <Link to={`/panel/cursos/${course.id}`} className="btn btn-sm">
                      Ver
                    </Link>
                    {(can('COURSE_UPDATE_ANY') || isOwner(course)) && (
                      <button type="button" className="btn btn-sm" onClick={() => openForm(course)}>
                        Editar
                      </button>
                    )}
                    {can('COURSE_DELETE') && (
                      <button type="button" className="btn btn-sm btn-danger-ghost" onClick={() => setDeleting(course)}>
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {courses.data && (
          <Pagination
            page={courses.data.page}
            totalPages={courses.data.totalPages}
            totalElements={courses.data.totalElements}
            onChange={setPage}
          />
        )}
      </QueryState>

      <CourseFormModal open={formOpen} course={formCourse} onClose={() => setFormOpen(false)} />
      <ConfirmDialog
        open={deleting !== null}
        title="Eliminar curso"
        message={`Se eliminará "${deleting?.title ?? ''}" junto con sus matrículas. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </RequirePermission>
  )
}
