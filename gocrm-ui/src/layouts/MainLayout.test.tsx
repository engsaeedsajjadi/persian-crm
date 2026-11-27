import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { MainLayout } from './MainLayout';
import { createMockUser } from '@/test/factories';
import type { User } from '@/types';
import { permissionsOf } from '@/test/permissions';

const mockUseAuth = vi.fn();
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => mockNavigate,
}));
vi.mock('@/components/layout/NotificationBell', () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const authState = (user: User) => ({
  user,
  permissions: permissionsOf(user),
  isLoading: false,
  isAuthenticated: true,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
});

// The permanent drawer is the navigation a desktop viewer sees; the temporary
// one is kept mounted for mobile and would double every entry. Entries are
// looked up by text: jsdom applies the drawer's `xs` display rule and ignores
// the `sm` media query, so role queries would report the entries hidden.
const navigation = () => within(screen.getByTestId('app-navigation'));

describe('MainLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the اتوماسیون group for admin and sales and hides it for support and customer', async () => {
    for (const role of ['admin', 'sales'] as const) {
      mockUseAuth.mockReturnValue(authState(createMockUser({ role })));
      const view = render(<MainLayout />);

      await userEvent.click(navigation().getByText('اتوماسیون'));
      expect(await navigation().findByText('اجراها', {}, { timeout: 15000 })).toBeInTheDocument();
      // قوانین are admin-only on the API.
      if (role === 'admin') {
        expect(navigation().getByText('قوانین')).toBeInTheDocument();
      } else {
        expect(navigation().queryByText('قوانین')).not.toBeInTheDocument();
      }
      view.unmount();
    }

    for (const role of ['support', 'customer'] as const) {
      mockUseAuth.mockReturnValue(authState(createMockUser({ role })));
      const view = render(<MainLayout />);

      expect(navigation().queryByText('اتوماسیون')).not.toBeInTheDocument();
      view.unmount();
    }
  }, 30000);

  it('renders the notification bell slot in the app bar', () => {
    mockUseAuth.mockReturnValue(authState(createMockUser({ role: 'admin' })));
    render(<MainLayout />);

    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
  }, 30000);

  it('shows the محصولات and پیش‌فاکتورها navigation entries for admin and sales and hides them for support and customer', () => {
    for (const role of ['admin', 'sales'] as const) {
      mockUseAuth.mockReturnValue(authState(createMockUser({ role })));
      const view = render(<MainLayout />);

      expect(navigation().getByText('محصولات')).toBeInTheDocument();
      expect(navigation().getByText('پیش‌فاکتورها')).toBeInTheDocument();
      // The entries sit with the other sales items, next to معاملات.
      expect(navigation().getByText('معاملات')).toBeInTheDocument();
      view.unmount();
    }

    for (const role of ['support', 'customer'] as const) {
      mockUseAuth.mockReturnValue(authState(createMockUser({ role })));
      const view = render(<MainLayout />);

      expect(navigation().queryByText('محصولات')).not.toBeInTheDocument();
      expect(navigation().queryByText('پیش‌فاکتورها')).not.toBeInTheDocument();
      // The shell itself still renders for them.
      expect(navigation().getByText('داشبورد')).toBeInTheDocument();
      expect(navigation().getByText('پیگیری‌ها')).toBeInTheDocument();
      view.unmount();
    }
  }, 30000);

  it('shows تیکت‌ها to admin, sales and support and hides it from customer', () => {
    for (const role of ['admin', 'sales', 'support'] as const) {
      mockUseAuth.mockReturnValue(authState(createMockUser({ role })));
      const view = render(<MainLayout />);

      expect(navigation().getByText('تیکت‌ها')).toBeInTheDocument();
      view.unmount();
    }

    mockUseAuth.mockReturnValue(authState(createMockUser({ role: 'customer' })));
    render(<MainLayout />);
    expect(navigation().queryByText('تیکت‌ها')).not.toBeInTheDocument();
  }, 30000);

  it('keeps the existing role-gated entries as they were', () => {
    mockUseAuth.mockReturnValue(authState(createMockUser({ role: 'support' })));
    render(<MainLayout />);

    expect(navigation().queryByText('معاملات')).not.toBeInTheDocument();
    expect(navigation().getByText('تیکت‌ها')).toBeInTheDocument();
    expect(navigation().getByText('شرکت‌ها')).toBeInTheDocument();
    expect(navigation().queryByText('کاربران')).not.toBeInTheDocument();
  }, 30000);

  it('names the app bar account button and opens the menu with خروج از حساب', async () => {
    mockUseAuth.mockReturnValue(authState(createMockUser({ role: 'admin' })));
    render(<MainLayout />);

    const accountButton = screen.getByRole('button', { name: 'منوی حساب کاربری' });
    await userEvent.click(accountButton);
    expect(await screen.findByRole('menuitem', { name: 'خروج از حساب' })).toBeInTheDocument();
  }, 30000);

  it.each([
    [false, 'goes to the login page after a logout that stays in the app'],
    [true, 'leaves the navigation to the identity provider when the logout hands the browser to it'],
  ])('logout resolving %s %s', async (leaving) => {
    const logout = vi.fn().mockResolvedValue(leaving);
    mockUseAuth.mockReturnValue({ ...authState(createMockUser({ role: 'admin' })), logout });
    render(<MainLayout />);

    await userEvent.click(screen.getByRole('button', { name: 'منوی حساب کاربری' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'خروج از حساب' }));
    expect(logout).toHaveBeenCalledTimes(1);
    if (leaving) {
      expect(mockNavigate).not.toHaveBeenCalledWith('/login');
    } else {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    }
  }, 30000);
});
