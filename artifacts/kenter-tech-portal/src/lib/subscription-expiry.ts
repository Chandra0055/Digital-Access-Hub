import { differenceInCalendarDays, isAfter } from 'date-fns';

export type SubscriptionExpiryWarning = {
  daysRemaining: number;
  countdownText: string;
};

export function getSubscriptionExpiryWarning(
  validUntil: Date | null,
  now: Date = new Date(),
): SubscriptionExpiryWarning | null {
  if (!validUntil || !isAfter(validUntil, now)) {
    return null;
  }

  const daysRemaining = differenceInCalendarDays(validUntil, now);
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