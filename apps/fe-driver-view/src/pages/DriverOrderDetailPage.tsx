import { useState, useRef } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useDriverAuth } from '@/hooks/useDriverAuth';
import { 
  fetchAssignedOrders,
  acceptOrder,
  rejectOrder,
  updateOrderStatus,
  addOrderNote,
  requestUploadUrl,
  uploadFileToR2,
  getCurrentLocation,
  generateWhatsAppLink,
  generateMapsLink,
  DriverApiError,
  UpdateStatusPayload
} from '@/services/driverApi';
import { OrderStatus } from '@treksistem/shared-types';
import { 
  ArrowLeft,
  MapPin, 
  Phone, 
  Camera,
  MessageCircle,
  Check,
  X,
  Navigation,
  ExternalLink,
  Clock,
  Package,
  AlertTriangle,
  Loader2,
  Upload
} from 'lucide-react';

export function DriverOrderDetailPage() {
  const { driverId, orderId } = useParams<{ driverId: string; orderId: string }>();
  const { isAuthenticated } = useDriverAuth();
  const queryClient = useQueryClient();
  
  // State
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [note, setNote] = useState('');
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAuthenticated || !driverId || !orderId) {
    return <Navigate to="/invalid-access" replace />;
  }

  // Fetch orders and find the specific order
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['assignedOrders', driverId],
    queryFn: () => fetchAssignedOrders(driverId),
  });

  const order = orders.find(o => o.id === orderId);

  // Mutations
  const acceptMutation = useMutation({
    mutationFn: () => acceptOrder(driverId, orderId),
    onSuccess: () => {
      toast.success('Order accepted successfully');
      queryClient.invalidateQueries({ queryKey: ['assignedOrders', driverId] });
    },
    onError: (error) => {
      toast.error(error instanceof DriverApiError ? error.message : 'Failed to accept order');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectOrder(driverId, orderId, reason),
    onSuccess: () => {
      toast.success('Order rejected');
      setRejectDialogOpen(false);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['assignedOrders', driverId] });
    },
    onError: (error) => {
      toast.error(error instanceof DriverApiError ? error.message : 'Failed to reject order');
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (payload: UpdateStatusPayload) => {
      // Get current location if needed
      if (['DRIVER_AT_PICKUP', 'PICKED_UP', 'DRIVER_AT_DROPOFF', 'DELIVERED'].includes(payload.newStatus)) {
        try {
          const location = await getCurrentLocation();
          payload.lat = location.lat;
          payload.lon = location.lon;
        } catch (error) {
          console.warn('Failed to get location:', error);
          // Continue without location if it fails
        }
      }
      return updateOrderStatus(driverId, orderId, payload);
    },
    onSuccess: () => {
      toast.success('Status updated successfully');
      setPendingStatus(null);
      setPhotoDialogOpen(false);
      setSelectedFile(null);
      setPhotoPreview(null);
      queryClient.invalidateQueries({ queryKey: ['assignedOrders', driverId] });
    },
    onError: (error) => {
      setPendingStatus(null);
      toast.error(error instanceof DriverApiError ? error.message : 'Failed to update status');
    },
  });

  const noteMutation = useMutation({
    mutationFn: (noteText: string) => addOrderNote(driverId, orderId, noteText),
    onSuccess: () => {
      toast.success('Note added successfully');
      setNoteDialogOpen(false);
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['assignedOrders', driverId] });
    },
    onError: (error) => {
      toast.error(error instanceof DriverApiError ? error.message : 'Failed to add note');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, newStatus }: { file: File; newStatus: OrderStatus }) => {
      const filename = `${orderId}_${Date.now()}_${file.name}`;
      const { uploadUrl, r2ObjectKey } = await requestUploadUrl(driverId, orderId, filename, file.type);
      await uploadFileToR2(uploadUrl, file, file.type);
      
      const payload: UpdateStatusPayload = {
        newStatus,
        photoR2Key: r2ObjectKey,
      };
      
      return statusMutation.mutateAsync(payload);
    },
    onSuccess: () => {
      toast.success('Photo uploaded and status updated');
    },
    onError: (error) => {
      toast.error(error instanceof DriverApiError ? error.message : 'Failed to upload photo');
    },
  });

  // Handlers
  const handleStatusUpdate = (newStatus: OrderStatus) => {
    setPendingStatus(newStatus);
    statusMutation.mutate({ newStatus });
  };

  const handlePhotoCapture = (newStatus: OrderStatus) => {
    setPendingStatus(newStatus);
    setPhotoDialogOpen(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoSubmit = () => {
    if (!selectedFile || !pendingStatus) return;
    uploadMutation.mutate({ file: selectedFile, newStatus: pendingStatus });
  };

  const formatAddress = (address: any): string => {
    if (typeof address === 'string') return address;
    return address?.text || 'Address not available';
  };

  const getStatusActions = (currentStatus: OrderStatus) => {
    const actions: JSX.Element[] = [];

    switch (currentStatus) {
      case 'DRIVER_ASSIGNED':
        actions.push(
          <Button
            key="accept"
            onClick={() => acceptMutation.mutate()}
            disabled={acceptMutation.isPending}
            className="flex-1"
          >
            {acceptMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Check className="w-4 h-4 mr-2" />
            Accept Order
          </Button>,
          <Dialog key="reject" open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1">
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rejectReason">Reason (optional)</Label>
                  <Textarea
                    id="rejectReason"
                    placeholder="e.g., Not available, too far, etc."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => rejectMutation.mutate(rejectReason.trim())}
                    disabled={rejectMutation.isPending}
                    variant="destructive"
                    className="flex-1"
                  >
                    {rejectMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Reject Order
                  </Button>
                  <Button variant="outline" onClick={() => setRejectDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
        break;

      case 'ACCEPTED_BY_DRIVER':
        actions.push(
          <Button
            key="at-pickup"
            onClick={() => handleStatusUpdate('DRIVER_AT_PICKUP')}
            disabled={statusMutation.isPending}
            className="flex-1"
          >
            {pendingStatus === 'DRIVER_AT_PICKUP' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Navigation className="w-4 h-4 mr-2" />
            Arrived at Pickup
          </Button>
        );
        break;

      case 'DRIVER_AT_PICKUP':
        actions.push(
          <Button
            key="pickup-photo"
            onClick={() => handlePhotoCapture('PICKED_UP')}
            disabled={uploadMutation.isPending}
            className="flex-1"
          >
            {pendingStatus === 'PICKED_UP' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Camera className="w-4 h-4 mr-2" />
            Confirm Pickup & Upload Photo
          </Button>
        );
        break;

      case 'PICKED_UP':
      case 'IN_TRANSIT':
        actions.push(
          <Button
            key="at-dropoff"
            onClick={() => handleStatusUpdate('DRIVER_AT_DROPOFF')}
            disabled={statusMutation.isPending}
            className="flex-1"
          >
            {pendingStatus === 'DRIVER_AT_DROPOFF' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Navigation className="w-4 h-4 mr-2" />
            Arrived at Dropoff
          </Button>
        );
        break;

      case 'DRIVER_AT_DROPOFF':
        actions.push(
          <Button
            key="delivery-photo"
            onClick={() => handlePhotoCapture('DELIVERED')}
            disabled={uploadMutation.isPending}
            className="flex-1"
          >
            {pendingStatus === 'DELIVERED' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Camera className="w-4 h-4 mr-2" />
            Confirm Delivery & Upload Photo
          </Button>
        );
        break;
    }

    return actions;
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading order details...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-4">Order Not Found</h1>
        <p className="text-muted-foreground mb-4">
          The requested order could not be found or you don't have access to it.
        </p>
        <Button asChild>
          <Link to={`/view/${driverId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Link>
        </Button>
      </div>
    );
  }

  const statusActions = getStatusActions(order.status);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/view/${driverId}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{order.service.name}</h1>
          <div className="text-sm text-muted-foreground">Order #{order.id.slice(-8)}</div>
        </div>
        <Badge variant="secondary">
          {order.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
        </Badge>
      </div>

      {/* Order Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Order Information
            {order.isBarangPenting && (
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Customer:</span>
              <div className="font-medium">{order.customerIdentifier}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <div className="font-medium">{new Date(order.createdAt).toLocaleString()}</div>
            </div>
          </div>

          {order.scheduledPickupTime && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Scheduled:</span>
              <span className="font-medium">{new Date(order.scheduledPickupTime).toLocaleString()}</span>
            </div>
          )}

          {order.details?.selectedMuatan && (
            <div className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Cargo:</span>
              <span className="font-medium">{order.details.selectedMuatan}</span>
            </div>
          )}

          {order.estimatedCost && (
            <div className="text-sm">
              <span className="text-muted-foreground">Estimated Cost:</span>
              <span className="font-medium ml-2">Rp {order.estimatedCost.toLocaleString()}</span>
            </div>
          )}

          {order.talanganAmount && order.talanganAmount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
              <div className="font-medium text-yellow-800">
                Talangan Required: Rp {order.talanganAmount.toLocaleString()}
              </div>
              <div className="text-sm text-yellow-600">
                Advance payment must be collected from customer
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pickup */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-600 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Pickup Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">{formatAddress(order.pickupAddress)}</div>
            {order.pickupAddress?.notes && (
              <div className="text-sm text-muted-foreground italic">
                Note: {order.pickupAddress.notes}
              </div>
            )}
            {order.pickupAddress?.lat && order.pickupAddress?.lon && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open(generateMapsLink(order.pickupAddress.lat!, order.pickupAddress.lon!, 'Pickup Location'), '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Maps
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Dropoff */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-red-600 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Dropoff Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">{formatAddress(order.dropoffAddress)}</div>
            {order.dropoffAddress?.notes && (
              <div className="text-sm text-muted-foreground italic">
                Note: {order.dropoffAddress.notes}
              </div>
            )}
            {order.dropoffAddress?.lat && order.dropoffAddress?.lon && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open(generateMapsLink(order.dropoffAddress.lat!, order.dropoffAddress.lon!, 'Dropoff Location'), '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Maps
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      {order.details?.driverInstructions && (
        <Card>
          <CardHeader>
            <CardTitle>Driver Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm bg-blue-50 border border-blue-200 p-3 rounded-md">
              {order.details.driverInstructions}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {statusActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {statusActions}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Note</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="note">Note</Label>
                    <Textarea
                      id="note"
                      placeholder="Add a note about this order..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => noteMutation.mutate(note.trim())}
                      disabled={noteMutation.isPending || !note.trim()}
                      className="flex-1"
                    >
                      {noteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Add Note
                    </Button>
                    <Button variant="outline" onClick={() => setNoteDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(generateWhatsAppLink(order.customerIdentifier, `Hi, this is your driver for order ${order.id.slice(-8)}. I will be handling your delivery.`), '_blank')}
            >
              <Phone className="w-4 h-4 mr-2" />
              Contact Customer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Photo Upload Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Proof Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="photo">Select Photo</Label>
              <Input
                ref={fileInputRef}
                id="photo"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                capture="environment"
              />
            </div>
            
            {photoPreview && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <img 
                  src={photoPreview} 
                  alt="Preview" 
                  className="w-full max-h-48 object-cover rounded-md border"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handlePhotoSubmit}
                disabled={!selectedFile || uploadMutation.isPending}
                className="flex-1"
              >
                {uploadMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Upload className="w-4 h-4 mr-2" />
                Upload & Update Status
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setPhotoDialogOpen(false);
                  setPendingStatus(null);
                  setSelectedFile(null);
                  setPhotoPreview(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 