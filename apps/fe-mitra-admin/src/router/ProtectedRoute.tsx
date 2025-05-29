import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  // Add any role/permission based props if needed later
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = () => {
  const { isAuthenticated, isLoading, error } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    // Global loading spinner
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading authentication status...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // If CF Access is protecting the entire application domain, this state might be less common
    // as user would be redirected by CF Access itself.
    console.log('ProtectedRoute: Not authenticated, showing authentication required message.');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-foreground mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">
            This application is protected by Cloudflare Access. If you are not redirected automatically, 
            please ensure you have access rights.
          </p>
          <Button 
            onClick={() => window.location.href = window.location.origin}
            className="mt-4"
          >
            Access Protected App
          </Button>
        </div>
      </div>
    );
  }
  
  if (error === 'ProfileNotFound' && location.pathname !== '/create-profile') {
    // Authenticated by CF Access, but no Treksistem profile yet
    return <Navigate to="/create-profile" replace />;
  }
  
  if (error && error !== 'ProfileNotFound') {
    // Some other auth error after being authenticated by CF
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-destructive mb-4">Authentication Error</h1>
          <p className="text-muted-foreground mb-4">Error during authentication: {error}</p>
          <Button 
            onClick={() => useAuthStore.getState().logout()}
            variant="outline"
          >
            Logout (Conceptual)
          </Button>
        </div>
      </div>
    );
  }

  // If authenticated and has a profile (or is going to create one)
  return <Outlet />; // Render the child route
};

export default ProtectedRoute; 