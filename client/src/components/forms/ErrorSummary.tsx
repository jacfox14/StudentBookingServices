interface Props {
  message?: string | null;
}
export function ErrorSummary({ message }: Props) {
  if (!message) return null;
  return (
    <div
      role="alert"
      style={{
        background: "#fdecea",
        color: "#611a15",
        border: "1px solid #f5c6c2",
        padding: "0.75rem 1rem",
        borderRadius: 6,
        marginBottom: "1rem",
      }}
    >
      {message}
    </div>
  );
}
