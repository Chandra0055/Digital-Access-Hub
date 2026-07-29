import { useState, useEffect } from 'react';
import { useListTools, getListToolsQueryKey } from '@workspace/api-client-react';
import type { Tool } from '@workspace/api-client-react';
import { StatusBadge } from '@/components/status-badge';
import { LaunchModal } from '@/components/launch-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Search, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function ToolsPage() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [extInstalled, setExtInstalled] = useState(false);
  const { toast } = useToast();

  // Detect the Kenter extension
  useEffect(() => {
    // Already signalled before React mounted
    if ((window as any).__kenterExtInstalled) {
      setExtInstalled(true);
      return;
    }
    // Listen in case the content script fires after React mounts
    const handler = () => setExtInstalled(true);
    window.addEventListener('kenter:extensionReady', handler);
    return () => window.removeEventListener('kenter:extensionReady', handler);
  }, []);

  // Listen for injection results
  useEffect(() => {
    const onSuccess = () => {
      toast({ title: '✅ Cookies injected — tool opened!' });
    };
    const onError = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      toast({
        title: 'Cookie injection failed',
        description: detail?.error || 'Unknown error',
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
    { category, status },
    { query: { queryKey: getListToolsQueryKey({ category, status }) } }
  );

  const filteredTools = tools?.filter((tool) =>
    search ? tool.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  const categories = Array.from(new Set(tools?.map((t) => t.category) || []));

  const handleAccessTool = (tool: Tool) => {
    if (!tool.cookieData?.trim()) {
      // No cookies — open directly
      window.open(tool.redirectUrl, '_blank');
      return;
    }

    if (extInstalled) {
      // Extension is present — inject automatically
      window.dispatchEvent(
        new CustomEvent('kenter:injectAndOpen', {
          detail: { cookies: tool.cookieData, url: tool.redirectUrl },
        })
      );
    } else {
      // No extension — show manual guide + install prompt
      setSelectedTool(tool);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Available Tools</h1>
            <p className="text-muted-foreground">Browse and access your digital toolkit</p>
          </div>

          {/* Extension status badge */}
          {extInstalled ? (
            <div className="flex items-center gap-2 text-sm bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1.5 rounded-full">
              <Zap className="w-3.5 h-3.5" />
              Extension active — 1-click access enabled
            </div>
          ) : (
            <a
              href="https://cookie-editor.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors border border-border rounded-full px-3 py-1.5"
            >
              Install extension for 1-click access
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
          <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? undefined : v)}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="coming_soon">Coming Soon</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : filteredTools && filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool, index) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                data-testid={`card-tool-${tool.id}`}
                className="border border-card-border bg-card rounded p-5 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg">{tool.name}</h3>
                  <StatusBadge status={tool.status} />
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{tool.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground uppercase">{tool.category}</span>
                  {tool.status === 'active' ? (
                    <Button
                      size="sm"
                      onClick={() => handleAccessTool(tool)}
                      data-testid={`button-access-${tool.id}`}
                    >
                      {extInstalled && tool.cookieData ? (
                        <><Zap className="w-3 h-3 mr-1.5" />Access Tool</>
                      ) : (
                        <>Access Tool<ExternalLink className="w-3 h-3 ml-2" /></>
                      )}
                    </Button>
                  ) : (
                    <Button size="sm" disabled data-testid={`button-coming-soon-${tool.id}`}>
                      Coming Soon
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-border rounded">
            <p className="text-muted-foreground">No tools found matching your criteria</p>
          </div>
        )}
      </motion.div>

      {selectedTool && (
        <LaunchModal
          open={!!selectedTool}
          onClose={() => setSelectedTool(null)}
          toolName={selectedTool.name}
          cookieData={selectedTool.cookieData}
          redirectUrl={selectedTool.redirectUrl}
        />
      )}
    </div>
  );
}
