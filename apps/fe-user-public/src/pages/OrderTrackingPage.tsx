import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Package, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Car, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle, 
  Truck, 
  Camera,
  MessageSquare,
  MapPin as LocationIcon,
  DollarSign
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchOrderTrackingDetails } from '@/services/publicApi';

/**
 * Get status badge variant based on order status
 */
function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'DELIVERED':
      return 'default';
    case 'CANCELLED_BY_USER':
    case 'CANCELLED_BY_MITRA':
    case 'CANCELLED_BY_DRIVER':
    case 'FAILED_DELIVERY':
      return 'destructive';
    case 'PENDING':
    case 'PENDING_DRIVER_ASSIGNMENT':
      return 'secondary';
    default:
      return 'outline';
  }
}

/**
 * Get human-readable status text
 */
function getStatusText(status: string): string {
  switch (status) {
    case 'PENDING': return 'Menunggu Konfirmasi';
    case 'ACCEPTED_BY_MITRA': return 'Diterima Mitra';
    case 'PENDING_DRIVER_ASSIGNMENT': return 'Mencari Driver';
    case 'DRIVER_ASSIGNED': return 'Driver Ditugaskan';
    case 'REJECTED_BY_DRIVER': return 'Ditolak Driver';
    case 'ACCEPTED_BY_DRIVER': return 'Diterima Driver';
    case 'DRIVER_AT_PICKUP': return 'Driver di Lokasi Jemput';
    case 'PICKED_UP': return 'Barang Diambil';
    case 'IN_TRANSIT': return 'Dalam Perjalanan';
    case 'DRIVER_AT_DROPOFF': return 'Driver di Lokasi Antar';
    case 'DELIVERED': return 'Terkirim';
    case 'CANCELLED_BY_USER': return 'Dibatalkan Pengguna';
    case 'CANCELLED_BY_MITRA': return 'Dibatalkan Mitra';
    case 'CANCELLED_BY_DRIVER': return 'Dibatalkan Driver';
    case 'FAILED_DELIVERY': return 'Gagal Kirim';
    case 'REFUNDED': return 'Dikembalikan';
    default: return status;
  }
}

/**
 * Get event icon based on event type
 */
function getEventIcon(eventType: string) {
  switch (eventType) {
    case 'STATUS_UPDATE': return <CheckCircle className="h-4 w-4" />;
    case 'PHOTO_UPLOADED': return <Camera className="h-4 w-4" />;
    case 'LOCATION_UPDATE': return <LocationIcon className="h-4 w-4" />;
    case 'NOTE_ADDED': return <MessageSquare className="h-4 w-4" />;
    case 'PAYMENT_UPDATE': return <DollarSign className="h-4 w-4" />;
    case 'ASSIGNMENT_CHANGED': return <User className="h-4 w-4" />;
    case 'COST_UPDATED': return <DollarSign className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
}

/**
 * Get human-readable event type text
 */
function getEventTypeText(eventType: string): string {
  switch (eventType) {
    case 'STATUS_UPDATE': return 'Status Diperbarui';
    case 'PHOTO_UPLOADED': return 'Foto Bukti';
    case 'LOCATION_UPDATE': return 'Lokasi Diperbarui';
    case 'NOTE_ADDED': return 'Catatan Ditambahkan';
    case 'PAYMENT_UPDATE': return 'Pembayaran Diperbarui';
    case 'ASSIGNMENT_CHANGED': return 'Penugasan Driver';
    case 'COST_UPDATED': return 'Biaya Diperbarui';
    default: return eventType;
  }
}

/**
 * Format timestamp to readable date string
 */
function formatTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp * 1000));
}

