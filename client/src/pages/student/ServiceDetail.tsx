import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { bookingsApi, servicesApi } from "@/api/endpoints";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/types/api";
import { useToast } from "@/context/ToastContext";
import { fmtDate, fmtTime } from "@/lib/format";
import { parseISO, startOfDay, addDays } from "date-fns";

export default function ServiceDetail() {
  const { id } = useParams();
  const svcId = Number(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { push: toast } = useToast();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);

  const { data: service } = useQuery({
    queryKey: ["service", svcId],
    queryFn: () => servicesApi.get(svcId),
  });

  const range = useMemo(() => {
    const from = startOfDay(new Date()).toISOString();
    const to = addDays(startOfDay(new Date()), 21).toISOString();
    return { from, to };
  }, []);

  const { data: slots, isLoading } = useQuery({
    queryKey: ["service", svcId, "availability", range.from, range.to],
    queryFn: () => servicesApi.availability(svcId, range.from, range.to),
  });

  const slotsByDay = useMemo(() => {
    const groups = new Map<string, typeof slots>();
    (slots ?? []).forEach((s) => {
      const day = s.startAt.slice(0, 10);
      if (!groups.has(day)) groups.set(day, [] as any);
      groups.get(day)!.push(s);
    });
    return groups;
  }, [slots]);

  const book = useMutation({
    mutationFn: (endAt: string) =>
      bookingsApi.create({
        serviceId: svcId,
        startAt: selectedSlot!,
        endAt,
        notes: notes || undefined,
      }),
    onSuccess: (booking) => {
      qc.invalidateQueries({ queryKey: ["bookings", "me"] });
      qc.invalidateQueries({ queryKey: ["service", svcId, "availability"] });
      toast("Booking request submitted!", "success");
      setOpen(false);
      navigate(`/bookings/${booking.id}/confirm`);
    },
    onError: (e) => {
      if (e instanceof ApiError) toast(e.message, "error");
    },
  });

  if (!service) return <p><span className="spinner-inline" /> Loading…</p>;

  return (
    <div>
      <Link to="/services" style={{ fontSize: "0.9rem" }}>← Back to services</Link>

      <header className="card" style={{ marginTop: "1rem" }}>
        <h1 className="page-title">{service.title}</h1>
        <p style={{ color: "#666", marginBottom: "0.5rem" }}>
          {service.categoryName} · with <strong>{service.providerName}</strong>
        </p>
        <p>{service.description}</p>
        <p style={{ color: "#555" }}>
          📍 {service.location} · ⏱ {service.durationMinutes} min per session
        </p>
      </header>

      <section className="card" style={{ marginTop: "1.5rem" }}>
        <h2>Pick an available time</h2>
        {isLoading ? (
          <p><span className="spinner-inline" /> Loading slots…</p>
        ) : !slots?.length ? (
          <p>No availability in the next 21 days. Check back later.</p>
        ) : (
          Array.from(slotsByDay.entries()).map(([day, daySlots]) => (
            <div key={day} style={{ marginBottom: "1.25rem" }}>
              <h4 style={{ marginBottom: "0.5rem" }}>{fmtDate(day + "T00:00:00")}</h4>
              <div className="availability-grid">
                {daySlots!.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`availability-slot ${selectedSlot === s.startAt ? "availability-slot--selected" : ""}`}
                    onClick={() => {
                      setSelectedSlot(s.startAt);
                      setOpen(true);
                    }}
                  >
                    {fmtTime(s.startAt)}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Confirm your booking"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={book.isPending || !selectedSlot}
              onClick={() => {
                if (!selectedSlot) return;
                const end = new Date(
                  parseISO(selectedSlot).getTime() + service.durationMinutes * 60_000
                ).toISOString();
                book.mutate(end);
              }}
            >
              {book.isPending ? <span className="spinner-inline" /> : "Confirm booking"}
            </button>
          </>
        }
      >
        {selectedSlot && (
          <>
            <p>
              <strong>{service.title}</strong><br />
              {fmtDate(selectedSlot)} at {fmtTime(selectedSlot)} · {service.durationMinutes} min<br />
              📍 {service.location}
            </p>
            <label className="form-label">Notes for the provider (optional)</label>
            <textarea
              className="form-control"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Anything they should know?"
            />
          </>
        )}
      </Modal>
    </div>
  );
}
