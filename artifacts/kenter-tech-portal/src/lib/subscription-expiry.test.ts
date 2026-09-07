import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getSubscriptionExpiryWarning,
  getSubscriptionState,
} from './subscription-expiry.ts';

const now = new Date(2026, 8, 5, 12);

test('active subscription without an expiry is unlimited and active', () => {
  assert.deepEqual(
    getSubscriptionState('active', null, now),
    {
      status: 'active',
      isActive: true,
      isInactive: false,
      isExpired: false,
      isExpiryInvalid: false,
      isExpiringSoon: false,
      validUntil: null,
      expiryWarning: null,
    },
  );
});

test('active subscription with a future expiry remains active', () => {
  const validUntil = new Date(2026, 8, 20, 12);
  const state = getSubscriptionState('active', validUntil, now);

  assert.equal(state.status, 'active');
  assert.equal(state.isActive, true);
  assert.equal(state.isExpiringSoon, false);
  assert.equal(state.validUntil?.getTime(), validUntil.getTime());
});

test('active subscription expiring at the current instant is expired', () => {
  const state = getSubscriptionState('active', now, now);

  assert.equal(state.status, 'expired');
  assert.equal(state.isExpired, true);
  assert.equal(state.isActive, false);
});

test('active subscription with a past expiry is expired', () => {
  const state = getSubscriptionState('active', new Date(now.getTime() - 1), now);

  assert.equal(state.status, 'expired');
  assert.equal(state.isExpired, true);
});

test('inactive status remains inactive without an expiry', () => {
  const state = getSubscriptionState('inactive', null, now);

  assert.equal(state.status, 'inactive');
  assert.equal(state.isInactive, true);
  assert.equal(state.isExpired, false);
});

test('expired status remains expired even with a future expiry', () => {
  const state = getSubscriptionState('expired', new Date(2026, 8, 20), now);

  assert.equal(state.status, 'expired');
  assert.equal(state.isExpired, true);
  assert.equal(state.isExpiringSoon, false);
});

test('active subscription within seven days is expiring soon', () => {
  const state = getSubscriptionState('active', new Date(2026, 8, 12, 12), now);

  assert.equal(state.status, 'active');
  assert.equal(state.isExpiringSoon, true);
  assert.deepEqual(state.expiryWarning, {
    daysRemaining: 7,
    countdownText: 'expires in 7 days',
  });
});

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

test('malformed expiry strings produce an explicit safe inactive state', () => {
  const state = getSubscriptionState('active', 'not-a-timestamp', now);

  assert.equal(state.status, 'inactive');
  assert.equal(state.isActive, false);
  assert.equal(state.isInactive, true);
  assert.equal(state.isExpiryInvalid, true);
  assert.equal(state.isExpiringSoon, false);
  assert.equal(state.validUntil, null);
  assert.equal(state.expiryWarning, null);
});

test('invalid Date objects produce an explicit safe inactive state', () => {
  const state = getSubscriptionState('active', new Date(Number.NaN), now);

  assert.equal(state.status, 'inactive');
  assert.equal(state.isActive, false);
  assert.equal(state.isExpiryInvalid, true);
  assert.equal(state.validUntil, null);
});

test('empty expiry strings produce an explicit safe inactive state', () => {
  const state = getSubscriptionState('active', '', now);

  assert.equal(state.status, 'inactive');
  assert.equal(state.isActive, false);
  assert.equal(state.isExpiryInvalid, true);
  assert.equal(state.validUntil, null);
});

test('does not return a warning for an invalid Date object', () => {
  assert.equal(
    getSubscriptionExpiryWarning(new Date(Number.NaN), now),
    null,
  );
});
