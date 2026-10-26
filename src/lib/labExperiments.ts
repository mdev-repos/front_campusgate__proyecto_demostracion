import { rawRequest, type RawResponse } from '../api/client'
import type { AccountKind } from '../auth/usePermissions'

export interface LabContext {
  token: string
  userId: string
  accountKind: AccountKind
}

export interface LabResult extends RawResponse {
  method: string
  path: string
  // Optional detail computed from the response (for example the page size the API really used).
  highlight?: string
}

export interface Experiment {
  id: string
  title: string
  description: string
  // Only some accounts can run it (for example "edit one of my courses" is for professors).
  kinds?: AccountKind[]
  run: (ctx: LabContext) => Promise<LabResult>
  explain: (result: LabResult, ctx: LabContext) => string
}

const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000'

async function send(
  method: string,
  path: string,
  options: { token?: string; body?: unknown } = {},
): Promise<LabResult> {
  const response = await rawRequest(path, { method, token: options.token, body: options.body })
  return { ...response, method, path }
}

function tamperToken(token: string): string {
  const [header, payload, signature] = token.split('.')
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
  const claims = JSON.parse(atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='))) as {
    permissions: string[]
    [claim: string]: unknown
  }
  claims.permissions = [...new Set([...claims.permissions, 'USER_READ', 'USER_CREATE', 'COURSE_UPDATE_ANY'])]
  // An administrator already has those permissions, so add a claim to guarantee the content really changes.
  claims.lab = 'adulterado'
  const forged = btoa(JSON.stringify(claims)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${header}.${forged}.${signature}`
}

async function pickCourse(ctx: LabContext, preferForeign: boolean): Promise<string> {
  const all = await rawRequest('/courses?size=50&sort=title,asc', { token: ctx.token })
  const courses = ((all.data as { content?: { id: string }[] } | null)?.content ?? []) as { id: string }[]
  if (!preferForeign || ctx.accountKind !== 'professor') return courses[0]?.id ?? UNKNOWN_ID
  const mine = await rawRequest('/professors/me/courses?size=50', { token: ctx.token })
  const ownIds = new Set(((mine.data as { content?: { id: string }[] } | null)?.content ?? []).map((c) => c.id))
  return courses.find((c) => !ownIds.has(c.id))?.id ?? courses[0]?.id ?? UNKNOWN_ID
}

async function pickOwnCourse(ctx: LabContext): Promise<string> {
  const mine = await rawRequest('/professors/me/courses?size=1', { token: ctx.token })
  return ((mine.data as { content?: { id: string }[] } | null)?.content ?? [])[0]?.id ?? UNKNOWN_ID
}

export const EXPERIMENTS: Experiment[] = [
  {
    id: 'no-token',
    title: 'Llamar sin token',
    description: 'Pide el listado de usuarios sin enviar ninguna credencial.',
    run: () => send('GET', '/users?size=1'),
    explain: (r) =>
      r.status === 401
        ? 'Sin token la API ni mira el recurso: el filtro del Resource Server corta antes de llegar al controller.'
        : 'Respuesta inesperada: sin token debería ser 401.',
  },
  {
    id: 'tampered-token',
    title: 'Token adulterado',
    description: 'Le agrega permisos de administrador y un claim extra al payload de tu token, y conserva la firma original.',
    run: (ctx) => send('GET', '/users?size=1', { token: tamperToken(ctx.token) }),
    explain: (r) =>
      r.status === 401
        ? 'El payload se puede leer y hasta reescribir, pero la firma deja de coincidir con el contenido y la API lo detecta. Por eso un JWT es seguro aunque no esté cifrado.'
        : 'Respuesta inesperada: un token adulterado debería ser 401.',
  },
  {
    id: 'list-users',
    title: 'Listar usuarios',
    description: 'Pide la primera página del listado de usuarios.',
    run: (ctx) => send('GET', '/users?size=1', { token: ctx.token }),
    explain: (r) =>
      r.status === 200
        ? 'Tu token trae el permiso USER_READ, así que la API responde.'
        : 'Tu token no trae USER_READ. El rechazo lo decide @PreAuthorize antes de entrar al método: nunca se consulta la base.',
  },
  {
    id: 'create-valid',
    title: 'Crear un usuario con un cuerpo válido',
    description: 'Envía un POST /users completo y correcto. Solo corre para cuentas que no deberían poder crearlo.',
    kinds: ['professor', 'student'],
    run: (ctx) =>
      send('POST', '/users', {
        token: ctx.token,
        body: { email: 'intruso@laboratorio.test', password: 'Laboratorio-123456', roles: ['STUDENT'] },
      }),
    explain: (r) =>
      r.status === 403
        ? 'El cuerpo es válido, así que la API llegó al chequeo de permisos: sin USER_CREATE, 403. No se creó nada.'
        : 'Respuesta inesperada.',
  },
  {
    id: 'create-empty',
    title: '¿Qué se revisa primero: el cuerpo o el permiso?',
    description: 'Envía un POST /users con el cuerpo vacío para ver cuál de las dos revisiones gana.',
    run: (ctx) => send('POST', '/users', { token: ctx.token, body: {} }),
    explain: (r, ctx) =>
      r.status === 400 && ctx.accountKind !== 'admin'
        ? 'Aunque no tenés USER_CREATE, la API respondió 400: en Spring MVC la validación del cuerpo (@Valid) ocurre al armar los argumentos del controller, antes de que @PreAuthorize se evalúe. Un 400 no prueba que tengas permiso; mirá el experimento anterior para ver el 403.'
        : r.status === 400
          ? 'Tenés USER_CREATE, así que el permiso pasó y el cuerpo vacío se rechazó con 400.'
          : 'Respuesta inesperada.',
  },
  {
    id: 'edit-foreign-course',
    title: 'Editar un curso que no es tuyo',
    description: 'Intenta un PUT con datos válidos sobre un curso ajeno. Solo corre para cuentas que no deberían poder.',
    kinds: ['professor', 'student'],
    run: async (ctx) => {
      const id = await pickCourse(ctx, true)
      return send('PUT', `/courses/${id}`, { token: ctx.token, body: { title: 'Cambio desde el laboratorio' } })
    },
    explain: (r, ctx) =>
      r.status === 403
        ? ctx.accountKind === 'professor'
          ? 'Tenés COURSE_UPDATE, pero no sos el dueño de este curso. El permiso dice qué podés hacer; la pertenencia dice sobre qué recurso. Hacen falta las dos. No se modificó nada.'
          : 'Tu cuenta no tiene permiso para editar cursos. No se modificó nada.'
        : 'Respuesta inesperada.',
  },
  {
    id: 'roster-foreign',
    title: 'Ver los alumnos de un curso ajeno',
    description: 'Pide el listado de alumnos matriculados de un curso que no es tuyo.',
    kinds: ['professor', 'student'],
    run: async (ctx) => {
      const id = await pickCourse(ctx, true)
      return send('GET', `/courses/${id}/students?size=1`, { token: ctx.token })
    },
    explain: (r, ctx) =>
      r.status === 403
        ? ctx.accountKind === 'professor'
          ? 'La misma regla de pertenencia: ver los alumnos de un curso es para su profesor dueño (o un administrador).'
          : 'El listado de alumnos de un curso no está disponible para un alumno.'
        : 'Respuesta inesperada.',
  },
  {
    id: 'roster-own',
    title: 'Ver los alumnos de un curso propio',
    description: 'El mismo pedido, pero sobre un curso tuyo. Compará con el experimento anterior.',
    kinds: ['professor'],
    run: async (ctx) => {
      const id = await pickOwnCourse(ctx)
      return send('GET', `/courses/${id}/students?size=1`, { token: ctx.token })
    },
    explain: (r) =>
      r.status === 200
        ? 'Acá sí: tenés el permiso y el curso es tuyo. La única diferencia con el experimento anterior es la pertenencia.'
        : 'Respuesta inesperada.',
  },
  {
    id: 'roster-any',
    title: 'Ver los alumnos de cualquier curso',
    description: 'Pide el listado de alumnos de un curso cualquiera.',
    kinds: ['admin'],
    run: async (ctx) => {
      const id = await pickCourse(ctx, false)
      return send('GET', `/courses/${id}/students?size=1`, { token: ctx.token })
    },
    explain: (r) =>
      r.status === 200
        ? 'Como administrador tenés COURSE_UPDATE_ANY: el permiso global reemplaza la regla de pertenencia.'
        : 'Respuesta inesperada.',
  },
  {
    id: 'self-modify',
    title: 'Modificar tu propia cuenta',
    description: 'Intenta deshabilitar tu propio usuario con PATCH.',
    run: (ctx) => send('PATCH', `/users/${ctx.userId}`, { token: ctx.token, body: { enabled: false } }),
    explain: (r) =>
      r.status === 409
        ? 'Un administrador no puede modificarse a sí mismo: así nunca se queda el sistema sin administradores.'
        : r.status === 403
          ? 'Sin USER_UPDATE ni se evalúa la regla: el permiso se chequea primero.'
          : 'Respuesta inesperada.',
  },
  {
    id: 'page-size',
    title: 'Pedir una página gigante',
    description: 'Pide GET /courses?size=100000.',
    run: async (ctx) => {
      const r = await send('GET', '/courses?size=100000', { token: ctx.token })
      const size = (r.data as { size?: number } | null)?.size
      return { ...r, highlight: size !== undefined ? `La API devolvió size = ${size}` : undefined }
    },
    explain: (r) =>
      r.status === 200
        ? 'La API no te da lo que pedís: acota el tamaño de página a 50. Así nadie puede forzarla a cargar todo de una vez.'
        : 'Respuesta inesperada.',
  },
  {
    id: 'bad-sort',
    title: 'Ordenar por un campo no permitido',
    description: 'Pide GET /courses?sort=professor.',
    run: (ctx) => send('GET', '/courses?sort=professor', { token: ctx.token }),
    explain: (r) =>
      r.status === 400
        ? 'Solo se puede ordenar por una lista blanca de campos. Si se pudiera ordenar por cualquier campo (por ejemplo un hash de contraseña), el orden del resultado revelaría información.'
        : 'Respuesta inesperada.',
  },
  {
    id: 'bad-id',
    title: 'Un id que no es un UUID',
    description: 'Pide GET /courses/hola.',
    run: (ctx) => send('GET', '/courses/hola', { token: ctx.token }),
    explain: (r) =>
      r.status === 400
        ? 'Spring no puede convertir "hola" a UUID y responde 400 solo, sin que haya código escrito para eso.'
        : 'Respuesta inesperada.',
  },
  {
    id: 'unknown-course',
    title: 'Un curso que no existe',
    description: 'Pide un curso con un UUID válido que no está en la base.',
    run: (ctx) => send('GET', `/courses/${UNKNOWN_ID}`, { token: ctx.token }),
    explain: (r) =>
      r.status === 404
        ? 'El recurso no existe. Para un permiso que no tenés, la API responde 403 antes de buscar, así que no podés averiguar qué ids existen.'
        : 'Respuesta inesperada.',
  },
]
