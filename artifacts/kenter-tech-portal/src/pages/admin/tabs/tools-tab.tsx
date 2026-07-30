import { useListTools, useDeleteTool, getListToolsQueryKey } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
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
import { useState } from 'react';

export function ToolsTab() {
  const [, setLocation] = useLocation();
  const { data: tools, isLoading } = useListTools(undefined, {
    query: { queryKey: getListToolsQueryKey() },
  });
  const deleteToolMutation = useDeleteTool();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toolToDelete, setToolToDelete] = useState<number | null>(null);

  const handleDelete = () => {
    if (toolToDelete === null) return;
    deleteToolMutation.mutate(
      { id: toolToDelete },
      {
        onSuccess: () => {
          toast({ title: 'Tool deleted' });
          queryClient.invalidateQueries({ queryKey: getListToolsQueryKey() });
          setDeleteDialogOpen(false);
          setToolToDelete(null);
        },
        onError: (error: any) => {
          toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
        },
      }
    );
  };

  const openDeleteDialog = (id: number) => {
    setToolToDelete(id);
    setDeleteDialogOpen(true);
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
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setLocation('/admin/tools/new')} data-testid="button-add-tool">
          <Plus className="w-4 h-4 mr-2" />
          Add Ai Blast
        </Button>
      </div>

      <div className="border border-card-border bg-card rounded">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Redirect URL</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tools?.map((tool) => (
              <TableRow key={tool.id} data-testid={`row-tool-${tool.id}`}>
                <TableCell>
                  <div>
                    <p className="font-medium">{tool.name}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{tool.description}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-mono uppercase">{tool.category}</span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={tool.status} />
                </TableCell>
                <TableCell>
                  <a
                    href={tool.redirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline font-mono truncate max-w-xs block"
                  >
                    {tool.redirectUrl}
                  </a>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/admin/tools/${tool.id}/edit`)}
                      data-testid={`button-edit-${tool.id}`}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(tool.id)}
                      data-testid={`button-delete-${tool.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ai Blast</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this Ai Blast? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} data-testid="button-confirm-delete">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
