import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { SidebarProvider } from "@/components/layout/Sidebar";

import AuthPage from "@/pages/AuthPage";
import Discover from "@/pages/Discover";
import MyLeads from "@/pages/MyLeads";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/auth" />;
  }

  return <Component {...rest} />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/auth">
        {isAuthenticated ? <Redirect to="/discover" /> : <AuthPage />}
      </Route>
      
      {/* Protected Routes */}
      <Route path="/discover">
        {() => <ProtectedRoute component={Discover} />}
      </Route>
      <Route path="/leads">
        {() => <ProtectedRoute component={MyLeads} />}
      </Route>
      
      {/* Redirect root to discover or auth */}
      <Route path="/">
        {isAuthenticated ? <Redirect to="/discover" /> : <Redirect to="/auth" />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider>
          <Toaster />
          <Router />
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
