import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";
import { bookingsApi } from "@/api/endpoints";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { fmtDateTime } from "@/lib/format";
import { useToast } from "@/context/ToastContext";
import type { Booking } from "@shared/schemas";

type Tab = "upcoming" | "past" | "cancelled";

function classify(b: Booking, now: Date): Tab {
  if (b.status === "cancelled" || b.status === "rejected") return "cancelled";
  if (b.status === "completed" || new Date(b.endAt) < now) return "past";
  return "upcoming";
}

export default function MyBookings() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [rebookTarget, setRebookTarget] = useState<Booking | null>(null);
  const [rebookError, setRebookError] = useState<string | null>(null);
  const qc = useQueryClient();
  const { push: toast } = useToast();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings", "me"],
    queryFn: () => bookingsApi.listMine(),
  });

  const rebook = useMutation({
    mutationFn: (b: Booking) =>
      bookingsApi.create({
        serviceId: b.serviceId,
        startAt: b.startAt,
        endAt: b.endAt,
        notes: b.notes ?? undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings", "me"] });
      setRebookTarget(null);
      setRebookError(null);
      toast("Booking submitted — awaiting approval", "success");
      setTab("upcoming");
    },
    onError: (err: any) => {
      const serverMsg: string = err?.response?.data?.message ?? "";
      setRebookError(
        serverMsg === "That time slot has already been booked"
          ? "That time slot is no longer available. Please browse services to find a new time."
          : serverMsg || "Something went wrong. Please try again."
      );
    },
  });

  const now = new Date();
  const groups: Record<Tab, Booking[]> = { upcoming: [], past: [], cancelled: [] };
  (bookings ?? []).forEach((b) => groups[classify(b, now)].push(b));
  const list = groups[tab].sort((a, b) =>
    a.startAt < b.startAt ? (tab === "upcoming" ? -1 : 1) : tab === "upcoming" ? 1 : -1
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My bookings</h1>
      </div>

      <div role="tablist" style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {(["upcoming", "past", "cancelled"] as Tab[]).map((t) => (
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

      {isLoading ? (
        <p><span className="spinner-inline" /> Loading…</p>
      ) : !list.length ? (
        <div className="card">
          <p>You have no {tab} bookings.</p>
          <Link to="/services" className="btn btn-primary btn-sm">Browse services</Link>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Service</th><th>Provider</th><th>When</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((b) => {
              const slotInFuture = new Date(b.startAt) > now;
              return (
                <tr key={b.id}>
                  <td>{b.serviceTitle}</td>
                  <td>{b.providerName}</td>
                  <td>{fmtDateTime(b.startAt)}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td style={{ display: "flex", gap: "0.5rem", flexWrap: "nowrap" }}>
                    <Link to={`/bookings/${b.id}`} className="btn btn-sm btn-secondary">Details</Link>
                    {tab === "cancelled" && (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        disabled={!slotInFuture}
                        title={!slotInFuture ? "This slot is in the past" : undefined}
                        onClick={() => {
                          setRebookError(null);
                          setRebookTarget(b);
                        }}
                      >
                        Rebook
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <Modal
        open={!!rebookTarget}
        onClose={() => {
          if (!rebook.isPending) {
            setRebookTarget(null);
            setRebookError(null);
          }
        }}
        title="Rebook this slot?"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={rebook.isPending}
              onClick={() => {
                setRebookTarget(null);
                setRebookError(null);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={rebook.isPending}
              onClick={() => rebookTarget && rebook.mutate(rebookTarget)}
            >
              {rebook.isPending ? <span className="spinner-inline" /> : "Confirm rebook"}
            </button>
          </>
        }
      >
        {rebookTarget && (
          <div>
            <p>
              Rebook <strong>{rebookTarget.serviceTitle}</strong> with{" "}
              <strong>{rebookTarget.providerName}</strong>?
            </p>
            <p style={{ marginTop: "0.5rem", color: "#555" }}>
              {fmtDateTime(rebookTarget.startAt)} – {fmtDateTime(rebookTarget.endAt)}
            </p>
            {rebookTarget.notes && (
              <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#666" }}>
                Your original notes will be carried over.
              </p>
            )}
            {rebookError && (
              <p
                role="alert"
                style={{
                  marginTop: "0.75rem",
                  padding: "0.5rem 0.75rem",
                  background: "#fef2f2",
                  border: "1px solid #CA1237",
                  borderRadius: "0.375rem",
                  color: "#CA1237",
                  fontSize: "0.875rem",
                }}
              >
                {rebookError}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
