import assert from 'node:assert/strict';
import test from 'node:test';
import { getSubscriptionExpiryWarning } from './subscription-expiry.ts';

const now = new Date(2026, 8, 5, 12);

test('returns "expires today" for a future expiry on the same calendar day', () => {
  assert.deepEqual(
    getSubscriptionExpiryWarning(new Date(2026, 8, 5, 23, 59, 59), now),
    { daysRemaining: 0, countdownText: 'expires today' },
  );
});

test('returns "expires tomorrow" for an expiry one calendar day away', () => {
  assert.deepEqual(
    getSubscriptionExpiryWarning(new Date(2026, 8, 6), now),
    { daysRemaining: 1, countdownText: 'expires tomorrow' },
  );
});

test('returns a seven-day countdown at the warning boundary', () => {
  assert.deepEqual(
    getSubscriptionExpiryWarning(new Date(2026, 8, 12, 12), now),
    { daysRemaining: 7, countdownText: 'expires in 7 days' },
  );
});

test('does not return a warning when expiry is more than seven calendar days away', () => {
  assert.equal(
    getSubscriptionExpiryWarning(new Date(2026, 8, 13), now),
    null,
  );
});

test('does not return a warning when expiry is already past by a fraction of a day', () => {
  assert.equal(
    getSubscriptionExpiryWarning(new Date(2026, 8, 5, 11, 59, 59, 999), now),
    null,
  );
});

test('does not return a warning when expiry equals the current instant', () => {
  assert.equal(getSubscriptionExpiryWarning(now, now), null);
});

test('compares timezone-offset timestamps by their actual instants', () => {
  assert.equal(
    getSubscriptionExpiryWarning(
      new Date('2026-09-05T08:00:00-04:00'),
      new Date('2026-09-05T12:00:00.001Z'),
    ),
    null,
  );
});