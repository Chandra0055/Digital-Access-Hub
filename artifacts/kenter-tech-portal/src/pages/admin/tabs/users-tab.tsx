import { useAdminListUsers, useAdminUpdateUser, getAdminListUsersQueryKey } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { StatusBadge } from '@/components/status-badge';

export function UsersTab() {
  const { data: users, isLoading } = useAdminListUsers({
    query: { queryKey: getAdminListUsersQueryKey() },
  });
  const updateUserMutation = useAdminUpdateUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleRoleChange = (userId: number, role: 'admin' | 'subscriber') => {
    updateUserMutation.mutate(
      { id: userId, data: { role } },
      {
        onSuccess: () => {
          toast({ title: 'User role updated' });
          queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
        },
        onError: (error: any) => {
          toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
        },
      }
    );
  };

  const handleStatusChange = (userId: number, subscriptionStatus: 'active' | 'inactive' | 'trial' | 'expired') => {
    updateUserMutation.mutate(
      { id: userId, data: { subscriptionStatus } },
      {
        onSuccess: () => {
          toast({ title: 'User status updated' });
          queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
        },
        onError: (error: any) => {
          toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
        },
      }
    );
  };

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
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => (
            <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
              <TableCell>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">{user.email}</p>
                </div>
              </TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(v) => handleRoleChange(user.id, v as 'admin' | 'subscriber')}
                  data-testid={`select-role-${user.id}`}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subscriber">Subscriber</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  value={user.subscriptionStatus}
                  onValueChange={(v) => handleStatusChange(user.id, v as any)}
                  data-testid={`select-status-${user.id}`}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <span className="text-sm font-mono text-muted-foreground">
                  {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
