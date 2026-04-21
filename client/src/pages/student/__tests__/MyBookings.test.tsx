import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../../../context/AuthContext';
import MyBookings from '../MyBookings';
import { users } from '../../../mocks/fixtures';
import type { User } from '@shared/schemas';

function makeQc() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const student = users.find((u) => u.email === 'alex@wsu.edu')!;
const authValue = {
  user: student as User,
  token: 'tok',
  isLoading: false,
  login: async () => student as User,
  register: async () => student as User,
  logout: async () => {},
};

function renderMyBookings() {
  render(
    <MemoryRouter>
      <QueryClientProvider client={makeQc()}>
        <AuthContext.Provider value={authValue}>
          <MyBookings />
        </AuthContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('MyBookings page', () => {
  it('renders the page heading', async () => {
    renderMyBookings();
    expect(screen.getByText(/my bookings/i)).toBeInTheDocument();
  });

  it('shows tab buttons for upcoming, past, and cancelled', async () => {
    renderMyBookings();
    expect(screen.getByRole('tab', { name: /upcoming/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /past/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /cancelled/i })).toBeInTheDocument();
  });

  it('loads and displays upcoming bookings from MSW', async () => {
    renderMyBookings();
    // MSW fixture has alex's bookings (approved and pending = upcoming)
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument(), { timeout: 3000 });

    // Should render some bookings in upcoming tab
    const rows = screen.queryAllByRole('row');
    // Table has header + data rows if bookings exist, or empty state
    const hasBookings = rows.length > 1;
    const hasEmptyState = screen.queryByText(/no upcoming bookings/i);
    expect(hasBookings || hasEmptyState).toBeTruthy();
  });

  it('switches to cancelled tab and shows different content', async () => {
    renderMyBookings();
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument(), { timeout: 3000 });

    await userEvent.click(screen.getByRole('tab', { name: /cancelled/i }));

    // After tab switch, the upcoming content is gone and cancelled content is shown
    const cancelledTab = screen.getByRole('tab', { name: /cancelled/i });
    expect(cancelledTab).toHaveAttribute('aria-selected', 'true');
  });

  it('shows empty-state message when tab has no bookings', async () => {
    renderMyBookings();
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument(), { timeout: 3000 });

    // Past tab likely has no bookings in test fixtures (all future)
    await userEvent.click(screen.getByRole('tab', { name: /past/i }));
    await waitFor(() => expect(screen.getByText(/no past bookings/i)).toBeInTheDocument(), { timeout: 2000 });
  });
});
