import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Eye, UserPlus, Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/Layout';
import AssignDriverDialog from '@/components/orders/AssignDriverDialog';
import { 
  fetchMitraOrders, 
  ApiOrder, 
  OrderFilters, 
  canAssignDriver, 
  getOrderStatusBadgeVariant 
} from '@/services/mitraOrderApi';
import { fetchMitraServices } from '@/services/mitraServiceApi';
import { fetchMitraDrivers } from '@/services/mitraDriverApi';
import { OrderStatus } from '@treksistem/shared-types';

const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'ACCEPTED_BY_MITRA',
  'PENDING_DRIVER_ASSIGNMENT',
  'DRIVER_ASSIGNED',
  'REJECTED_BY_DRIVER',
  'ACCEPTED_BY_DRIVER',
  'DRIVER_AT_PICKUP',
  'PICKED_UP',
  'IN_TRANSIT',
  'DRIVER_AT_DROPOFF',
  'DELIVERED',
  'CANCELLED_BY_USER',
  'CANCELLED_BY_MITRA',
  'CANCELLED_BY_DRIVER',
  'FAILED_DELIVERY',
  'REFUNDED',
];

export default function OrdersListPage() {
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    limit: 20,
  });
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);

  // Fetch orders with current filters
  const { 
    data: ordersResponse, 
    isLoading: ordersLoading, 
    error: ordersError,
    refetch: refetchOrders 
  } = useQuery({
    queryKey: ['mitraOrders', filters],
    queryFn: () => fetchMitraOrders(filters),
  });

  // Fetch services for filter dropdown
  const { data: services } = useQuery({
    queryKey: ['mitraServices'],
    queryFn: fetchMitraServices,
  });

  // Fetch drivers for filter dropdown
  const { data: drivers } = useQuery({
    queryKey: ['mitraDrivers'],
    queryFn: fetchMitraDrivers,
  });

  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
    });
  };

  const handleAssignDriver = (order: ApiOrder) => {
    setSelectedOrder(order);
    setAssignDialogOpen(true);
  };

  const handleAssignSuccess = () => {
    setAssignDialogOpen(false);
    setSelectedOrder(null);
    refetchOrders();
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
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateId = (id: string) => {
    return `${id.slice(0, 8)}...`;
  };

  if (ordersError) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                Error loading orders: {ordersError.message}
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
            <p className="text-muted-foreground">
              Manage and track all orders for your services
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter orders by status, service, driver, or date range
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select
                  value={filters.status || ''}
                  onValueChange={(value) => handleFilterChange('status', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service Filter */}
              <div className="space-y-2">
                <Label htmlFor="service-filter">Service</Label>
                <Select
                  value={filters.serviceId || ''}
                  onValueChange={(value) => handleFilterChange('serviceId', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All services</SelectItem>
                    {services?.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Driver Filter */}
              <div className="space-y-2">
                <Label htmlFor="driver-filter">Driver</Label>
                <Select
                  value={filters.driverId || ''}
                  onValueChange={(value) => handleFilterChange('driverId', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All drivers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All drivers</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {drivers?.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From Filter */}
              <div className="space-y-2">
                <Label htmlFor="date-from">Date From</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <Label htmlFor="date-to">Date To</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
                  className="w-auto"
                />
              </div>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Orders {ordersResponse?.meta && `(${ordersResponse.meta.total} total)`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !ordersResponse?.data.length ? (
              <div className="text-center py-8 text-muted-foreground">
                No orders found matching your filters
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordersResponse.data.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          {truncateId(order.id)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getOrderStatusBadgeVariant(order.status)}>
                            {order.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {order.service?.name || 'Unknown Service'}
                        </TableCell>
                        <TableCell>
                          {order.driver?.name || (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {order.ordererIdentifier}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(order.estimatedCost)}
                        </TableCell>
                        <TableCell>
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <Link to={`/orders/${order.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            {canAssignDriver(order) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAssignDriver(order)}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {ordersResponse.meta.totalPages > 1 && (
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Page {ordersResponse.meta.page} of {ordersResponse.meta.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={ordersResponse.meta.page <= 1}
                        onClick={() => handleFilterChange('page', ordersResponse.meta.page - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={ordersResponse.meta.page >= ordersResponse.meta.totalPages}
                        onClick={() => handleFilterChange('page', ordersResponse.meta.page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assign Driver Dialog */}
        {selectedOrder && (
          <AssignDriverDialog
            order={selectedOrder}
            isOpen={assignDialogOpen}
            onOpenChange={setAssignDialogOpen}
            onSuccess={handleAssignSuccess}
          />
        )}
      </div>
    </Layout>
  );
} 