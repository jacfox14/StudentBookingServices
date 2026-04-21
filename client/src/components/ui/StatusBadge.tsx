import type { BookingStatus } from "@shared/schemas";

const map: Record<BookingStatus, { label: string; mod: string }> = {
  pending: { label: "Pending", mod: "pending" },
  approved: { label: "Approved", mod: "confirmed" },
  completed: { label: "Completed", mod: "confirmed" },
  rejected: { label: "Rejected", mod: "cancelled" },
  cancelled: { label: "Cancelled", mod: "cancelled" },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const meta = map[status];
  return (
    <span className={`status-badge status-badge--${meta.mod}`} role="status">
      {meta.label}
    </span>
  );
}
