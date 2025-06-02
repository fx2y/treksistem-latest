import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MapPin, 
  Package, 
  Phone, 
  AlertTriangle,
  Calendar,
  Eye
} from 'lucide-react';
import { DriverOrder } from '@/services/driverApi';
import { OrderStatus } from '@treksistem/shared-types';
import { Link } from 'react-router-dom';

interface OrderCardProps {
  order: DriverOrder;
  driverId: string;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (_selected: boolean) => void;
}

const statusConfig: Record<OrderStatus, { label: string; variant: string; color: string }> = {
  'PENDING': { label: 'Pending', variant: 'secondary', color: 'text-gray-600' },
  'ACCEPTED_BY_MITRA': { label: 'Accepted by Mitra', variant: 'secondary', color: 'text-blue-600' },
  'PENDING_DRIVER_ASSIGNMENT': { label: 'Pending Assignment', variant: 'secondary', color: 'text-yellow-600' },
  'DRIVER_ASSIGNED': { label: 'New Order', variant: 'default', color: 'text-blue-600' },
  'REJECTED_BY_DRIVER': { label: 'Rejected', variant: 'destructive', color: 'text-red-600' },
  'ACCEPTED_BY_DRIVER': { label: 'Accepted', variant: 'secondary', color: 'text-green-600' },
  'DRIVER_AT_PICKUP': { label: 'At Pickup', variant: 'default', color: 'text-blue-600' },
  'PICKED_UP': { label: 'Picked Up', variant: 'default', color: 'text-blue-600' },
  'IN_TRANSIT': { label: 'In Transit', variant: 'default', color: 'text-blue-600' },
  'DRIVER_AT_DROPOFF': { label: 'At Dropoff', variant: 'default', color: 'text-blue-600' },
  'DELIVERED': { label: 'Delivered', variant: 'secondary', color: 'text-green-600' },
  'CANCELLED_BY_USER': { label: 'Cancelled by User', variant: 'destructive', color: 'text-red-600' },
  'CANCELLED_BY_MITRA': { label: 'Cancelled by Mitra', variant: 'destructive', color: 'text-red-600' },
  'CANCELLED_BY_DRIVER': { label: 'Cancelled by Driver', variant: 'destructive', color: 'text-red-600' },
  'FAILED_DELIVERY': { label: 'Failed Delivery', variant: 'destructive', color: 'text-red-600' },
  'REFUNDED': { label: 'Refunded', variant: 'secondary', color: 'text-gray-600' },
};

export function OrderCard({ 
  order, 
  driverId, 
  isSelectable = false, 
  isSelected = false, 
  onSelectionChange 
}: OrderCardProps) {
  const statusInfo = statusConfig[order.status];
  const scheduledTime = order.scheduledPickupTime 
    ? new Date(order.scheduledPickupTime).toLocaleString() 
    : null;

  const formatAddress = (address: any): string => {
    if (typeof address === 'string') return address;
    return address?.text || 'Address not available';
  };

  const isActionable = ['DRIVER_ASSIGNED', 'ACCEPTED_BY_DRIVER', 'DRIVER_AT_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'DRIVER_AT_DROPOFF'].includes(order.status);

  const handleSelectionChange = (checked: boolean) => {
    onSelectionChange?.(checked);
  };

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {isSelectable && isActionable && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleSelectionChange}
                className="mt-1"
              />
            )}
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {order.service.name}
                {order.isBarangPenting && (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
              </CardTitle>
              <div className="text-sm text-muted-foreground mt-1">
                Order #{order.id.slice(-8)}
              </div>
            </div>
          </div>
          <Badge 
            variant={statusInfo.variant as any} 
            className={`${statusInfo.color} shrink-0`}
          >
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Pickup Address */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 mt-0.5 text-green-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-green-600 text-sm">Pickup</div>
            <div className="text-sm text-muted-foreground truncate">
              {formatAddress(order.pickupAddress)}
            </div>
            {order.pickupAddress?.notes && (
              <div className="text-xs text-muted-foreground italic">
                {order.pickupAddress.notes}
              </div>
            )}
          </div>
        </div>

        {/* Dropoff Address */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-red-600 text-sm">Dropoff</div>
            <div className="text-sm text-muted-foreground truncate">
              {formatAddress(order.dropoffAddress)}
            </div>
            {order.dropoffAddress?.notes && (
              <div className="text-xs text-muted-foreground italic">
                {order.dropoffAddress.notes}
              </div>
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {order.details?.selectedMuatan && (
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{order.details.selectedMuatan}</span>
            </div>
          )}
          
          {scheduledTime && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground text-xs">{scheduledTime}</span>
            </div>
          )}
        </div>

        {/* Customer Info */}
        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Customer: {order.customerIdentifier}</span>
        </div>

        {/* Talangan Info */}
        {order.talanganAmount && order.talanganAmount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 p-2 rounded-md">
            <div className="text-sm font-medium text-yellow-800">
              Talangan: Rp {order.talanganAmount.toLocaleString()}
            </div>
            <div className="text-xs text-yellow-600">
              Advance payment required
            </div>
          </div>
        )}

        {/* Driver Instructions */}
        {order.details?.driverInstructions && (
          <div className="bg-blue-50 border border-blue-200 p-2 rounded-md">
            <div className="text-sm font-medium text-blue-800">Instructions:</div>
            <div className="text-sm text-blue-700">{order.details.driverInstructions}</div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            asChild 
            size="sm" 
            variant="outline" 
            className="flex-1"
          >
            <Link to={`/view/${driverId}/order/${order.id}`}>
              <Eye className="w-4 h-4 mr-1" />
              View Details
            </Link>
          </Button>
          
          {order.status === 'DRIVER_ASSIGNED' && (
            <Button 
              asChild
              size="sm" 
              className="flex-1"
            >
              <Link to={`/view/${driverId}/order/${order.id}`}>
                Accept Order
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 