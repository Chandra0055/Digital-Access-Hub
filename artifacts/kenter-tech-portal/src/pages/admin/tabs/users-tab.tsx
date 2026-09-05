import { useState } from 'react';
import {
  useAdminListUsers,
  useAdminCreateUser,
  useAdminUpdateUser,
  useAdminDeleteUser,
  useAdminSetUserTools,
  getAdminListUsersQueryKey,
  useListTools,
  getListToolsQueryKey,
} from '@workspace/api-client-react';
import type { UserWithSubscription } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';
import { Plus, Trash2, Settings2, Calendar, Infinity, CalendarDays, Hash, ShieldOff, Clock, CalendarX, RefreshCw, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ─── Validity preset helper ─────────────────────────────────────────────────

type ValidityPreset = '0' | '1' | '7' | '25' | '90' | 'unlimited' | 'custom';

const PRESET_LABELS: Record<ValidityPreset, string> = {
  '0': '0 Days',
  '1': '1 Day',
  '7': '7 Days',
  '25': '25 Days',
  '90': '90 Days',
  'unlimited': 'Unlimited',
  'custom': 'Custom',
};

type ValidityMode = 'days' | 'date';

function ValidityPicker({
  mode,
  preset,
  customDays,
  exactDate,
  onMode,
  onPreset,
  onCustomDays,
  onExactDate,
}: {
  mode: ValidityMode;
  preset: ValidityPreset;
  customDays: string;
  exactDate: string;
  onMode: (v: ValidityMode) => void;
  onPreset: (v: ValidityPreset) => void;
  onCustomDays: (v: string) => void;
  onExactDate: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden w-fit">
        <button
          type="button"
          onClick={() => onMode('days')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === 'days'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Hash className="w-3 h-3" /> Days from today
        </button>
        <button
          type="button"
          onClick={() => onMode('date')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-border ${
            mode === 'date'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <CalendarDays className="w-3 h-3" /> Pick exact date
        </button>
      </div>

      {mode === 'days' ? (
        <>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(PRESET_LABELS) as [ValidityPreset, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => onPreset(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  preset === key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {preset === 'custom' && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                placeholder="Number of days"
                value={customDays}
                onChange={(e) => onCustomDays(e.target.value)}
                className="w-40 h-8 text-sm"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={exactDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => onExactDate(e.target.value)}
            className="w-48 h-8 text-sm"
          />
          {exactDate && (
            <span className="text-xs text-muted-foreground">
              Expires {format(new Date(exactDate), 'MMM d, yyyy')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function getAccessDays(mode: ValidityMode, preset: ValidityPreset, customDays: string, exactDate: string): number | undefined {
  if (mode === 'date') {
    if (!exactDate) return undefined;
    const days = Math.ceil((new Date(exactDate).getTime() - Date.now()) / 86_400_000);
    return days > 0 ? days : 1;
  }
  if (preset === 'unlimited') return undefined;
  if (preset === 'custom') return customDays ? parseInt(customDays, 10) : undefined;
  return parseInt(preset, 10);
}

// ─── Tool access picker ──────────────────────────────────────────────────────

function ToolAccessPicker({
  allToolIds,
  allToolNames,
  selectedIds,
  onChange,
}: {
  allToolIds: number[];
  allToolNames: Map<number, string>;
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const allSelected = selectedIds.length === 0;

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
      {/* "All Ai Blasts" option */}
      <label className="flex items-center gap-2 cursor-pointer py-1">
        <Checkbox
          checked={allSelected}
          onCheckedChange={(c) => c && onChange([])}
        />
        <span className="text-sm font-medium">All Ai Blasts</span>
        <span className="text-xs text-muted-foreground ml-1">(no restriction)</span>
      </label>
      <div className="border-t border-border my-1" />
      {allToolIds.map((id) => (
        <label key={id} className="flex items-center gap-2 cursor-pointer py-0.5">
          <Checkbox
            checked={selectedIds.includes(id)}
            onCheckedChange={(c) => {
              if (c) {
                onChange([...selectedIds, id]);
              } else {
                onChange(selectedIds.filter((x) => x !== id));
              }
            }}
          />
          <span className="text-sm">{allToolNames.get(id)}</span>
        </label>
      ))}
    </div>
  );
}

// ─── Create user dialog ──────────────────────────────────────────────────────

function CreateUserDialog({
  open,
  onClose,
  allToolIds,
  allToolNames,
}: {
  open: boolean;
  onClose: () => void;
  allToolIds: number[];
  allToolNames: Map<number, string>;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'subscriber' | 'admin'>('subscriber');
  const [validityMode, setValidityMode] = useState<ValidityMode>('days');
  const [preset, setPreset] = useState<ValidityPreset>('7');
  const [customDays, setCustomDays] = useState('');
  const [exactDate, setExactDate] = useState('');
  const [toolIds, setToolIds] = useState<number[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useAdminCreateUser();
  const setToolsMutation = useAdminSetUserTools();

  const reset = () => {
    setName(''); setEmail(''); setPassword('');
    setRole('subscriber'); setValidityMode('days');
    setPreset('7'); setCustomDays(''); setExactDate(''); setToolIds([]);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const accessDays = getAccessDays(validityMode, preset, customDays, exactDate);

    createMutation.mutate(
      {
        data: {
          name,
          email,
          password,
          role,
          toolIds,
          ...(accessDays === null || accessDays === undefined ? {} : { accessDays }),
        },
      },
      {
        onSuccess: async (newUser) => {
          if (toolIds.length > 0) {
            await setToolsMutation.mutateAsync({ id: newUser.id, data: { toolIds } });
          }
          toast({ title: 'Customer created', description: `${name} can now log in.` });
          queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
          handleClose();
        },
        onError: (err: any) => {
          toast({ title: 'Failed to create customer', description: err.message, variant: 'destructive' });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-name">Full name</Label>
              <Input id="new-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jane Smith" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-email">Email</Label>
              <Input id="new-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="jane@company.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Password</Label>
              <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min 6 characters" minLength={6} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscriber">Subscriber</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Subscription Expiry</Label>
            <ValidityPicker
              mode={validityMode} preset={preset} customDays={customDays} exactDate={exactDate}
              onMode={setValidityMode} onPreset={setPreset} onCustomDays={setCustomDays} onExactDate={setExactDate}
            />
          </div>

          {allToolIds.length > 0 && (
            <div className="space-y-1.5">
              <Label>Ai Blast Access</Label>
              <ToolAccessPicker
                allToolIds={allToolIds}
                allToolNames={allToolNames}
                selectedIds={toolIds}
                onChange={setToolIds}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Manage user dialog ───────────────────────────────────────────────────────

function ManageUserDialog({
  user,
  onClose,
  allToolIds,
  allToolNames,
}: {
  user: UserWithSubscription;
  onClose: () => void;
  allToolIds: number[];
  allToolNames: Map<number, string>;
}) {
  const [validityMode, setValidityMode] = useState<ValidityMode>('days');
  const [preset, setPreset] = useState<ValidityPreset>('7');
  const [customDays, setCustomDays] = useState('');
  const [exactDate, setExactDate] = useState('');
  const [toolIds, setToolIds] = useState<number[]>(user.toolIds ?? []);
  const [role, setRole] = useState<'admin' | 'subscriber'>(user.role as any);
  const [status, setStatus] = useState(user.subscriptionStatus);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateMutation = useAdminUpdateUser();
  const setToolsMutation = useAdminSetUserTools();

  const handleSave = async () => {
    const accessDays = getAccessDays(validityMode, preset, customDays, exactDate);
    // Clear expiry if unlimited is selected in days mode.
    const accessDaysPayload =
      validityMode === 'days' && preset === 'unlimited' && user.validUntil
        ? { accessDays: null }
        : accessDays !== undefined
        ? { accessDays }
        : {};

    try {
      await updateMutation.mutateAsync({
        id: user.id,
        data: { role: role as any, subscriptionStatus: status as any, ...accessDaysPayload },
      });
      await setToolsMutation.mutateAsync({ id: user.id, data: { toolIds } });

      toast({ title: 'Customer updated' });
      queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
      onClose();
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    }
  };

  const currentExpiry = user.validUntil ? new Date(user.validUntil) : null;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage: {user.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Current expiry info */}
          {currentExpiry && (
            <div className={`text-xs rounded-lg px-3 py-2 border ${isPast(currentExpiry) ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
              {isPast(currentExpiry)
                ? `⚠ Subscription expired on ${format(currentExpiry, 'MMM d, yyyy')}`
                : `Subscription expires ${format(currentExpiry, 'MMM d, yyyy')}`}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscriber">Subscriber</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subscription Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Subscription Expiry</Label>
            <ValidityPicker
              mode={validityMode} preset={preset} customDays={customDays} exactDate={exactDate}
              onMode={setValidityMode} onPreset={setPreset} onCustomDays={setCustomDays} onExactDate={setExactDate}
            />
          </div>

          {allToolIds.length > 0 && (
            <div className="space-y-1.5">
              <Label>Ai Blast Access</Label>
              <ToolAccessPicker
                allToolIds={allToolIds}
                allToolNames={allToolNames}
                selectedIds={toolIds}
                onChange={setToolIds}
              />
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending || setToolsMutation.isPending}>
            {(updateMutation.isPending || setToolsMutation.isPending) ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const EXPIRING_SOON_DAYS = 7;
type ExpiryFilter = 'all' | 'expiring' | 'expired';
export function UsersTab() {
  const [createOpen, setCreateOpen] = useState(false);
  const [managingUser, setManagingUser] = useState<UserWithSubscription | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserWithSubscription | null>(null);
  const [revokingUser, setRevokingUser] = useState<UserWithSubscription | null>(null);
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>('all');
  const [search, setSearch] = useState('');

  const { data: users, isLoading } = useAdminListUsers({
    query: { queryKey: getAdminListUsersQueryKey() },
  });
  const { data: tools } = useListTools(undefined, {
    query: { queryKey: getListToolsQueryKey() },
  });
  const deleteUserMutation = useAdminDeleteUser();
  const revokeUserMutation = useAdminUpdateUser();
  const extendMutation = useAdminUpdateUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const allToolIds = tools?.map((t) => t.id) ?? [];
  const allToolNames = new Map(tools?.map((t) => [t.id, t.name]) ?? []);

  const handleExtend = (user: UserWithSubscription) => {
    // accessDays is always "days from now" on the API side.
    // For a future expiry we want (remaining days + 30); for expired/no expiry just 30.
    const now = Date.now();
    const currentExpiry = user.validUntil ? new Date(user.validUntil).getTime() : null;
    const remainingDays = currentExpiry && currentExpiry > now
      ? Math.ceil((currentExpiry - now) / 86_400_000)
      : 0;
    const accessDays = remainingDays + 30;

    extendMutation.mutate(
      { id: user.id, data: { accessDays } },
      {
        onSuccess: () => {
          toast({ title: 'Subscription extended', description: `${user.name} extended by 30 days.` });
          queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
        },
        onError: (err: any) => {
          toast({ title: 'Extension failed', description: err.message, variant: 'destructive' });
        },
      }
    );
  };

  const handleRevoke = () => {
    if (!revokingUser) return;
    revokeUserMutation.mutate(
      { id: revokingUser.id, data: { subscriptionStatus: 'expired', accessDays: null } },
      {
        onSuccess: () => {
          toast({ title: 'Subscription revoked', description: `${revokingUser.name}'s access has been revoked.` });
          queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
          setRevokingUser(null);
        },
        onError: (err: any) => {
          toast({ title: 'Revoke failed', description: err.message, variant: 'destructive' });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deletingUser) return;
    deleteUserMutation.mutate(
      { id: deletingUser.id },
      {
        onSuccess: () => {
          toast({ title: 'Customer deleted' });
          queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
          setDeletingUser(null);
        },
        onError: (err: any) => {
          toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  // ── Compute counts for filter badges ──────────────────────────────────────
  const expiringCount = users?.filter((u) => getExpiryBucket(u.validUntil) === 'expiring').length ?? 0;
  const expiredCount  = users?.filter((u) => getExpiryBucket(u.validUntil) === 'expired').length ?? 0;

  // ── Filter + sort ──────────────────────────────────────────────────────────
  const filteredUsers = (() => {
    let list = users ?? [];
    if (expiryFilter === 'expiring') {
      list = list.filter((u) => getExpiryBucket(u.validUntil) === 'expiring');
    } else if (expiryFilter === 'expired') {
      list = list.filter((u) => getExpiryBucket(u.validUntil) === 'expired');
    }
    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter((u) =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }
    // Sort by expiry ascending for filtered views so soonest is first
    if (expiryFilter !== 'all') {
      list = [...list].sort((a, b) => {
        const ta = a.validUntil ? new Date(a.validUntil).getTime() : Number.POSITIVE_INFINITY;
        const tb = b.validUntil ? new Date(b.validUntil).getTime() : Number.POSITIVE_INFINITY;
        return ta - tb;
      });
    }
    return list;
  })();

  return (
    <>
      {/* ── Filter tabs ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-muted/40">
          <button
            type="button"
            onClick={() => setExpiryFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              expiryFilter === 'all'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All
            <span className="ml-0.5 text-xs text-muted-foreground">({users?.length ?? 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setExpiryFilter('expiring')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              expiryFilter === 'expiring'
                ? 'bg-background shadow-sm text-amber-700'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="w-3 h-3" />
            Expiring soon
            {expiringCount > 0 && (
              <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                expiryFilter === 'expiring' ? 'bg-amber-100 text-amber-700' : 'bg-amber-100 text-amber-600'
              }`}>{expiringCount}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setExpiryFilter('expired')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              expiryFilter === 'expired'
                ? 'bg-background shadow-sm text-red-700'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CalendarX className="w-3 h-3" />
            Already expired
            {expiredCount > 0 && (
              <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                expiryFilter === 'expired' ? 'bg-red-100 text-red-700' : 'bg-red-100 text-red-600'
              }`}>{expiredCount}</span>
            )}
          </button>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Create Customer
        </Button>
      </div>
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers by name or email..."
          className="pl-9"
          aria-label="Search customers"
        />
      </div>

      <div className="border border-border bg-card rounded">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Valid Until</span>
              </TableHead>
              <TableHead>Ai Blasts</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-sm text-muted-foreground">
                  {expiryFilter === 'expiring'
                    ? 'No customers expiring in the next 7 days.'
                    : expiryFilter === 'expired'
                    ? 'No expired customers.'
                    : search.trim()
                    ? 'No customers match your search.'
                    : 'No customers yet.'}
                </TableCell>
              </TableRow>
            )}
            {filteredUsers.map((user) => {
              const expiry = user.validUntil ? new Date(user.validUntil) : null;
              const bucket = getExpiryBucket(user.validUntil);
              const expired = bucket === 'expired';
              const expiringSoon = bucket === 'expiring';
              const toolCount = user.toolIds?.length ?? 0;

              return (
                <TableRow
                  key={user.id}
                  data-testid={`row-user-${user.id}`}
                  className={expiringSoon ? 'bg-amber-50/40' : expired ? 'bg-red-50/30' : undefined}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.name}</p>
                       <div className="flex items-center gap-2 flex-wrap">
                         <p className="text-xs text-muted-foreground font-mono">{user.email}</p>
                         {user.createdByAdmin && (
                           <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30">
                             Admin added
                           </Badge>
                         )}
                         {user.accessGrantedByAdmin && (
                           <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-700 border-green-300">
                             Access given
                           </Badge>
                         )}
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {expiry ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-sm font-mono ${expired ? 'text-red-500' : expiringSoon ? 'text-amber-600' : 'text-foreground'}`}>
                          {expired ? '⚠ ' : ''}{format(expiry, 'MMM d, yyyy')}
                        </span>
                        {expiringSoon && (
                          <Badge
                            variant="outline"
                            className="border-amber-300 bg-amber-100 text-amber-700 hover:bg-amber-100"
                            data-testid={`badge-expiring-${user.id}`}
                          >
                            <Clock className="mr-1 h-3 w-3" />
                            Expiring soon
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Infinity className="w-3.5 h-3.5" /> Unlimited
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {toolCount === 0 ? 'All' : `${toolCount} selected`}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(expiringSoon || expired) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-700 border-green-300 hover:bg-green-50 hover:text-green-800"
                          onClick={() => handleExtend(user)}
                          disabled={extendMutation.isPending}
                          data-testid={`button-extend-${user.id}`}
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1" />
                          +30 days
                        </Button>
                      )}
                      {(user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trial') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-amber-600 border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                          onClick={() => setRevokingUser(user)}
                          data-testid={`button-revoke-${user.id}`}
                        >
                          <ShieldOff className="w-3.5 h-3.5 mr-1" />
                          Revoke
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setManagingUser(user)}
                        data-testid={`button-manage-${user.id}`}
                      >
                        <Settings2 className="w-3.5 h-3.5 mr-1" />
                        Manage
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingUser(user)}
                        data-testid={`button-delete-${user.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {createOpen && (
        <CreateUserDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          allToolIds={allToolIds}
          allToolNames={allToolNames}
        />
      )}

      {managingUser && (
        <ManageUserDialog
          user={managingUser}
          onClose={() => setManagingUser(null)}
          allToolIds={allToolIds}
          allToolNames={allToolNames}
        />
      )}

      <AlertDialog open={!!revokingUser} onOpenChange={(v) => !v && setRevokingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke <strong>{revokingUser?.name}</strong>'s subscription and block their access to all tools. You can re-activate them from the Manage dialog at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-amber-600 text-white hover:bg-amber-700"
              disabled={revokeUserMutation.isPending}
            >
              <ShieldOff className="w-3.5 h-3.5 mr-1.5" />
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingUser} onOpenChange={(v) => !v && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deletingUser?.name}</strong> ({deletingUser?.email}) and all their data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function getExpiryBucket(validUntil: string | null | undefined): 'expired' | 'expiring' | 'ok' | 'unlimited' {
  if (!validUntil) return 'unlimited';
  const expiry = new Date(validUntil);
  const now = new Date();
  if (isPast(expiry)) return 'expired';
  if (isWithinInterval(expiry, { start: now, end: addDays(now, EXPIRING_SOON_DAYS) })) return 'expiring';
  return 'ok';
}
