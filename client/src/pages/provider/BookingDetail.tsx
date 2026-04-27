import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { bookingsApi } from "@/api/endpoints";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { RejectBookingModal } from "@/components/provider/RejectBookingModal";
import { fmtDateTime } from "@/lib/format";
import { useToast } from "@/context/ToastContext";
import { ApiError } from "@/types/api";
import NotFound from "@/pages/shared/NotFound";

export default function ProviderBookingDetail() {
  const { id } = useParams();
  const bookingId = Number(id);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { push: toast } = useToast();
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingsApi.get(bookingId),
    retry: false,
  });

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ["provider", "bookings"] });
    qc.invalidateQueries({ queryKey: ["provider", "requests"] });
    qc.invalidateQueries({ queryKey: ["bookings"] });
    qc.invalidateQueries({ queryKey: ["booking", bookingId] });
  }

  const approve = useMutation({
    mutationFn: () => bookingsApi.approve(bookingId),
    onSuccess: () => {
      invalidateAll();
      toast("Booking approved", "success");
      navigate("/provider/bookings");
    },
  });

  const reject = useMutation({
    mutationFn: (reason: string) => bookingsApi.reject(bookingId, { reason }),
    onSuccess: () => {
      invalidateAll();
      toast("Booking rejected", "info");
      setRejectOpen(false);
      navigate("/provider/bookings");
    },
  });

  const cancel = useMutation({
    mutationFn: () => bookingsApi.cancel(bookingId),
    onSuccess: () => {
      invalidateAll();
      toast("Booking cancelled", "info");
      navigate("/provider/bookings");
    },
  });

  if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
    return <NotFound />;
  }

  if (isLoading || !booking) {
    return <p><span className="spinner-inline" /> Loading…</p>;
  }

  const isPending = booking.status === "pending";
  const isApproved = booking.status === "approved";

  return (
    <div>
      <Link to="/provider/bookings" style={{ fontSize: "0.9rem" }}>← Back to my bookings</Link>
      <div className="card" style={{ marginTop: "1rem" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h1 className="page-title">{booking.serviceTitle}</h1>
            <p style={{ color: "#666" }}>with {booking.studentName}</p>
          </div>
          <StatusBadge status={booking.status} />
        </header>
        <hr />
        <dl style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "0.5rem 1rem" }}>
          <dt><strong>When</strong></dt>
          <dd>{fmtDateTime(booking.startAt)} – {fmtDateTime(booking.endAt)}</dd>
          <dt><strong>Service</strong></dt>
          <dd>
            <Link to={`/services/${booking.serviceId}`}>{booking.serviceTitle}</Link>
          </dd>
          <dt><strong>Student</strong></dt><dd>{booking.studentName}</dd>
          <dt><strong>Location</strong></dt><dd>{booking.location ?? "—"}</dd>
          <dt><strong>Notes</strong></dt><dd>{booking.notes ?? <em>None</em>}</dd>
          {booking.rejectionReason && (
            <>
              <dt><strong>Rejection reason</strong></dt>
              <dd>{booking.rejectionReason}</dd>
            </>
          )}
        </dl>

        {(isPending || isApproved) && (
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {isPending && (
              <>
                <button
                  type="button"
                  className="btn btn-success"
                  disabled={approve.isPending}
                  onClick={() => approve.mutate()}
                >
                  {approve.isPending ? <span className="spinner-inline" /> : "Approve"}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setRejectOpen(true)}
                >
                  Reject
                </button>
              </>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              disabled={cancel.isPending}
              onClick={() => setConfirmCancelOpen(true)}
            >
              {cancel.isPending ? <span className="spinner-inline" /> : "Cancel booking"}
            </button>
          </div>
        )}
      </div>

      <Modal
        open={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        title="Cancel this booking?"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirmCancelOpen(false)}
            >
              Keep booking
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={cancel.isPending}
              onClick={() => {
                setConfirmCancelOpen(false);
                cancel.mutate();
              }}
            >
              Yes, cancel
            </button>
          </>
        }
      >
        <p>
          Cancel <strong>{booking.studentName}</strong>'s booking for{" "}
          <strong>{booking.serviceTitle}</strong>? The student will be notified.
        </p>
      </Modal>

      <RejectBookingModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onSubmit={(reason) => reject.mutate(reason)}
        isPending={reject.isPending}
      />
    </div>
  );
}
