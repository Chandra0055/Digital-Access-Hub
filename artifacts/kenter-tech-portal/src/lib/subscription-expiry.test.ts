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

test('uses calendar days at the seven-day warning boundary across times of day', async (t) => {
  const boundaryCases = [
    {
      name: 'just inside: late on the seventh calendar day',
      currentTime: new Date(2026, 8, 5, 0, 0, 0, 1),
      validUntil: new Date(2026, 8, 12, 23, 59, 59, 999),
      expected: { daysRemaining: 7, countdownText: 'expires in 7 days' },
    },
    {
      name: 'exactly seven elapsed days',
      currentTime: new Date(2026, 8, 5, 12),
      validUntil: new Date(2026, 8, 12, 12),
      expected: { daysRemaining: 7, countdownText: 'expires in 7 days' },
    },
    {
      name: 'just outside: early on the eighth calendar day',
      currentTime: new Date(2026, 8, 5, 23, 59, 59, 999),
      validUntil: new Date(2026, 8, 13, 0, 0, 0, 0),
      expected: null,
    },
  ] as const;

  for (const boundaryCase of boundaryCases) {
    await t.test(boundaryCase.name, () => {
      assert.deepEqual(
        getSubscriptionExpiryWarning(
          boundaryCase.validUntil,
          boundaryCase.currentTime,
        ),
        boundaryCase.expected,
      );
    });
  }
});

test('uses calendar days at the seven-day warning boundary across daylight-saving transitions', async (t) => {
  const originalTimezone = process.env.TZ;
  process.env.TZ = 'America/New_York';

  try {
    const transitionCases = [
      {
        name: 'spring forward',
        currentTime: new Date(2026, 2, 1, 12),
        seventhCalendarDay: new Date(2026, 2, 8, 12),
        eighthCalendarDay: new Date(2026, 2, 9, 12),
      },
      {
        name: 'fall back',
        currentTime: new Date(2026, 9, 25, 12),
        seventhCalendarDay: new Date(2026, 10, 1, 12),
        eighthCalendarDay: new Date(2026, 10, 2, 12),
      },
    ] as const;

    for (const transitionCase of transitionCases) {
      await t.test(transitionCase.name, () => {
        assert.deepEqual(
          getSubscriptionExpiryWarning(
            transitionCase.seventhCalendarDay,
            transitionCase.currentTime,
          ),
          { daysRemaining: 7, countdownText: 'expires in 7 days' },
        );
        assert.equal(
          getSubscriptionExpiryWarning(
            transitionCase.eighthCalendarDay,
            transitionCase.currentTime,
          ),
          null,
        );
      });
    }
  } finally {
    if (originalTimezone === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTimezone;
    }
  }
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
