import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { providerApi } from "@/api/endpoints";
import { Modal } from "@/components/ui/Modal";
import { fmtDate, fmtTime } from "@/lib/format";
import { useToast } from "@/context/ToastContext";

const HOUR_SLOTS = [
  { label: "8:00 AM",  value: 8  },
  { label: "9:00 AM",  value: 9  },
  { label: "10:00 AM", value: 10 },
  { label: "11:00 AM", value: 11 },
  { label: "12:00 PM", value: 12 },
  { label: "1:00 PM",  value: 13 },
  { label: "2:00 PM",  value: 14 },
  { label: "3:00 PM",  value: 15 },
  { label: "4:00 PM",  value: 16 },
];

const WEEKDAYS = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
];

function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function todayStr() {
  return isoDate(new Date());
}

export default function ProviderSchedule() {
  const qc = useQueryClient();
  const { push: toast } = useToast();
  const [open, setOpen] = useState(false);

  const [serviceId, setServiceId]     = useState(0);
  const [startDate, setStartDate]     = useState(todayStr);
  const [endDate, setEndDate]         = useState(() => isoDate(addDays(new Date(), 6)));
  const [days, setDays]               = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));
  const [hours, setHours]             = useState<Set<number>>(new Set([8, 9, 10, 11, 12, 13, 14, 15, 16]));
  const [submitting, setSubmitting]   = useState(false);

  const { data: blocks } = useQuery({ queryKey: ["provider", "schedule"], queryFn: providerApi.schedule });
  const { data: services } = useQuery({ queryKey: ["provider", "services"], queryFn: providerApi.myServices });

  const remove = useMutation({
    mutationFn: providerApi.removeAvailability,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["provider", "schedule"] }),
  });

  const selectedService = services?.find((s) => s.id === serviceId);

  function overlaps(
    a: { startAt: string; endAt: string },
    b: { startAt: string; endAt: string },
  ) {
    return a.startAt < b.endAt && a.endAt > b.startAt;
  }

  // Build the list of (startAt, endAt) pairs that will be created,
  // skipping any that overlap with existing blocks or with each other.
  const { preview, skipped } = useMemo(() => {
    if (!serviceId || !startDate || !endDate || days.size === 0 || hours.size === 0)
      return { preview: [], skipped: 0 };
    const duration = selectedService?.durationMinutes ?? 30;
    const existing = (blocks ?? []).filter((b) => b.serviceId === serviceId);
    const accepted: { startAt: string; endAt: string }[] = [];
    let skipped = 0;
    const cursor = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T23:59:59");
    while (cursor <= end) {
      if (days.has(cursor.getDay())) {
        for (const h of Array.from(hours).sort((a, b) => a - b)) {
          const s = new Date(cursor);
          s.setHours(h, 0, 0, 0);
          const e = new Date(s.getTime() + duration * 60_000);
          const candidate = { startAt: s.toISOString(), endAt: e.toISOString() };
          const conflictsExisting = existing.some((x) => overlaps(candidate, x));
          const conflictsBatch    = accepted.some((x) => overlaps(candidate, x));
          if (conflictsExisting || conflictsBatch) { skipped++; continue; }
          accepted.push(candidate);
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return { preview: accepted, skipped };
  }, [serviceId, startDate, endDate, days, hours, selectedService, blocks]);

  function toggleDay(v: number) {
    setDays((prev) => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  }
  function toggleHour(v: number) {
    setHours((prev) => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  }

  function openModal() {
    setServiceId(0);
    setStartDate(todayStr());
    setEndDate(isoDate(addDays(new Date(), 6)));
    setDays(new Set([1, 2, 3, 4, 5]));
    setHours(new Set([9, 10, 11, 13, 14, 15]));
    setOpen(true);
  }

  async function handleSubmit() {
    if (!serviceId || preview.length === 0) return;
    setSubmitting(true);
    try {
      await Promise.all(preview.map((slot) => providerApi.addAvailability({ serviceId, ...slot })));
      qc.invalidateQueries({ queryKey: ["provider", "schedule"] });
      const skippedMsg = skipped > 0 ? ` (${skipped} skipped — conflicts)` : "";
      toast(`Added ${preview.length} slot${preview.length !== 1 ? "s" : ""}${skippedMsg}`, "success");
      setOpen(false);
    } catch {
      toast("Failed to save some slots", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const grouped = new Map<string, NonNullable<typeof blocks>>();
  (blocks ?? []).forEach((b) => {
    const day = b.startAt.slice(0, 10);
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day)!.push(b);
  });

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">My schedule</h1>
          <p className="page-subtitle">Manage your availability</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openModal}>
          + Add availability
        </button>
      </div>

      {!blocks?.length ? (
        <div className="card">No availability yet. Add some slots so students can book.</div>
      ) : (
        Array.from(grouped.entries()).sort().map(([day, list]) => (
          <section key={day} className="card" style={{ marginBottom: "1rem" }}>
            <h3>{fmtDate(day + "T00:00:00")}</h3>
            <div className="availability-grid">
              {list.map((b) => {
                const svcName = services?.find((s) => s.id === b.serviceId)?.title ?? "Unknown service";
                return (
                  <div key={b.id} className="availability-slot">
                    <div style={{ fontSize: "0.7rem", color: "var(--crimson)", fontWeight: 600, marginBottom: "0.15rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {svcName}
                    </div>
                    {fmtTime(b.startAt)} – {fmtTime(b.endAt)}
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      style={{ display: "block", marginTop: "0.25rem", width: "100%" }}
                      onClick={() => remove.mutate(b.id)}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add availability"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={submitting || preview.length === 0 || serviceId === 0}
              onClick={handleSubmit}
            >
              {submitting
                ? <span className="spinner-inline" />
                : preview.length > 0
                  ? `Add ${preview.length} slot${preview.length !== 1 ? "s" : ""}`
                  : "Add slots"}

            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Service */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Service</label>
            <select
              className="form-control"
              value={serviceId}
              onChange={(e) => setServiceId(Number(e.target.value))}
            >
              <option value={0}>Select a service…</option>
              {services?.map((s) => (
                <option key={s.id} value={s.id}>{s.title} ({s.durationMinutes} min)</option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">From</label>
              <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">To</label>
              <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Days of week */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Days</label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {WEEKDAYS.map((d) => (
                <label
                  key={d.value}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.3rem",
                    padding: "0.3rem 0.75rem",
                    borderRadius: "6px",
                    border: `1px solid ${days.has(d.value) ? "var(--crimson)" : "#ccc"}`,
                    background: days.has(d.value) ? "var(--crimson)" : "#fff",
                    color: days.has(d.value) ? "#fff" : "#333",
                    cursor: "pointer",
                    userSelect: "none",
                    fontSize: "0.875rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={days.has(d.value)}
                    onChange={() => toggleDay(d.value)}
                    style={{ display: "none" }}
                  />
                  {d.label}
                </label>
              ))}
            </div>
          </div>

          {/* Time slots */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Time slots</label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {HOUR_SLOTS.map((h) => (
                <label
                  key={h.value}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.3rem",
                    padding: "0.3rem 0.75rem",
                    borderRadius: "6px",
                    border: `1px solid ${hours.has(h.value) ? "var(--crimson)" : "#ccc"}`,
                    background: hours.has(h.value) ? "var(--crimson)" : "#fff",
                    color: hours.has(h.value) ? "#fff" : "#333",
                    cursor: "pointer",
                    userSelect: "none",
                    fontSize: "0.875rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={hours.has(h.value)}
                    onChange={() => toggleHour(h.value)}
                    style={{ display: "none" }}
                  />
                  {h.label}
                </label>
              ))}
            </div>
          </div>

          {/* Preview count */}
          {serviceId > 0 && (
            <p style={{ margin: 0, fontSize: "0.875rem", color: preview.length > 0 ? "var(--crimson)" : "#888" }}>
              {preview.length > 0 ? (
                <>
                  {preview.length} slot{preview.length !== 1 ? "s" : ""} will be created across{" "}
                  {new Set(preview.map((s) => s.startAt.slice(0, 10))).size} day{new Set(preview.map((s) => s.startAt.slice(0, 10))).size !== 1 ? "s" : ""}.
                  {skipped > 0 && (
                    <span style={{ color: "#888" }}> {skipped} skipped — conflicts with existing slots.</span>
                  )}
                </>
              ) : (
                skipped > 0
                  ? `All ${skipped} slot${skipped !== 1 ? "s" : ""} conflict with existing availability.`
                  : "No slots match the current selection."
              )}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
