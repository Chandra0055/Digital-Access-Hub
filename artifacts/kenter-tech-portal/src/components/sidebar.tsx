import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { LayoutDashboard, Package, User, Shield, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLogout } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout: authLogout } = useAuth();
  const queryClient = useQueryClient();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        authLogout();
      },
    });
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tools', label: 'Available Tools', icon: Package },
    { href: '/account', label: 'My Account', icon: User },
  ];

  const isAdmin = user?.role === 'admin';

  return (
    <aside className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold tracking-tight text-sidebar-foreground">
          KENTER<span className="text-primary">_TECH</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1 font-mono">PORTAL v2.1</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={`nav-${item.href.replace('/', '')}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="pt-4 mt-4 border-t border-sidebar-border">
              <p className="text-xs font-mono text-muted-foreground px-3 mb-2">ADMIN</p>
              <Link
                href="/admin"
                data-testid="nav-admin"
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors',
                  location.startsWith('/admin')
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )}
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
            </div>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground font-mono truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          data-testid="button-logout"
          className="w-full justify-start"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
