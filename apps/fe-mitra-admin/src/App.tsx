import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DashboardPage } from "@/pages/DashboardPage";

function HomePage() { 
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-4xl font-bold text-foreground mb-6">Mitra Admin Portal</h1>
      <div className="space-y-4">
        <nav className="space-y-2">
          <Link 
            to="/dashboard" 
            className="block text-primary hover:text-primary/80 underline"
          >
            Go to Dashboard
          </Link>
          <Link 
            to="/login-placeholder" 
            className="block text-primary hover:text-primary/80 underline"
          >
            Login (Placeholder)
          </Link>
        </nav>
        <div className="pt-4">
          <Button 
            onClick={() => toast.success("Shadcn/ui setup is working!")}
            className="mr-4"
          >
            Test Toast
          </Button>
          <Button variant="outline">
            Test Button
          </Button>
        </div>
      </div>
    </div>
  ); 
}

function LoginPagePlaceholder() { 
  return (
    <div className="min-h-screen bg-background p-8">
      <h2 className="text-2xl font-semibold text-foreground mb-4">Login Page Placeholder</h2>
      <p className="text-muted-foreground">Actual login via Cloudflare Access.</p>
      <Link 
        to="/" 
        className="block mt-4 text-primary hover:text-primary/80 underline"
      >
        Back to Home
      </Link>
    </div>
  ); 
}

function NotFoundPage() { 
  return (
    <div className="min-h-screen bg-background p-8">
      <h2 className="text-2xl font-semibold text-destructive">404 - Page Not Found</h2>
      <Link 
        to="/" 
        className="block mt-4 text-primary hover:text-primary/80 underline"
      >
        Back to Home
      </Link>
    </div>
  ); 
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/login-placeholder" element={<LoginPagePlaceholder />} />
        {/* Add other routes for services, drivers, orders later */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App; 