/**
 * Format currency to Indonesian Rupiah
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();

  const { 
    data: orderData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['orderTracking', orderId],
    queryFn: () => fetchOrderTrackingDetails(orderId!),
    enabled: !!orderId,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  if (!orderId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              ID Order Tidak Valid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>ID order tidak ditemukan dalam URL.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Memuat Data Order...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Order Tidak Ditemukan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Order dengan ID <code className="bg-muted px-2 py-1 rounded">{orderId}</code> tidak ditemukan atau tidak dapat diakses.</p>
            <Button 
              onClick={() => refetch()} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lacak Order</h1>
          <p className="text-muted-foreground">ID: {orderData.id}</p>
        </div>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Order Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Status Order
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant={getStatusBadgeVariant(orderData.status)} className="text-sm">
              {getStatusText(orderData.status)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Dibuat: {formatTimestamp(orderData.createdAt)}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Layanan</p>
              <p className="text-sm text-muted-foreground">{orderData.serviceName}</p>
              <p className="text-xs text-muted-foreground">Mitra: {orderData.mitraName}</p>
            </div>
            
            {(orderData.estimatedCost || orderData.finalCost) && (
              <div>
                <p className="font-medium">Biaya</p>
                {orderData.finalCost ? (
                  <p className="text-sm">{formatCurrency(orderData.finalCost)} <span className="text-muted-foreground">(Final)</span></p>
                ) : (
                  <p className="text-sm text-muted-foreground">{formatCurrency(orderData.estimatedCost!)} (Estimasi)</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Driver Information */}
      {orderData.driver && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Informasi Driver
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{orderData.driver.name}</span>
            </div>
            
            {orderData.driver.phoneNumber && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={`tel:${orderData.driver.phoneNumber}`}
                  className="text-blue-600 hover:underline"
                >
                  {orderData.driver.phoneNumber}
                </a>
              </div>
            )}
            
            {orderData.driver.vehicleInfo && (
              <div className="flex items-center gap-3">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{orderData.driver.vehicleInfo}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Address Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Alamat Jemput
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{orderData.pickupAddress.text}</p>
            {orderData.pickupAddress.notes && (
              <p className="text-xs text-muted-foreground mt-1">
                Catatan: {orderData.pickupAddress.notes}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-600" />
              Alamat Antar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{orderData.dropoffAddress.text}</p>
            {orderData.dropoffAddress.notes && (
              <p className="text-xs text-muted-foreground mt-1">
                Catatan: {orderData.dropoffAddress.notes}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Events Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Riwayat Order
          </CardTitle>
          <CardDescription>
            Timeline aktivitas order Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orderData.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada aktivitas</p>
          ) : (
            <div className="space-y-4">
              {orderData.events
                .sort((a, b) => b.timestamp - a.timestamp) // Show latest first
                .map((event) => (
                  <div key={event.id} className="flex gap-3 pb-4 border-b last:border-b-0">
                    <div className="flex-shrink-0 mt-1">
                      {getEventIcon(event.eventType)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">
                          {getEventTypeText(event.eventType)}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>
                      
                      {/* Event-specific content */}
                      {event.dataJson.newStatus && (
                        <p className="text-sm text-muted-foreground">
                          Status: {getStatusText(event.dataJson.newStatus)}
                          {event.dataJson.reason && ` - ${event.dataJson.reason}`}
                        </p>
                      )}
                      
                      {event.dataJson.note && (
                        <p className="text-sm bg-muted p-2 rounded">
                          {event.dataJson.note}
                          {event.dataJson.author && (
                            <span className="text-xs text-muted-foreground block mt-1">
                              - {event.dataJson.author}
                            </span>
                          )}
                        </p>
                      )}
                      
                      {/* Photo display */}
                      {(event.dataJson.photoR2Key || event.dataJson.photoUrl) && (
                        <div className="space-y-2">
                          {event.dataJson.photoType && (
                            <p className="text-xs text-muted-foreground">
                              Jenis foto: {event.dataJson.photoType.replace('_', ' ')}
                            </p>
                          )}
                          {event.dataJson.caption && (
                            <p className="text-sm italic">{event.dataJson.caption}</p>
                          )}
                          <div className="bg-muted p-2 rounded text-xs text-center">
                            📷 Foto bukti tersedia
                            {/* Note: Actual image display would require handling R2 URLs */}
                          </div>
                        </div>
                      )}
                      
                      {/* Location update */}
                      {event.dataJson.lat && event.dataJson.lon && (
                        <p className="text-sm text-muted-foreground">
                          📍 Lokasi: {event.dataJson.lat.toFixed(6)}, {event.dataJson.lon.toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 