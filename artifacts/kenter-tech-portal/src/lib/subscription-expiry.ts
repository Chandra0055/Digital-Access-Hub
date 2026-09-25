import { isAfter } from 'date-fns';

export type SubscriptionStatus = 'active' | 'inactive' | 'expired';

export type SubscriptionExpiryWarning = {
  daysRemaining: number;
  countdownText: string;
};

export type SubscriptionState = {
  status: SubscriptionStatus;
  isActive: boolean;
  isInactive: boolean;
  isExpired: boolean;
  isExpiryInvalid: boolean;
  isExpiringSoon: boolean;
  validUntil: Date | null;
  expiryWarning: SubscriptionExpiryWarning | null;
};

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function differenceInUtcCalendarDays(laterDate: Date, earlierDate: Date): number {
  const laterUtcDay = Date.UTC(
    laterDate.getUTCFullYear(),
    laterDate.getUTCMonth(),
    laterDate.getUTCDate(),
  );
  const earlierUtcDay = Date.UTC(
    earlierDate.getUTCFullYear(),
    earlierDate.getUTCMonth(),
    earlierDate.getUTCDate(),
  );

  return Math.round((laterUtcDay - earlierUtcDay) / MILLISECONDS_PER_DAY);
}

export function getSubscriptionState(
  subscriptionStatus: string | null | undefined,
  validUntil: Date | string | null | undefined,
  now: Date = new Date(),
): SubscriptionState {
  const parsedExpiryDate =
    validUntil === null || validUntil === undefined
      ? null
      : new Date(validUntil);
  const isExpiryInvalid =
    parsedExpiryDate !== null && Number.isNaN(parsedExpiryDate.getTime());
  const expiryDate = isExpiryInvalid ? null : parsedExpiryDate;
  const hasExpired = expiryDate !== null && expiryDate.getTime() <= now.getTime();
  const status: SubscriptionStatus =
    isExpiryInvalid
      ? 'inactive'
      : subscriptionStatus === 'active'
      ? hasExpired ? 'expired' : 'active'
      : subscriptionStatus === 'expired'
        ? 'expired'
        : 'inactive';
  const expiryWarning =
    status === 'active' ? getSubscriptionExpiryWarning(expiryDate, now) : null;

  return {
    status,
    isActive: status === 'active',
    isInactive: status === 'inactive',
    isExpired: status === 'expired',
    isExpiryInvalid,
    isExpiringSoon: expiryWarning !== null,
    validUntil: expiryDate,
    expiryWarning,
  };
}

export function getSubscriptionExpiryWarning(
  validUntil: Date | null,
  now: Date = new Date(),
): SubscriptionExpiryWarning | null {
  if (
    !validUntil ||
    Number.isNaN(validUntil.getTime()) ||
    !isAfter(validUntil, now)
  ) {
    return null;
  }

  // Countdown labels follow UTC calendar dates so travel cannot shift them.
  const daysRemaining = differenceInUtcCalendarDays(validUntil, now);
  if (daysRemaining > 7) {
    return null;
  }

  return {
    daysRemaining,
    countdownText:
      daysRemaining === 0
        ? 'expires today'
        : daysRemaining === 1
          ? 'expires tomorrow'
          : `expires in ${daysRemaining} days`,
  };
}