import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";
import { bookingsApi, providerApi } from "@/api/endpoints";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RejectBookingModal } from "@/components/provider/RejectBookingModal";
import { fmtDateTime } from "@/lib/format";
import { classifyBooking, type BookingTab } from "@/lib/bookings";
import { useToast } from "@/context/ToastContext";
import type { Booking } from "@shared/schemas";

const ALL_SERVICES = "all";

export default function ProviderMyBookings() {
  const [tab, setTab] = useState<BookingTab>("upcoming");
  const [serviceFilter, setServiceFilter] = useState<string>(ALL_SERVICES);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const qc = useQueryClient();
  const { push: toast } = useToast();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["provider", "bookings"],
    queryFn: providerApi.bookings,
  });

  const { data: myServices } = useQuery({
    queryKey: ["provider", "services"],
    queryFn: providerApi.myServices,
  });

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ["provider", "bookings"] });
    qc.invalidateQueries({ queryKey: ["provider", "requests"] });
    qc.invalidateQueries({ queryKey: ["bookings"] });
  }

  const approve = useMutation({
    mutationFn: (id: number) => bookingsApi.approve(id),
    onSuccess: () => {
      invalidateAll();
      toast("Booking approved", "success");
    },
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      bookingsApi.reject(id, { reason }),
    onSuccess: () => {
      invalidateAll();
      toast("Booking rejected", "info");
      setRejectingId(null);
    },
  });

  const now = new Date();
  const todayStr = now.toDateString();

  const filtered = (bookings ?? []).filter((b) => {
    if (serviceFilter === ALL_SERVICES) return true;
    return String(b.serviceId) === serviceFilter;
  });

  const groups: Record<BookingTab, Booking[]> = { upcoming: [], past: [], cancelled: [] };
  filtered.forEach((b) => groups[classifyBooking(b, now)].push(b));

  const list = groups[tab].slice().sort((a, b) =>
    a.startAt < b.startAt ? (tab === "upcoming" ? -1 : 1) : tab === "upcoming" ? 1 : -1
  );

  const emptyMsg: Record<BookingTab, string> = {
    upcoming: "No upcoming bookings. Students will appear here once they request time on one of your services.",
    past: "No past bookings yet.",
    cancelled: "No cancelled or rejected bookings.",
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My bookings</h1>
        <p className="page-subtitle">All bookings across your services.</p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div role="tablist" style={{ display: "flex", gap: "0.5rem" }}>
          {(["upcoming", "past", "cancelled"] as BookingTab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setTab(t)}
            >
              {t[0].toUpperCase() + t.slice(1)} ({groups[t].length})
            </button>
          ))}
        </div>

        {(myServices?.length ?? 0) > 1 && (
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.875rem", color: "#555" }}>Service:</span>
            <select
              className="form-control"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              style={{ minWidth: 200 }}
            >
              <option value={ALL_SERVICES}>All services</option>
              {myServices!.map((s) => (
                <option key={s.id} value={String(s.id)}>{s.title}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {isLoading ? (
        <p><span className="spinner-inline" /> Loading…</p>
      ) : !list.length ? (
        <div className="card">
          <p>{emptyMsg[tab]}</p>
        </div>
      ) : (
        <div className="provider-bookings-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Service</th>
                <th>When</th>
                <th>Status</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((b) => {
                const isToday = new Date(b.startAt).toDateString() === todayStr;
                const truncated = b.notes && b.notes.length > 60
                  ? b.notes.slice(0, 60) + "…"
                  : b.notes;
                return (
                  <tr key={b.id}>
                    <td>
                      {b.studentName}
                      {isToday && tab === "upcoming" && (
                        <span
                          className="status-badge status-badge--pending"
                          style={{ marginLeft: "0.5rem", fontSize: "0.7rem" }}
                        >
                          Today
                        </span>
                      )}
                    </td>
                    <td>{b.serviceTitle}</td>
                    <td>{fmtDateTime(b.startAt)}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td
                      style={{ maxWidth: 240, whiteSpace: "pre-wrap" }}
                      title={b.notes ?? undefined}
                    >
                      {truncated ?? "—"}
                    </td>
                    <td style={{ display: "flex", gap: "0.5rem", flexWrap: "nowrap" }}>
                      <Link
                        to={`/provider/bookings/${b.id}`}
                        className="btn btn-sm btn-secondary"
                      >
                        Details
                      </Link>
                      {b.status === "pending" && (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            disabled={approve.isPending}
                            onClick={() => approve.mutate(b.id)}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => setRejectingId(b.id)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <RejectBookingModal
        open={rejectingId !== null}
        onClose={() => setRejectingId(null)}
        onSubmit={(reason) => rejectingId && reject.mutate({ id: rejectingId, reason })}
        isPending={reject.isPending}
      />
    </div>
  );
}
