import { Download, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface LaunchModalProps {
  open: boolean;
  onClose: () => void;
  toolName: string;
}

export function LaunchModal({ open, onClose, toolName }: LaunchModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-card-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Extension Required</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            To access <strong className="text-foreground">{toolName}</strong> you need the Kenter browser extension installed. It only takes a minute.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">

          {/* Download button */}
          <a href="/kenter-extension.zip" download="kenter-extension.zip" className="block">
            <Button className="w-full" size="lg" data-testid="button-download-extension">
              <Download className="w-4 h-4 mr-2" />
              Download Kenter Extension
            </Button>
          </a>

          {/* Install steps */}
          <div className="bg-background border border-border rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">How to install</p>
            <ol className="space-y-2.5">
              {[
                <>Download and <strong className="text-foreground">unzip</strong> the file above</>,
                <>Open Chrome and go to <code className="bg-card text-xs px-1.5 py-0.5 rounded border border-border">chrome://extensions</code></>,
                <>Enable <strong className="text-foreground">Developer mode</strong> (toggle top-right)</>,
                <>Click <strong className="text-foreground">Load unpacked</strong> → select the unzipped folder</>,
                <>Come back here and click <strong className="text-foreground">Access Tool</strong> again</>,
              ].map((step, i) => (
                <li key={i} className="flex gap-3 items-start text-sm text-muted-foreground">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Already installed — reload to activate */}
          <div className="bg-background border border-border rounded-lg p-3 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Already installed? Reload the page to activate it.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() => window.location.reload()}
              data-testid="button-reload-page"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Reload Page
            </Button>
          </div>

          {/* Chrome Web Store note */}
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Works on Chrome, Edge, and Brave.{' '}
            <a
              href="https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-0.5"
            >
              Need help? <ExternalLink className="w-3 h-3" />
            </a>
          </p>

          <div className="flex justify-end border-t border-border pt-3">
            <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
