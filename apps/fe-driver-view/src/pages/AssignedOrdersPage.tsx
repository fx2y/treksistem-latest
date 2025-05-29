import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useDriverAuth } from '@/hooks/useDriverAuth';
import { OrderCard } from '@/components/driver/OrderCard';
import { 
  fetchAssignedOrders, 
  addOrderNote, 
  DriverApiError 
} from '@/services/driverApi';
import { RefreshCw, MessageCircle, Loader2 } from 'lucide-react';

interface AssignedOrdersPageProps {
  driverId?: string;
}

export const AssignedOrdersPage = ({ driverId: propDriverId }: AssignedOrdersPageProps) => {
  const { driverId: paramDriverId } = useParams<{ driverId: string }>();
  const driverId = propDriverId || paramDriverId;
  const { isAuthenticated } = useDriverAuth();
  const queryClient = useQueryClient();

  // State for bulk operations
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [bulkNoteDialogOpen, setBulkNoteDialogOpen] = useState(false);
  const [bulkNote, setBulkNote] = useState('');

  if (!isAuthenticated || !driverId) {
    return <Navigate to="/invalid-access" replace />;
  }

  // Fetch assigned orders with polling
  const { 
    data: orders = [], 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useQuery({
    queryKey: ['assignedOrders', driverId],
    queryFn: () => fetchAssignedOrders(driverId),
    refetchInterval: 30000, // Poll every 30 seconds
    refetchIntervalInBackground: true,
    retry: (failureCount, error) => {
      if (error instanceof DriverApiError && error.status === 404) {
        return false; // Don't retry if driver not found
      }
      return failureCount < 3;
    },
  });

  // Bulk note mutation
  const bulkNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      const promises = Array.from(selectedOrderIds).map(orderId =>
        addOrderNote(driverId, orderId, note, 'DRIVER_NOTE_BULK')
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast.success(`Note added to ${selectedOrderIds.size} orders`);
      setSelectedOrderIds(new Set());
      setBulkNote('');
      setBulkNoteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['assignedOrders', driverId] });
    },
    onError: (error) => {
      console.error('Bulk note error:', error);
      toast.error(error instanceof DriverApiError ? error.message : 'Failed to add bulk note');
    },
  });

  const handleOrderSelection = (orderId: string, selected: boolean) => {
    const newSelection = new Set(selectedOrderIds);
    if (selected) {
      newSelection.add(orderId);
    } else {
      newSelection.delete(orderId);
    }
    setSelectedOrderIds(newSelection);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const actionableOrderIds = orders
        .filter(order => ['DRIVER_ASSIGNED', 'ACCEPTED_BY_DRIVER', 'DRIVER_AT_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'DRIVER_AT_DROPOFF'].includes(order.status))
        .map(order => order.id);
      setSelectedOrderIds(new Set(actionableOrderIds));
    } else {
      setSelectedOrderIds(new Set());
    }
  };

  const handleBulkNoteSubmit = () => {
    if (!bulkNote.trim()) {
      toast.error('Please enter a note');
      return;
    }
    if (selectedOrderIds.size === 0) {
      toast.error('Please select at least one order');
      return;
    }
    bulkNoteMutation.mutate(bulkNote.trim());
  };

  const actionableOrders = orders.filter(order => 
    ['DRIVER_ASSIGNED', 'ACCEPTED_BY_DRIVER', 'DRIVER_AT_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'DRIVER_AT_DROPOFF'].includes(order.status)
  );

  const allActionableSelected = actionableOrders.length > 0 && 
    actionableOrders.every(order => selectedOrderIds.has(order.id));

  if (error) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-4">Error Loading Orders</h1>
        <p className="text-muted-foreground mb-4">
          {error instanceof DriverApiError ? error.message : 'Failed to load assigned orders'}
        </p>
        <Button onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Orders</h1>
          <div className="text-sm text-muted-foreground">
            Driver: {driverId.slice(0, 8)}...
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Bulk Actions */}
      {actionableOrders.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Bulk Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedOrderIds.size} of {actionableOrders.length} orders selected
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectAll(!allActionableSelected)}
              >
                {allActionableSelected ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            
            <Dialog open={bulkNoteDialogOpen} onOpenChange={setBulkNoteDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={selectedOrderIds.size === 0}
                  className="w-full"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Add Note to Selected Orders ({selectedOrderIds.size})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Note to {selectedOrderIds.size} Orders</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bulkNote">Note</Label>
                    <Textarea
                      id="bulkNote"
                      placeholder="e.g., Terjebak macet di area Sudirman"
                      value={bulkNote}
                      onChange={(e) => setBulkNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleBulkNoteSubmit}
                      disabled={bulkNoteMutation.isPending || !bulkNote.trim()}
                      className="flex-1"
                    >
                      {bulkNoteMutation.isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Add Note
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setBulkNoteDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <div className="text-lg font-medium mb-2">No orders assigned</div>
              <div className="text-sm">New orders will appear here automatically</div>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              driverId={driverId}
              isSelectable={actionableOrders.some(o => o.id === order.id)}
              isSelected={selectedOrderIds.has(order.id)}
              onSelectionChange={(selected) => handleOrderSelection(order.id, selected)}
            />
          ))
        )}
      </div>
    </div>
  );
}; 