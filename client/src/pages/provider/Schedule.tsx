import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { providerApi } from "@/api/endpoints";
import { Modal } from "@/components/ui/Modal";
import { fmtDate, fmtTime } from "@/lib/format";
import { useToast } from "@/context/ToastContext";

export default function ProviderSchedule() {
  const qc = useQueryClient();
  const { push: toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ serviceId: 0, date: "", start: "09:00", end: "10:00" });

  const { data: blocks } = useQuery({
    queryKey: ["provider", "schedule"],
    queryFn: providerApi.schedule,
  });
  const { data: services } = useQuery({
    queryKey: ["provider", "services"],
    queryFn: providerApi.myServices,
  });

  const add = useMutation({
    mutationFn: providerApi.addAvailability,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["provider", "schedule"] });
      setOpen(false);
      toast("Availability added", "success");
    },
  });

  const remove = useMutation({
    mutationFn: providerApi.removeAvailability,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["provider", "schedule"] }),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const startAt = new Date(`${form.date}T${form.start}`).toISOString();
    const endAt = new Date(`${form.date}T${form.end}`).toISOString();
    add.mutate({ serviceId: form.serviceId, startAt, endAt });
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
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
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
              {list.map((b) => (
                <div key={b.id} className="availability-slot">
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
              ))}
            </div>
          </section>
        ))
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add availability block"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" form="add-avail" className="btn btn-primary" disabled={add.isPending}>
              {add.isPending ? <span className="spinner-inline" /> : "Add"}
            </button>
          </>
        }
      >
        <form id="add-avail" onSubmit={submit}>
          <label className="form-label">Service</label>
          <select
            className="form-control mb-3"
            value={form.serviceId}
            onChange={(e) => setForm({ ...form, serviceId: Number(e.target.value) })}
            required
          >
            <option value={0}>Select a service…</option>
            {services?.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
          <label className="form-label">Date</label>
          <input
            type="date"
            className="form-control mb-3"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
          <div className="grid grid-2" style={{ gap: "1rem" }}>
            <div>
              <label className="form-label">Start time</label>
              <input type="time" className="form-control" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">End time</label>
              <input type="time" className="form-control" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} required />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
