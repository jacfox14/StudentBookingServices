import { Link } from "react-router-dom";

export default function Forbidden() {
  return (
    <div className="container" style={{ textAlign: "center", padding: "4rem 1rem" }}>
      <h1 className="page-title">403 — Forbidden</h1>
      <p>You don't have permission to view that page.</p>
      <Link to="/" className="btn btn-primary">Go home</Link>
    </div>
  );
}
