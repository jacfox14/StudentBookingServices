import type { Booking } from "@shared/schemas";

export type BookingTab = "upcoming" | "past" | "cancelled";

export function classifyBooking(b: Booking, now: Date): BookingTab {
  if (b.status === "cancelled" || b.status === "rejected") return "cancelled";
  if (b.status === "completed" || new Date(b.endAt) < now) return "past";
  return "upcoming";
}
