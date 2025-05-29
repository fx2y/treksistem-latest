import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Eye, Edit, Settings, Loader2 } from 'lucide-react';
import { fetchMitraDrivers, ApiDriver } from '@/services/mitraDriverApi';
import { toast } from 'sonner';

const DriversListPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    data: drivers = [],
    isLoading,
    error,
  } = useQuery<ApiDriver[], Error>({
    queryKey: ['mitraDrivers'],
    queryFn: fetchMitraDrivers,
  });

  // Handle errors with useEffect instead of onError
  React.useEffect(() => {
    if (error) {
      console.error('Failed to fetch drivers:', error);
      toast.error('Failed to load drivers. Please try again.');
    }
  }, [error]);

  const formatConfigSummary = (driver: ApiDriver): string => {
    if (!driver.parsedConfigJson?.vehicle) {
      return 'No vehicle info';
    }
    
    const vehicle = driver.parsedConfigJson.vehicle;
    const parts = [vehicle.type];
    if (vehicle.brand) parts.push(vehicle.brand);
    if (vehicle.plateNumber) parts.push(`(${vehicle.plateNumber})`);
    
    return parts.join(' ');
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (error) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Drivers</h1>
              <p className="text-muted-foreground mt-1">
                Manage your drivers and their service assignments
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-lg font-medium text-destructive mb-2">Failed to load drivers</p>
                <p className="text-sm text-muted-foreground mb-4">
                  There was an error loading your drivers. Please try refreshing the page.
                </p>
                <Button onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Drivers</h1>
            <p className="text-muted-foreground mt-1">
              Manage your drivers and their service assignments
            </p>
          </div>
          <Button asChild>
            <Link to="/drivers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add New Driver
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Drivers</CardTitle>
            <CardDescription>
              {drivers.length === 0 
                ? "No drivers found. Add your first driver to get started."
                : `${drivers.length} driver${drivers.length === 1 ? '' : 's'} total`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading drivers...</span>
              </div>
            ) : drivers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-lg font-medium text-muted-foreground mb-2">No drivers yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your first driver to start managing your logistics operations.
                </p>
                <Button asChild>
                  <Link to="/drivers/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Driver
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Identifier</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Vehicle Info</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drivers.map((driver: ApiDriver) => (
                      <TableRow key={driver.id}>
                        <TableCell className="font-medium">
                          {driver.identifier}
                        </TableCell>
                        <TableCell>
                          {driver.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatConfigSummary(driver)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={driver.isActive ? "default" : "secondary"}>
                            {driver.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(driver.createdAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/drivers/${driver.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/drivers/${driver.id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Driver
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/drivers/${driver.id}/assign-services`)}>
                                <Settings className="mr-2 h-4 w-4" />
                                Manage Services
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DriversListPage; 