import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { bookingsApi } from "@/api/endpoints";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDateTime } from "@/lib/format";

export default function BookingConfirmation() {
  const { id } = useParams();
  const bookingId = Number(id);
  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingsApi.get(bookingId),
  });

  if (isLoading || !booking) return <p><span className="spinner-inline" /> Loading…</p>;

  return (
    <div className="container" style={{ maxWidth: 640, padding: "2rem 0" }}>
      <div
        className="card"
        style={{ borderLeft: "6px solid var(--color-success, #2e7d32)" }}
      >
        <h1 className="page-title" style={{ color: "var(--color-success, #2e7d32)" }}>
          ✓ Request submitted!
        </h1>
        <p>Your booking is pending provider approval. You'll see a notification when it's confirmed.</p>
        <hr />
        <dl style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "0.5rem 1rem" }}>
          <dt><strong>Service</strong></dt><dd>{booking.serviceTitle}</dd>
          <dt><strong>Provider</strong></dt><dd>{booking.providerName}</dd>
          <dt><strong>When</strong></dt><dd>{fmtDateTime(booking.startAt)}</dd>
          <dt><strong>Location</strong></dt><dd>{booking.location ?? "—"}</dd>
          <dt><strong>Status</strong></dt><dd><StatusBadge status={booking.status} /></dd>
        </dl>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
          <Link to="/bookings" className="btn btn-primary">View my bookings</Link>
          <Link to="/services" className="btn btn-secondary">Browse more services</Link>
        </div>
      </div>
    </div>
  );
}
