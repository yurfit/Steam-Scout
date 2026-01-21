import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useClerkAuth } from "@/hooks/use-clerk-auth";
import { Loader2 } from "lucide-react";
import { SidebarProvider } from "@/components/layout/Sidebar";
import { ClerkProvider } from '@clerk/clerk-react';
import { GDPRConsent } from '@/components/GDPRConsent';
import '@/lib/i18n';

import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import Discover from "@/pages/Discover";
import MyLeads from "@/pages/MyLeads";
import NotFound from "@/pages/not-found";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useClerkAuth();

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
  const { isAuthenticated, isLoading } = useClerkAuth();

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
        {isAuthenticated ? <Redirect to="/" /> : <AuthPage />}
      </Route>
      
      {/* Protected Routes - specific paths first, then root */}
      <Route path="/discover">
        {() => <ProtectedRoute component={Discover} />}
      </Route>
      <Route path="/leads">
        {() => <ProtectedRoute component={MyLeads} />}
      </Route>
      <Route path="/">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SidebarProvider>
            <Toaster />
            <GDPRConsent />
            <Router />
          </SidebarProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
