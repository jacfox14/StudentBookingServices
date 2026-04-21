import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { adminApi } from "@/api/endpoints";

export default function AdminDashboard() {
  const { data: summary } = useQuery({
    queryKey: ["admin", "reports", "summary"],
    queryFn: adminApi.reportsSummary,
  });

  const tiles = [
    { label: "Users", value: summary?.totalUsers, link: "/admin/users" },
    { label: "Services", value: summary?.totalServices, link: "/admin/services" },
    { label: "Total bookings", value: summary?.totalBookings, link: "/admin/reports" },
    { label: "Pending requests", value: summary?.pendingRequests, link: "/admin/reports" },
    { label: "Approved this week", value: summary?.approvedThisWeek, link: "/admin/reports" },
    { label: "Active providers", value: summary?.activeProviders, link: "/admin/users" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin dashboard</h1>
        <p className="page-subtitle">System overview and quick links</p>
      </div>

      <div className="grid grid-3">
        {tiles.map((t) => (
          <Link key={t.label} to={t.link} className="metric-card card" style={{ textDecoration: "none", color: "inherit" }}>
            <h3 style={{ margin: 0, color: "var(--crimson)" }}>{t.value ?? "–"}</h3>
            <p style={{ margin: 0 }}>{t.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
