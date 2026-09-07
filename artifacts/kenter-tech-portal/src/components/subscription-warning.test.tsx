import { render, screen } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { getSubscriptionState } from '@/lib/subscription-expiry';
import { SubscriptionWarning } from './subscription-warning';

const now = new Date(2026, 8, 5, 12);

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});

afterAll(() => {
  vi.useRealTimers();
});

const states = [
  {
    name: 'active',
    subscription: getSubscriptionState('active', new Date(2026, 9, 5, 12), now),
    text: /subscription (?:is )?active|subscription expires on/i,
  },
  {
    name: 'warning',
    subscription: getSubscriptionState('active', new Date(2026, 8, 12, 12), now),
    text: /subscription expir(?:es|ing) (?:soon|in 7 days)/i,
  },
  {
    name: 'invalid',
    subscription: getSubscriptionState('active', 'not-a-timestamp', now),
    text: /couldn't verify your subscription expiry date/i,
  },
  {
    name: 'expired',
    subscription: getSubscriptionState('expired', new Date(2026, 8, 4, 12), now),
    text: /subscription expired/i,
  },
] as const;

describe.each(['card', 'banner'] as const)('%s subscription warning', (variant) => {
  it.each(states)('announces the $name state with accessible status text', ({ subscription, text }) => {
    render(<SubscriptionWarning subscription={subscription} variant={variant} />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent(text);
  });
});

it('renders no status region when the banner has nothing to announce', () => {
  const activeWithoutExpiry = getSubscriptionState('active', null, now);

  const { container } = render(
    <SubscriptionWarning subscription={activeWithoutExpiry} variant="banner" />,
  );

  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(container).toBeEmptyDOMElement();
});