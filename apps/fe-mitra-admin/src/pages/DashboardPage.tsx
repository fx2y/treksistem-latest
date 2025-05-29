import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useApiQuery } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data interface - replace with actual types from shared-types
interface DashboardStats {
  totalServices: number;
  activeDrivers: number;
  totalVehicles: number;
  todayOrders: number;
}

export function DashboardPage() {
  const { user, setUser } = useAuthStore();

  // Example of using the API hook - this would call a real endpoint
  const { data: stats, isLoading, error } = useApiQuery<DashboardStats>(
    ['dashboard', 'stats'],
    '/dashboard/stats',
    { 
      enabled: false, // Disabled for now since we don't have a real API
      onError: (error) => {
        console.error('Failed to load dashboard stats:', error);
      }
    }
  );

  // Mock user for demonstration
  const handleMockLogin = () => {
    setUser({
      id: '1',
      email: 'admin@treksistem.com',
      name: 'Admin User',
      role: 'admin'
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          {!user && (
            <Button onClick={handleMockLogin}>
              Mock Login
            </Button>
          )}
        </div>

        {user && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : stats?.totalServices ?? '12'}
                </div>
                <p className="text-xs text-muted-foreground">
                  +2 from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Drivers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : stats?.activeDrivers ?? '8'}
                </div>
                <p className="text-xs text-muted-foreground">
                  +1 from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Vehicles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : stats?.totalVehicles ?? '15'}
                </div>
                <p className="text-xs text-muted-foreground">
                  +3 from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Today's Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : stats?.todayOrders ?? '24'}
                </div>
                <p className="text-xs text-muted-foreground">
                  +12% from yesterday
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {!user && (
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Mitra Admin Portal</CardTitle>
              <CardDescription>
                Please log in to access the dashboard and manage your services.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                In production, authentication will be handled by Cloudflare Access.
                For now, you can use the "Mock Login" button above to simulate authentication.
              </p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error Loading Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {error.message}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
} 