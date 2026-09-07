import { render, screen } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const { authState } = vi.hoisted(() => ({
  authState: {
    user: {
      id: 'subscriber-1',
      name: 'Subscriber',
      role: 'subscriber',
      subscriptionStatus: 'active',
      validUntil: null as Date | null,
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

const now = new Date(2026, 8, 5, 12);
const expiringSoon = new Date(2026, 8, 12, 12);
const beyondWarningWindow = new Date(2026, 8, 13, 12);
const expired = new Date(2026, 8, 4, 12);

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
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