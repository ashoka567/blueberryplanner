import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import * as api from "@/lib/api";

import Dashboard from "@/pages/Dashboard";
import CalendarPage from "@/pages/Calendar";
import MedicationsPage from "@/pages/Medications";
import ChoresPage from "@/pages/Chores";
import GroceriesPage from "@/pages/Groceries";
import Reminders from "@/pages/Reminders";
import Settings from "@/pages/Settings";
import NotificationsPage from "@/pages/Notifications";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import KidLogin from "@/pages/KidLogin";
import NotFound from "@/pages/not-found";
import SuperAdmin from "@/pages/SuperAdmin";

function AuthenticatedRouter() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const { data: authData, isLoading } = useQuery({
    queryKey: ['auth'],
    queryFn: api.getMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const handleAuthSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['auth'] });
    queryClient.invalidateQueries({ queryKey: ['families'] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-[#D2691E] flex items-center justify-center text-white text-3xl animate-pulse">
            🫐
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authData?.authenticated) {
    return (
      <Switch>
        <Route path="/super-admin" component={SuperAdmin} />
        <Route path="/register">
          <Register onRegisterSuccess={handleAuthSuccess} />
        </Route>
        <Route path="/login">
          <Login onLoginSuccess={handleAuthSuccess} />
        </Route>
        <Route path="/kid-login">
          <KidLogin onLoginSuccess={handleAuthSuccess} />
        </Route>
        <Route>
          <Login onLoginSuccess={handleAuthSuccess} />
        </Route>
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/calendar" component={CalendarPage} />
        <Route path="/medications" component={MedicationsPage} />
        <Route path="/chores" component={ChoresPage} />
        <Route path="/groceries" component={GroceriesPage} />
        <Route path="/reminders" component={Reminders} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/settings" component={Settings} />
        <Route path="/login">
          {() => {
            setLocation('/');
            return null;
          }}
        </Route>
        <Route path="/register">
          {() => {
            setLocation('/');
            return null;
          }}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthenticatedRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
