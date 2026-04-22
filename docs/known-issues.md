# Known Issues — StudentBookingServices

*Post-launch retrospective. Issues below are acknowledged and deferred; none are blockers for the current demo deployment.*

---

## KI-001 — No Reschedule UI for Students

**Description:** Students cannot reschedule a confirmed booking. The only available actions are viewing or cancelling. If a student needs a different time, they must cancel and re-book.

**Impact:** Minor UX friction. Cancelling and re-booking works correctly, but the original slot is immediately released and may be taken by another student.

**Proposed fix:** Add a "Reschedule" action to the student booking card that reuses the existing slot-selection flow, then issues a `PATCH /api/bookings/:id` with a new `scheduledAt`.

---

## KI-002 — "Completed" Status Is Never Set Automatically

**Description:** The `BookingStatus` enum includes `completed`, but no background job or API call transitions a booking to that state after the appointment time passes. All past bookings remain `confirmed` indefinitely.

**Impact:** Reports and provider dashboards cannot distinguish past from upcoming appointments by status alone; callers must compare `scheduledAt` against the current timestamp manually.

**Proposed fix:** Add a scheduled cron task (e.g., via `node-cron`) that runs hourly and sets `status = 'completed'` for all `confirmed` bookings whose `scheduledAt + durationMinutes` is in the past.

---

## KI-003 — Date Comparison Uses Local Time Instead of UTC

**Description:** Availability and conflict checks in `BookingService.ts` build date ranges using `new Date()` without explicit timezone handling. In environments where the server's local timezone differs from UTC (any production host outside the developer's machine), window boundaries are off by the UTC offset.

**Impact:** Edge-case double-bookings or false availability gaps near midnight in non-UTC server deployments.

**Proposed fix:** Normalise all date arithmetic to UTC using `Date.UTC(...)` or a library such as `date-fns-tz`. Store and compare all timestamps as UTC in the database.

---

## KI-004 — Email Notifications Are Not Sent (Console Stub Only)

**Description:** `server/src/services/EmailService.ts` logs notification content to `console.log` rather than dispatching real email. Students and staff receive no out-of-app alerts for booking confirmations, cancellations, or reminders.

**Impact:** Users who are not actively viewing the app will miss time-sensitive booking updates.

**Proposed fix:** Integrate a transactional email provider (e.g., SendGrid, Resend, or Nodemailer with SMTP). Replace the `console.log` stub with an API call, keeping the existing function signature so callers require no changes.

---

## KI-005 — Recurrence Rule Field Is Stored but Never Enforced

**Description:** The `Service` model includes a `recurrenceRule` column (iCal RRULE format) and the admin service form accepts a value for it, but no code expands the rule into individual bookable slots. The field is persisted to the database and returned in API responses but has no effect on availability.

**Impact:** Any admin who sets a recurrence rule will observe no change in behaviour, leading to confusion.

**Proposed fix:** Either implement RRULE expansion using a library such as `rrule` when building availability windows, or remove the field entirely until the feature is scoped and scheduled.

---

## KI-006 — Demo Credentials Are Hard-Coded in the Login UI

**Description:** The login page renders plaintext demo credentials (`admin@wsu.edu / password`, `staff@wsu.edu / password`, `student@wsu.edu / password`) directly in the UI for convenience during development and grading demos.

**Impact:** Any public deployment would expose valid account credentials to all visitors, posing a direct account-takeover risk.

**Proposed fix:** Remove the credential hints before any non-demo deployment, or gate their display behind a `VITE_SHOW_DEMO_CREDENTIALS=true` environment variable so they are never visible in production builds.
