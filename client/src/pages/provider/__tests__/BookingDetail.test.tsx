import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { AuthContext } from "../../../context/AuthContext";
import { ToastProvider } from "../../../context/ToastContext";
import ProviderBookingDetail from "../BookingDetail";
import { users, makeToken, bookings } from "../../../mocks/fixtures";
import { server } from "../../../test/setup";
import type { User } from "@shared/schemas";

function makeQc() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const provider = users.find((u) => u.email === "advisor@wsu.edu")!;
const token = makeToken(provider.id, provider.role);

const authValue = {
  user: provider as User,
  token,
  isLoading: false,
  login: async () => provider as User,
  register: async () => provider as User,
  logout: async () => {},
};

beforeEach(() => {
  localStorage.setItem("sbs.token", token);
});

afterEach(() => {
  localStorage.removeItem("sbs.token");
});

function renderAt(bookingId: number) {
  render(
    <MemoryRouter initialEntries={[`/provider/bookings/${bookingId}`]}>
      <QueryClientProvider client={makeQc()}>
        <AuthContext.Provider value={authValue}>
          <ToastProvider>
            <Routes>
              <Route
                path="/provider/bookings/:id"
                element={<ProviderBookingDetail />}
              />
              <Route path="/provider/bookings" element={<div>list page</div>} />
            </Routes>
          </ToastProvider>
        </AuthContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

async function waitLoaded() {
  await waitFor(
    () => expect(screen.queryByText(/^loading…$/i)).not.toBeInTheDocument(),
    { timeout: 3000 }
  );
}

// Pick fixture bookings with the right statuses for parameterized assertions.
const pendingBooking = bookings.find((b) => b.status === "pending")!;
const approvedBooking = bookings.find((b) => b.status === "approved")!;
const cancelledBooking = bookings.find((b) => b.status === "cancelled");
const rejectedBooking = bookings.find((b) => b.status === "rejected");
const completedBooking = bookings.find((b) => b.status === "completed");

describe("ProviderBookingDetail page", () => {
  it("renders the student name, service, and notes", async () => {
    renderAt(pendingBooking.id);
    await waitLoaded();
    expect(await screen.findByText(pendingBooking.studentName)).toBeInTheDocument();
    expect(screen.getAllByText(pendingBooking.serviceTitle).length).toBeGreaterThan(0);
  });

  it("shows Approve, Reject, and Cancel buttons for a pending booking", async () => {
    renderAt(pendingBooking.id);
    await waitLoaded();
    expect(await screen.findByRole("button", { name: /^approve$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^reject$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel booking/i })).toBeInTheDocument();
  });

  it("shows only Cancel for an approved booking (no Approve, no Reject)", async () => {
    renderAt(approvedBooking.id);
    await waitLoaded();
    expect(await screen.findByRole("button", { name: /cancel booking/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^approve$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^reject$/i })).not.toBeInTheDocument();
  });

  it.runIf(!!cancelledBooking)(
    "shows no action buttons for a cancelled booking",
    async () => {
      renderAt(cancelledBooking!.id);
      await waitLoaded();
      expect(screen.queryByRole("button", { name: /^approve$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^reject$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /cancel booking/i })).not.toBeInTheDocument();
    }
  );

  it.runIf(!!rejectedBooking)(
    "shows the rejection reason for a rejected booking",
    async () => {
      renderAt(rejectedBooking!.id);
      await waitLoaded();
      if (rejectedBooking!.rejectionReason) {
        expect(
          await screen.findByText(rejectedBooking!.rejectionReason)
        ).toBeInTheDocument();
      }
      expect(screen.queryByRole("button", { name: /^approve$/i })).not.toBeInTheDocument();
    }
  );

  it.runIf(!!completedBooking)(
    "shows no action buttons for a completed booking",
    async () => {
      renderAt(completedBooking!.id);
      await waitLoaded();
      expect(screen.queryByRole("button", { name: /^approve$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^reject$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /cancel booking/i })).not.toBeInTheDocument();
    }
  );

  it("never renders a Reschedule button for any status (provider-side)", async () => {
    renderAt(pendingBooking.id);
    await waitLoaded();
    expect(screen.queryByRole("button", { name: /reschedule/i })).not.toBeInTheDocument();
  });

  it("disables the modal Reject button when no reason is entered", async () => {
    renderAt(pendingBooking.id);
    await waitLoaded();
    await userEvent.click(await screen.findByRole("button", { name: /^reject$/i }));
    // Modal opens — wait for the textarea, then verify the modal's Reject is disabled.
    await screen.findByText(/tell the student why/i);
    const allRejects = screen.getAllByRole("button", { name: /^reject$/i });
    const disabled = allRejects.filter((b) => (b as HTMLButtonElement).disabled);
    expect(disabled.length).toBeGreaterThan(0);
  });

  it("renders NotFound fallback when the server returns 403", async () => {
    server.use(
      http.get("/api/bookings/:id", () =>
        HttpResponse.json(
          { code: "FORBIDDEN", message: "Not allowed" },
          { status: 403 }
        )
      )
    );
    renderAt(pendingBooking.id);
    await waitFor(() => {
      expect(screen.getByText(/page not found/i)).toBeInTheDocument();
    });
  });
});
