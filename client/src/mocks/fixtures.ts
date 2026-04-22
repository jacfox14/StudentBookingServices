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
  { id: 1,  email: "admin@wsu.edu",     firstName: "Admin",  lastName: "Cougar",   role: "admin",   isBanned: false, createdAt: nowIso() },
  { id: 2,  email: "advisor@wsu.edu",   firstName: "Maya",   lastName: "Chen",     role: "staff",   isBanned: false, createdAt: nowIso() },
  { id: 3,  email: "librarian@wsu.edu", firstName: "Daniel", lastName: "Kim",      role: "staff",   isBanned: false, createdAt: nowIso() },
  { id: 4,  email: "counselor@wsu.edu", firstName: "Rosa",   lastName: "Martinez", role: "staff",   isBanned: false, createdAt: nowIso() },
  { id: 5,  email: "career@wsu.edu",    firstName: "Jordan", lastName: "Patel",    role: "staff",   isBanned: false, createdAt: nowIso() },
  { id: 10, email: "alex@wsu.edu",      firstName: "Alex",   lastName: "Johnson",  role: "student", isBanned: false, createdAt: nowIso() },
];

export const passwords: Record<string, string> = {
  "admin@wsu.edu":     "password123",
  "advisor@wsu.edu":   "password123",
  "librarian@wsu.edu": "password123",
  "counselor@wsu.edu": "password123",
  "career@wsu.edu":    "password123",
  "alex@wsu.edu":      "password123",
};

export const categories: ServiceCategory[] = [
  { id: 1, name: "Advising",   icon: "🎓" },
  { id: 2, name: "Library",    icon: "📚" },
  { id: 3, name: "Counseling", icon: "💬" },
  { id: 4, name: "Career",     icon: "💼" },
  { id: 5, name: "Tutoring",   icon: "✏️" },
];

