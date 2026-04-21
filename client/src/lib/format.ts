import { format, isThisWeek, isToday, isTomorrow, parseISO } from "date-fns";

export function fmtDate(iso: string): string {
  return format(parseISO(iso), "MMM d, yyyy");
}

export function fmtTime(iso: string): string {
  return format(parseISO(iso), "h:mm a");
}

export function fmtDateTime(iso: string): string {
  return format(parseISO(iso), "MMM d, yyyy · h:mm a");
}

export function fmtRelativeDay(iso: string): string {
  const d = parseISO(iso);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isThisWeek(d)) return format(d, "EEEE");
  return format(d, "EEE, MMM d");
}
