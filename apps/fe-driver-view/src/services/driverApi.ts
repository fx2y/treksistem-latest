// Driver API service functions
// These will be implemented when the backend API is ready

export interface DriverOrder {
  id: string;
  serviceId: string;
  serviceName: string;
  status: 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  pickupAddress: string;
  deliveryAddress: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  dueDate?: string;
}

export interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  status: 'active' | 'inactive';
}

// Placeholder functions - will be implemented when backend is ready
export const driverApi = {
  // Get driver profile
  getDriverProfile: async (_driverId: string): Promise<DriverProfile> => {
    // TODO: Implement actual API call to /api/drivers/:driverId
    throw new Error('Driver API not implemented yet');
  },

  // Get assigned orders for driver
  getAssignedOrders: async (_driverId: string): Promise<DriverOrder[]> => {
    // TODO: Implement actual API call to /api/drivers/:driverId/orders
    throw new Error('Driver API not implemented yet');
  },

  // Accept an assigned order
  acceptOrder: async (_driverId: string, _orderId: string): Promise<void> => {
    // TODO: Implement actual API call to /api/drivers/:driverId/orders/:orderId/accept
    throw new Error('Driver API not implemented yet');
  },

  // Update order status
  updateOrderStatus: async (
    _driverId: string, 
    _orderId: string, 
    _status: DriverOrder['status'],
    _notes?: string
  ): Promise<void> => {
    // TODO: Implement actual API call to /api/drivers/:driverId/orders/:orderId/status
    throw new Error('Driver API not implemented yet');
  },

  // Upload proof photo
  uploadProofPhoto: async (_driverId: string, _orderId: string, _file: File): Promise<string> => {
    // TODO: Implement actual API call to get pre-signed URL and upload to R2
    throw new Error('Driver API not implemented yet');
  },
}; 