import type {
  User,
  Service,
  Booking,
  Notification,
  AvailabilityBlock,
  ServiceCategory,
} from "@shared/schemas";

const nowIso = () => new Date().toISOString();

export const users: User[] = [
  { id: 1, email: "admin@wsu.edu", firstName: "Admin", lastName: "Cougar", role: "admin", isBanned: false, createdAt: nowIso() },
  { id: 2, email: "advisor@wsu.edu", firstName: "Maya", lastName: "Chen", role: "staff", isBanned: false, createdAt: nowIso() },
  { id: 3, email: "librarian@wsu.edu", firstName: "Daniel", lastName: "Kim", role: "staff", isBanned: false, createdAt: nowIso() },
  { id: 4, email: "counselor@wsu.edu", firstName: "Rosa", lastName: "Martinez", role: "staff", isBanned: false, createdAt: nowIso() },
  { id: 5, email: "career@wsu.edu", firstName: "Jordan", lastName: "Patel", role: "staff", isBanned: false, createdAt: nowIso() },
  { id: 10, email: "alex@wsu.edu", firstName: "Alex", lastName: "Johnson", role: "student", isBanned: false, createdAt: nowIso() },
  { id: 11, email: "sam@wsu.edu", firstName: "Sam", lastName: "Riley", role: "student", isBanned: false, createdAt: nowIso() },
  { id: 12, email: "banned@wsu.edu", firstName: "Blake", lastName: "Rivers", role: "student", isBanned: true, createdAt: nowIso() },
];

export const passwords: Record<string, string> = {
  "admin@wsu.edu": "password123",
  "advisor@wsu.edu": "password123",
  "librarian@wsu.edu": "password123",
  "counselor@wsu.edu": "password123",
  "career@wsu.edu": "password123",
  "alex@wsu.edu": "password123",
  "sam@wsu.edu": "password123",
};

export const categories: ServiceCategory[] = [
  { id: 1, name: "Advising", icon: "🎓" },
  { id: 2, name: "Library", icon: "📚" },
  { id: 3, name: "Counseling", icon: "💬" },
  { id: 4, name: "Career", icon: "💼" },
  { id: 5, name: "Tutoring", icon: "✏️" },
];

export const services: Service[] = [
  { id: 1, categoryId: 1, categoryName: "Advising", providerId: 2, providerName: "Maya Chen", title: "Academic Advising — CS Majors", description: "One-on-one advising for computer science undergraduates. Bring your degree audit.", location: "Sloan Hall 210", durationMinutes: 30, isActive: true },
  { id: 2, categoryId: 2, categoryName: "Library", providerId: 3, providerName: "Daniel Kim", title: "Research Consultation", description: "Help finding academic sources, citation formatting, and database searches.", location: "Terrell Library Rm 102", durationMinutes: 45, isActive: true },
  { id: 3, categoryId: 3, categoryName: "Counseling", providerId: 4, providerName: "Rosa Martinez", title: "Wellness Check-in", description: "Confidential 50-minute counseling session.", location: "CCC 3rd Floor", durationMinutes: 50, isActive: true },
  { id: 4, categoryId: 4, categoryName: "Career", providerId: 5, providerName: "Jordan Patel", title: "Resume Review", description: "Get targeted feedback on your resume from a career coach.", location: "ASCC 110", durationMinutes: 30, isActive: true },
  { id: 5, categoryId: 4, categoryName: "Career", providerId: 5, providerName: "Jordan Patel", title: "Mock Interview", description: "Practice interviewing with structured feedback.", location: "ASCC 112", durationMinutes: 45, isActive: true },
  { id: 6, categoryId: 1, categoryName: "Advising", providerId: 2, providerName: "Maya Chen", title: "Graduation Planning", description: "Review your remaining coursework and graduation timeline.", location: "Sloan Hall 210", durationMinutes: 30, isActive: true },
  { id: 7, categoryId: 2, categoryName: "Library", providerId: 3, providerName: "Daniel Kim", title: "Library Equipment Loan", description: "Check out cameras, mics, and laptops.", location: "Terrell Circ Desk", durationMinutes: 15, isActive: true },
  { id: 8, categoryId: 5, categoryName: "Tutoring", providerId: 2, providerName: "Maya Chen", title: "Writing Support", description: "Peer tutoring on essays and technical writing.", location: "Avery 121", durationMinutes: 60, isActive: false },
];

