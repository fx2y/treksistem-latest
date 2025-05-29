import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  UserPlus, 
  MapPin, 
  Clock, 
  DollarSign, 
  User, 
  Package, 
  MessageSquare,
  Camera,
  Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/Layout';
import AssignDriverDialog from '@/components/orders/AssignDriverDialog';
import { 
  fetchMitraOrderById, 
  canAssignDriver, 
  getOrderStatusBadgeVariant
} from '@/services/mitraOrderApi';
import { OrderEvent, createWhatsAppLink, WhatsAppMessages } from '@treksistem/shared-types';

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const { 
    data: order, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['mitraOrder', orderId],
    queryFn: () => fetchMitraOrderById(orderId!),
    enabled: !!orderId,
  });

  const handleAssignSuccess = () => {
    setAssignDialogOpen(false);
    refetch();
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatEventType = (eventType: string) => {
    return eventType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'STATUS_UPDATE':
        return <Clock className="h-4 w-4" />;
      case 'PHOTO_UPLOADED':
        return <Camera className="h-4 w-4" />;
      case 'LOCATION_UPDATE':
        return <Navigation className="h-4 w-4" />;
      case 'NOTE_ADDED':
        return <MessageSquare className="h-4 w-4" />;
      case 'ASSIGNMENT_CHANGED':
        return <UserPlus className="h-4 w-4" />;
      case 'COST_UPDATED':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const renderEventData = (event: OrderEvent) => {
    const data = event.dataJson as any;
    
    switch (event.eventType) {
      case 'STATUS_UPDATE':
        return (
          <div className="text-sm">
            {data.oldStatus && (
              <span className="text-muted-foreground">
                From: <Badge variant="outline" className="mx-1">{data.oldStatus.replace(/_/g, ' ')}</Badge>
              </span>
            )}
            <span className="text-muted-foreground">
              To: <Badge variant={getOrderStatusBadgeVariant(data.newStatus)} className="mx-1">
                {data.newStatus.replace(/_/g, ' ')}
              </Badge>
            </span>
            {data.reason && (
              <div className="text-muted-foreground mt-1">Reason: {data.reason}</div>
            )}
          </div>
        );
      
      case 'PHOTO_UPLOADED':
        return (
          <div className="text-sm">
            <div>Photo Type: <Badge variant="outline">{data.photoType}</Badge></div>
            {data.caption && <div className="text-muted-foreground mt-1">Caption: {data.caption}</div>}
            <div className="text-muted-foreground mt-1 font-mono text-xs">Key: {data.photoR2Key}</div>
          </div>
        );
      
      case 'LOCATION_UPDATE':
        return (
          <div className="text-sm">
            <div>Coordinates: {data.lat}, {data.lon}</div>
            {data.accuracy && <div className="text-muted-foreground">Accuracy: {data.accuracy}m</div>}
            {data.heading && <div className="text-muted-foreground">Heading: {data.heading}°</div>}
          </div>
        );
      
      case 'NOTE_ADDED':
        return (
          <div className="text-sm">
            <div className="font-medium">By: {data.author}</div>
            <div className="mt-1">{data.note}</div>
          </div>
        );
      
      case 'ASSIGNMENT_CHANGED':
        return (
          <div className="text-sm">
            {data.oldDriverId && (
              <div className="text-muted-foreground">Previous Driver: {data.oldDriverId}</div>
            )}
            {data.newDriverId && (
              <div>New Driver: {data.newDriverId}</div>
            )}
            {data.reason && (
              <div className="text-muted-foreground mt-1">Reason: {data.reason}</div>
            )}
          </div>
        );
      
      case 'COST_UPDATED':
        return (
          <div className="text-sm">
            {data.oldCost && (
              <div className="text-muted-foreground">
                Previous: {formatCurrency(data.oldCost)}
              </div>
            )}
            <div>New Cost: {formatCurrency(data.newCost)}</div>
            {data.reason && (
              <div className="text-muted-foreground mt-1">Reason: {data.reason}</div>
            )}
          </div>
        );
      
      default:
        return (
          <div className="text-sm text-muted-foreground">
            {JSON.stringify(data, null, 2)}
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                Error loading order: {error?.message || 'Order not found'}
              </div>
              <div className="text-center mt-4">
                <Button variant="outline" onClick={() => navigate('/orders')}>
                  Back to Orders
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
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/orders">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
              <p className="text-muted-foreground font-mono">
                {order.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getOrderStatusBadgeVariant(order.status)} className="text-sm">
              {order.status.replace(/_/g, ' ')}
            </Badge>
            {canAssignDriver(order) && (
              <Button onClick={() => setAssignDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Driver
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Order Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Status</div>
                    <Badge variant={getOrderStatusBadgeVariant(order.status)}>
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Created</div>
                    <div className="text-sm">{formatDate(order.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Estimated Cost</div>
                    <div className="text-sm font-medium">{formatCurrency(order.estimatedCost)}</div>
                  </div>
                  {order.finalCost && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Final Cost</div>
                      <div className="text-sm font-medium">{formatCurrency(order.finalCost)}</div>
                    </div>
                  )}
                  {order.talanganAmount && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Talangan Amount</div>
                      <div className="text-sm font-medium">{formatCurrency(order.talanganAmount)}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Payment Method</div>
                    <div className="text-sm">{order.paymentMethod || 'Not specified'}</div>
                  </div>
                </div>
                
                {order.isBarangPenting && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Important Items</Badge>
                      <span className="text-sm text-yellow-800">
                        This order contains valuable/important items
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Service Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Service Name:</span>
                    <span className="text-sm">{order.service?.name || 'Unknown Service'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Service Type:</span>
                    <Badge variant="outline">{order.service?.serviceTypeKey || 'Unknown'}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Customer Contact:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">{order.ordererIdentifier}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const message = WhatsAppMessages.mitraToOrderer(order.id);
                          const waLink = createWhatsAppLink(order.ordererIdentifier, message);
                          if (waLink) {
                            window.open(waLink, '_blank');
                          }
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {order.receiverWaNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">Receiver WhatsApp:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono">{order.receiverWaNumber}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const message = WhatsAppMessages.mitraToReceiver(order.id);
                            const waLink = createWhatsAppLink(order.receiverWaNumber!, message);
                            if (waLink) {
                              window.open(waLink, '_blank');
                            }
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Driver Information */}
            {order.driver && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Driver Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Driver Name:</span>
                      <span className="text-sm">{order.driver.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">Driver Contact:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono">{order.driver.identifier}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const message = WhatsAppMessages.mitraToDriver(order.id, order.driver?.name);
                            const waLink = createWhatsAppLink(order.driver?.identifier, message);
                            if (waLink) {
                              window.open(waLink, '_blank');
                            }
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Details */}
            {order.parsedDetailsJson && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pickup Address */}
                  {order.parsedDetailsJson.pickupAddress && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Pickup Address</div>
                      <div className="text-sm">
                        <div>{order.parsedDetailsJson.pickupAddress.streetAddress}</div>
                        {order.parsedDetailsJson.pickupAddress.district && (
                          <div className="text-muted-foreground">
                            {order.parsedDetailsJson.pickupAddress.district}, {order.parsedDetailsJson.pickupAddress.city}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dropoff Address */}
                  {order.parsedDetailsJson.dropoffAddress && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Dropoff Address</div>
                      <div className="text-sm">
                        <div>{order.parsedDetailsJson.dropoffAddress.streetAddress}</div>
                        {order.parsedDetailsJson.dropoffAddress.district && (
                          <div className="text-muted-foreground">
                            {order.parsedDetailsJson.dropoffAddress.district}, {order.parsedDetailsJson.dropoffAddress.city}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {order.parsedDetailsJson.notes && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Notes</div>
                      <div className="text-sm">{order.parsedDetailsJson.notes}</div>
                    </div>
                  )}

                  {/* Driver Instructions */}
                  {order.parsedDetailsJson.driverInstructions && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Driver Instructions</div>
                      <div className="text-sm">{order.parsedDetailsJson.driverInstructions}</div>
                    </div>
                  )}

                  {/* Selected Muatan */}
                  {order.parsedDetailsJson.selectedMuatanId && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Selected Cargo Type</div>
                      <Badge variant="outline">{order.parsedDetailsJson.selectedMuatanId}</Badge>
                    </div>
                  )}

                  {/* Selected Fasilitas */}
                  {order.parsedDetailsJson.selectedFasilitasIds?.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Selected Facilities</div>
                      <div className="flex flex-wrap gap-2">
                        {order.parsedDetailsJson.selectedFasilitasIds.map((facilityId: string, index: number) => (
                          <Badge key={index} variant="outline">{facilityId}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scheduled Pickup Time */}
                  {order.parsedDetailsJson.scheduledPickupTime && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2">Scheduled Pickup</div>
                      <div className="text-sm">{formatDate(new Date(order.parsedDetailsJson.scheduledPickupTime).getTime() / 1000)}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Events Timeline */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Order Timeline
                </CardTitle>
                <CardDescription>
                  Complete history of order events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {order.events && order.events.length > 0 ? (
                  <div className="space-y-4">
                    {order.events
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .map((event, index) => (
                        <div key={event.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                              {getEventIcon(event.eventType)}
                            </div>
                            {index < order.events!.length - 1 && (
                              <div className="h-6 w-px bg-border mt-2" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">
                                {formatEventType(event.eventType)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(event.timestamp)}
                              </div>
                            </div>
                            {renderEventData(event)}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No events recorded yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Assign Driver Dialog */}
        {order && (
          <AssignDriverDialog
            order={order}
            isOpen={assignDialogOpen}
            onOpenChange={setAssignDialogOpen}
            onSuccess={handleAssignSuccess}
          />
        )}
      </div>
    </Layout>
  );
} 