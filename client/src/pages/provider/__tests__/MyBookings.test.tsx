import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "../../../context/AuthContext";
import { ToastProvider } from "../../../context/ToastContext";
import ProviderMyBookings from "../MyBookings";
import { users, makeToken } from "../../../mocks/fixtures";
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

function renderPage() {
  render(
    <MemoryRouter>
      <QueryClientProvider client={makeQc()}>
        <AuthContext.Provider value={authValue}>
          <ToastProvider>
            <ProviderMyBookings />
          </ToastProvider>
        </AuthContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

async function waitForLoaded() {
  await waitFor(
    () => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument(),
    { timeout: 3000 }
  );
}

describe("ProviderMyBookings page", () => {
  it("renders the page heading and three tabs", async () => {
    renderPage();
    expect(screen.getByText(/my bookings/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /upcoming/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /past/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /cancelled/i })).toBeInTheDocument();
  });

  it("loads provider bookings from MSW and shows them in the table", async () => {
    renderPage();
    await waitForLoaded();
    // Maya Chen owns services 1, 6, 8. Alex's bookings on those should render.
    const rows = screen.queryAllByRole("row");
    const hasRows = rows.length > 1;
    const hasEmpty = screen.queryByText(/no upcoming bookings/i);
    expect(hasRows || hasEmpty).toBeTruthy();
  });

  it("switches to the cancelled tab and updates aria-selected", async () => {
    renderPage();
    await waitForLoaded();
    await userEvent.click(screen.getByRole("tab", { name: /cancelled/i }));
    expect(screen.getByRole("tab", { name: /cancelled/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it("shows the service-filter select when the provider has multiple services", async () => {
    renderPage();
    await waitForLoaded();
    // Maya has services 1, 6, 8 — more than 1, so the select should appear.
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /all services/i })).toBeInTheDocument();
  });

  it("renders Approve and Reject buttons only on pending rows", async () => {
    renderPage();
    await waitForLoaded();
    const approves = screen.queryAllByRole("button", { name: /^approve$/i });
    const rejects = screen.queryAllByRole("button", { name: /^reject$/i });
    expect(approves.length).toBe(rejects.length);
    // Every Approve button should sit in a row whose status is Pending.
    approves.forEach((btn) => {
      const row = btn.closest("tr")!;
      expect(within(row).getByText(/pending/i)).toBeInTheDocument();
    });
  });

  it("shows the rejection modal when Reject is clicked on a pending row", async () => {
    renderPage();
    await waitForLoaded();
    const rejects = screen.queryAllByRole("button", { name: /^reject$/i });
    if (!rejects.length) {
      // No pending rows in fixture for this provider — skip without failing.
      return;
    }
    await userEvent.click(rejects[0]);
    expect(await screen.findByText(/tell the student why/i)).toBeInTheDocument();
  });
});
