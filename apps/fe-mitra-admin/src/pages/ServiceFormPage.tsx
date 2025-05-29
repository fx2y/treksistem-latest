import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { CreateServicePayloadSchema, CreateServicePayload } from '@/types/service';
import { fetchMitraServiceById, createMitraService, updateMitraService } from '@/services/mitraServiceApi';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';

import { BasicServiceInfoSection } from '@/components/service-form/BasicServiceInfoSection';
import { ServiceConfigSection } from '@/components/service-form/ServiceConfigSection';

interface ServiceFormPageProps {
  mode: 'create' | 'edit';
}

const ServiceFormPage: React.FC<ServiceFormPageProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { serviceId } = useParams<{ serviceId: string }>();
  const queryClient = useQueryClient();

  // Fetch existing service data for edit mode
  const { data: existingService, isLoading: isLoadingService } = useQuery({
    queryKey: ['mitraService', serviceId],
    queryFn: () => fetchMitraServiceById(serviceId!),
    enabled: mode === 'edit' && !!serviceId,
  });

  // Form setup with default values
  const form = useForm<CreateServicePayload>({
    resolver: zodResolver(CreateServicePayloadSchema),
    defaultValues: {
      name: '',
      serviceTypeKey: '',
      isActive: true,
      configJson: {
        serviceTypeAlias: '',
        modelBisnis: 'USAHA_SENDIRI',
        angkutanUtama: '',
        driverGenderConstraint: 'SEMUA',
        modelRute: 'DYNAMIC_P2P',
        privasiMassal: 'PRIVATE_SINGLE_ORDER',
        waktuLayananDefault: 'EXPRESS_NOW',
        allowedModelOrder: ['PANGGIL_KE_ORDERER'],
        penanggungJawabOrder: 'KETEMU_LANGSUNG',
        fiturTalangan: {
          enabled: false,
        },
        alurLayanan: 'DIRECT_PICKUP_DELIVER',
        isBarangPentingDefault: false,
        jangkauanLayanan: {},
        pricing: {
          biayaAdminPerOrder: 0,
          modelHargaJarak: 'PER_KM',
          biayaPerKm: 0,
        },
        allowedMuatan: [],
        availableFasilitas: [],
      },
    },
  });

  // Reset form with existing service data when editing
  useEffect(() => {
    if (mode === 'edit' && existingService) {
      const formData: CreateServicePayload = {
        name: existingService.name,
        serviceTypeKey: existingService.serviceType,
        isActive: existingService.isActive,
        configJson: existingService.parsedConfigJson || existingService.configJson,
      };
      form.reset(formData);
    }
  }, [existingService, form, mode]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createMitraService,
    onSuccess: (data) => {
      toast.success('Service created successfully!');
      queryClient.invalidateQueries({ queryKey: ['mitraServices'] });
      navigate(`/services/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create service: ${error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateServicePayload>) => updateMitraService(serviceId!, data),
    onSuccess: (data) => {
      toast.success('Service updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['mitraServices'] });
      queryClient.invalidateQueries({ queryKey: ['mitraService', serviceId] });
      navigate(`/services/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to update service: ${error.message}`);
    },
  });

  const onSubmit = (data: CreateServicePayload) => {
    if (mode === 'create') {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isFormLoading = mode === 'edit' && isLoadingService;

  if (isFormLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg font-medium">Loading service data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {mode === 'create' ? 'Create New Service' : 'Edit Service'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {mode === 'create' 
            ? 'Configure a new service for your logistics business'
            : 'Update your service configuration'
          }
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Service Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Configure the basic details of your service
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BasicServiceInfoSection control={form.control} />
            </CardContent>
          </Card>

          {/* Service Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Service Configuration</CardTitle>
              <CardDescription>
                Define the detailed configuration for your service
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceConfigSection control={form.control} watch={form.watch} />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/services')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'create' ? 'Create Service' : 'Update Service'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ServiceFormPage; 