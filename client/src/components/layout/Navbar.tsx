import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/api/endpoints";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data: notes } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.list,
    enabled: !!user,
    refetchInterval: 30_000,
  });
  const unread = notes?.filter((n) => !n.readAt).length ?? 0;

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <nav className="navbar" aria-label="Primary">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand" style={{ textDecoration: "none", color: "inherit" }}>
          <strong>SBS</strong> — WSU Student Booking Services
        </Link>
        {user && (
          <ul className="navbar-links" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", gap: "1rem" }}>
            {user.role === "student" && (
              <>
                <li><NavLink to="/dashboard">Dashboard</NavLink></li>
                <li><NavLink to="/services">Browse Services</NavLink></li>
                <li><NavLink to="/bookings">My Bookings</NavLink></li>
              </>
            )}
            {user.role === "staff" && (
              <>
                <li><NavLink to="/provider">Dashboard</NavLink></li>
                <li><NavLink to="/provider/schedule">Schedule</NavLink></li>
                <li><NavLink to="/provider/requests">Requests</NavLink></li>
                <li><NavLink to="/provider/profile">Profile</NavLink></li>
              </>
            )}
            {user.role === "admin" && (
              <>
                <li><NavLink to="/admin">Dashboard</NavLink></li>
                <li><NavLink to="/admin/users">Users</NavLink></li>
                <li><NavLink to="/admin/services">Services</NavLink></li>
                <li><NavLink to="/admin/reports">Reports</NavLink></li>
              </>
            )}
          </ul>
        )}
      </div>
      <div className="navbar-right">
        {user ? (
          <>
            <Link to="/notifications" className="navbar-bell" aria-label={`Notifications (${unread} unread)`}>
              🔔{unread > 0 && <span className="badge">{unread}</span>}
            </Link>
            <span className={`role-badge role-badge--${user.role === "staff" ? "provider" : user.role}`}>
              {user.role}
            </span>
            <span className="navbar-user">
              {user.firstName} {user.lastName}
            </span>
            <button type="button" className="btn btn-sm btn-secondary" onClick={handleLogout}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-sm btn-secondary">Sign in</Link>
            <Link to="/register" className="btn btn-sm btn-primary">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
