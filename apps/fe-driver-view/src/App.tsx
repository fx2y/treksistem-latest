import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AssignedOrdersPage } from '@/pages/AssignedOrdersPage';
import { DriverOrderDetailPage } from '@/pages/DriverOrderDetailPage';

// Wrapper for the AssignedOrdersPage that extracts driverId from URL
function AssignedOrdersPageWrapper() {
  const { driverId } = useParams<{ driverId: string }>();
  if (!driverId) return <Navigate to="/invalid-access" replace />;
  return <AssignedOrdersPage driverId={driverId} />;
}

function InvalidAccessPage() {
  return (
    <div className="p-4 text-center">
      <h1 className="text-2xl font-bold text-destructive mb-4">Invalid Access</h1>
      <p className="text-muted-foreground">Driver ID not provided or invalid.</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename="/">
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          {/* The driverId in the path IS the authentication token for MVP */}
          <Route path="/view/:driverId" element={<AssignedOrdersPageWrapper />} />
          <Route path="/view/:driverId/order/:orderId" element={<DriverOrderDetailPage />} />
          <Route path="/invalid-access" element={<InvalidAccessPage />} />
          <Route path="/" element={<Navigate to="/invalid-access" replace />} />
          <Route path="*" element={<div className="p-4 text-center"><h1 className="text-2xl font-bold">404 - Not Found</h1></div>} />
        </Routes>
      </div>
      <Toaster />
    </BrowserRouter>
  );
}

export default App; 