import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserPlus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ApiOrder, assignDriverToOrder } from '@/services/mitraOrderApi';
import { fetchMitraDrivers, ApiDriver } from '@/services/mitraDriverApi';

interface AssignDriverDialogProps {
  order: ApiOrder;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AssignDriverDialog({
  order,
  isOpen,
  onOpenChange,
  onSuccess,
}: AssignDriverDialogProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch all drivers for this mitra
  const { data: allDrivers, isLoading: driversLoading } = useQuery({
    queryKey: ['mitraDrivers'],
    queryFn: fetchMitraDrivers,
    enabled: isOpen,
  });

  // Filter drivers to show only suitable ones
  const suitableDrivers = allDrivers?.filter((driver: ApiDriver) => {
    // Must be active
    if (!driver.isActive) return false;
    
    // For now, we'll show all active drivers
    // In a more complex implementation, we could check:
    // - Driver service assignments
    // - Driver availability
    // - Driver location proximity
    // - Driver capacity/vehicle type compatibility
    
    return true;
  }) || [];

  // Assign driver mutation
  const assignMutation = useMutation({
    mutationFn: ({ orderId, driverId }: { orderId: string; driverId: string }) =>
      assignDriverToOrder(orderId, driverId),
    onSuccess: () => {
      toast.success(`Driver assigned successfully to order ${order.id.slice(0, 8)}...`);
      
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['mitraOrders'] });
      queryClient.invalidateQueries({ queryKey: ['mitraOrder', order.id] });
      
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(`Failed to assign driver: ${error.message}`);
    },
  });

  const handleAssign = () => {
    if (!selectedDriverId) {
      toast.error('Please select a driver');
      return;
    }

    assignMutation.mutate({
      orderId: order.id,
      driverId: selectedDriverId,
    });
  };

  const handleCancel = () => {
    setSelectedDriverId('');
    onOpenChange(false);
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Driver to Order
          </DialogTitle>
          <DialogDescription>
            Select an available driver to assign to this order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Order ID:</span>
                  <span className="text-sm font-mono">{order.id.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Service:</span>
                  <span className="text-sm">{order.service?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Service Type:</span>
                  <Badge variant="outline">
                    {order.service?.serviceTypeKey || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Estimated Cost:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(order.estimatedCost)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Customer:</span>
                  <span className="text-sm font-mono">{order.ordererIdentifier}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driver Selection */}
          <div className="space-y-2">
            <Label htmlFor="driver-select">Select Driver</Label>
            {driversLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Loading drivers...</span>
              </div>
            ) : suitableDrivers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No suitable drivers available
              </div>
            ) : (
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a driver" />
                </SelectTrigger>
                <SelectContent>
                  {suitableDrivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-medium">{driver.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {driver.identifier}
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          Active
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected Driver Info */}
          {selectedDriverId && (
            <Card>
              <CardContent className="pt-4">
                {(() => {
                  const selectedDriver = suitableDrivers.find(d => d.id === selectedDriverId);
                  if (!selectedDriver) return null;
                  
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Driver Name:</span>
                        <span className="text-sm">{selectedDriver.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Identifier:</span>
                        <span className="text-sm font-mono">{selectedDriver.identifier}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Status:</span>
                        <Badge variant={selectedDriver.isActive ? 'default' : 'secondary'}>
                          {selectedDriver.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={assignMutation.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedDriverId || assignMutation.isPending || suitableDrivers.length === 0}
          >
            {assignMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Driver
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 