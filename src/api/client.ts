import { API_URL } from '../config'

// Mirrors the API's ProblemDetail error body (RFC 9457).
export class ApiError extends Error {
  readonly status: number
  readonly errors?: Record<string, string>

  constructor(status: number, detail: string, errors?: Record<string, string>) {
    super(detail)
    this.status = status
    this.errors = errors
  }
}

// The request never reached the API (offline, server asleep, CORS blocked...).
export class NetworkError extends Error {
  constructor() {
    super('No response from the API')
  }
}

export interface RequestOptions {
  method?: string
  body?: unknown
  token?: string | null
  signal?: AbortSignal
}

export interface RawResponse {
  status: number
  data: unknown
}

// Returns the response as is (including 4xx/5xx) so the security lab can show exactly what the API answered.
export async function rawRequest(path: string, options: RequestOptions = {}): Promise<RawResponse> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.token) headers.Authorization = `Bearer ${options.token}`

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new NetworkError()
  }

  const text = await response.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  return { status: response.status, data }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { status, data } = await rawRequest(path, options)
  if (status === 204) return undefined as T
  if (status >= 400) {
    const problem = (data ?? {}) as { detail?: string; errors?: Record<string, string> }
    throw new ApiError(status, problem.detail ?? `Error ${status}`, problem.errors)
  }
  return data as T
}
