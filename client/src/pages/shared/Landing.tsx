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
          background: "var(--crimson)",
          color: "#fff",
          padding: "2.5rem 1rem",
          textAlign: "center",
          borderRadius: "1rem",
          margin: "1rem",
        }}
      >
        <h1 style={{ fontSize: "3.5rem", marginBottom: "0.5rem", fontWeight: 700, color: "#fff" }}>Student Booking Services</h1>
        <p style={{ fontSize: "1.1rem", maxWidth: 720, margin: "0 auto 1.5rem", fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>
          Your one-stop platform for booking advisors, counselors, librarians, and career coaches at
          Washington State University.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "2rem" }}>
          <Link to="/login" className="btn btn-primary btn-landing" style={{ background: "#A60F2D" }}>Sign in</Link>
          <Link to="/register" className="btn btn-secondary btn-landing" style={{ background: "#A60F2D" }}>Create account</Link>
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
