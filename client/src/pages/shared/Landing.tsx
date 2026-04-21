import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { defaultPathForRole } from "@/routes/defaultPath";

export default function Landing() {
  const { user } = useAuth();
  if (user) return <Navigate to={defaultPathForRole(user.role)} replace />;

  return (
    <div>
      <section
        style={{
          background: "linear-gradient(135deg, var(--crimson, #A60F2D), #6a0a1f)",
          color: "#fff",
          padding: "4rem 1rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>Student Booking Services</h1>
        <p style={{ fontSize: "1.1rem", maxWidth: 720, margin: "0 auto 1.5rem" }}>
          Your one-stop platform for booking advisors, counselors, librarians, and career coaches at
          Washington State University.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <Link to="/login" className="btn btn-primary">Sign in</Link>
          <Link to="/register" className="btn btn-secondary">Create account</Link>
        </div>
      </section>

      <div className="container" style={{ padding: "3rem 1rem" }}>
        <div className="grid grid-3">
          <div className="card">
            <h3>🎓 Advising & Tutoring</h3>
            <p>Book time with academic advisors and peer tutors to stay on track for graduation.</p>
          </div>
          <div className="card">
            <h3>💬 Counseling & Wellness</h3>
            <p>Confidential appointments with counselors when you need them most.</p>
          </div>
          <div className="card">
            <h3>💼 Career Services</h3>
            <p>Resume reviews, mock interviews, and career coaching a click away.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
