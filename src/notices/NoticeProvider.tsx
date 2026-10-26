import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

type NoticeKind = 'info' | 'success' | 'error'

interface Notice {
  id: number
  kind: NoticeKind
  title: string
  message: string
}

interface NoticeContextValue {
  notify: (kind: NoticeKind, title: string, message: string) => void
}

const NoticeContext = createContext<NoticeContextValue | null>(null)

// Notices explain what the API just did (and why), not only that something happened.
export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setNotices((list) => list.filter((n) => n.id !== id))
  }, [])

  const notify = useCallback(
    (kind: NoticeKind, title: string, message: string) => {
      const id = nextId.current++
      setNotices((list) => [...list.slice(-3), { id, kind, title, message }])
      window.setTimeout(() => dismiss(id), kind === 'error' ? 14000 : 10000)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <NoticeContext.Provider value={value}>
      {children}
      <div className="notices" role="status" aria-live="polite">
        {notices.map((n) => (
          <div key={n.id} className={`notice notice-${n.kind}`}>
            <span className="notice-title">{n.title}</span>
            <button type="button" onClick={() => dismiss(n.id)} aria-label="Cerrar aviso">
              ×
            </button>
            <span className="notice-text">{n.message}</span>
          </div>
        ))}
      </div>
    </NoticeContext.Provider>
  )
}

export function useNotices(): NoticeContextValue {
  const ctx = useContext(NoticeContext)
  if (!ctx) throw new Error('useNotices must be used inside NoticeProvider')
  return ctx
}
