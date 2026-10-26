import { useClampPage } from '../../lib/useClampPage'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { Course, PageResponse } from '../../api/types'
import { useMyProfile } from '../../api/useMyProfile'
import { useAuth } from '../../auth/AuthProvider'
import { usePermissions } from '../../auth/usePermissions'
import { Pagination } from '../../components/Pagination'
import { QueryState } from '../../components/QueryState'
import { fullName } from '../../lib/labels'
import { CourseFormModal } from './CourseFormModal'

const PAGE_SIZE = 10

export function MyCourses() {
  const { request } = useAuth()
  const { accountKind } = usePermissions()
  const isProfessor = accountKind === 'professor'
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<Course | null>(null)

  const profile = useMyProfile()
  const endpoint = isProfessor ? '/professors/me/courses' : '/students/me/courses'

  const courses = useQuery({
    queryKey: ['courses', 'mine', accountKind, page],
    queryFn: () => request<PageResponse<Course>>(`${endpoint}?page=${page}&size=${PAGE_SIZE}&sort=title,asc`),
    placeholderData: keepPreviousData,
  })
  useClampPage(courses.data?.totalPages, page, setPage)

  return (
    <>
      <div className="toolbar">
        <div>
          <h1 className="page-title">Mis cursos</h1>
          <p className="muted">
            {isProfessor
              ? 'Los cursos que dictás. Solo sobre estos la API te deja editar y ver la lista de alumnos.'
              : 'Los cursos en los que estás matriculado.'}
          </p>
          {profile.data && (
            <p className="small muted" style={{ marginTop: 6 }}>
              Perfil: {fullName(profile.data)}
            </p>
          )}
        </div>
      </div>

      <QueryState isPending={courses.isPending} error={courses.error} onRetry={() => void courses.refetch()}>
        {courses.data?.content.length === 0 ? (
          <div className="empty">
            <strong>Todavía no tenés cursos</strong>
            <p>{isProfessor ? 'Un administrador te los asigna.' : 'Un administrador te matricula en los cursos.'}</p>
          </div>
        ) : (
          <div className="course-grid">
            {courses.data?.content.map((course) => (
              <article className="card course-card" key={course.id}>
                <h3>{course.title}</h3>
                <p>{course.description ?? 'Sin descripción.'}</p>
                <div className="course-meta">
                  <span className="chip">{course.studentCount} alumnos</span>
                </div>
                <div className="course-actions">
                  <Link to={`/panel/cursos/${course.id}`} className="btn btn-sm">
                    Ver curso
                  </Link>
                  {isProfessor && (
                    <button type="button" className="btn btn-sm" onClick={() => setEditing(course)}>
                      Editar
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
        {courses.data && (
          <Pagination
            page={courses.data.page}
            totalPages={courses.data.totalPages}
            totalElements={courses.data.totalElements}
            onChange={setPage}
          />
        )}
      </QueryState>

      <CourseFormModal open={editing !== null} course={editing} onClose={() => setEditing(null)} />
    </>
  )
}
