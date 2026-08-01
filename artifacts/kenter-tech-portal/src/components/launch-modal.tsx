import { useState } from 'react';
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

type BrowserKey = 'chrome' | 'edge' | 'brave' | 'opera' | 'firefox';

interface BrowserInfo {
  label: string;
  dot: string;
  group: 'chromium' | 'firefox';
  extensionPage: string;
}

const BROWSERS: Record<BrowserKey, BrowserInfo> = {
  chrome:  { label: 'Chrome',  dot: '#4285F4', group: 'chromium', extensionPage: 'chrome://extensions' },
  edge:    { label: 'Edge',    dot: '#0078D4', group: 'chromium', extensionPage: 'edge://extensions' },
  brave:   { label: 'Brave',   dot: '#FB542B', group: 'chromium', extensionPage: 'brave://extensions' },
  opera:   { label: 'Opera',   dot: '#FF1B2D', group: 'chromium', extensionPage: 'opera://extensions' },
  firefox: { label: 'Firefox', dot: '#FF7139', group: 'firefox',  extensionPage: 'about:debugging' },
};

export function LaunchModal({ open, onClose, toolName }: LaunchModalProps) {
  const [browser, setBrowser] = useState<BrowserKey>('chrome');
  const info = BROWSERS[browser];
  const isFirefox = info.group === 'firefox';
  const zipFile = isFirefox ? '/kenter-extension-firefox.zip' : '/kenter-extension-chrome.zip';

  const chromiumSteps = [
    <>Download and <strong className="text-foreground">unzip</strong> the file</>,
    <>Open <code className="bg-background text-xs px-1.5 py-0.5 rounded border border-border">{info.extensionPage}</code></>,
    <>Enable <strong className="text-foreground">Developer mode</strong> (toggle, top-right)</>,
    <>Click <strong className="text-foreground">Load unpacked</strong> → select the unzipped folder</>,
    <>Return here and click <strong className="text-foreground">Access Tool</strong></>,
  ];

  const firefoxSteps = [
    <>Download and <strong className="text-foreground">unzip</strong> the file</>,
    <>Open <code className="bg-background text-xs px-1.5 py-0.5 rounded border border-border">about:debugging</code> in Firefox</>,
    <>Click <strong className="text-foreground">This Firefox</strong> in the left sidebar</>,
    <>Click <strong className="text-foreground">Load Temporary Add-on…</strong> → select <code className="bg-background text-xs px-1.5 py-0.5 rounded border border-border">manifest.json</code> from the unzipped folder</>,
    <>Return here and click <strong className="text-foreground">Access Tool</strong></>,
  ];

  const steps = isFirefox ? firefoxSteps : chromiumSteps;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-card-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Extension Required</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            To access <strong className="text-foreground">{toolName}</strong>, install the Ai Blast extension first. Pick your browser below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">

          {/* Browser picker */}
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(BROWSERS) as [BrowserKey, BrowserInfo][]).map(([key, b]) => (
              <button
                key={key}
                onClick={() => setBrowser(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  browser === key
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                }`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: b.dot }} />
                {b.label}
              </button>
            ))}
          </div>

          {/* Download */}
          <a href={zipFile} download={`ai-blast-extension-${isFirefox ? 'firefox' : 'chrome'}.zip`} className="block">
            <Button className="w-full" size="lg" data-testid="button-download-extension">
              <Download className="w-4 h-4 mr-2" />
              Download for {info.label}
            </Button>
          </a>

          {/* Steps */}
          <div className="bg-background border border-border rounded-lg p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              How to install
            </p>
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

            {isFirefox && (
              <p className="text-xs text-amber-500/80 border-t border-border pt-3 mt-3 leading-relaxed">
                Firefox temporary add-ons reset on restart. Reinstall using the same steps after restarting Firefox.
              </p>
            )}
          </div>

          {/* Already installed */}
          <div className="bg-background border border-border rounded-lg p-3 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Already installed? Reload to activate.
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
