import { useAuth } from '@/contexts/auth-context';
import { useListTools, useAdminGetStats, getListToolsQueryKey, getAdminGetStatsQueryKey } from '@workspace/api-client-react';
import { StatusBadge } from '@/components/status-badge';
import { Package, Users, CreditCard, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data: tools, isLoading: toolsLoading } = useListTools(undefined, {
    query: { queryKey: getListToolsQueryKey() },
  });

  const { data: stats, isLoading: statsLoading } = useAdminGetStats({
    query: {
      enabled: isAdmin,
      queryKey: getAdminGetStatsQueryKey(),
    },
  });

  const activeTools = tools?.filter((t) => t.status === 'active') || [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Welcome back, {user?.name}
          </h1>
          <p className="text-muted-foreground">
            Your subscription is <StatusBadge status={user?.subscriptionStatus || 'inactive'} />
          </p>
        </div>

        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {statsLoading ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </>
            ) : (
              <>
                <StatCard
                  icon={Users}
                  label="Total Users"
                  value={stats?.totalUsers || 0}
                  delay={0}
                />
                <StatCard
                  icon={Package}
                  label="Total Tools"
                  value={stats?.totalTools || 0}
                  delay={0.1}
                />
                <StatCard
                  icon={CreditCard}
                  label="Active Subscriptions"
                  value={stats?.activeSubscriptions || 0}
                  delay={0.2}
                />
                <StatCard
                  icon={TrendingUp}
                  label="Active Tools"
                  value={activeTools.length}
                  delay={0.3}
                />
              </>
            )}
          </div>
        )}

        <div className="border border-card-border bg-card rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
          <div className="space-y-4">
            {toolsLoading ? (
              <>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Available Tools</span>
                  <span className="text-sm font-mono font-semibold">{activeTools.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Your Role</span>
                  <span className="text-sm font-mono font-semibold uppercase">{user?.role}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Account Status</span>
                  <StatusBadge status={user?.subscriptionStatus || 'inactive'} />
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  delay: number;
}

function StatCard({ icon: Icon, label, value, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="border border-card-border bg-card rounded p-6"
      data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
      </div>
      <p className="text-3xl font-bold font-mono">{value}</p>
    </motion.div>
  );
}
