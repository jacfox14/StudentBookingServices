import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Shell() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main container" style={{ padding: "2rem 1rem" }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
