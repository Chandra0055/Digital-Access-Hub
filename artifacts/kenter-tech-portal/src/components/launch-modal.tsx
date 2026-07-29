import { useState } from 'react';
import { Copy, Check, ExternalLink, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LaunchModalProps {
  open: boolean;
  onClose: () => void;
  toolName: string;
  cookieData: string | null | undefined;
  redirectUrl: string;
}

export function LaunchModal({ open, onClose, toolName, cookieData, redirectUrl }: LaunchModalProps) {
  const [copied, setCopied] = useState(false);
  const hasCookies = !!cookieData?.trim();

  const handleCopy = async () => {
    if (!cookieData) return;
    await navigator.clipboard.writeText(cookieData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpen = () => {
    window.open(redirectUrl, '_blank');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg bg-card border-card-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{toolName}</DialogTitle>
        </DialogHeader>

        {hasCookies ? (
          <div className="space-y-5 mt-1">
            {/* Steps */}
            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex gap-3 items-start p-3 rounded-lg bg-background border border-border">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-2">Copy the session cookies</p>
                  <pre className="bg-card border border-border rounded p-3 text-xs font-mono text-foreground whitespace-pre-wrap break-all max-h-36 overflow-y-auto leading-relaxed">
                    {cookieData}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full"
                    onClick={handleCopy}
                    data-testid="button-copy-cookies"
                  >
                    {copied ? (
                      <><Check className="w-3.5 h-3.5 mr-2 text-green-400" />Copied!</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5 mr-2" />Copy Cookie Data</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3 items-start p-3 rounded-lg bg-background border border-border">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">Open the tool</p>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">The tool website will open in a new tab.</p>
                  <Button size="sm" className="w-full" onClick={handleOpen} data-testid="button-open-tool">
                    Open {toolName}
                    <ExternalLink className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3 items-start p-3 rounded-lg bg-background border border-border">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">3</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">Import cookies on that page</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    On the tool's tab, open <span className="text-foreground font-medium">Cookie-Editor</span> extension
                    <ChevronRight className="inline w-3 h-3 mx-0.5" />
                    click <span className="text-foreground font-medium">Import</span>
                    <ChevronRight className="inline w-3 h-3 mx-0.5" />
                    paste the copied data
                    <ChevronRight className="inline w-3 h-3 mx-0.5" />
                    click <span className="text-foreground font-medium">Import</span> again
                    <ChevronRight className="inline w-3 h-3 mx-0.5" />
                    then <span className="text-foreground font-medium">refresh the page</span>.
                  </p>
                  <a
                    href="https://cookie-editor.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                  >
                    Don't have Cookie-Editor? Get it free
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-border pt-3">
              <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
            </div>
          </div>
        ) : (
          /* No cookies — just open directly */
          <div className="space-y-4 mt-1">
            <p className="text-sm text-muted-foreground">Click below to open this tool directly.</p>
            <div className="flex justify-between items-center">
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" onClick={handleOpen} data-testid="button-open-tool">
                Open {toolName}
                <ExternalLink className="w-3.5 h-3.5 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
