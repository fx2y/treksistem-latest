import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, MapPin, Phone } from 'lucide-react';
import type { DriverOrder } from '@/services/driverApi';

interface OrderCardProps {
  order: DriverOrder;
  onAccept?: (orderId: string) => void;
  onDecline?: (orderId: string) => void;
  onUpdateStatus?: (orderId: string) => void;
}

export const OrderCard = ({ order, onAccept, onDecline, onUpdateStatus }: OrderCardProps) => {
  const getStatusDisplay = (status: DriverOrder['status']) => {
    switch (status) {
      case 'assigned':
        return { icon: Clock, label: 'New Order', className: 'bg-blue-100 text-blue-800' };
      case 'accepted':
        return { icon: CheckCircle, label: 'Accepted', className: 'bg-green-100 text-green-800' };
      case 'in_progress':
        return { icon: Clock, label: 'In Progress', className: 'bg-yellow-100 text-yellow-800' };
      case 'completed':
        return { icon: CheckCircle, label: 'Completed', className: 'bg-green-100 text-green-800' };
      case 'cancelled':
        return { icon: Clock, label: 'Cancelled', className: 'bg-red-100 text-red-800' };
      default:
        return { icon: Clock, label: status, className: 'bg-gray-100 text-gray-800' };
    }
  };

  const statusDisplay = getStatusDisplay(order.status);
  const StatusIcon = statusDisplay.icon;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{order.serviceName}</CardTitle>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.className}`}>
            <StatusIcon className="w-3 h-3" />
            {statusDisplay.label}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="font-medium">{order.customerName}</div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-4 h-4" />
            {order.customerPhone}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 text-green-600" />
            <div>
              <div className="font-medium text-green-600">Pickup</div>
              <div className="text-muted-foreground">{order.pickupAddress}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 text-red-600" />
            <div>
              <div className="font-medium text-red-600">Delivery</div>
              <div className="text-muted-foreground">{order.deliveryAddress}</div>
            </div>
          </div>
        </div>

        {order.dueDate && (
          <div className="text-sm text-muted-foreground">
            Due: {new Date(order.dueDate).toLocaleString()}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {order.status === 'assigned' ? (
            <>
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => onAccept?.(order.id)}
              >
                Accept Order
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={() => onDecline?.(order.id)}
              >
                Decline
              </Button>
            </>
          ) : order.status === 'accepted' || order.status === 'in_progress' ? (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onUpdateStatus?.(order.id)}
            >
              Update Status
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}; 