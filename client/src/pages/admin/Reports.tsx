import { useState } from "react";
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
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const CHART_H = 180;
  const LABEL_H = 24;

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
        <h2>Bookings per day (last 14 days)</h2>
        {!trend?.length ? (
          <p>No data yet.</p>
        ) : (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {/* Y-axis: absolutely positioned labels matching grid line positions exactly */}
            <div style={{ position: "relative", width: 24, height: CHART_H + LABEL_H }}>
              {[0, 25, 50, 75, 100].map((pct) => {
                const val = Math.round((pct / 100) * max);
                return (
                  <span key={pct} style={{
                    position: "absolute",
                    right: 0,
                    bottom: `${(pct / 100) * CHART_H + LABEL_H - 6}px`,
                    fontSize: "0.68rem",
                    color: "#888",
                    lineHeight: 1,
                  }}>{val}</span>
                );
              })}
            </div>
            {/* Chart + labels */}
            <div style={{ flex: 1 }}>
              {/* Chart area */}
              <div style={{ position: "relative", height: CHART_H }}>
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((pct) => (
                  <div key={pct} style={{
                    position: "absolute", left: 0, right: 0,
                    bottom: `${(pct / 100) * CHART_H}px`,
                    borderTop: "1px dashed #e0e0e0",
                    zIndex: 0,
                  }} />
                ))}
                {/* Bars */}
                <div style={{ display: "flex", alignItems: "flex-end", height: "100%", gap: "0.4rem", position: "relative", zIndex: 1 }}>
                  {trend.map((d) => {
                    const barH = d.count > 0 ? (d.count / max) * CHART_H : 0;
                    const hovered = hoveredDate === d.date;
                    return (
                      <div
                        key={d.date}
                        style={{ flex: 1, position: "relative", height: `${barH}px` }}
                        onMouseEnter={() => setHoveredDate(d.date)}
                        onMouseLeave={() => setHoveredDate(null)}
                      >
                        {d.count > 0 && (
                          <span style={{
                            position: "absolute", top: -16, left: 0, right: 0,
                            textAlign: "center", fontSize: "0.65rem", fontWeight: 600,
                            color: hovered ? "#7a0b20" : "var(--crimson)",
                          }}>{d.count}</span>
                        )}
                        <div style={{
                          width: "100%", height: "100%",
                          background: hovered ? "#7a0b20" : "var(--crimson)",
                          borderRadius: "4px 4px 0 0",
                          transition: "background 0.15s",
                        }} title={`${d.date}: ${d.count} bookings`} />
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Date labels */}
              <div style={{ display: "flex", gap: "0.4rem", marginTop: 4, height: LABEL_H }}>
                {trend.map((d) => (
                  <div key={d.date} style={{ flex: 1, textAlign: "center" }}>
                    <small style={{
                      fontSize: "0.65rem",
                      color: hoveredDate === d.date ? "var(--crimson)" : "#666",
                      fontWeight: hoveredDate === d.date ? 600 : 400,
                    }}>{d.date.slice(5)}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
