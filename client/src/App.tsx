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
import DocumentManagement from "@/pages/document-management";
import Dashboard from "@/pages/Dashboard";
import Analytics from "@/pages/Analytics";
import BulkImport from "@/pages/BulkImport";
// Login kaldırıldı - artık authentication yok
import NotFound from "@/pages/not-found";
import AdminTenants from "@/pages/AdminTenants";

// ProtectedRoute kaldırıldı - artık authentication yok

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/api/:id" component={ApiDetails} />
      <Route path="/test" component={VarlikTest} />
      <Route path="/api-center" component={ApiCenter} />
      <Route path="/documents" component={DocumentManagement} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/bulk-import" component={BulkImport} />
      <Route path="/admin/tenants" component={AdminTenants} />
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
