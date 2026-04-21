import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";
import { bookingsApi } from "@/api/endpoints";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDateTime } from "@/lib/format";
import type { Booking } from "@shared/schemas";

type Tab = "upcoming" | "past" | "cancelled";

function classify(b: Booking, now: Date): Tab {
  if (b.status === "cancelled" || b.status === "rejected") return "cancelled";
  if (b.status === "completed" || new Date(b.endAt) < now) return "past";
  return "upcoming";
}

export default function MyBookings() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings", "me"],
    queryFn: () => bookingsApi.listMine(),
  });

  const now = new Date();
  const groups: Record<Tab, Booking[]> = { upcoming: [], past: [], cancelled: [] };
  (bookings ?? []).forEach((b) => groups[classify(b, now)].push(b));
  const list = groups[tab].sort((a, b) => (a.startAt < b.startAt ? (tab === "upcoming" ? -1 : 1) : tab === "upcoming" ? 1 : -1));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My bookings</h1>
      </div>

      <div role="tablist" style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {(["upcoming", "past", "cancelled"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)} ({groups[t].length})
          </button>
        ))}
      </div>

      {isLoading ? (
        <p><span className="spinner-inline" /> Loading…</p>
      ) : !list.length ? (
        <div className="card">
          <p>You have no {tab} bookings.</p>
          <Link to="/services" className="btn btn-primary btn-sm">Browse services</Link>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Service</th><th>Provider</th><th>When</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((b) => (
              <tr key={b.id}>
                <td>{b.serviceTitle}</td>
                <td>{b.providerName}</td>
                <td>{fmtDateTime(b.startAt)}</td>
                <td><StatusBadge status={b.status} /></td>
                <td><Link to={`/bookings/${b.id}`} className="btn btn-sm btn-secondary">Details</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
