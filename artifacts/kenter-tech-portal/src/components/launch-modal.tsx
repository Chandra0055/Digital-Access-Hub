import { useState } from 'react';
import { Copy, Check, ExternalLink, ChevronRight, Puzzle } from 'lucide-react';
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

        <div className="space-y-4 mt-1">

          {/* Extension install prompt — primary recommendation */}
          <div className="border border-primary/30 bg-primary/5 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Puzzle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-primary mb-1">
                  Get 1-click access — install the extension
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  Install the <strong className="text-foreground">Kenter Tech Portal</strong> browser extension.
                  After that, clicking Access Tool automatically injects the cookies and opens the tool — no manual steps.
                </p>
                <div className="text-xs text-muted-foreground space-y-1 mb-3">
                  <p>1. Download the extension from your admin</p>
                  <p>2. Go to <code className="bg-background px-1 rounded">chrome://extensions</code></p>
                  <p>3. Enable <strong className="text-foreground">Developer mode</strong> → <strong className="text-foreground">Load unpacked</strong></p>
                  <p>4. Select the <code className="bg-background px-1 rounded">kenter-extension</code> folder</p>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or do it manually</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Manual steps */}
          <div className="space-y-2">
            {/* Step 1 — Copy */}
            <div className="flex gap-3 items-start p-3 rounded-lg bg-background border border-border">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold flex items-center justify-center mt-0.5">1</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-2">Copy the session cookies</p>
                <pre className="bg-card border border-border rounded p-3 text-xs font-mono text-foreground whitespace-pre-wrap break-all max-h-28 overflow-y-auto leading-relaxed">
                  {cookieData || '(no cookie data saved for this tool)'}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={handleCopy}
                  disabled={!cookieData}
                  data-testid="button-copy-cookies"
                >
                  {copied
                    ? <><Check className="w-3.5 h-3.5 mr-2 text-green-400" />Copied!</>
                    : <><Copy className="w-3.5 h-3.5 mr-2" />Copy Cookie Data</>
                  }
                </Button>
              </div>
            </div>

            {/* Step 2 — Open */}
            <div className="flex gap-3 items-start p-3 rounded-lg bg-background border border-border">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold flex items-center justify-center mt-0.5">2</span>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1.5">Open the tool site</p>
                <Button size="sm" className="w-full" onClick={handleOpen} data-testid="button-open-tool">
                  Open {toolName} <ExternalLink className="w-3.5 h-3.5 ml-2" />
                </Button>
              </div>
            </div>

            {/* Step 3 — Import */}
            <div className="flex gap-3 items-start p-3 rounded-lg bg-background border border-border">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold flex items-center justify-center mt-0.5">3</span>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Import via Cookie-Editor</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  On the tool tab: open Cookie-Editor
                  <ChevronRight className="inline w-3 h-3 mx-0.5" />Import
                  <ChevronRight className="inline w-3 h-3 mx-0.5" />paste
                  <ChevronRight className="inline w-3 h-3 mx-0.5" />Import
                  <ChevronRight className="inline w-3 h-3 mx-0.5" />refresh the page.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-border pt-3">
            <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
