import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { bookingsApi } from "@/api/endpoints";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDateTime, fmtRelativeDay } from "@/lib/format";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings", "me"],
    queryFn: () => bookingsApi.listMine(),
  });

  const upcoming = (bookings ?? [])
    .filter((b) => (b.status === "approved" || b.status === "pending") && new Date(b.startAt) >= new Date())
    .sort((a, b) => (a.startAt < b.startAt ? -1 : 1))
    .slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome, {user?.firstName} 👋</h1>
        <p className="page-subtitle">Here's what's on your schedule.</p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: "2rem" }}>
        <Link to="/services" className="action-card card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3>🔍 Browse services</h3>
          <p>Find advisors, counselors, tutors, and library equipment.</p>
        </Link>
        <Link to="/bookings" className="action-card card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3>📋 My bookings</h3>
          <p>View, reschedule, or cancel your upcoming sessions.</p>
        </Link>
        <Link to="/notifications" className="action-card card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3>🔔 Notifications</h3>
          <p>Reminders and booking updates in one place.</p>
        </Link>
      </div>

      <section className="card">
        <h2>Upcoming appointments</h2>
        {isLoading ? (
          <p><span className="spinner-inline" /> Loading…</p>
        ) : upcoming.length === 0 ? (
          <p>No upcoming appointments. <Link to="/services">Browse services</Link> to book one.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {upcoming.map((b) => (
              <li key={b.id} className="appointment-card" style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid #eee" }}>
                <div>
                  <strong>{b.serviceTitle}</strong>
                  <div style={{ color: "#666", fontSize: "0.9rem" }}>
                    with {b.providerName} · {fmtRelativeDay(b.startAt)} at {fmtDateTime(b.startAt)}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <StatusBadge status={b.status} />
                  <Link to={`/bookings/${b.id}`} className="btn btn-sm btn-secondary">View</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
