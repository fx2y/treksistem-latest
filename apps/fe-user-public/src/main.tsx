import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'
import App from './App.tsx'

interface ApiError {
  response?: {
    status: number;
  };
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (_failureCount: number, _error: unknown) => {
        const apiError = _error as ApiError;
        const status = apiError?.response?.status;
        
        // Don't retry on client errors (4xx)
        if (status && status >= 400 && status < 500) {
          return false;
        }
        
        // Don't retry on specific HTTP status codes
        if (status === 404 || status === 401 || status === 403) {
          return false;
        }
        
        // Retry up to 2 times for server errors (less aggressive for public users)
        return _failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      refetchOnWindowFocus: false, // Avoid unnecessary refetches for public users
    },
    mutations: {
      retry: (_failureCount: number, _error: unknown) => {
        // Don't retry mutations for public users to avoid confusion
        return false;
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)
