import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { providerApi } from "@/api/endpoints";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDateTime } from "@/lib/format";

export default function ProviderDashboard() {
  const { user } = useAuth();
  const { data: requests } = useQuery({
    queryKey: ["provider", "requests"],
    queryFn: providerApi.requests,
  });
  const { data: myBookings } = useQuery({
    queryKey: ["provider", "bookings"],
    queryFn: providerApi.bookings,
  });

  const today = new Date();
  const todaysList = (myBookings ?? [])
    .filter((b) => b.status === "approved" && new Date(b.startAt).toDateString() === today.toDateString())
    .sort((a, b) => (a.startAt < b.startAt ? -1 : 1));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Hello, {user?.firstName}</h1>
        <p className="page-subtitle">Your provider overview</p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: "2rem" }}>
        <div className="metric-card card">
          <h3 style={{ margin: 0, color: "var(--crimson)" }}>{requests?.length ?? 0}</h3>
          <p style={{ margin: 0 }}>Pending requests</p>
        </div>
        <div className="metric-card card">
          <h3 style={{ margin: 0, color: "var(--crimson)" }}>{todaysList.length}</h3>
          <p style={{ margin: 0 }}>Today's appointments</p>
        </div>
        <div className="metric-card card">
          <h3 style={{ margin: 0, color: "var(--crimson)" }}>
            {myBookings?.filter((b) => b.status === "approved").length ?? 0}
          </h3>
          <p style={{ margin: 0 }}>Upcoming confirmed</p>
        </div>
      </div>

      <section className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Pending requests</h2>
          <Link to="/provider/requests" className="btn btn-sm btn-secondary">View all</Link>
        </div>
        {!requests?.length ? (
          <p>No pending requests.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {requests.slice(0, 5).map((r) => (
              <li key={r.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid #eee" }}>
                <strong>{r.studentName}</strong> — {r.serviceTitle}<br />
                <small>{fmtDateTime(r.startAt)}</small>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Today's schedule</h2>
        {!todaysList.length ? (
          <p>Nothing on today's calendar.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Time</th><th>Student</th><th>Service</th><th>Status</th></tr>
            </thead>
            <tbody>
              {todaysList.map((b) => (
                <tr key={b.id}>
                  <td>{fmtDateTime(b.startAt)}</td>
                  <td>{b.studentName}</td>
                  <td>{b.serviceTitle}</td>
                  <td><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