export const services: Service[] = [
  { id: 1, categoryId: 1, categoryName: "Advising",   providerId: 2, providerName: "Maya Chen",     title: "Academic Advising — CS Majors", description: "One-on-one advising for computer science undergraduates. Bring your degree audit.", location: "Sloan Hall 210",        durationMinutes: 30, isActive: true  },
  { id: 2, categoryId: 2, categoryName: "Library",    providerId: 3, providerName: "Daniel Kim",    title: "Research Consultation",         description: "Help finding academic sources, citation formatting, and database searches.",  location: "Terrell Library Rm 102", durationMinutes: 45, isActive: true  },
  { id: 3, categoryId: 3, categoryName: "Counseling", providerId: 4, providerName: "Rosa Martinez", title: "Wellness Check-in",              description: "Confidential 50-minute counseling session.",                                 location: "CCC 3rd Floor",          durationMinutes: 50, isActive: true  },
  { id: 4, categoryId: 4, categoryName: "Career",     providerId: 5, providerName: "Jordan Patel",  title: "Resume Review",                  description: "Get targeted feedback on your resume from a career coach.",                  location: "ASCC 110",               durationMinutes: 30, isActive: true  },
  { id: 5, categoryId: 4, categoryName: "Career",     providerId: 5, providerName: "Jordan Patel",  title: "Mock Interview",                 description: "Practice interviewing with structured feedback.",                            location: "ASCC 112",               durationMinutes: 45, isActive: true  },
  { id: 6, categoryId: 1, categoryName: "Advising",   providerId: 2, providerName: "Maya Chen",     title: "Graduation Planning",            description: "Review your remaining coursework and graduation timeline.",                 location: "Sloan Hall 210",        durationMinutes: 30, isActive: true  },
  { id: 7, categoryId: 2, categoryName: "Library",    providerId: 3, providerName: "Daniel Kim",    title: "Library Equipment Loan",         description: "Check out cameras, mics, and laptops.",                                     location: "Terrell Circ Desk",      durationMinutes: 15, isActive: true  },
  { id: 8, categoryId: 5, categoryName: "Tutoring",   providerId: 2, providerName: "Maya Chen",     title: "Writing Support",                description: "Peer tutoring on essays and technical writing.",                            location: "Avery 121",              durationMinutes: 60, isActive: false },
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

// All bookings belong to Alex Johnson (id:10).
// Upcoming bookings show on the student dashboard; past bookings populate the admin graph
// (MSW reports handler groups by startAt date).
export const bookings: Booking[] = [
  // --- Upcoming ---
  {
    id: 1, serviceId: 6, serviceTitle: "Graduation Planning",        providerName: "Maya Chen",
    studentId: 10, studentName: "Alex Johnson",
    startAt: atTime(addDays(today, 2), 9).toISOString(),
    endAt:   atTime(addDays(today, 2), 9, 30).toISOString(),
    status: "approved", notes: "Need to map out my final semester.", location: "Sloan Hall 210", createdAt: nowIso(),
  },
  {
    id: 2, serviceId: 1, serviceTitle: "Academic Advising — CS Majors", providerName: "Maya Chen",
    studentId: 10, studentName: "Alex Johnson",
    startAt: atTime(addDays(today, 4), 10).toISOString(),
    endAt:   atTime(addDays(today, 4), 10, 30).toISOString(),
    status: "approved", notes: "Thinking about adding a minor in math.", location: "Sloan Hall 210", createdAt: nowIso(),
  },
  {
    id: 3, serviceId: 4, serviceTitle: "Resume Review",               providerName: "Jordan Patel",
    studentId: 10, studentName: "Alex Johnson",
    startAt: atTime(addDays(today, 6), 14).toISOString(),
    endAt:   atTime(addDays(today, 6), 14, 30).toISOString(),
    status: "pending", notes: "Applying for summer software engineering internships.", location: "ASCC 110", createdAt: nowIso(),
  },
  {
    id: 4, serviceId: 5, serviceTitle: "Mock Interview",              providerName: "Jordan Patel",
    studentId: 10, studentName: "Alex Johnson",
    startAt: atTime(addDays(today, 9), 11).toISOString(),
    endAt:   atTime(addDays(today, 9), 11, 45).toISOString(),
    status: "pending", notes: "Preparing for an Amazon SDE interview.", location: "ASCC 112", createdAt: nowIso(),
  },
  // --- Past (spread across last 13 days for admin reports graph) ---
  {
    id: 5, serviceId: 3, serviceTitle: "Wellness Check-in",           providerName: "Rosa Martinez",
    studentId: 10, studentName: "Alex Johnson",
    startAt: atTime(addDays(today, -1), 13).toISOString(),
    endAt:   atTime(addDays(today, -1), 13, 50).toISOString(),
    status: "completed", location: "CCC 3rd Floor", createdAt: addDays(today, -1).toISOString(),
  },
  {
    id: 6, serviceId: 2, serviceTitle: "Research Consultation",       providerName: "Daniel Kim",
    studentId: 10, studentName: "Alex Johnson",
    startAt: atTime(addDays(today, -2), 11).toISOString(),
    endAt:   atTime(addDays(today, -2), 11, 45).toISOString(),
    status: "completed", location: "Terrell Library Rm 102", createdAt: addDays(today, -2).toISOString(),
  },
  {
    id: 7, serviceId: 7, serviceTitle: "Library Equipment Loan",      providerName: "Daniel Kim",
    studentId: 10, studentName: "Alex Johnson",
    startAt: atTime(addDays(today, -3), 10).toISOString(),
    endAt:   atTime(addDays(today, -3), 10, 15).toISOString(),
    status: "cancelled", location: "Terrell Circ Desk", createdAt: addDays(today, -3).toISOString(),
  },
  {
    id: 8, serviceId: 1, serviceTitle: "Academic Advising — CS Majors", providerName: "Maya Chen",
    studentId: 10, studentName: "Alex Johnson",
    startAt: atTime(addDays(today, -4), 9).toISOString(),
    endAt:   atTime(addDays(today, -4), 9, 30).toISOString(),
    status: "completed", location: "Sloan Hall 210", createdAt: addDays(today, -4).toISOString(),
  },
  {
    id: 9, serviceId: 4, serviceTitle: "Resume Review",               providerName: "Jordan Patel",
    studentId: 10, studentName: "Alex Johnson",
    startAt: atTime(addDays(today, -5), 14).toISOString(),
    endAt:   atTime(addDays(today, -5), 14, 30).toISOString(),
    status: "completed", location: "ASCC 110", createdAt: addDays(today, -5).toISOString(),
  },
  {
    id: 10, serviceId: 6, serviceTitle: "Graduation Planning",        providerName: "Maya Chen",
    studentId: 10, studentName: "Alex Johnson",
    startAt: atTime(addDays(today, -6), 10).toISOString(),
    endAt:   atTime(addDays(today, -6), 10, 30).toISOString(),
    status: "completed", location: "Sloan Hall 210", createdAt: addDays(today, -6).toISOString(),
  },
  {
    id: 11, serviceId: 5, serviceTitle: "Mock Interview",             providerName: "Jordan Patel",
    studentId: 10, studentName: "Alex Johnson",
    startAt: atTime(addDays(today, -7), 11).toISOString(),
    endAt:   atTime(addDays(today, -7), 11, 45).toISOString(),
    status: "rejected", rejectionReason: "Schedule conflict — please select a different slot.", location: "ASCC 112", createdAt: addDays(today, -7).toISOString(),
  },
  {
    id: 12, serviceId: 2, serviceTitle: "Research Consultation",      providerName: "Daniel Kim",
    studentId: 10, studentName: "Alex Johnson",
    startAt: atTime(addDays(today, -8), 13).toISOString(),
    endAt:   atTime(addDays(today, -8), 13, 45).toISOString(),
    status: "completed", location: "Terrell Library Rm 102", createdAt: addDays(today, -8).toISOString(),
  },
  {
    id: 13, serviceId: 3, serviceTitle: "Wellness Check-in",          providerName: "Rosa Martinez",
    studentId: 10, studentName: "Alex Johnson",
    startAt: atTime(addDays(today, -9), 9).toISOString(),
    endAt:   atTime(addDays(today, -9), 9, 50).toISOString(),
    status: "completed", location: "CCC 3rd Floor", createdAt: addDays(today, -9).toISOString(),
  },
  {
    id: 14, serviceId: 7, serviceTitle: "Library Equipment Loan",     providerName: "Daniel Kim",
    studentId: 10, studentName: "Alex Johnson",
    startAt: atTime(addDays(today, -10), 11).toISOString(),
    endAt:   atTime(addDays(today, -10), 11, 15).toISOString(),
    status: "completed", location: "Terrell Circ Desk", createdAt: addDays(today, -10).toISOString(),
  },
  {
    id: 15, serviceId: 1, serviceTitle: "Academic Advising — CS Majors", providerName: "Maya Chen",
    studentId: 10, studentName: "Alex Johnson",
    startAt: atTime(addDays(today, -11), 10).toISOString(),
    endAt:   atTime(addDays(today, -11), 10, 30).toISOString(),
    status: "completed", location: "Sloan Hall 210", createdAt: addDays(today, -11).toISOString(),
  },
  {
    id: 16, serviceId: 4, serviceTitle: "Resume Review",              providerName: "Jordan Patel",
    studentId: 10, studentName: "Alex Johnson",
    startAt: atTime(addDays(today, -12), 14).toISOString(),
    endAt:   atTime(addDays(today, -12), 14, 30).toISOString(),
    status: "completed", location: "ASCC 110", createdAt: addDays(today, -12).toISOString(),
  },
  {
    id: 17, serviceId: 6, serviceTitle: "Graduation Planning",        providerName: "Maya Chen",
    studentId: 10, studentName: "Alex Johnson",
    startAt: atTime(addDays(today, -13), 9).toISOString(),
    endAt:   atTime(addDays(today, -13), 9, 30).toISOString(),
    status: "completed", location: "Sloan Hall 210", createdAt: addDays(today, -13).toISOString(),
  },
];

export const notifications: Notification[] = [
  // Alex — unread approvals for upcoming bookings
  { id: 1, userId: 10, type: "booking_approved", payload: { bookingId: 1, serviceTitle: "Graduation Planning" },            readAt: null,    createdAt: nowIso() },
  { id: 2, userId: 10, type: "booking_approved", payload: { bookingId: 2, serviceTitle: "Academic Advising — CS Majors" }, readAt: null,    createdAt: nowIso() },
  // Alex — read confirmations for pending bookings he submitted
  { id: 3, userId: 10, type: "booking_created",  payload: { bookingId: 3, serviceTitle: "Resume Review" },                 readAt: nowIso(), createdAt: nowIso() },
  { id: 4, userId: 10, type: "booking_created",  payload: { bookingId: 4, serviceTitle: "Mock Interview" },                readAt: nowIso(), createdAt: nowIso() },
  // Alex — past rejection
  { id: 5, userId: 10, type: "booking_rejected", payload: { bookingId: 11, serviceTitle: "Mock Interview", reason: "Schedule conflict — please select a different slot." }, readAt: nowIso(), createdAt: nowIso() },
  // Maya Chen (advisor, id:2) — pending requests from Alex
  { id: 6, userId: 2,  type: "booking_created",  payload: { bookingId: 3, serviceTitle: "Resume Review",  student: "Alex Johnson" }, readAt: null, createdAt: nowIso() },
  { id: 7, userId: 2,  type: "booking_created",  payload: { bookingId: 4, serviceTitle: "Mock Interview", student: "Alex Johnson" }, readAt: null, createdAt: nowIso() },
];

export function makeToken(userId: number, role: string) {
  const payload = btoa(
    JSON.stringify({ sub: userId, role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8 })
  );
  return `mock.${payload}.signature`;
}
