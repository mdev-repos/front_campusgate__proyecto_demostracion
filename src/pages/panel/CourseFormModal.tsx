import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Course, PageResponse, Profile } from '../../api/types'
import { useAuth } from '../../auth/AuthProvider'
import { usePermissions } from '../../auth/usePermissions'
import { Modal } from '../../components/Modal'
import { fullName } from '../../lib/labels'
import { fieldError } from '../../notices/explainError'
import { useNotices } from '../../notices/NoticeProvider'
import { useErrorNotifier } from '../../notices/useErrorNotifier'

interface CourseFormModalProps {
  open: boolean
  // null means "create a new course".
  course: Course | null
  onClose: () => void
}

export function useProfessorsLookup() {
  const { request } = useAuth()
  const { can } = usePermissions()
  return useQuery({
    queryKey: ['professors-lookup'],
    queryFn: () => request<PageResponse<Profile>>('/professors?size=50&sort=lastName,asc'),
    enabled: can('PROFESSOR_READ_ANY'),
  })
}

export function CourseFormModal({ open, course, onClose }: CourseFormModalProps) {
  return (
    <Modal title={course ? 'Editar curso' : 'Nuevo curso'} open={open} onClose={onClose}>
      <CourseForm course={course} onClose={onClose} />
    </Modal>
  )
}

function CourseForm({ course, onClose }: { course: Course | null; onClose: () => void }) {
  const { request } = useAuth()
  const queryClient = useQueryClient()
  const { notify } = useNotices()
  const notifyError = useErrorNotifier()
  const professors = useProfessorsLookup()
  const [title, setTitle] = useState(course?.title ?? '')
  const [description, setDescription] = useState(course?.description ?? '')
  const [professorId, setProfessorId] = useState(course?.professorId ?? '')

  const save = useMutation({
    mutationFn: () =>
      course
        ? request<Course>(`/courses/${course.id}`, { method: 'PUT', body: { title: title.trim(), description } })
        : request<Course>('/courses', { method: 'POST', body: { title: title.trim(), description, professorId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
      void queryClient.invalidateQueries({ queryKey: ['course'] })
      if (course) {
        notify(
          'success',
          '200 · Curso actualizado',
          'PUT reemplaza título y descripción. Para un profesor, la API solo lo permite si el curso es suyo.',
        )
      } else {
        notify('success', '201 · Curso creado', 'La API validó que el profesor elegido exista antes de crear el curso.')
      }
      onClose()
    },
    onError: notifyError,
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    save.mutate()
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="course-title">Título</label>
        <input id="course-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        {fieldError(save.error, 'title') && <span className="field-error">{fieldError(save.error, 'title')}</span>}
      </div>
      <div className="field">
        <label htmlFor="course-description">Descripción</label>
        <textarea
          id="course-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      {!course && (
        <div className="field">
          <label htmlFor="course-professor">Profesor</label>
          <select id="course-professor" value={professorId} onChange={(e) => setProfessorId(e.target.value)}>
            <option value="">Elegí un profesor…</option>
            {professors.data?.content.map((p) => (
              <option key={p.id} value={p.id}>
                {fullName(p)}
              </option>
            ))}
          </select>
          {fieldError(save.error, 'professorId') && (
            <span className="field-error">{fieldError(save.error, 'professorId')}</span>
          )}
        </div>
      )}
      <div className="modal-actions">
        <button type="button" className="btn" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={save.isPending}>
          {save.isPending ? 'Guardando…' : course ? 'Guardar cambios' : 'Crear curso'}
        </button>
      </div>
    </form>
  )
}
