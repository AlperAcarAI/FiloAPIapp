import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import ApiDetails from "@/pages/api-details";
import VarlikTest from "@/pages/varlik-test";
import ApiTest from "@/pages/api-test";
import DocumentManagement from "@/pages/document-management";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/api/:id" component={ApiDetails} />
      <Route path="/test" component={VarlikTest} />
      <Route path="/api-test" component={ApiTest} />
      <Route path="/documents" component={DocumentManagement} />
      <Route path="/login" component={Login} />
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
