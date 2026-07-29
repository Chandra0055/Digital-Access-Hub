import { useAdminListSubscriptions, getAdminListSubscriptionsQueryKey } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/status-badge';
import { format } from 'date-fns';

export function SubscriptionsTab() {
  const { data: subscriptions, isLoading } = useAdminListSubscriptions({
    query: { queryKey: getAdminListSubscriptionsQueryKey() },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="border border-card-border bg-card rounded">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Plan Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Expires</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions?.map((sub) => (
            <TableRow key={sub.id} data-testid={`row-subscription-${sub.id}`}>
              <TableCell>
                <div>
                  <p className="font-medium">{sub.user?.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">{sub.user?.email}</p>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm font-mono uppercase">{sub.planType}</span>
              </TableCell>
              <TableCell>
                <StatusBadge status={sub.status} />
              </TableCell>
              <TableCell>
                <span className="text-sm font-mono text-muted-foreground">
                  {format(new Date(sub.createdAt), 'MMM dd, yyyy')}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm font-mono text-muted-foreground">
                  {sub.expiresAt ? format(new Date(sub.expiresAt), 'MMM dd, yyyy') : 'Never'}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
