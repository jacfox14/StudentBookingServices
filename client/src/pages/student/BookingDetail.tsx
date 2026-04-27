import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { addDays, parseISO, startOfDay } from "date-fns";
import { bookingsApi, servicesApi } from "@/api/endpoints";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { fmtDate, fmtDateTime, fmtTime } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ApiError } from "@/types/api";
import NotFound from "@/pages/shared/NotFound";
import { RESCHEDULE_LEAD_TIME_MINUTES, type AvailabilityBlock } from "@shared/schemas";

export default function BookingDetail() {
  const { id } = useParams();
  const bookingId = Number(id);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { push: toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [pickedSlot, setPickedSlot] = useState<string | null>(null);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingsApi.get(bookingId),
    retry: false,
  });

  const range = useMemo(() => {
    const from = startOfDay(new Date()).toISOString();
    const to = addDays(startOfDay(new Date()), 21).toISOString();
    return { from, to };
  }, []);

  const { data: slots, isLoading: slotsLoading } = useQuery({
    enabled: rescheduleOpen && !!booking,
    queryKey: [
      "service",
      booking?.serviceId,
      "availability",
      range.from,
      range.to,
      "exclude",
      bookingId,
    ],
    queryFn: () =>
      servicesApi.availability(booking!.serviceId, range.from, range.to, bookingId),
  });

  const slotsByDay = useMemo(() => {
    const groups = new Map<string, AvailabilityBlock[]>();
    (slots ?? []).forEach((s) => {
      const day = s.startAt.slice(0, 10);
      if (!groups.has(day)) groups.set(day, []);
      groups.get(day)!.push(s);
    });
    return groups;
  }, [slots]);

  const cancel = useMutation({
    mutationFn: () => bookingsApi.cancel(bookingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings", "me"] });
      qc.invalidateQueries({ queryKey: ["booking", bookingId] });
      toast("Booking cancelled", "info");
      navigate("/bookings");
    },
  });

  const reschedule = useMutation({
    mutationFn: (slot: { startAt: string; endAt: string }) =>
      bookingsApi.reschedule(bookingId, slot.startAt, slot.endAt),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings", "me"] });
      qc.invalidateQueries({ queryKey: ["booking", bookingId] });
      qc.invalidateQueries({
        queryKey: ["service", booking?.serviceId, "availability"],
      });
      toast("Reschedule sent — awaiting provider approval", "success");
      setRescheduleOpen(false);
      setPickedSlot(null);
      setRescheduleError(null);
    },
    onError: async (e) => {
      if (!(e instanceof ApiError)) {
        setRescheduleError("Something went wrong. Please try again.");
        return;
      }

      // Booking is no longer reschedulable — refetch and bail out of the modal.
      if (e.code === "CONFLICT" && /^Cannot reschedule a /.test(e.message)) {
        await qc.invalidateQueries({ queryKey: ["booking", bookingId] });
        setRescheduleOpen(false);
        setPickedSlot(null);
        toast(
          "This booking can no longer be rescheduled — its status changed. Refreshed.",
          "info"
        );
        return;
      }

      // Slot was taken under us — refetch availability and explain inline.
      if (e.code === "CONFLICT" && e.message.includes("already been booked")) {
        setPickedSlot(null);
        await qc.invalidateQueries({
          queryKey: ["service", booking?.serviceId, "availability"],
        });
        setRescheduleError("Someone grabbed that slot first. Pick another time.");
        return;
      }

      // Lead-time guard tripped — they sat on the modal too long.
      if (e.code === "CONFLICT" && e.message.includes("at least")) {
        await qc.invalidateQueries({ queryKey: ["booking", bookingId] });
        setRescheduleOpen(false);
        toast(e.message, "info");
        return;
      }

      setRescheduleError(e.message);
    },
  });

  if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
    return <NotFound />;
  }

  if (isLoading || !booking) return <p><span className="spinner-inline" /> Loading…</p>;

  const startMs = new Date(booking.startAt).getTime();
  const isUpcomingActive =
    (booking.status === "pending" || booking.status === "approved") &&
    startMs > Date.now();
  const minLeadMs = RESCHEDULE_LEAD_TIME_MINUTES * 60_000;
  const canReschedule = isUpcomingActive && startMs - Date.now() >= minLeadMs;
  const canCancel = isUpcomingActive;
  const isStudentOrAdmin = user?.role === "student" || user?.role === "admin";

  const slotDurationMs = new Date(booking.endAt).getTime() - new Date(booking.startAt).getTime();
  const pickedDifferent = !!pickedSlot && pickedSlot !== booking.startAt;

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
        {canCancel && isStudentOrAdmin && (
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.5rem" }}>
            {canReschedule && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setRescheduleError(null);
                  setPickedSlot(null);
                  setRescheduleOpen(true);
                }}
              >
                Reschedule
              </button>
            )}
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

      <Modal
        open={rescheduleOpen}
        onClose={() => {
          setRescheduleOpen(false);
          setPickedSlot(null);
          setRescheduleError(null);
        }}
        title="Choose a new time"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setRescheduleOpen(false);
                setPickedSlot(null);
                setRescheduleError(null);
              }}
            >
              Keep current time
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!pickedDifferent || reschedule.isPending}
              onClick={() => {
                if (!pickedSlot) return;
                const endIso = new Date(parseISO(pickedSlot).getTime() + slotDurationMs).toISOString();
                reschedule.mutate({ startAt: pickedSlot, endAt: endIso });
              }}
            >
              {reschedule.isPending ? <span className="spinner-inline" /> : "Confirm new time"}
            </button>
          </>
        }
      >
        {booking.status === "approved" ? (
          <div
            role="status"
            style={{
              background: "#fff8e1",
              border: "1px solid #f1c40f",
              padding: "0.75rem 1rem",
              borderRadius: "6px",
              marginBottom: "1rem",
            }}
          >
            ⚠️ This booking is currently <strong>approved</strong>. Rescheduling will reset
            it to <strong>pending</strong> and your provider will need to re-approve the new
            time.
          </div>
        ) : (
          <p style={{ color: "#555", marginBottom: "1rem" }}>
            Your provider hasn't approved this booking yet. Rescheduling will replace the
            requested time and they'll review the new one.
          </p>
        )}

        <p style={{ marginBottom: "1rem" }}>
          <strong>Currently:</strong> {fmtDateTime(booking.startAt)}
        </p>

        {rescheduleError && (
          <div
            role="alert"
            style={{
              background: "#fdecea",
              color: "#c62828",
              padding: "0.75rem 1rem",
              borderRadius: "6px",
              marginBottom: "1rem",
              fontWeight: 500,
            }}
          >
            {rescheduleError}
          </div>
        )}

        {slotsLoading ? (
          <p><span className="spinner-inline" /> Loading slots…</p>
        ) : !slots?.length ? (
          <p>No other times are available in the next 21 days. You can keep this booking or cancel it.</p>
        ) : (
          Array.from(slotsByDay.entries()).map(([day, daySlots]) => (
            <div key={day} style={{ marginBottom: "1.25rem" }}>
              <h4 style={{ marginBottom: "0.5rem" }}>{fmtDate(day + "T00:00:00")}</h4>
              <div className="availability-grid">
                {daySlots.map((s) => {
                  const isCurrent = s.startAt === booking.startAt;
                  const isSelected = pickedSlot === s.startAt;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`availability-slot ${isSelected ? "availability-slot--selected" : ""}`}
                      onClick={() => setPickedSlot(s.startAt)}
                      disabled={isCurrent}
                      title={isCurrent ? "This is your current time" : undefined}
                    >
                      {fmtTime(s.startAt)}
                      {isCurrent ? " (current)" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </Modal>
    </div>
  );
}
