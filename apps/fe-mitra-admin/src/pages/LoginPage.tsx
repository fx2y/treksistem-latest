import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Construct the CF Access login URL. This might be just your app's domain if it's fully protected.
  // Or it could be a specific path if CF Access is configured that way.
  // For apps not fully behind Access but using it for specific paths, you might need an explicit login trigger.
  // const cfAccessLoginUrl = `https://<your-team-name>.cloudflareaccess.com/cdn-cgi/access/sso/login/<your-app-audience-tag>`;
  // This is highly dependent on your CF Access application setup. Often, simply navigating to the protected app URL triggers login.

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Login Required</CardTitle>
          <CardDescription>
            This application is protected by Cloudflare Access
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            If you are not automatically redirected, please ensure you have access rights.
          </p>
          
          <div className="space-y-2">
            <Button 
              onClick={() => window.location.href = window.location.origin}
              className="w-full"
            >
              Access Protected App
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Clicking this button will attempt to access the application, 
              which may trigger the Cloudflare Access login flow.
            </p>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Need access? Contact your administrator to be added to the access policy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage; 