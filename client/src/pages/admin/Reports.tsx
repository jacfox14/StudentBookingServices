import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/endpoints";

export default function AdminReports() {
  const { data: summary } = useQuery({
    queryKey: ["admin", "reports", "summary"],
    queryFn: adminApi.reportsSummary,
  });
  const { data: trend } = useQuery({
    queryKey: ["admin", "reports", "bookings"],
    queryFn: adminApi.reportsBookings,
  });

  const max = Math.max(1, ...(trend ?? []).map((d) => d.count));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">High-level metrics for the app</p>
      </div>

      {summary && (
        <div className="grid grid-3" style={{ marginBottom: "2rem" }}>
          {Object.entries(summary).map(([k, v]) => (
            <div key={k} className="metric-card card">
              <h3 style={{ margin: 0, color: "var(--crimson)" }}>{v as number}</h3>
              <p style={{ margin: 0, textTransform: "capitalize" }}>{k.replace(/([A-Z])/g, " $1").toLowerCase()}</p>
            </div>
          ))}
        </div>
      )}

      <section className="card">
        <h2>Bookings per day</h2>
        {!trend?.length ? (
          <p>No data yet.</p>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", height: 200 }}>
            {trend.map((d) => (
              <div key={d.date} style={{ flex: 1, textAlign: "center" }}>
                <div
                  title={`${d.date}: ${d.count}`}
                  style={{
                    background: "var(--crimson)",
                    height: `${(d.count / max) * 100}%`,
                    minHeight: 4,
                    borderRadius: "4px 4px 0 0",
                  }}
                />
                <small style={{ fontSize: "0.7rem", color: "#666" }}>{d.date.slice(5)}</small>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
