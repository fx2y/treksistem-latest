import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { CreateDriverPayloadSchema, CreateDriverPayload } from '@/types/driver';
import { createMitraDriver, updateMitraDriver, fetchMitraDriverById } from '@/services/mitraDriverApi';
import { toast } from 'sonner';

interface DriverFormPageProps {
  mode: 'create' | 'edit';
}

const VEHICLE_TYPES = [
  'Mobil',
  'Motor',
  'Pickup',
  'Ambulance',
  'Truk',
  'Van',
  'Bus',
  'Sepeda',
  'Lainnya'
];

const DAYS_OF_WEEK: Array<{ value: 'SENIN' | 'SELASA' | 'RABU' | 'KAMIS' | 'JUMAT' | 'SABTU' | 'MINGGU'; label: string }> = [
  { value: 'SENIN', label: 'Senin' },
  { value: 'SELASA', label: 'Selasa' },
  { value: 'RABU', label: 'Rabu' },
  { value: 'KAMIS', label: 'Kamis' },
  { value: 'JUMAT', label: 'Jumat' },
  { value: 'SABTU', label: 'Sabtu' },
  { value: 'MINGGU', label: 'Minggu' },
];

const DriverFormPage: React.FC<DriverFormPageProps> = ({ mode }) => {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<CreateDriverPayload>({
    resolver: zodResolver(CreateDriverPayloadSchema),
    defaultValues: {
      identifier: '',
      name: '',
      isActive: true,
      configJson: {
        vehicle: {
          type: '',
          brand: '',
          model: '',
          year: undefined,
          plateNumber: '',
          color: '',
        },
        capabilities: [],
        equipment: [],
        certifications: [],
        operatingHours: {
          availableDays: [],
          startTime: '',
          endTime: '',
          is24Hours: false,
        },
      },
    },
  });

  // Fetch existing driver data for edit mode
  const { data: existingDriver, isLoading: isLoadingDriver } = useQuery({
    queryKey: ['mitraDriver', driverId],
    queryFn: () => fetchMitraDriverById(driverId!),
    enabled: mode === 'edit' && !!driverId,
  });

  // Reset form with existing data when loaded
  React.useEffect(() => {
    if (existingDriver && mode === 'edit') {
      form.reset({
        identifier: existingDriver.identifier,
        name: existingDriver.name,
        isActive: existingDriver.isActive,
        configJson: existingDriver.parsedConfigJson || {
          vehicle: {
            type: '',
            brand: '',
            model: '',
            year: undefined,
            plateNumber: '',
            color: '',
          },
          capabilities: [],
          equipment: [],
          certifications: [],
          operatingHours: {
            availableDays: [],
            startTime: '',
            endTime: '',
            is24Hours: false,
          },
        },
      });
    }
  }, [existingDriver, mode, form]);

  const createMutation = useMutation({
    mutationFn: createMitraDriver,
    onSuccess: (data) => {
      toast.success('Driver created successfully!');
      queryClient.invalidateQueries({ queryKey: ['mitraDrivers'] });
      navigate(`/drivers/${data.id}`);
    },
    onError: (error: any) => {
      console.error('Failed to create driver:', error);
      toast.error('Failed to create driver. Please try again.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ driverId, payload }: { driverId: string; payload: Partial<CreateDriverPayload> }) =>
      updateMitraDriver(driverId, payload),
    onSuccess: (data) => {
      toast.success('Driver updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['mitraDrivers'] });
      queryClient.invalidateQueries({ queryKey: ['mitraDriver', driverId] });
      navigate(`/drivers/${data.id}`);
    },
    onError: (error: any) => {
      console.error('Failed to update driver:', error);
      toast.error('Failed to update driver. Please try again.');
    },
  });

  const onSubmit = (data: CreateDriverPayload) => {
    // Clean up empty fields and ensure required fields are present
    const cleanedData = {
      ...data,
      configJson: {
        ...data.configJson,
        vehicle: {
          ...data.configJson?.vehicle,
          type: data.configJson?.vehicle?.type || '', // Ensure type is always a string
          year: data.configJson?.vehicle?.year || undefined,
        },
        capabilities: data.configJson?.capabilities?.filter(Boolean) || [],
        equipment: data.configJson?.equipment?.filter(Boolean) || [],
        certifications: data.configJson?.certifications?.filter(Boolean) || [],
      },
    };

    if (mode === 'create') {
      createMutation.mutate(cleanedData);
    } else if (driverId) {
      updateMutation.mutate({ driverId, payload: cleanedData });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (mode === 'edit' && isLoadingDriver) {
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
                <span className="ml-2 text-muted-foreground">Loading driver data...</span>
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/drivers')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Drivers
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {mode === 'create' ? 'Add New Driver' : 'Edit Driver'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {mode === 'create' 
                ? 'Create a new driver profile with vehicle and capability information'
                : 'Update driver information and configuration'
              }
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Driver identification and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver Identifier *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., email, phone, or unique ID" {...field} />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for the driver (email, phone number, or custom ID)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Driver's full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active Driver</FormLabel>
                        <FormDescription>
                          Whether this driver is currently active and available for assignments
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Vehicle Information */}
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Information</CardTitle>
                <CardDescription>
                  Details about the driver's vehicle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="configJson.vehicle.type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VEHICLE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="configJson.vehicle.brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Toyota, Honda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="configJson.vehicle.model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Avanza, Beat" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="configJson.vehicle.year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="2020" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="configJson.vehicle.plateNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plate Number</FormLabel>
                        <FormControl>
                          <Input placeholder="B 1234 XYZ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="configJson.vehicle.color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., White, Black" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Operating Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Operating Hours</CardTitle>
                <CardDescription>
                  When this driver is available for work
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="configJson.operatingHours.is24Hours"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Available 24/7</FormLabel>
                        <FormDescription>
                          Check if this driver is available 24 hours a day, 7 days a week
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {!form.watch('configJson.operatingHours.is24Hours') && (
                  <>
                    <FormField
                      control={form.control}
                      name="configJson.operatingHours.availableDays"
                      render={() => (
                        <FormItem>
                          <FormLabel>Available Days</FormLabel>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {DAYS_OF_WEEK.map((day) => (
                              <FormField
                                key={day.value}
                                control={form.control}
                                name="configJson.operatingHours.availableDays"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={day.value}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(day.value)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, day.value])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== day.value
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">
                                        {day.label}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="configJson.operatingHours.startTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="configJson.operatingHours.endTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Capabilities, Equipment, and Certifications */}
            <Card>
              <CardHeader>
                <CardTitle>Capabilities & Equipment</CardTitle>
                <CardDescription>
                  Driver skills, available equipment, and certifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="configJson.capabilities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capabilities</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter capabilities separated by commas (e.g., Heavy lifting, Medical transport, Long distance)"
                          value={field.value?.join(', ') || ''}
                          onChange={(e) => {
                            const capabilities = e.target.value
                              .split(',')
                              .map(item => item.trim())
                              .filter(Boolean);
                            field.onChange(capabilities);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        List driver capabilities separated by commas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="configJson.equipment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipment</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter equipment separated by commas (e.g., Stretcher, Oxygen tank, GPS)"
                          value={field.value?.join(', ') || ''}
                          onChange={(e) => {
                            const equipment = e.target.value
                              .split(',')
                              .map(item => item.trim())
                              .filter(Boolean);
                            field.onChange(equipment);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        List available equipment separated by commas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="configJson.certifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certifications</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter certifications separated by commas (e.g., First Aid, Defensive Driving, Medical Transport)"
                          value={field.value?.join(', ') || ''}
                          onChange={(e) => {
                            const certifications = e.target.value
                              .split(',')
                              .map(item => item.trim())
                              .filter(Boolean);
                            field.onChange(certifications);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        List certifications separated by commas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/drivers')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {mode === 'create' ? 'Create Driver' : 'Update Driver'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
};

export default DriverFormPage; 