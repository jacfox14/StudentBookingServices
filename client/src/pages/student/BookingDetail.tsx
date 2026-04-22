import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { bookingsApi } from "@/api/endpoints";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { fmtDateTime } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function BookingDetail() {
  const { id } = useParams();
  const bookingId = Number(id);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { push: toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingsApi.get(bookingId),
  });

  const cancel = useMutation({
    mutationFn: () => bookingsApi.cancel(bookingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings", "me"] });
      qc.invalidateQueries({ queryKey: ["booking", bookingId] });
      toast("Booking cancelled", "info");
      navigate("/bookings");
    },
  });

  if (isLoading || !booking) return <p><span className="spinner-inline" /> Loading…</p>;

  const canCancel =
    (booking.status === "pending" || booking.status === "approved") &&
    new Date(booking.startAt) > new Date();

  return (
    <div>
      <Link to="/bookings" style={{ fontSize: "0.9rem" }}>← Back to my bookings</Link>
      <div className="card" style={{ marginTop: "1rem" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className="page-title">{booking.serviceTitle}</h1>
            <p style={{ color: "#666" }}>with {booking.providerName}</p>
          </div>
          <StatusBadge status={booking.status} />
        </header>
        <hr />
        <dl style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "0.5rem 1rem" }}>
          <dt><strong>When</strong></dt><dd>{fmtDateTime(booking.startAt)} – {fmtDateTime(booking.endAt)}</dd>
          <dt><strong>Location</strong></dt><dd>{booking.location ?? "—"}</dd>
          <dt><strong>Student</strong></dt><dd>{booking.studentName}</dd>
          <dt><strong>Notes</strong></dt><dd>{booking.notes ?? <em>None</em>}</dd>
          {booking.rejectionReason && (
            <>
              <dt><strong>Rejection reason</strong></dt>
              <dd>{booking.rejectionReason}</dd>
            </>
          )}
        </dl>
        {canCancel && (user?.role === "student" || user?.role === "admin") && (
          <div style={{ marginTop: "1.5rem" }}>
            <button
              type="button"
              className="btn btn-danger"
              disabled={cancel.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              {cancel.isPending ? <span className="spinner-inline" /> : "Cancel booking"}
            </button>
          </div>
        )}
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Cancel this booking?"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setConfirmOpen(false)}>
              Keep booking
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={cancel.isPending}
              onClick={() => { setConfirmOpen(false); cancel.mutate(); }}
            >
              Yes, cancel
            </button>
          </>
        }
      >
        <p>Are you sure you want to cancel your booking for <strong>{booking.serviceTitle}</strong>? This cannot be undone.</p>
      </Modal>
    </div>
  );
}
