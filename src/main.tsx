import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HashRouter } from 'react-router-dom'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import './styles/tokens.css'
import './styles/global.css'
import { App } from './App'
import { ApiStatusProvider } from './api/ApiStatusProvider'
import { AuthProvider } from './auth/AuthProvider'
import { NoticeProvider } from './notices/NoticeProvider'
import { ThemeProvider } from './theme/ThemeProvider'

// Errors are shown by each screen, so failed requests are not retried silently.
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false, staleTime: 15_000 } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <NoticeProvider>
        <ApiStatusProvider>
          <AuthProvider>
            <QueryClientProvider client={queryClient}>
              <HashRouter>
                <App />
              </HashRouter>
            </QueryClientProvider>
          </AuthProvider>
        </ApiStatusProvider>
      </NoticeProvider>
    </ThemeProvider>
  </StrictMode>,
)
