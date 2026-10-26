import { useCallback } from 'react'
import { explainError } from './explainError'
import { useNotices } from './NoticeProvider'

export function useErrorNotifier() {
  const { notify } = useNotices()
  return useCallback(
    (error: unknown) => {
      const { title, message } = explainError(error)
      notify('error', title, message)
    },
    [notify],
  )
}
