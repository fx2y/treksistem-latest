import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes (shorter for real-time driver updates)
      retry: (failureCount, error: any) => {
        // Don't retry on client errors (4xx) or auth errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
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
      // Mobile-optimized settings
      refetchOnWindowFocus: false, // Avoid refetching when switching apps on mobile
      refetchOnMount: 'always', // Always refetch when component mounts for fresh data
      refetchOnReconnect: true, // Refetch when network reconnects
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Retry network errors for critical driver operations
        if (error?.response?.status === 0 || !error?.response) {
          return failureCount < 2;
        }
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000), // Faster retry for mobile
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