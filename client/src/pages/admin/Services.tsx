import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { adminApi, servicesApi } from "@/api/endpoints";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/context/ToastContext";
import type { Service } from "@shared/schemas";
import { FormField } from "@/components/forms/FormField";

const serviceFormSchema = z.object({
  categoryId: z.number().refine((v) => v > 0, { message: "Please select a category" }),
  providerId: z.number().refine((v) => v > 0, { message: "Please select a provider" }),
}).passthrough();

interface ServiceForm {
  categoryId: number;
  providerId: number;
  title: string;
  description: string;
  location: string;
  durationMinutes: number;
  isActive: boolean;
}

function emptyForm(): ServiceForm {
  return {
    categoryId: 0,
    providerId: 0,
    title: "",
    description: "",
    location: "",
    durationMinutes: 30,
    isActive: true,
  };
}

export default function AdminServices() {
  const qc = useQueryClient();
  const { push: toast } = useToast();
  const [editing, setEditing] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ServiceForm>(emptyForm());
  const [formErrors, setFormErrors] = useState<{ categoryId?: string; providerId?: string }>({});

  const { data: services, isLoading } = useQuery({
    queryKey: ["admin", "services"],
    queryFn: adminApi.services,
  });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: servicesApi.categories });
  const { data: users } = useQuery({ queryKey: ["admin", "users"], queryFn: adminApi.users });
  const staffOptions = (users ?? []).filter((u) => u.role === "staff");

  const save = useMutation({
    mutationFn: () =>
      editing
        ? adminApi.updateService(editing.id, form as any)
        : adminApi.createService(form as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "services"] });
      qc.invalidateQueries({ queryKey: ["services"] });
      toast(editing ? "Service updated" : "Service created", "success");
      setOpen(false);
      setEditing(null);
    },
  });

  const del = useMutation({
    mutationFn: adminApi.deleteService,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "services"] });
      toast("Service deleted", "info");
    },
  });

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setFormErrors({});
    setOpen(true);
  }
  function openEdit(s: Service) {
    setEditing(s);
    setFormErrors({});
    setForm({
      categoryId: s.categoryId,
      providerId: s.providerId,
      title: s.title,
      description: s.description,
      location: s.location,
      durationMinutes: s.durationMinutes,
      isActive: s.isActive,
    });
    setOpen(true);
  }

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">Services</h1>
          <p className="page-subtitle">Manage all services offered</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>+ Add service</button>
      </div>

      {isLoading ? (
        <p><span className="spinner-inline" /> Loading…</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr><th>Title</th><th>Category</th><th>Provider</th><th>Duration</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {services?.map((s) => (
              <tr key={s.id}>
                <td>{s.title}</td>
                <td>{s.categoryName}</td>
                <td>{s.providerName}</td>
                <td>{s.durationMinutes} min</td>
                <td>
                  <span className={`status-badge status-badge--${s.isActive ? "confirmed" : "inactive"}`}>
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)}>Edit</button>{" "}
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                      if (confirm(`Delete "${s.title}"?`)) del.mutate(s.id);
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit: ${editing.title}` : "New service"}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={save.isPending}
              onClick={() => {
                const result = serviceFormSchema.safeParse(form);
                if (!result.success) {
                  const errs = result.error.flatten().fieldErrors;
                  setFormErrors({
                    categoryId: errs.categoryId?.[0],
                    providerId: errs.providerId?.[0],
                  });
                  return;
                }
                setFormErrors({});
                save.mutate();
              }}
            >
              {save.isPending ? <span className="spinner-inline" /> : "Save"}
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <FormField
            label="Title"
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <FormField
            as="textarea"
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Category</label>
              <select
                className={`form-control ${formErrors.categoryId ? "is-invalid" : ""}`}
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
              >
                <option value={0}>Select…</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {formErrors.categoryId && <div className="field-error" role="alert">{formErrors.categoryId}</div>}
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Provider</label>
              <select
                className={`form-control ${formErrors.providerId ? "is-invalid" : ""}`}
                value={form.providerId}
                onChange={(e) => setForm({ ...form, providerId: Number(e.target.value) })}
              >
                <option value={0}>Select…</option>
                {staffOptions.map((u) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
              {formErrors.providerId && <div className="field-error" role="alert">{formErrors.providerId}</div>}
            </div>
          </div>
          <FormField
            label="Location"
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <FormField
            label="Duration (minutes)"
            type="number"
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
          />
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>
        </div>
      </Modal>
    </div>
  );
}
