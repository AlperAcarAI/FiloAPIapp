import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import Home from "@/pages/home";
import ApiDetails from "@/pages/api-details";
import VarlikTest from "@/pages/varlik-test";
import ApiCenter from "@/pages/api-center";
import ApiStatus from "@/pages/api-status";
import DocumentManagement from "@/pages/document-management";
import Dashboard from "@/pages/Dashboard";
import Analytics from "@/pages/Analytics";
import BulkImport from "@/pages/BulkImport";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import AdminTenants from "@/pages/AdminTenants";

function ProtectedRoute({ component: Component }: { component: any }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      // Development mode - skip authentication for faster testing
      if (process.env.NODE_ENV === 'development') {
        setIsAuthenticated(true);
        return;
      }

      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      // Verify token is still valid
      try {
        const response = await fetch('/api/test-auth', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        }
      } catch (error) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  if (!isAuthenticated && process.env.NODE_ENV !== 'development') {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/api/:id" component={() => <ProtectedRoute component={ApiDetails} />} />
      <Route path="/test" component={() => <ProtectedRoute component={VarlikTest} />} />
      <Route path="/api-center" component={() => <ProtectedRoute component={ApiCenter} />} />
      <Route path="/api-status" component={() => <ProtectedRoute component={ApiStatus} />} />
      <Route path="/documents" component={() => <ProtectedRoute component={DocumentManagement} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={Analytics} />} />
      <Route path="/bulk-import" component={() => <ProtectedRoute component={BulkImport} />} />
      <Route path="/admin/tenants" component={() => <ProtectedRoute component={AdminTenants} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
