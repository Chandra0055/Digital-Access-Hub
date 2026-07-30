import { useState, useEffect } from 'react';
import { useListTools, getListToolsQueryKey } from '@workspace/api-client-react';
import type { Tool } from '@workspace/api-client-react';
import { useAuth } from '@/contexts/auth-context';
import { StatusBadge } from '@/components/status-badge';
import { LaunchModal } from '@/components/launch-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Search, Zap, PuzzleIcon, AlertTriangle, Clock, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { isPast, format, differenceInDays } from 'date-fns';

// ─── Tool card ────────────────────────────────────────────────────────────────

function ToolCard({
  tool,
  index,
  locked,
  subscriptionActive,
  extInstalled,
  onAccess,
}: {
  tool: Tool;
  index: number;
  locked: boolean;
  subscriptionActive: boolean;
  extInstalled: boolean;
  onAccess: (tool: Tool) => void;
}) {
  return (
    <motion.div
      key={tool.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      data-testid={`card-tool-${tool.id}`}
      className={`border rounded-xl p-5 transition-colors relative ${
        locked
          ? 'border-border bg-muted/30 opacity-70'
          : subscriptionActive
          ? 'border-border bg-card hover:border-primary/50'
          : 'border-border bg-card/60 opacity-80'
      }`}
    >
      {locked && (
        <div className="absolute top-3 right-3">
          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {tool.iconUrl ? (
            <img
              src={tool.iconUrl}
              alt={tool.name}
              className="w-10 h-10 rounded object-contain flex-shrink-0 border border-border bg-white p-0.5"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 font-bold text-base ${locked ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
              {tool.name.charAt(0).toUpperCase()}
            </div>
          )}
          <h3 className={`font-semibold text-lg leading-tight ${locked ? 'text-muted-foreground' : ''}`}>
            {tool.name}
          </h3>
        </div>
        {!locked && <StatusBadge status={tool.status} />}
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{tool.description}</p>

      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground uppercase">{tool.category}</span>

        {locked ? (
          <span className="text-xs text-muted-foreground italic">Contact admin to get access</span>
        ) : tool.status === 'active' ? (
          subscriptionActive ? (
            <Button
              size="sm"
              onClick={() => onAccess(tool)}
              data-testid={`button-access-${tool.id}`}
            >
              {extInstalled && tool.cookieData ? (
                <><Zap className="w-3 h-3 mr-1.5" />Access Tool</>
              ) : (
                <>Access Tool <ExternalLink className="w-3 h-3 ml-1.5" /></>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              disabled
              variant="outline"
              className="text-xs text-muted-foreground"
              data-testid={`button-renew-${tool.id}`}
            >
              Renew Subscription to Access
            </Button>
          )
        ) : (
          <Button size="sm" disabled data-testid={`button-coming-soon-${tool.id}`}>
            Coming Soon
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ title, count, locked }: { title: string; count: number; locked?: boolean }) {
  return (
    <div className={`flex items-center gap-3 mb-4 pb-2 border-b ${locked ? 'border-border/50' : 'border-border'}`}>
      {locked && <Lock className="w-4 h-4 text-muted-foreground" />}
      <h2 className={`font-semibold text-base ${locked ? 'text-muted-foreground' : 'text-foreground'}`}>
        {title}
      </h2>
      <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-mono">
        {count}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ToolsPage() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [installModalTool, setInstallModalTool] = useState<Tool | null>(null);
  const [extInstalled, setExtInstalled] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Subscription state
  const isAdmin = user?.role === 'admin';
  const subscriptionActive =
    isAdmin ||
    (user?.subscriptionStatus === 'active' &&
      (!user?.validUntil || !isPast(new Date(user.validUntil))));
  const subscriptionExpired =
    !isAdmin &&
    (user?.subscriptionStatus === 'expired' ||
      (user?.validUntil ? isPast(new Date(user.validUntil)) : false));
  const subscriptionNone = !isAdmin && user?.subscriptionStatus === 'inactive';

  // Expiring soon
  const validUntilDate = user?.validUntil ? new Date(user.validUntil) : null;
  const daysUntilExpiry = validUntilDate && !isPast(validUntilDate)
    ? differenceInDays(validUntilDate, new Date())
    : null;
  const subscriptionExpiringSoon =
    !isAdmin && subscriptionActive && daysUntilExpiry !== null && daysUntilExpiry <= 7;
  const expiryCountdownText =
    daysUntilExpiry === 0
      ? 'expires today'
      : daysUntilExpiry === 1
      ? 'expires tomorrow'
      : `expires in ${daysUntilExpiry} days`;

  // Extension detection
  useEffect(() => {
    if (document.documentElement.getAttribute('data-kenter-ext') === '1') {
      setExtInstalled(true);
      return;
    }
    const handler = () => setExtInstalled(true);
    window.addEventListener('kenter:extensionReady', handler);
    return () => window.removeEventListener('kenter:extensionReady', handler);
  }, []);

  useEffect(() => {
    const onSuccess = () => toast({ title: '✅ Logged in — Tool opened!' });
    const onError = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      toast({
        title: 'Injection failed',
        description: detail?.error || 'Unknown error. Try reinstalling the extension.',
        variant: 'destructive',
      });
    };
    window.addEventListener('kenter:injectionSuccess', onSuccess);
    window.addEventListener('kenter:injectionError', onError);
    return () => {
      window.removeEventListener('kenter:injectionSuccess', onSuccess);
      window.removeEventListener('kenter:injectionError', onError);
    };
  }, [toast]);

  const { data: tools, isLoading } = useListTools(
    { category },
    { query: { queryKey: getListToolsQueryKey({ category }) } }
  );

  const handleAccessTool = (tool: Tool) => {
    if (!subscriptionActive) return;
    const needsCookies = !!tool.cookieData?.trim();
    if (!needsCookies) {
      window.open(tool.redirectUrl, '_blank');
      return;
    }
    if (extInstalled) {
      window.dispatchEvent(
        new CustomEvent('kenter:injectAndOpen', {
          detail: { cookies: tool.cookieData, url: tool.redirectUrl },
        })
      );
    } else {
      setInstallModalTool(tool);
    }
  };

  // Split into accessible and locked — filter by search across both
  const matchesSearch = (tool: Tool) =>
    !search || tool.name.toLowerCase().includes(search.toLowerCase());

  const accessibleTools = tools?.filter((t) => t.hasAccess && matchesSearch(t)) ?? [];
  const lockedTools = tools?.filter((t) => !t.hasAccess && matchesSearch(t)) ?? [];

  const categories = Array.from(new Set(tools?.map((t) => t.category) ?? []));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Available Tools</h1>
            <p className="text-muted-foreground">Browse and access your digital toolkit</p>
          </div>

          {subscriptionActive && (
            extInstalled ? (
              <div className="flex items-center gap-2 text-sm bg-green-500/10 border border-green-500/20 text-green-600 px-3 py-1.5 rounded-full">
                <Zap className="w-3.5 h-3.5" />
                Extension active — 1-click access enabled
              </div>
            ) : (
              <a
                href="/kenter-extension.zip"
                download="kenter-extension.zip"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors border border-border rounded-full px-3 py-1.5"
              >
                <PuzzleIcon className="w-3.5 h-3.5" />
                Install extension for 1-click access
              </a>
            )
          )}
        </div>

        {/* Subscription banners */}
        {(subscriptionExpired || subscriptionNone) && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">
                {subscriptionExpired
                  ? `Your subscription expired on ${user?.validUntil ? format(new Date(user.validUntil), 'MMMM d, yyyy') : 'an unknown date'}.`
                  : "You don't have an active subscription."}
              </p>
              <p className="text-xs mt-0.5 text-red-700">
                Contact your administrator to renew your subscription and regain access.
              </p>
            </div>
          </div>
        )}

        {subscriptionExpiringSoon && validUntilDate && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-900">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-yellow-600" />
            <div>
              <p className="font-medium text-sm">
                ⚠ Your subscription {expiryCountdownText} — {format(validUntilDate, 'MMMM d, yyyy')}
              </p>
              <p className="text-xs mt-0.5 text-yellow-800">
                Contact your administrator to renew before your access is cut off.
              </p>
            </div>
          </div>
        )}

        {subscriptionActive && !isAdmin && user?.validUntil && !subscriptionExpiringSoon && (
          <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-lg px-3 py-2 w-fit">
            <Clock className="w-3.5 h-3.5" />
            Subscription expires on{' '}
            <span className="font-medium text-foreground ml-1">
              {format(new Date(user.validUntil), 'MMMM d, yyyy')}
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search"
              className="pl-9"
            />
          </div>
          <Select value={category || 'all'} onValueChange={(v) => setCategory(v === 'all' ? undefined : v)}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : (
          <div className="space-y-10">
            {/* ── Accessible tools ── */}
            {accessibleTools.length > 0 && (
              <section>
                <SectionHeading title="Your Tools" count={accessibleTools.length} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accessibleTools.map((tool, i) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      index={i}
                      locked={false}
                      subscriptionActive={subscriptionActive}
                      extInstalled={extInstalled}
                      onAccess={handleAccessTool}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Empty state when subscription is active but no tools granted yet */}
            {accessibleTools.length === 0 && !isAdmin && subscriptionActive && !search && (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-border rounded-xl text-center gap-2">
                <Lock className="w-8 h-8 text-muted-foreground/50" />
                <p className="font-medium text-muted-foreground">No tools assigned yet</p>
                <p className="text-sm text-muted-foreground/70">
                  Contact your administrator to get access to tools.
                </p>
              </div>
            )}

            {/* ── Locked tools ── */}
            {lockedTools.length > 0 && (
              <section>
                <SectionHeading
                  title={isAdmin ? 'All Tools' : 'Other Tools'}
                  count={lockedTools.length}
                  locked={!isAdmin}
                />
                {!isAdmin && (
                  <p className="text-sm text-muted-foreground mb-4">
                    You do not have access to these tools. Contact your administrator to purchase access.
                  </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lockedTools.map((tool, i) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      index={i}
                      locked={!isAdmin}
                      subscriptionActive={subscriptionActive}
                      extInstalled={extInstalled}
                      onAccess={handleAccessTool}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* No results from search */}
            {accessibleTools.length === 0 && lockedTools.length === 0 && search && (
              <div className="text-center py-12 border border-dashed border-border rounded-xl">
                <p className="text-muted-foreground">No tools found matching "{search}"</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {installModalTool && (
        <LaunchModal
          open={!!installModalTool}
          onClose={() => setInstallModalTool(null)}
          toolName={installModalTool.name}
        />
      )}
    </div>
  );
}
