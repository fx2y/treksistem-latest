import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Settings, Loader2, User, Car, Clock, MapPin } from 'lucide-react';
import { fetchMitraDriverById, fetchAssignedServicesForDriver } from '@/services/mitraDriverApi';
import { toast } from 'sonner';

const DriverDetailPage: React.FC = () => {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();

  const {
    data: driver,
    isLoading: isDriverLoading,
    error: driverError,
  } = useQuery({
    queryKey: ['mitraDriver', driverId],
    queryFn: () => fetchMitraDriverById(driverId!),
    enabled: !!driverId,
  });

  const {
    data: assignedServices = [],
    isLoading: isServicesLoading,
    error: servicesError,
  } = useQuery({
    queryKey: ['assignedServices', driverId],
    queryFn: () => fetchAssignedServicesForDriver(driverId!),
    enabled: !!driverId,
  });

  React.useEffect(() => {
    if (driverError) {
      console.error('Failed to fetch driver:', driverError);
      toast.error('Failed to load driver details. Please try again.');
    }
    if (servicesError) {
      console.error('Failed to fetch assigned services:', servicesError);
      toast.error('Failed to load assigned services.');
    }
  }, [driverError, servicesError]);

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatOperatingHours = (operatingHours: any): string => {
    if (!operatingHours) return 'Not specified';
    
    if (operatingHours.is24Hours) return '24/7';
    
    const days = operatingHours.availableDays?.join(', ') || 'Not specified';
    const timeRange = operatingHours.startTime && operatingHours.endTime 
      ? `${operatingHours.startTime} - ${operatingHours.endTime}`
      : 'Time not specified';
    
    return `${days} (${timeRange})`;
  };

  if (driverError) {
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
                <p className="text-lg font-medium text-destructive mb-2">Failed to load driver</p>
                <p className="text-sm text-muted-foreground mb-4">
                  There was an error loading the driver details. Please try again.
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

  if (isDriverLoading) {
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
                <span className="ml-2 text-muted-foreground">Loading driver details...</span>
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
              <h1 className="text-3xl font-bold text-foreground">{driver.name}</h1>
              <p className="text-muted-foreground mt-1">Driver Details</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/drivers/${driver.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Driver
              </Link>
            </Button>
            <Button asChild>
              <Link to={`/drivers/${driver.id}/assign-services`}>
                <Settings className="mr-2 h-4 w-4" />
                Manage Services
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Identifier</label>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded mt-1">{driver.identifier}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-sm mt-1">{driver.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant={driver.isActive ? "default" : "secondary"}>
                    {driver.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm mt-1">{formatDate(driver.createdAt)}</p>
              </div>
              {driver.updatedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm mt-1">{formatDate(driver.updatedAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {driver.parsedConfigJson?.vehicle ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Vehicle Type</label>
                    <p className="text-sm mt-1">{driver.parsedConfigJson.vehicle.type}</p>
                  </div>
                  {driver.parsedConfigJson.vehicle.brand && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Brand</label>
                      <p className="text-sm mt-1">{driver.parsedConfigJson.vehicle.brand}</p>
                    </div>
                  )}
                  {driver.parsedConfigJson.vehicle.model && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Model</label>
                      <p className="text-sm mt-1">{driver.parsedConfigJson.vehicle.model}</p>
                    </div>
                  )}
                  {driver.parsedConfigJson.vehicle.year && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Year</label>
                      <p className="text-sm mt-1">{driver.parsedConfigJson.vehicle.year}</p>
                    </div>
                  )}
                  {driver.parsedConfigJson.vehicle.plateNumber && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Plate Number</label>
                      <p className="text-sm font-mono bg-muted px-2 py-1 rounded mt-1">
                        {driver.parsedConfigJson.vehicle.plateNumber}
                      </p>
                    </div>
                  )}
                  {driver.parsedConfigJson.vehicle.color && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Color</label>
                      <p className="text-sm mt-1">{driver.parsedConfigJson.vehicle.color}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No vehicle information available</p>
              )}
            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Operating Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{formatOperatingHours(driver.parsedConfigJson?.operatingHours)}</p>
            </CardContent>
          </Card>

          {/* Assigned Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Assigned Services
              </CardTitle>
              <CardDescription>
                Services this driver is assigned to handle
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isServicesLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading services...</span>
                </div>
              ) : assignedServices.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">No services assigned</p>
                  <Button size="sm" asChild>
                    <Link to={`/drivers/${driver.id}/assign-services`}>
                      Assign Services
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {assignedServices.map((service) => (
                    <div key={service.serviceId} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium">{service.serviceName}</p>
                        <p className="text-xs text-muted-foreground">{service.serviceType}</p>
                      </div>
                      <Badge variant={service.isActive ? "default" : "secondary"} className="text-xs">
                        {service.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Capabilities and Equipment */}
        {(driver.parsedConfigJson?.capabilities?.length || driver.parsedConfigJson?.equipment?.length || driver.parsedConfigJson?.certifications?.length) && (
          <Card>
            <CardHeader>
              <CardTitle>Capabilities & Equipment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {driver.parsedConfigJson?.capabilities?.length && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Capabilities</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {driver.parsedConfigJson.capabilities.map((capability, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {driver.parsedConfigJson?.equipment?.length && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Equipment</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {driver.parsedConfigJson.equipment.map((item, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {driver.parsedConfigJson?.certifications?.length && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Certifications</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {driver.parsedConfigJson.certifications.map((cert, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default DriverDetailPage; 