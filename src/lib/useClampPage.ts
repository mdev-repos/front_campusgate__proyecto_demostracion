import { useEffect } from 'react'

// If the current page no longer exists (for example the last item of the last page was deleted),
// go back to the last valid page instead of showing an empty table.
export function useClampPage(totalPages: number | undefined, page: number, setPage: (page: number) => void) {
  useEffect(() => {
    if (totalPages !== undefined && totalPages > 0 && page >= totalPages) setPage(totalPages - 1)
  }, [totalPages, page, setPage])
}
