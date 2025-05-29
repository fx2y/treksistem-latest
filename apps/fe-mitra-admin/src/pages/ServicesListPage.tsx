import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PlusCircle, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import { fetchMitraServices, type ApiService } from '@/services/mitraServiceApi';

export default function ServicesListPage() {
  const navigate = useNavigate();
  
  const { 
    data: services, 
    isLoading, 
    error 
  } = useQuery<ApiService[], Error>({
    queryKey: ['mitraServices'],
    queryFn: fetchMitraServices,
  });

  const handleViewService = (serviceId: string) => {
    navigate(`/services/${serviceId}`);
  };

  const handleEditService = (serviceId: string) => {
    // TODO: Navigate to edit page when implemented
    navigate(`/services/${serviceId}/edit`);
  };

  const handleDeleteService = (serviceId: string) => {
    // TODO: Implement delete confirmation dialog
    console.log('Delete service:', serviceId);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateId = (id: string) => {
    return `${id.slice(0, 8)}...`;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading services...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive mb-4">Error loading services: {error.message}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manage Your Services</h1>
            <p className="text-muted-foreground mt-1">
              Create and configure logistics services for your business
            </p>
          </div>
          <Button onClick={() => navigate('/services/new')} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Create New Service
          </Button>
        </div>

        {/* Services Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Services</CardTitle>
          </CardHeader>
          <CardContent>
            {!services || services.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  <PlusCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No services found</p>
                  <p className="text-sm">Create your first service to get started</p>
                </div>
                <Button onClick={() => navigate('/services/new')} className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Create New Service
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Service Name</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Transport Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-mono text-sm">
                          {truncateId(service.id)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {service.name}
                        </TableCell>
                        <TableCell>
                          {service.serviceType}
                        </TableCell>
                        <TableCell>
                          {service.parsedConfigJson?.angkutanUtama || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={service.isActive ? 'default' : 'secondary'}>
                            {service.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(service.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewService(service.id)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditService(service.id)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteService(service.id)}
                              className="flex items-center gap-1 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
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
} 