import { useState } from 'react';
import { Download, ExternalLink, RefreshCw, Chrome, Globe } from 'lucide-react';
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

const BROWSERS = [
  { name: 'Chrome', color: '#4285F4' },
  { name: 'Firefox', color: '#FF7139' },
  { name: 'Edge', color: '#0078D4' },
  { name: 'Brave', color: '#FB542B' },
  { name: 'Opera', color: '#FF1B2D' },
];

const CHROME_STEPS = [
  <>Download and <strong className="text-foreground">unzip</strong> the file above</>,
  <>Open <code className="bg-card text-xs px-1.5 py-0.5 rounded border border-border">chrome://extensions</code> <span className="text-muted-foreground">(or edge:// / brave://)</span></>,
  <>Enable <strong className="text-foreground">Developer mode</strong> (toggle, top-right)</>,
  <>Click <strong className="text-foreground">Load unpacked</strong> → select the unzipped folder</>,
  <>Come back here and click <strong className="text-foreground">Access Tool</strong></>,
];

const FIREFOX_STEPS = [
  <>Download and <strong className="text-foreground">unzip</strong> the file above</>,
  <>Open <code className="bg-card text-xs px-1.5 py-0.5 rounded border border-border">about:debugging</code> in Firefox</>,
  <>Click <strong className="text-foreground">This Firefox</strong> in the left sidebar</>,
  <>Click <strong className="text-foreground">Load Temporary Add-on…</strong> → select <code className="bg-card text-xs px-1.5 py-0.5 rounded border border-border">manifest.json</code> inside the unzipped folder</>,
  <>Come back here and click <strong className="text-foreground">Access Tool</strong></>,
];

export function LaunchModal({ open, onClose, toolName }: LaunchModalProps) {
  const [browser, setBrowser] = useState<'chrome' | 'firefox'>('chrome');

  const steps = browser === 'firefox' ? FIREFOX_STEPS : CHROME_STEPS;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-card-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Extension Required</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            To access <strong className="text-foreground">{toolName}</strong>, install the Kenter extension first. It takes under a minute.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">

          {/* Browser selector */}
          <div className="flex items-center gap-2 flex-wrap">
            {BROWSERS.map((b) => {
              const key = b.name === 'Firefox' ? 'firefox' : 'chrome';
              const active = browser === key;
              return (
                <button
                  key={b.name}
                  onClick={() => setBrowser(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    active
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: b.color }}
                  />
                  {b.name}
                </button>
              );
            })}
          </div>

          {/* Download button */}
          <a href="/kenter-extension.zip" download="kenter-extension.zip" className="block">
            <Button className="w-full" size="lg" data-testid="button-download-extension">
              <Download className="w-4 h-4 mr-2" />
              Download Kenter Extension
            </Button>
          </a>

          {/* Install steps */}
          <div className="bg-background border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              {browser === 'firefox' ? (
                <Globe className="w-3.5 h-3.5 text-orange-400" />
              ) : (
                <Chrome className="w-3.5 h-3.5 text-blue-400" />
              )}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {browser === 'firefox' ? 'Firefox instructions' : 'Chrome / Edge / Brave / Opera'}
              </p>
            </div>
            <ol className="space-y-2.5">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3 items-start text-sm text-muted-foreground">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>

            {browser === 'firefox' && (
              <p className="text-xs text-amber-500/80 border-t border-border pt-3 leading-relaxed">
                Firefox temporary add-ons are removed on restart. For a permanent install, the extension needs to be self-signed or submitted to Firefox Add-ons.
              </p>
            )}
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
              Reload
            </Button>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <a
              href="https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
            >
              Need help? <ExternalLink className="w-3 h-3" />
            </a>
            <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
