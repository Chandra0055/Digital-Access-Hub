import { useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useGetTool, useCreateTool, useUpdateTool, getGetToolQueryKey } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

interface ToolFormData {
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'coming_soon';
  category: string;
  redirectUrl: string;
  iconUrl?: string;
  cookieData?: string;
}

export default function ToolFormPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();

  const toolId = params.id && params.id !== 'new' ? Number(params.id) : null;
  const isEdit = toolId !== null;

  const { data: tool, isLoading } = useGetTool(toolId!, {
    query: {
      enabled: !!toolId,
      queryKey: getGetToolQueryKey(toolId!),
    },
  });

  const createToolMutation = useCreateTool();
  const updateToolMutation = useUpdateTool();

  const form = useForm<ToolFormData>({
    defaultValues: {
      name: '',
      description: '',
      status: 'active',
      category: '',
      redirectUrl: '',
      iconUrl: '',
      cookieData: '',
    },
  });

  useEffect(() => {
    if (tool) {
      form.reset({
        name: tool.name,
        description: tool.description,
        status: tool.status,
        category: tool.category,
        redirectUrl: tool.redirectUrl,
        iconUrl: tool.iconUrl || '',
        cookieData: tool.cookieData || '',
      });
    }
  }, [tool, form]);

  const onSubmit = (data: ToolFormData) => {
    if (isEdit && toolId) {
      updateToolMutation.mutate(
        { id: toolId, data },
        {
          onSuccess: () => {
            toast({ title: 'Tool updated' });
            setLocation('/admin');
          },
          onError: (error: any) => {
            toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
          },
        }
      );
    } else {
      createToolMutation.mutate(
        { data },
        {
          onSuccess: () => {
            toast({ title: 'Tool created' });
            setLocation('/admin');
          },
          onError: (error: any) => {
            toast({ title: 'Create failed', description: error.message, variant: 'destructive' });
          },
        }
      );
    }
  };

  if (isLoading && isEdit) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <p>Loading...</p>
      </div>
    );
  }

  const isPending = createToolMutation.isPending || updateToolMutation.isPending;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Button
          variant="ghost"
          onClick={() => setLocation('/admin')}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {isEdit ? 'Edit Tool' : 'Create Tool'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Update tool details' : 'Add a new tool to the portal'}
          </p>
        </div>

        <div className="border border-card-border bg-card rounded p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* ── Basic info ── */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tool Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-name" placeholder="e.g., CloudSync Pro" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-description" rows={3} placeholder="What does this tool do?" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-category" placeholder="e.g., Development, Design" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="coming_soon">Coming Soon</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="redirectUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tool URL</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-redirect-url" placeholder="https://example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="iconUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon URL <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-icon-url" placeholder="https://example.com/icon.png" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Admin-only: Session Cookie Data ── */}
              <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-sm font-semibold text-amber-400">Admin Only</span>
                </div>

                <FormField
                  control={form.control}
                  name="cookieData"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Cookie Data</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          data-testid="input-cookie-data"
                          rows={10}
                          placeholder={`Export as JSON from Cookie-Editor and paste here.\n\nExample:\n[\n  {\n    "name": "__Secure-1PSID",\n    "value": "ABC123xyz...",\n    "domain": ".example.com",\n    "path": "/",\n    "secure": true,\n    "httpOnly": true,\n    "sameSite": "None"\n  },\n  {\n    "name": "SID",\n    "value": "def456...",\n    "domain": ".example.com",\n    "path": "/"\n  }\n]`}
                          className="font-mono text-xs resize-y leading-relaxed"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Use <span className="text-foreground font-medium">Cookie-Editor</span> → <span className="text-foreground font-medium">Export As: JSON</span>. JSON preserves all cookie properties (domain, path, expiry, flags). Never exposed to subscribers.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isPending} data-testid="button-submit">
                  {isPending ? 'Saving...' : isEdit ? 'Update Tool' : 'Create Tool'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/admin')}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </motion.div>
    </div>
  );
}
