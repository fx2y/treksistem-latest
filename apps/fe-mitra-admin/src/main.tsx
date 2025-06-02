import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ApiError } from './services/api'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on client errors (4xx) or auth errors
        if (error instanceof ApiError) {
          if (error.isClientError() || error.isAuthError()) {
            return false;
          }
        }
        
        // Don't retry on specific HTTP status codes
        if (error?.response?.status === 404 || 
            error?.response?.status === 401 || 
            error?.response?.status === 403) {
          return false;
        }
        
        // Retry up to 3 times for server errors and network issues
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Generally don't retry mutations to avoid duplicate operations
        // Only retry on network errors
        if (error instanceof ApiError && error.status === 0) {
          return failureCount < 2;
        }
        return false;
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
) 