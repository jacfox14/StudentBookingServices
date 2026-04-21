import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";
import { servicesApi } from "@/api/endpoints";

export default function StudentServices() {
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");

  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: servicesApi.categories });
  const { data: services, isLoading } = useQuery({
    queryKey: ["services", { q, categoryId }],
    queryFn: () => servicesApi.list({ q: q || undefined, categoryId: categoryId || undefined }),
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Browse services</h1>
        <p className="page-subtitle">Filter by category or search by keyword.</p>
      </div>

      <div className="card" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <input
          type="search"
          className="form-control"
          placeholder="Search services, providers…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
          aria-label="Search services"
        />
        <select
          className="form-control"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
          style={{ maxWidth: 240 }}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {cats?.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p><span className="spinner-inline" /> Loading services…</p>
      ) : !services?.length ? (
        <p>No services match your filters.</p>
      ) : (
        <div className="grid grid-3">
          {services.map((s) => (
            <article key={s.id} className="card">
              <header style={{ marginBottom: "0.5rem" }}>
                <h3 style={{ marginBottom: "0.25rem" }}>{s.title}</h3>
                <small style={{ color: "#666" }}>{s.categoryName} · {s.providerName}</small>
              </header>
              <p style={{ fontSize: "0.9rem" }}>{s.description}</p>
              <div style={{ fontSize: "0.85rem", color: "#555", marginBottom: "0.75rem" }}>
                📍 {s.location} · ⏱ {s.durationMinutes} min
              </div>
              <Link to={`/services/${s.id}`} className="btn btn-primary btn-sm">
                View availability
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
