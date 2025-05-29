import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

// Mock data interface - replace with actual types from shared-types
interface DashboardStats {
  totalServices: number;
  activeDrivers: number;
  totalVehicles: number;
  todayOrders: number;
}

export function DashboardPage() {
  const { mitraProfile, logout } = useAuthStore();

  // Mock stats for now - in the future this would come from an API
  const mockStats: DashboardStats = {
    totalServices: 12,
    activeDrivers: 8,
    totalVehicles: 15,
    todayOrders: 24,
  };

  const handleLogout = () => {
    logout();
    // In production, this would redirect to CF Access logout URL:
    // window.location.href = 'https://<your-team-name>.cloudflareaccess.com/cdn-cgi/access/logout';
    alert("Conceptual logout. For actual CF Access logout, you'd redirect to the CF logout URL.");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            {mitraProfile && (
              <p className="text-muted-foreground mt-1">
                Welcome back, <span className="font-medium">{mitraProfile.name}</span>
              </p>
            )}
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout (Conceptual)
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link to="/services" className="block">
              <CardHeader>
                <CardTitle className="text-lg">Manage Services</CardTitle>
                <CardDescription>
                  Create and configure your logistics services
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link to="/drivers" className="block">
              <CardHeader>
                <CardTitle className="text-lg">Manage Drivers</CardTitle>
                <CardDescription>
                  Add drivers and assign them to services
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link to="/orders" className="block">
              <CardHeader>
                <CardTitle className="text-lg">View Orders</CardTitle>
                <CardDescription>
                  Monitor and manage incoming orders
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockStats.totalServices}
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
                {mockStats.activeDrivers}
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
                {mockStats.totalVehicles}
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
                {mockStats.todayOrders}
              </div>
              <p className="text-xs text-muted-foreground">
                +12% from yesterday
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Mitra Profile Info */}
        {mitraProfile && (
          <Card>
            <CardHeader>
              <CardTitle>Mitra Profile</CardTitle>
              <CardDescription>
                Your business information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Business Name: </span>
                  <span className="text-sm text-muted-foreground">{mitraProfile.name}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">Mitra ID: </span>
                  <span className="text-sm text-muted-foreground font-mono">{mitraProfile.id}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">Owner Email: </span>
                  <span className="text-sm text-muted-foreground">{mitraProfile.ownerUserId}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">Created: </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(mitraProfile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
} 