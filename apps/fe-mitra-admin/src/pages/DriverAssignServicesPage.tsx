import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { 
  fetchMitraDriverById, 
  fetchAssignedServicesForDriver, 
  assignServiceToDriver, 
  unassignServiceFromDriver 
} from '@/services/mitraDriverApi';
import { fetchMitraServices } from '@/services/mitraServiceApi';
import { toast } from 'sonner';

const DriverAssignServicesPage: React.FC = () => {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedServiceIds, setSelectedServiceIds] = React.useState<Set<string>>(new Set());
  const [initialServiceIds, setInitialServiceIds] = React.useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = React.useState(false);

  // Fetch driver details
  const {
    data: driver,
    isLoading: isDriverLoading,
    error: driverError,
  } = useQuery({
    queryKey: ['mitraDriver', driverId],
    queryFn: () => fetchMitraDriverById(driverId!),
    enabled: !!driverId,
  });

  // Fetch all available services
  const {
    data: allServices = [],
    isLoading: isServicesLoading,
    error: servicesError,
  } = useQuery({
    queryKey: ['mitraServices'],
    queryFn: fetchMitraServices,
  });

  // Fetch currently assigned services
  const {
    data: assignedServices = [],
    isLoading: isAssignedServicesLoading,
    error: assignedServicesError,
  } = useQuery({
    queryKey: ['assignedServices', driverId],
    queryFn: () => fetchAssignedServicesForDriver(driverId!),
    enabled: !!driverId,
  });

  // Initialize selected services when data loads
  React.useEffect(() => {
    if (assignedServices.length > 0) {
      const assignedIds = new Set(assignedServices.map(service => service.serviceId));
      setSelectedServiceIds(assignedIds);
      setInitialServiceIds(assignedIds);
    }
  }, [assignedServices]);

  // Handle errors
  React.useEffect(() => {
    if (driverError) {
      console.error('Failed to fetch driver:', driverError);
      toast.error('Failed to load driver details.');
    }
    if (servicesError) {
      console.error('Failed to fetch services:', servicesError);
      toast.error('Failed to load services.');
    }
    if (assignedServicesError) {
      console.error('Failed to fetch assigned services:', assignedServicesError);
      toast.error('Failed to load assigned services.');
    }
  }, [driverError, servicesError, assignedServicesError]);

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServiceIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const handleSaveAssignments = async () => {
    if (!driverId) return;

    setIsLoading(true);
    try {
      // Determine which services to assign and unassign
      const servicesToAssign = Array.from(selectedServiceIds).filter(id => !initialServiceIds.has(id));
      const servicesToUnassign = Array.from(initialServiceIds).filter(id => !selectedServiceIds.has(id));

      // Execute assignments and unassignments
      const assignPromises = servicesToAssign.map(serviceId => assignServiceToDriver(driverId, serviceId));
      const unassignPromises = servicesToUnassign.map(serviceId => unassignServiceFromDriver(driverId, serviceId));

      await Promise.all([...assignPromises, ...unassignPromises]);

      // Update the initial state to reflect the new assignments
      setInitialServiceIds(new Set(selectedServiceIds));

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['assignedServices', driverId] });
      queryClient.invalidateQueries({ queryKey: ['mitraDriver', driverId] });

      toast.success('Service assignments updated successfully!');
    } catch (error) {
      console.error('Failed to update service assignments:', error);
      toast.error('Failed to update service assignments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = () => {
    if (selectedServiceIds.size !== initialServiceIds.size) return true;
    for (const id of selectedServiceIds) {
      if (!initialServiceIds.has(id)) return true;
    }
    return false;
  };

  if (driverError || servicesError || assignedServicesError) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/drivers')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Drivers
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-lg font-medium text-destructive mb-2">Failed to load data</p>
                <p className="text-sm text-muted-foreground mb-4">
                  There was an error loading the required data. Please try again.
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

  if (isDriverLoading || isServicesLoading || isAssignedServicesLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/drivers')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Drivers
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading data...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!driver) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/drivers')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Drivers
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-lg font-medium text-muted-foreground mb-2">Driver not found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  The driver you're looking for doesn't exist or has been removed.
                </p>
                <Button asChild>
                  <Link to="/drivers">Back to Drivers</Link>
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/drivers')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Drivers
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Manage Service Assignments</h1>
              <p className="text-muted-foreground mt-1">
                Assign services to <span className="font-medium">{driver.name}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/drivers/${driver.id}`}>
                View Driver Details
              </Link>
            </Button>
            <Button 
              onClick={handleSaveAssignments} 
              disabled={!hasChanges() || isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Assignments
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Driver Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Driver Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-sm mt-1">{driver.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Identifier</label>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded mt-1">{driver.identifier}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant={driver.isActive ? "default" : "secondary"}>
                    {driver.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              {driver.parsedConfigJson?.vehicle && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Vehicle</label>
                  <p className="text-sm mt-1">
                    {driver.parsedConfigJson.vehicle.type}
                    {driver.parsedConfigJson.vehicle.brand && ` - ${driver.parsedConfigJson.vehicle.brand}`}
                    {driver.parsedConfigJson.vehicle.plateNumber && ` (${driver.parsedConfigJson.vehicle.plateNumber})`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Services Available</span>
                  <span className="text-sm font-medium">{allServices.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Currently Selected</span>
                  <span className="text-sm font-medium">{selectedServiceIds.size}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Changes Made</span>
                  <span className="text-sm font-medium">
                    {hasChanges() ? (
                      <Badge variant="outline" className="text-xs">
                        <XCircle className="mr-1 h-3 w-3" />
                        Unsaved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Saved
                      </Badge>
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Available Services</CardTitle>
            <CardDescription>
              Select the services this driver should be assigned to handle
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allServices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-2">No services available</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Create some services first before assigning them to drivers.
                </p>
                <Button size="sm" asChild>
                  <Link to="/services/new">Create First Service</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {allServices.map((service) => (
                  <div
                    key={service.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedServiceIds.has(service.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleServiceToggle(service.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedServiceIds.has(service.id)}
                        onChange={() => handleServiceToggle(service.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium truncate">{service.name}</h4>
                          <Badge variant={service.isActive ? "default" : "secondary"} className="text-xs ml-2">
                            {service.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{service.serviceType}</p>
                        {service.parsedConfigJson?.serviceTypeAlias && (
                          <p className="text-xs text-muted-foreground">
                            {service.parsedConfigJson.serviceTypeAlias}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Button variant="outline" onClick={() => navigate(`/drivers/${driver.id}`)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveAssignments} 
            disabled={!hasChanges() || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Assignments
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default DriverAssignServicesPage; 