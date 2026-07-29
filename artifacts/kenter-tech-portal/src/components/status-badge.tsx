import { cn } from '@/lib/utils';

type Status = 'active' | 'inactive' | 'trial' | 'expired' | 'coming_soon';

const statusConfig: Record<Status, { label: string; className: string }> = {
  active: { label: 'ACTIVE', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  inactive: { label: 'INACTIVE', className: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  trial: { label: 'TRIAL', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  expired: { label: 'EXPIRED', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  coming_soon: { label: 'COMING SOON', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold border',
        config.className,
        className
      )}
      data-testid={`badge-${status}`}
    >
      {config.label}
    </span>
  );
}
