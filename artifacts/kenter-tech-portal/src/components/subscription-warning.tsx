import { format, formatDistanceToNow } from 'date-fns';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { SubscriptionState } from '@/lib/subscription-expiry';

type SubscriptionWarningVariant = 'card' | 'banner';

interface SubscriptionWarningProps {
  subscription: SubscriptionState;
  variant: SubscriptionWarningVariant;
  className?: string;
}

const statusProps = {
  role: 'status' as const,
  'aria-live': 'polite' as const,
};

export function SubscriptionWarning({
  subscription,
  variant,
  className = '',
}: SubscriptionWarningProps) {
  if (variant === 'banner') {
    return <BannerWarning subscription={subscription} className={className} />;
  }

  return <CardWarning subscription={subscription} {...statusProps} />;
}

function BannerWarning({
  subscription,
  className,
}: {
  subscription: SubscriptionState;
  className: string;
}) {
  if (subscription.isExpiryInvalid || subscription.isExpired || subscription.isInactive) {
    const message = subscription.isExpiryInvalid
      ? "We couldn't verify your subscription expiry date."
      : subscription.isExpired
        ? `Your subscription expired on ${
            subscription.validUntil
              ? format(subscription.validUntil, 'MMMM d, yyyy')
              : 'an unknown date'
          }.`
        : "You don't have an active subscription.";

    return (
      <div
        className={`flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 ${className}`}
        {...statusProps}
      >
        <AlertTriangle aria-hidden="true" className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-sm">{message}</p>
          <p className="text-xs mt-0.5 text-red-700">
            Contact your administrator to renew your subscription and regain access.
          </p>
        </div>
      </div>
    );
  }

  if (subscription.isExpiringSoon && subscription.validUntil) {
    return (
      <div
        className={`flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-900 ${className}`}
        {...statusProps}
      >
        <AlertTriangle
          aria-hidden="true"
          className="w-5 h-5 mt-0.5 flex-shrink-0 text-yellow-600"
        />
        <div>
          <p className="font-medium text-sm">
            ⚠ Your subscription {subscription.expiryWarning?.countdownText} —{' '}
            {format(subscription.validUntil, 'MMMM d, yyyy')}
          </p>
          <p className="text-xs mt-0.5 text-yellow-800">
            Contact your administrator to renew before your access is cut off.
          </p>
        </div>
      </div>
    );
  }

  if (subscription.isActive && subscription.validUntil) {
    return (
      <div
        className={`flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-lg px-3 py-2 w-fit ${className}`}
        {...statusProps}
      >
        <Clock aria-hidden="true" className="w-3.5 h-3.5" />
        Subscription expires on{' '}
        <span className="font-medium text-foreground ml-1">
          {format(subscription.validUntil, 'MMMM d, yyyy')}
        </span>
      </div>
    );
  }

  return null;
}

function CardWarning({
  subscription,
  ...props
}: {
  subscription: SubscriptionState;
  role: 'status';
  'aria-live': 'polite';
}) {
  if (subscription.isExpiryInvalid) {
    return (
      <div
        className="flex items-start gap-4 border border-amber-200 bg-amber-50 rounded-lg p-4"
        {...props}
      >
        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
          <AlertTriangle aria-hidden="true" className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="font-semibold text-amber-800">Subscription Date Unavailable</p>
          <p className="text-sm text-amber-700 mt-0.5">
            We couldn't verify your subscription expiry date. Contact your administrator to
            restore access.
          </p>
        </div>
      </div>
    );
  }

  if (subscription.isExpiringSoon && subscription.validUntil) {
    return (
      <div
        className="flex items-start gap-4 border border-yellow-300 bg-yellow-50 rounded-lg p-4"
        {...props}
      >
        <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle aria-hidden="true" className="w-5 h-5 text-yellow-600" />
        </div>
        <div>
          <p className="font-semibold text-yellow-900">⚠ Subscription Expiring Soon</p>
          <p className="text-sm text-yellow-800 mt-0.5">
            Your subscription{' '}
            <span className="font-medium">{subscription.expiryWarning?.countdownText}</span>{' '}
            ({format(subscription.validUntil, 'MMMM d, yyyy')}). Contact your administrator to
            renew before your access is cut off.
          </p>
        </div>
      </div>
    );
  }

  if (subscription.isActive) {
    return (
      <div
        className="flex items-start gap-4 border border-green-200 bg-green-50 rounded-lg p-4"
        {...props}
      >
        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
          <CheckCircle aria-hidden="true" className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-green-800">Subscription Active</p>
          {subscription.validUntil ? (
            <p className="text-sm text-green-700 mt-0.5">
              Your subscription expires on{' '}
              <span className="font-medium">
                {format(subscription.validUntil, 'MMMM d, yyyy')}
              </span>{' '}
              — {formatDistanceToNow(subscription.validUntil, { addSuffix: true })}
            </p>
          ) : (
            <p className="text-sm text-green-700 mt-0.5">
              Your subscription has no expiry date.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (subscription.isExpired) {
    return (
      <div
        className="flex items-start gap-4 border border-red-200 bg-red-50 rounded-lg p-4"
        {...props}
      >
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
          <AlertTriangle aria-hidden="true" className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <p className="font-semibold text-red-800">Subscription Expired</p>
          <p className="text-sm text-red-700 mt-0.5">
            {subscription.validUntil
              ? `Your subscription expired on ${format(subscription.validUntil, 'MMMM d, yyyy')}.`
              : 'Your subscription is no longer active.'}{' '}
            Contact your administrator to renew.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-start gap-4 border border-amber-200 bg-amber-50 rounded-lg p-4"
      {...props}
    >
      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
        <Clock aria-hidden="true" className="w-5 h-5 text-amber-600" />
      </div>
      <div>
        <p className="font-semibold text-amber-800">No Active Subscription</p>
        <p className="text-sm text-amber-700 mt-0.5">
          You don't have an active subscription. Contact your administrator to get access.
        </p>
      </div>
    </div>
  );
}