export default function Footer() {
  return (
    <footer
      style={{
        background: "#222",
        color: "#ddd",
        padding: "1.5rem 2rem",
        textAlign: "center",
        marginTop: "3rem",
        fontSize: "0.9rem",
      }}
    >
      © {new Date().getFullYear()} Student Booking Services — Washington State University ·
      CPTS 489 Team Project
    </footer>
  );
}
