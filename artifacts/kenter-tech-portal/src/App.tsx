import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, Redirect } from 'wouter';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { Sidebar } from '@/components/sidebar';
import LoginPage from '@/pages/login';
import SignupPage from '@/pages/signup';
import DashboardPage from '@/pages/dashboard';
import ToolsPage from '@/pages/tools';
import AccountPage from '@/pages/account';
import AdminPage from '@/pages/admin';
import ToolFormPage from '@/pages/admin/tool-form';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <Redirect to={user ? '/dashboard' : '/login'} />;
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />

      <Route path="/login">
        <AuthLayout>
          <LoginPage />
        </AuthLayout>
      </Route>

      <Route path="/signup">
        <AuthLayout>
          <SignupPage />
        </AuthLayout>
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute>
          <AppLayout>
            <DashboardPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/tools">
        <ProtectedRoute>
          <AppLayout>
            <ToolsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/account">
        <ProtectedRoute>
          <AppLayout>
            <AccountPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin">
        <ProtectedRoute requireAdmin>
          <AppLayout>
            <AdminPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/tools/new">
        <ProtectedRoute requireAdmin>
          <AppLayout>
            <ToolFormPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/tools/:id/edit">
        <ProtectedRoute requireAdmin>
          <AppLayout>
            <ToolFormPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
