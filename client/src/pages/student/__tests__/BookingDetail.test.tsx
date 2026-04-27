import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { AuthContext } from '../../../context/AuthContext';
import { ToastProvider } from '../../../context/ToastContext';
import BookingDetail from '../BookingDetail';
import { server } from '../../../test/setup';
import type { Booking, User } from '@shared/schemas';

function makeQc() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const student: User = {
  id: 10,
  email: 'alex@wsu.edu',
  firstName: 'Alex',
  lastName: 'Johnson',
  role: 'student',
  isBanned: false,
  createdAt: new Date().toISOString(),
};

const authValue = {
  user: student,
  token: 'tok',
  isLoading: false,
  login: async () => student,
  register: async () => student,
  logout: async () => {},
};

function renderDetail(bookingId: number) {
  render(
    <MemoryRouter initialEntries={[`/bookings/${bookingId}`]}>
      <QueryClientProvider client={makeQc()}>
        <AuthContext.Provider value={authValue}>
          <ToastProvider>
            <Routes>
              <Route path="/bookings/:id" element={<BookingDetail />} />
            </Routes>
          </ToastProvider>
        </AuthContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  const start = new Date(Date.now() + 6 * 3_600_000); // 6 hours out — well past 120-min lead time.
  const end = new Date(start.getTime() + 30 * 60_000);
  return {
    id: 901,
    serviceId: 1,
    serviceTitle: 'Academic Advising',
    providerName: 'Maya Chen',
    studentId: student.id,
    studentName: 'Alex Johnson',
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    status: 'approved',
    notes: null,
    rejectionReason: null,
    location: 'Sloan Hall 210',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function stubBooking(b: Booking) {
  server.use(
    http.get('/api/bookings/:id', ({ params }) => {
      if (Number(params.id) !== b.id) {
        return HttpResponse.json({ code: 'NOT_FOUND', message: 'no' }, { status: 404 });
      }
      return HttpResponse.json(b);
    })
  );
}

function stubAvailability(slots: { id: number; serviceId: number; startAt: string; endAt: string }[]) {
  server.use(
    http.get('/api/services/:id/availability', () => HttpResponse.json(slots))
  );
}

describe('BookingDetail page — reschedule', () => {
  it('renders the Reschedule button for an approved upcoming booking', async () => {
    const b = makeBooking();
    stubBooking(b);
    renderDetail(b.id);

    expect(await screen.findByRole('button', { name: /reschedule/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel booking/i })).toBeInTheDocument();
  });

  it('hides the Reschedule button when the lead-time guard would deny it (booking starts in 30 min)', async () => {
    const start = new Date(Date.now() + 30 * 60_000);
    const end = new Date(start.getTime() + 30 * 60_000);
    const b = makeBooking({ id: 902, startAt: start.toISOString(), endAt: end.toISOString() });
    stubBooking(b);
    renderDetail(b.id);

    // Cancel button still appears (until appointment time), reschedule does not.
    await screen.findByRole('button', { name: /cancel booking/i });
    expect(screen.queryByRole('button', { name: /^reschedule$/i })).not.toBeInTheDocument();
  });

  it('hides both buttons for a cancelled booking', async () => {
    const b = makeBooking({ id: 903, status: 'cancelled' });
    stubBooking(b);
    renderDetail(b.id);

    await screen.findByText(/Academic Advising/i);
    expect(screen.queryByRole('button', { name: /^reschedule$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel booking/i })).not.toBeInTheDocument();
  });

  it('opens the modal with the approved → pending warning banner', async () => {
    const b = makeBooking();
    stubBooking(b);
    stubAvailability([]);
    renderDetail(b.id);

    await userEvent.click(await screen.findByRole('button', { name: /^reschedule$/i }));

    await waitFor(() =>
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    );
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('status')).toHaveTextContent(/will reset/i);
    expect(within(dialog).getByText(/^Currently:$/i)).toBeInTheDocument();
  });

  it('shows the milder copy when the booking is pending', async () => {
    const b = makeBooking({ id: 904, status: 'pending' });
    stubBooking(b);
    stubAvailability([]);
    renderDetail(b.id);

    await userEvent.click(await screen.findByRole('button', { name: /^reschedule$/i }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/hasn't approved this booking yet/i)).toBeInTheDocument();
    expect(within(dialog).queryByText(/will reset/i)).not.toBeInTheDocument();
  });

  it('Confirm button is disabled until a different slot is picked', async () => {
    const b = makeBooking();
    stubBooking(b);
    const otherStart = new Date(new Date(b.startAt).getTime() + 24 * 3_600_000).toISOString();
    const otherEnd = new Date(new Date(b.endAt).getTime() + 24 * 3_600_000).toISOString();
    stubAvailability([
      { id: 5001, serviceId: b.serviceId, startAt: b.startAt, endAt: b.endAt }, // current — disabled
      { id: 5002, serviceId: b.serviceId, startAt: otherStart, endAt: otherEnd },
    ]);
    renderDetail(b.id);

    await userEvent.click(await screen.findByRole('button', { name: /^reschedule$/i }));
    const dialog = await screen.findByRole('dialog');

    const confirm = within(dialog).getByRole('button', { name: /confirm new time/i });
    expect(confirm).toBeDisabled();

    // The "(current)" slot is disabled; pick the other one.
    const slotButtons = within(dialog).getAllByRole('button').filter((b) =>
      /(\d{1,2}:\d{2})/.test(b.textContent ?? '')
    );
    // Find the non-current slot
    const target = slotButtons.find((btn) => !/current/i.test(btn.textContent ?? ''));
    expect(target).toBeTruthy();
    await userEvent.click(target!);

    expect(confirm).not.toBeDisabled();
  });

  it('confirming a slot calls PATCH /bookings/:id with the right payload', async () => {
    const b = makeBooking();
    stubBooking(b);

    const newStart = new Date(new Date(b.startAt).getTime() + 24 * 3_600_000).toISOString();
    const newEnd = new Date(new Date(b.endAt).getTime() + 24 * 3_600_000).toISOString();
    stubAvailability([
      { id: 6001, serviceId: b.serviceId, startAt: newStart, endAt: newEnd },
    ]);

    const seen: { startAt?: string; endAt?: string } = {};
    server.use(
      http.patch('/api/bookings/:id', async ({ request }) => {
        const body = (await request.json()) as { startAt: string; endAt: string };
        seen.startAt = body.startAt;
        seen.endAt = body.endAt;
        return HttpResponse.json({ ...b, status: 'pending', startAt: body.startAt, endAt: body.endAt });
      })
    );

    renderDetail(b.id);
    await userEvent.click(await screen.findByRole('button', { name: /^reschedule$/i }));
    const dialog = await screen.findByRole('dialog');
    const slotButtons = within(dialog).getAllByRole('button').filter((btn) =>
      /(\d{1,2}:\d{2})/.test(btn.textContent ?? '')
    );
    await userEvent.click(slotButtons[0]);
    await userEvent.click(within(dialog).getByRole('button', { name: /confirm new time/i }));

    await waitFor(() => expect(seen.startAt).toBe(newStart));
    expect(seen.endAt).toBe(newEnd);
  });

  it('a 409 "already been booked" surfaces the inline message and refetches availability', async () => {
    const b = makeBooking();
    stubBooking(b);

    const newStart = new Date(new Date(b.startAt).getTime() + 26 * 3_600_000).toISOString();
    const newEnd = new Date(new Date(b.endAt).getTime() + 26 * 3_600_000).toISOString();

    let availabilityCalls = 0;
    server.use(
      http.get('/api/services/:id/availability', () => {
        availabilityCalls++;
        return HttpResponse.json([
          { id: 7001, serviceId: b.serviceId, startAt: newStart, endAt: newEnd },
        ]);
      }),
      http.patch('/api/bookings/:id', () =>
        HttpResponse.json(
          { code: 'CONFLICT', message: 'That time slot has already been booked' },
          { status: 409 }
        )
      )
    );

    renderDetail(b.id);
    await userEvent.click(await screen.findByRole('button', { name: /^reschedule$/i }));
    const dialog = await screen.findByRole('dialog');
    const slotButtons = within(dialog).getAllByRole('button').filter((btn) =>
      /(\d{1,2}:\d{2})/.test(btn.textContent ?? '')
    );
    await userEvent.click(slotButtons[0]);

    const callsBefore = availabilityCalls;
    await userEvent.click(within(dialog).getByRole('button', { name: /confirm new time/i }));

    // Inline error appears, modal stays open, availability refetched.
    await screen.findByText(/grabbed that slot first/i);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await waitFor(() => expect(availabilityCalls).toBeGreaterThan(callsBefore));
  });

  it('a 409 "Cannot reschedule a ..." closes the modal and refetches the booking', async () => {
    const b = makeBooking();
    let bookingCalls = 0;
    server.use(
      http.get('/api/bookings/:id', () => {
        bookingCalls++;
        return HttpResponse.json(b);
      })
    );
    const newStart = new Date(new Date(b.startAt).getTime() + 24 * 3_600_000).toISOString();
    const newEnd = new Date(new Date(b.endAt).getTime() + 24 * 3_600_000).toISOString();
    stubAvailability([{ id: 8001, serviceId: b.serviceId, startAt: newStart, endAt: newEnd }]);

    server.use(
      http.patch('/api/bookings/:id', () =>
        HttpResponse.json(
          { code: 'CONFLICT', message: 'Cannot reschedule a cancelled booking' },
          { status: 409 }
        )
      )
    );

    renderDetail(b.id);
    await userEvent.click(await screen.findByRole('button', { name: /^reschedule$/i }));
    const dialog = await screen.findByRole('dialog');
    const slotButtons = within(dialog).getAllByRole('button').filter((btn) =>
      /(\d{1,2}:\d{2})/.test(btn.textContent ?? '')
    );
    const callsBefore = bookingCalls;
    await userEvent.click(slotButtons[0]);
    await userEvent.click(within(dialog).getByRole('button', { name: /confirm new time/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(bookingCalls).toBeGreaterThan(callsBefore);
  });

  it('a 409 lead-time error closes the modal and surfaces a toast', async () => {
    const b = makeBooking();
    stubBooking(b);
    const newStart = new Date(new Date(b.startAt).getTime() + 24 * 3_600_000).toISOString();
    const newEnd = new Date(new Date(b.endAt).getTime() + 24 * 3_600_000).toISOString();
    stubAvailability([{ id: 9001, serviceId: b.serviceId, startAt: newStart, endAt: newEnd }]);

    server.use(
      http.patch('/api/bookings/:id', () =>
        HttpResponse.json(
          {
            code: 'CONFLICT',
            message: 'Reschedules must be made at least 120 minutes before the appointment. Cancel and book a new time instead.',
          },
          { status: 409 }
        )
      )
    );

    renderDetail(b.id);
    await userEvent.click(await screen.findByRole('button', { name: /^reschedule$/i }));
    const dialog = await screen.findByRole('dialog');
    const slotButtons = within(dialog).getAllByRole('button').filter((btn) =>
      /(\d{1,2}:\d{2})/.test(btn.textContent ?? '')
    );
    await userEvent.click(slotButtons[0]);
    await userEvent.click(within(dialog).getByRole('button', { name: /confirm new time/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText(/at least 120 minutes/i)).toBeInTheDocument();
  });
});
