import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { API_URL } from '../config'

export type ApiStatus = 'checking' | 'ready' | 'down'

interface ApiStatusValue {
  status: ApiStatus
  elapsedSeconds: number
  retry: () => void
}

const GIVE_UP_AFTER_SECONDS = 120
const RETRY_DELAY_MS = 3000
const ATTEMPT_TIMEOUT_MS = 15000

const ApiStatusContext = createContext<ApiStatusValue | null>(null)

// Starts pinging as soon as the app mounts (on any route), so a sleeping free-tier server wakes up
// while the visitor reads the landing page. /ping/ready also touches the database.
export function ApiStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ApiStatus>('checking')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => {
    setStatus('checking')
    setElapsedSeconds(0)
    setAttempt((n) => n + 1)
  }, [])

  useEffect(() => {
    // Local to this run, so an old polling loop can never be revived by a newer one.
    let cancelled = false
    const startedAt = Date.now()

    const ticker = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)

    async function poll() {
      while (!cancelled) {
        try {
          const response = await fetch(`${API_URL}/ping/ready`, { signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS) })
          if (response.ok) {
            if (!cancelled) setStatus('ready')
            return
          }
        } catch {
          // Still waking up (or unreachable): try again below.
        }
        if (Date.now() - startedAt > GIVE_UP_AFTER_SECONDS * 1000) {
          if (!cancelled) setStatus('down')
          return
        }
        await new Promise((resolve) => window.setTimeout(resolve, RETRY_DELAY_MS))
      }
    }
    poll().finally(() => window.clearInterval(ticker))

    return () => {
      cancelled = true
      window.clearInterval(ticker)
    }
  }, [attempt])

  const value = useMemo(() => ({ status, elapsedSeconds, retry }), [status, elapsedSeconds, retry])
  return <ApiStatusContext.Provider value={value}>{children}</ApiStatusContext.Provider>
}

export function useApiStatus(): ApiStatusValue {
  const ctx = useContext(ApiStatusContext)
  if (!ctx) throw new Error('useApiStatus must be used inside ApiStatusProvider')
  return ctx
}
