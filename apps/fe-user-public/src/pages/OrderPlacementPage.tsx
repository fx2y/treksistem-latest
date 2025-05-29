import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { 
  OrderPlacementPayload,
  AllowedMuatan,
  AvailableFasilitas
} from '@treksistem/shared-types';

import { fetchPublicServiceConfig, placeOrder } from '../services/publicApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';

export default function OrderPlacementPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('serviceId');

  // Fetch service configuration
  const { 
    data: serviceConfig, 
    isLoading: isLoadingConfig, 
    error: configError 
  } = useQuery({
    queryKey: ['publicServiceConfig', serviceId],
    queryFn: () => fetchPublicServiceConfig(serviceId!),
    enabled: !!serviceId,
  });

  // Form setup without zodResolver to avoid TypeScript issues
  const form = useForm<OrderPlacementPayload>({
    defaultValues: {
      serviceId: serviceId || '',
      ordererIdentifier: '',
      receiverWaNumber: '',
      details: {
        pickupAddress: {
          text: '',
          lat: undefined,
          lon: undefined,
          notes: '',
        },
        dropoffAddress: {
          text: '',
          lat: undefined,
          lon: undefined,
          notes: '',
        },
        notes: '',
        selectedMuatanId: '',
        selectedFasilitasIds: [],
        driverInstructions: '',
      },
      talanganAmount: 0,
      isBarangPenting: false,
      paymentMethod: 'CASH' as const,
    },
  });

  // Watch form values for dynamic updates
  const talanganAmount = form.watch('talanganAmount') || 0;
  const isBarangPenting = form.watch('isBarangPenting');

  // Dynamic validation: receiverWaNumber required for sensitive orders or talangan > 0
  const requiresReceiverNotification = useMemo(() => {
    return (serviceConfig?.configJson.isBarangPentingDefault || isBarangPenting || talanganAmount > 0);
  }, [serviceConfig?.configJson.isBarangPentingDefault, isBarangPenting, talanganAmount]);

  // Order placement mutation
  const placeOrderMutation = useMutation({
    mutationFn: placeOrder,
    onSuccess: (data) => {
      toast.success('Order placed successfully!', {
        description: `Order ID: ${data.orderId}`,
      });

      // Show receiver notification link if required
      if (data.requiresReceiverNotification && data.receiverNotificationLink) {
        toast.info('Send WhatsApp notification to receiver', {
          description: 'Click to notify the receiver about this order',
          action: {
            label: 'Open WhatsApp',
            onClick: () => window.open(data.receiverNotificationLink, '_blank'),
          },
          duration: 10000,
        });
      }

      // Navigate to tracking page (if implemented) or show success
      navigate('/');
    },
    onError: (error) => {
      toast.error('Failed to place order', {
        description: error.message,
      });
    },
  });

  // Submit handler with manual validation
  const onSubmit = (data: OrderPlacementPayload) => {
    if (!serviceId) {
      toast.error('Service ID is missing');
      return;
    }

    // Basic validation
    if (!data.ordererIdentifier) {
      form.setError('ordererIdentifier', {
        type: 'required',
        message: 'Phone number is required',
      });
      return;
    }

    if (!data.details.pickupAddress.text) {
      form.setError('details.pickupAddress.text', {
        type: 'required',
        message: 'Pickup address is required',
      });
      return;
    }

    if (!data.details.dropoffAddress.text) {
      form.setError('details.dropoffAddress.text', {
        type: 'required',
        message: 'Delivery address is required',
      });
      return;
    }

    // Add validation for receiver notification requirement
    if (requiresReceiverNotification && !data.receiverWaNumber) {
      form.setError('receiverWaNumber', {
        type: 'required',
        message: 'Receiver WhatsApp number is required for this type of order',
      });
      return;
    }

    // Validate talangan amount against service limits
    if (serviceConfig?.configJson.fiturTalangan.enabled && data.talanganAmount) {
      const maxAmount = serviceConfig.configJson.fiturTalangan.maxAmount || 0;
      if (data.talanganAmount > maxAmount) {
        form.setError('talanganAmount', {
          type: 'max',
          message: `Talangan amount cannot exceed ${maxAmount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}`,
        });
        return;
      }
    }

    placeOrderMutation.mutate(data);
  };

  // Loading state
  if (isLoadingConfig) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">Loading service configuration...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (configError || !serviceConfig) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <h2 className="text-lg font-semibold mb-2">Error Loading Service</h2>
              <p>{configError?.message || 'Service not found'}</p>
              <Button 
                onClick={() => navigate('/')} 
                className="mt-4"
                variant="outline"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { configJson } = serviceConfig;

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Place Order - {serviceConfig.name}</CardTitle>
          <CardDescription>
            {serviceConfig.mitraName} • {configJson.serviceTypeAlias}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Customer Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                
                <FormField
                  control={form.control}
                  name="ordererIdentifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="08123456789 or +6281234567890"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        We'll use this number to contact you about your order
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {requiresReceiverNotification && (
                  <FormField
                    control={form.control}
                    name="receiverWaNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Receiver WhatsApp Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="08123456789 or +6281234567890"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Required for valuable items or advance payment orders
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pickup & Delivery</h3>
                
                <FormField
                  control={form.control}
                  name="details.pickupAddress.text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter complete pickup address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="details.pickupAddress.notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Notes (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Near the red gate, second floor"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="details.dropoffAddress.text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter complete delivery address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="details.dropoffAddress.notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Notes (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Ring the doorbell twice"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Cargo Type Selection */}
              {configJson.allowedMuatan && configJson.allowedMuatan.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Cargo Type</h3>
                  <FormField
                    control={form.control}
                    name="details.selectedMuatanId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Cargo Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose cargo type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {configJson.allowedMuatan?.map((muatan: AllowedMuatan) => (
                              <SelectItem key={muatan.muatanId} value={muatan.muatanId}>
                                {muatan.namaTampil}
                                {muatan.biayaHandlingTambahan && (
                                  <span className="text-muted-foreground text-xs ml-2">
                                    (+{muatan.biayaHandlingTambahan.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })})
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Facilities Selection */}
              {configJson.availableFasilitas && configJson.availableFasilitas.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Additional Facilities</h3>
                  <FormField
                    control={form.control}
                    name="details.selectedFasilitasIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Additional Facilities</FormLabel>
                        <div className="space-y-3">
                          {configJson.availableFasilitas?.map((fasilitas: AvailableFasilitas) => (
                            <div key={fasilitas.fasilitasId} className="flex items-center space-x-2">
                              <Checkbox
                                id={fasilitas.fasilitasId}
                                checked={field.value?.includes(fasilitas.fasilitasId) || false}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...(field.value || []), fasilitas.fasilitasId]);
                                  } else {
                                    field.onChange(field.value?.filter(id => id !== fasilitas.fasilitasId) || []);
                                  }
                                }}
                              />
                              <Label htmlFor={fasilitas.fasilitasId} className="text-sm font-normal cursor-pointer">
                                {fasilitas.namaTampil}
                                {fasilitas.biayaFasilitasTambahan && (
                                  <span className="text-muted-foreground text-xs ml-2">
                                    (+{fasilitas.biayaFasilitasTambahan.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })})
                                  </span>
                                )}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Talangan (Advance Payment) */}
              {configJson.fiturTalangan.enabled && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Advance Payment (Talangan)</h3>
                  <FormField
                    control={form.control}
                    name="talanganAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Advance Payment Amount</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            max={configJson.fiturTalangan.maxAmount || undefined}
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          {configJson.fiturTalangan.maxAmount && (
                            `Maximum: ${configJson.fiturTalangan.maxAmount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}`
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Order Notes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Information</h3>
                
                <FormField
                  control={form.control}
                  name="details.notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any special instructions or notes for this order"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="details.driverInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions for Driver (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Special instructions for the driver"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!configJson.isBarangPentingDefault && (
                  <FormField
                    control={form.control}
                    name="isBarangPenting"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            This order contains valuable/important items
                          </FormLabel>
                          <FormDescription>
                            Check this if your order contains valuable or important items requiring special handling
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CASH">Cash</SelectItem>
                          <SelectItem value="TRANSFER">Bank Transfer</SelectItem>
                          <SelectItem value="EWALLET">E-Wallet</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={placeOrderMutation.isPending}
                >
                  {placeOrderMutation.isPending ? 'Placing Order...' : 'Place Order'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 