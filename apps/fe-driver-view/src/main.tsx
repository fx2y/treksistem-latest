import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 404 || error?.response?.status === 401 || error?.response?.status === 403) {
          return false; // Don't retry on these auth/not found errors
        }
        return failureCount < 3; // Retry 3 times for other errors
      },
      // Mobile-optimized settings
      refetchOnWindowFocus: false, // Avoid refetching when switching apps on mobile
      refetchOnMount: 'always', // Always refetch when component mounts for fresh data
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