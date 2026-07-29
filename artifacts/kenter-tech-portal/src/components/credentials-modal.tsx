import { useState } from 'react';
import { Copy, Check, ExternalLink, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CredentialsModalProps {
  open: boolean;
  onClose: () => void;
  toolName: string;
  credentials: string | null | undefined;
  redirectUrl: string;
}

export function CredentialsModal({
  open,
  onClose,
  toolName,
  credentials,
  redirectUrl,
}: CredentialsModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!credentials) return;
    await navigator.clipboard.writeText(credentials);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg bg-card border-card-border">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Cookie className="w-5 h-5 text-primary" />
            <DialogTitle className="text-lg font-semibold">{toolName}</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            Copy the cookie string below and paste it into your browser to access this tool.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {credentials ? (
            <div className="relative">
              <pre className="bg-background border border-border rounded p-4 text-sm font-mono text-foreground whitespace-pre-wrap break-all max-h-64 overflow-y-auto leading-relaxed">
                {credentials}
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={handleCopy}
                data-testid="button-copy-credentials"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5 text-green-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="bg-background border border-dashed border-border rounded p-6 text-center text-sm text-muted-foreground">
              No cookies have been added for this tool yet.
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-border">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                window.open(redirectUrl, '_blank');
                onClose();
              }}
              data-testid="button-open-tool"
            >
              Open Tool
              <ExternalLink className="w-3.5 h-3.5 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
