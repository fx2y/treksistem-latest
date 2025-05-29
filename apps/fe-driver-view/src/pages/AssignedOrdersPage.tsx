import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDriverAuth } from '@/hooks/useDriverAuth';
import { Navigate } from 'react-router-dom';
import { CheckCircle, Clock, MapPin, Phone } from 'lucide-react';

interface AssignedOrdersPageProps {
  driverId: string;
}

export const AssignedOrdersPage = ({ driverId }: AssignedOrdersPageProps) => {
  const { isAuthenticated } = useDriverAuth();

  if (!isAuthenticated) {
    return <Navigate to="/invalid-access" replace />;
  }

  // Mock data for demonstration - will be replaced with actual API calls
  const mockOrders = [
    {
      id: 'order_1',
      serviceName: 'Express Delivery',
      customerName: 'John Doe',
      customerPhone: '+6281234567890',
      pickupAddress: 'Jl. Sudirman No. 123, Jakarta',
      deliveryAddress: 'Jl. Thamrin No. 456, Jakarta',
      status: 'assigned' as const,
      dueDate: '2024-01-15 14:00',
    },
    {
      id: 'order_2',
      serviceName: 'Document Pickup',
      customerName: 'Jane Smith',
      customerPhone: '+6281234567891',
      pickupAddress: 'Jl. HR Rasuna Said No. 789, Jakarta',
      deliveryAddress: 'Jl. Gatot Subroto No. 101, Jakarta',
      status: 'accepted' as const,
      dueDate: '2024-01-15 16:30',
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <div className="text-sm text-muted-foreground">
          Driver: {driverId.slice(0, 8)}...
        </div>
      </div>

      <div className="space-y-4">
        {mockOrders.map((order) => (
          <Card key={order.id} className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{order.serviceName}</CardTitle>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  order.status === 'assigned' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {order.status === 'assigned' ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                  {order.status === 'assigned' ? 'New Order' : 'Accepted'}
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

              <div className="text-sm text-muted-foreground">
                Due: {order.dueDate}
              </div>

              <div className="flex gap-2 pt-2">
                {order.status === 'assigned' ? (
                  <>
                    <Button size="sm" className="flex-1">
                      Accept Order
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Decline
                    </Button>
                  </>
                ) : (
                  <Button size="sm" className="flex-1">
                    Update Status
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockOrders.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No orders assigned yet
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 