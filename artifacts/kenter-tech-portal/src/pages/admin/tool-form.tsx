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
import { ArrowLeft } from 'lucide-react';

interface ToolFormData {
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'coming_soon';
  category: string;
  redirectUrl: string;
  iconUrl?: string;
  credentials?: string;
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
      credentials: '',
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
        credentials: tool.credentials || '',
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
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-name" />
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
                      <Textarea {...field} data-testid="input-description" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <FormField
                control={form.control}
                name="redirectUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Redirect URL</FormLabel>
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
                    <FormLabel>Icon URL (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-icon-url" placeholder="https://example.com/icon.png" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="credentials"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cookies (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="input-credentials"
                        rows={6}
                        placeholder={`Paste the cookie string here.\n\nExample:\nsession_id=abc123xyz; auth_token=def456uvw; user_pref=dark`}
                        className="font-mono text-sm resize-y"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Paste the cookie string for this tool. Subscribers will see and copy it when they click "Access Tool".
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
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
