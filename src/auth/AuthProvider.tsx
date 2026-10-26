import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, apiRequest, type RequestOptions } from '../api/client'
import { useNotices } from '../notices/NoticeProvider'
import { decodeJwt, type DecodedJwt } from './jwt'

interface Session {
  token: string
  email: string
}

interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
}

interface AuthContextValue {
  session: Session | null
  decoded: DecodedJwt | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  request: <T>(path: string, options?: Omit<RequestOptions, 'token'>) => Promise<T>
}

const STORAGE_KEY = 'campusgate-session'
const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const stored = JSON.parse(raw) as Session
    const decoded = decodeJwt(stored.token)
    return decoded && decoded.payload.exp * 1000 > Date.now() ? stored : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { notify } = useNotices()
  const [session, setSession] = useState<Session | null>(readStoredSession)

  const decoded = useMemo(() => (session ? decodeJwt(session.token) : null), [session])

  const logout = useCallback(() => {
    setSession(null)
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Nothing to clean if storage is blocked.
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    const next = { token: response.accessToken, email }
    setSession(next)
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // The session still works until the tab reloads.
    }
  }, [])

  // Authenticated request: adds the Bearer token and ends the session if the API says the token is no longer valid.
  const request = useCallback(
    async <T,>(path: string, options: Omit<RequestOptions, 'token'> = {}): Promise<T> => {
      try {
        return await apiRequest<T>(path, { ...options, token: session?.token })
      } catch (error) {
        if (error instanceof ApiError && error.status === 401 && session) {
          logout()
          notify(
            'info',
            '401 · Sesión inválida',
            'La API rechazó el token (venció o no es válido), así que se cerró la sesión. Hay que iniciar sesión otra vez.',
          )
        }
        throw error
      }
    },
    [session, logout, notify],
  )

  // The API has no refresh tokens yet: when the JWT expires the visitor has to sign in again.
  useEffect(() => {
    if (!decoded) return
    const msLeft = decoded.payload.exp * 1000 - Date.now()
    const timer = window.setTimeout(() => {
      logout()
      notify(
        'info',
        'Tu sesión venció',
        'El token dura 30 minutos y esta API todavía no tiene refresh tokens: hay que volver a iniciar sesión.',
      )
    }, Math.max(msLeft, 0))
    return () => window.clearTimeout(timer)
  }, [decoded, logout, notify])

  const value = useMemo(
    () => ({ session, decoded, login, logout, request }),
    [session, decoded, login, logout, request],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
