import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/api/endpoints";
import { fmtDateTime } from "@/lib/format";
import type { Notification } from "@shared/schemas";

function renderMessage(n: Notification): string {
  const p = n.payload as Record<string, unknown>;
  const svc = (p.serviceTitle ?? p.service) as string | undefined;
  const forSvc = svc ? ` for ${svc}` : "";
  switch (n.type) {
    case "booking_created": {
      const when = p.startAt ? ` — ${fmtDateTime(p.startAt as string)}` : "";
      return `New booking request from ${p.student ?? "a student"}${forSvc}${when}.`;
    }
    case "booking_approved":
      return `Your booking${forSvc} was approved.`;
    case "booking_rejected":
      return `Your booking${forSvc} was rejected. Reason: ${(p.rejectionReason ?? p.reason) ?? "—"}`;
    case "booking_cancelled":
      return `Your booking${forSvc} was cancelled.`;
    case "reminder":
      return `Reminder: your booking${forSvc} is ${p.when ?? "coming up soon"}.`;
    default:
      return "New notification.";
  }
}

export default function Notifications() {
  const qc = useQueryClient();
  const { data: items, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.list,
  });
  const markRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Notifications</h1>
        <p className="page-subtitle">Booking updates and reminders.</p>
      </div>

      {isLoading ? (
        <p><span className="spinner-inline" /> Loading…</p>
      ) : !items?.length ? (
        <div className="card">You're all caught up.</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {items.map((n) => (
            <li
              key={n.id}
              className="card"
              style={{
                marginBottom: "0.75rem",
                borderLeft: `4px solid ${n.readAt ? "#ccc" : "var(--crimson, #A60F2D)"}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div>{renderMessage(n)}</div>
                <small style={{ color: "#777" }}>{fmtDateTime(n.createdAt)}</small>
              </div>
              {!n.readAt && (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => markRead.mutate(n.id)}
                >
                  Mark read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
