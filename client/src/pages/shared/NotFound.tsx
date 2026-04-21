import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container" style={{ textAlign: "center", padding: "4rem 1rem" }}>
      <h1 className="page-title">404 — Page not found</h1>
      <p>We couldn't find what you were looking for.</p>
      <Link to="/" className="btn btn-primary">Go home</Link>
    </div>
  );
}
