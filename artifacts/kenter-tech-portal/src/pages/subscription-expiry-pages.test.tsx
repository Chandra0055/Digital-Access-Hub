import { render, screen } from '@testing-library/react';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { authState } = vi.hoisted(() => ({
  authState: {
    user: {
      id: 'subscriber-1',
      name: 'Subscriber',
      role: 'subscriber',
      subscriptionStatus: 'active',
      validUntil: null as Date | string | null,
    },
  },
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => authState,
}));

vi.mock('@workspace/api-client-react', () => ({
  getAdminGetStatsQueryKey: () => ['admin-stats'],
  getListToolsQueryKey: () => ['tools'],
  useAdminGetStats: () => ({ data: undefined, isLoading: false }),
  useListTools: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('framer-motion', async () => {
  const React = await import('react');
  return {
    motion: new Proxy(
      {},
      {
        get: (_, tag: string) =>
          React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
            ({ children, ...props }, ref) =>
              React.createElement(tag, { ...props, ref }, children),
          ),
      },
    ),
  };
});

import DashboardPage from './dashboard';
import ToolsPage from './tools';
import AccountPage from './account';

const now = new Date(2026, 8, 5, 12);
const expiringSoon = new Date(2026, 8, 12, 12);
const beyondWarningWindow = new Date(2026, 8, 13, 12);
const expired = new Date(2026, 8, 4, 12);

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});

beforeEach(() => {
  authState.user.role = 'subscriber';
  authState.user.subscriptionStatus = 'active';
  authState.user.validUntil = null;
});

describe.each([
  ['Dashboard', DashboardPage],
  ['Tools', ToolsPage],
  ['Account', AccountPage],
])('%s malformed subscription expiry', (_name, Page) => {
  it('renders a clear unavailable fallback without throwing', () => {
    authState.user.subscriptionStatus = 'active';
    authState.user.validUntil = 'not-a-timestamp';

    render(<Page />);

    expect(screen.getAllByText(/date unavailable|couldn't verify/i)[0]).toBeVisible();
  });
});

afterAll(() => {
  vi.useRealTimers();
});

describe.each([
  ['Dashboard', DashboardPage],
  ['Tools', ToolsPage],
])('%s subscription expiry warning', (_name, Page) => {
  it('shows the seven-day warning and visible countdown wording', () => {
    authState.user.subscriptionStatus = 'active';
    authState.user.validUntil = expiringSoon;

    render(<Page />);

    expect(screen.getByText(/expires in 7 days/i)).toBeVisible();
  });

  it('hides the warning beyond seven calendar days', () => {
    authState.user.subscriptionStatus = 'active';
    authState.user.validUntil = beyondWarningWindow;

    render(<Page />);

    expect(screen.queryByText(/expir(?:es|ing) soon/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/expires in \d+ days/i)).not.toBeInTheDocument();
  });

  it('hides the warning after the subscription has expired', () => {
    authState.user.subscriptionStatus = 'active';
    authState.user.validUntil = expired;

    render(<Page />);

    expect(screen.queryByText(/expir(?:es|ing) soon/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/expires in \d+ days/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/subscription expired/i)[0]).toBeVisible();
  });
});

describe.each([
  ['Dashboard', DashboardPage],
  ['Tools', ToolsPage],
])('%s admin subscription display', (_name, Page) => {
  it('does not show subscriber warnings for admins', () => {
    authState.user.role = 'admin';
    authState.user.subscriptionStatus = 'inactive';
    authState.user.validUntil = expiringSoon;

    render(<Page />);

    expect(screen.queryByText(/subscription expiring soon/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/expires in \d+ days/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no active subscription/i)).not.toBeInTheDocument();
  });
});

it('keeps an active subscription without an expiry visibly active without a countdown', () => {
  render(<DashboardPage />);

  expect(screen.getByText(/subscription active/i)).toBeVisible();
  expect(screen.getByText(/no expiry date/i)).toBeVisible();
  expect(screen.queryByText(/expires in \d+ days/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/subscription expiring soon/i)).not.toBeInTheDocument();
});

it('shows an active unlimited status on the account page without a countdown', () => {
  render(<AccountPage />);

  expect(screen.getByText(/^active$/i)).toBeVisible();
  expect(screen.getByText(/^unlimited$/i)).toBeVisible();
  expect(screen.queryByText(/expires in \d+ days/i)).not.toBeInTheDocument();
});