function addDays(base: Date, d: number) {
  const x = new Date(base);
  x.setDate(x.getDate() + d);
  return x;
}
function atTime(base: Date, h: number, m = 0) {
  const x = new Date(base);
  x.setHours(h, m, 0, 0);
  return x;
}

const today = new Date();
export const availability: AvailabilityBlock[] = (() => {
  const out: AvailabilityBlock[] = [];
  let id = 1;
  for (const svc of services) {
    if (!svc.isActive) continue;
    for (let d = 1; d <= 14; d++) {
      const day = addDays(today, d);
      if (day.getDay() === 0 || day.getDay() === 6) continue;
      for (const hour of [9, 10, 11, 13, 14, 15]) {
        out.push({
          id: id++,
          serviceId: svc.id,
          startAt: atTime(day, hour).toISOString(),
          endAt: atTime(day, hour, svc.durationMinutes).toISOString(),
        });
      }
    }
  }
  return out;
})();

export const bookings: Booking[] = [
  {
    id: 1,
    serviceId: 1,
    serviceTitle: "Academic Advising — CS Majors",
    providerName: "Maya Chen",
    studentId: 10,
    studentName: "Alex Johnson",
    startAt: atTime(addDays(today, 2), 10).toISOString(),
    endAt: atTime(addDays(today, 2), 10, 30).toISOString(),
    status: "approved",
    notes: "Want to switch minors.",
    location: "Sloan Hall 210",
    createdAt: nowIso(),
  },
  {
    id: 2,
    serviceId: 4,
    serviceTitle: "Resume Review",
    providerName: "Jordan Patel",
    studentId: 10,
    studentName: "Alex Johnson",
    startAt: atTime(addDays(today, 4), 14).toISOString(),
    endAt: atTime(addDays(today, 4), 14, 30).toISOString(),
    status: "pending",
    notes: "Applying to summer internships.",
    location: "ASCC 110",
    createdAt: nowIso(),
  },
  {
    id: 3,
    serviceId: 2,
    serviceTitle: "Research Consultation",
    providerName: "Daniel Kim",
    studentId: 11,
    studentName: "Sam Riley",
    startAt: atTime(addDays(today, 1), 11).toISOString(),
    endAt: atTime(addDays(today, 1), 11, 45).toISOString(),
    status: "pending",
    notes: "Thesis sources needed.",
    location: "Terrell Library Rm 102",
    createdAt: nowIso(),
  },
  {
    id: 4,
    serviceId: 1,
    serviceTitle: "Academic Advising — CS Majors",
    providerName: "Maya Chen",
    studentId: 10,
    studentName: "Alex Johnson",
    startAt: atTime(addDays(today, -3), 9).toISOString(),
    endAt: atTime(addDays(today, -3), 9, 30).toISOString(),
    status: "completed",
    location: "Sloan Hall 210",
    createdAt: nowIso(),
  },
  {
    id: 5,
    serviceId: 3,
    serviceTitle: "Wellness Check-in",
    providerName: "Rosa Martinez",
    studentId: 10,
    studentName: "Alex Johnson",
    startAt: atTime(addDays(today, -7), 13).toISOString(),
    endAt: atTime(addDays(today, -7), 13, 50).toISOString(),
    status: "cancelled",
    location: "CCC 3rd Floor",
    createdAt: nowIso(),
  },
];

export const notifications: Notification[] = [
  {
    id: 1,
    userId: 10,
    type: "booking_approved",
    payload: { bookingId: 1, service: "Academic Advising — CS Majors" },
    readAt: null,
    createdAt: nowIso(),
  },
  {
    id: 2,
    userId: 10,
    type: "reminder",
    payload: { bookingId: 1, when: "tomorrow at 10:00 AM" },
    readAt: null,
    createdAt: nowIso(),
  },
  {
    id: 3,
    userId: 10,
    type: "booking_created",
    payload: { bookingId: 2, service: "Resume Review" },
    readAt: nowIso(),
    createdAt: nowIso(),
  },
];

export function makeToken(userId: number, role: string) {
  const payload = btoa(
    JSON.stringify({ sub: userId, role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8 })
  );
  return `mock.${payload}.signature`;
}
