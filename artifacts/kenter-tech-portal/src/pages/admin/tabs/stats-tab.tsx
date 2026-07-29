import { useAdminGetStats, getAdminGetStatsQueryKey } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Package, CreditCard, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export function StatsTab() {
  const { data: stats, isLoading } = useAdminGetStats({
    query: { queryKey: getAdminGetStatsQueryKey() },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          label="Revenue"
          value="$0"
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-card-border bg-card rounded p-6">
          <h3 className="text-lg font-semibold mb-4">Tools by Category</h3>
          <div className="space-y-3">
            {stats?.toolsByCategory.map((item) => (
              <div key={item.category} className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{item.category}</span>
                <span className="text-sm font-mono font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-card-border bg-card rounded p-6">
          <h3 className="text-lg font-semibold mb-4">Subscriptions by Plan</h3>
          <div className="space-y-3">
            {stats?.subscriptionsByPlan.map((item) => (
              <div key={item.planType} className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground capitalize">{item.planType}</span>
                <span className="text-sm font-mono font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border border-card-border bg-card rounded p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Users</h3>
        <div className="space-y-2">
          {stats?.recentUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{user.email}</p>
              </div>
              <span className="text-xs font-mono text-muted-foreground uppercase">{user.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
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
