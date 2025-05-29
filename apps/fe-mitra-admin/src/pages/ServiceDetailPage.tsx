import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Loader2, Settings } from 'lucide-react';
import { fetchMitraServiceById, type ApiService } from '@/services/mitraServiceApi';

export default function ServiceDetailPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  
  const { 
    data: service, 
    isLoading, 
    error 
  } = useQuery<ApiService, Error>({
    queryKey: ['mitraService', serviceId],
    queryFn: () => fetchMitraServiceById(serviceId!),
    enabled: !!serviceId,
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderConfigValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">Not set</span>;
    }

    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Yes' : 'No'}
        </Badge>
      );
    }

    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return <span className="text-muted-foreground italic">Empty array</span>;
        }
        return (
          <div className="space-y-2">
            {value.map((item, index) => (
              <div key={index} className="bg-muted p-3 rounded-md">
                {typeof item === 'object' ? (
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(item, null, 2)}
                  </pre>
                ) : (
                  <span className="text-sm">{String(item)}</span>
                )}
              </div>
            ))}
          </div>
        );
      }
      return (
        <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    if (typeof value === 'number') {
      return <span className="font-mono">{value.toLocaleString('id-ID')}</span>;
    }

    return <span>{String(value)}</span>;
  };

  const renderConfigSection = (title: string, config: Record<string, any> | undefined) => {
    if (!config || Object.keys(config).length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground italic">No configuration available</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(config).map(([key, value]) => (
              <div key={key} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="font-medium text-sm">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </div>
                <div className="md:col-span-2">
                  {renderConfigValue(value)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading service details...</p>
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
            <p className="text-destructive mb-4">Error loading service: {error.message}</p>
            <div className="space-x-2">
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Button variant="outline" onClick={() => navigate('/services')}>
                Back to Services
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!service) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Service not found</p>
            <Button onClick={() => navigate('/services')}>
              Back to Services
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
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/services')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Services
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{service.name}</h1>
              <p className="text-muted-foreground mt-1">
                Service Details • {service.serviceType}
              </p>
            </div>
          </div>
          <Button 
            onClick={() => navigate(`/services/${serviceId}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Service
          </Button>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium">Service ID:</span>
                  <p className="font-mono text-sm text-muted-foreground">{service.id}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Service Name:</span>
                  <p className="text-lg font-semibold">{service.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Service Type:</span>
                  <p>{service.serviceType}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Status:</span>
                  <div className="mt-1">
                    <Badge variant={service.isActive ? 'default' : 'secondary'}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium">Created:</span>
                  <p>{formatDate(service.createdAt)}</p>
                </div>
                {service.updatedAt && (
                  <div>
                    <span className="text-sm font-medium">Last Updated:</span>
                    <p>{formatDate(service.updatedAt)}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium">Mitra ID:</span>
                  <p className="font-mono text-sm text-muted-foreground">{service.mitraId}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Configuration */}
        {service.parsedConfigJson && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Service Configuration</h2>
            
            {/* Core Configuration */}
            {renderConfigSection('Core Settings', {
              serviceTypeAlias: service.parsedConfigJson.serviceTypeAlias,
              modelBisnis: service.parsedConfigJson.modelBisnis,
              angkutanUtama: service.parsedConfigJson.angkutanUtama,
              driverGenderConstraint: service.parsedConfigJson.driverGenderConstraint,
              modelRute: service.parsedConfigJson.modelRute,
              privasiMassal: service.parsedConfigJson.privasiMassal,
              waktuLayananDefault: service.parsedConfigJson.waktuLayananDefault,
              penanggungJawabOrder: service.parsedConfigJson.penanggungJawabOrder,
              alurLayanan: service.parsedConfigJson.alurLayanan,
              isBarangPentingDefault: service.parsedConfigJson.isBarangPentingDefault,
            })}

            {/* Order Models */}
            {renderConfigSection('Allowed Order Models', {
              allowedModelOrder: service.parsedConfigJson.allowedModelOrder,
            })}

            {/* Pricing Configuration */}
            {renderConfigSection('Pricing Configuration', service.parsedConfigJson.pricing)}

            {/* Talangan Feature */}
            {renderConfigSection('Talangan (Advance Payment)', service.parsedConfigJson.fiturTalangan)}

            {/* Coverage Area */}
            {renderConfigSection('Service Coverage', service.parsedConfigJson.jangkauanLayanan)}

            {/* Allowed Cargo Types */}
            {service.parsedConfigJson.allowedMuatan && service.parsedConfigJson.allowedMuatan.length > 0 && 
              renderConfigSection('Allowed Cargo Types', { allowedMuatan: service.parsedConfigJson.allowedMuatan })}

            {/* Available Facilities */}
            {service.parsedConfigJson.availableFasilitas && service.parsedConfigJson.availableFasilitas.length > 0 && 
              renderConfigSection('Available Facilities', { availableFasilitas: service.parsedConfigJson.availableFasilitas })}

            {/* Type-Specific Configuration */}
            {service.parsedConfigJson.typeSpecificConfig && 
              renderConfigSection('Type-Specific Configuration', service.parsedConfigJson.typeSpecificConfig)}
          </div>
        )}
      </div>
    </Layout>
  );
} 