# Bug Fixes & UI Improvements — bugfixes-hank

---

## Backend / Data

**Seeder Fix**
- Notification `payload` objects were being passed as raw JS objects to Sequelize `bulkInsert`, which requires JSON columns to be pre-stringified. Wrapped all payloads in `JSON.stringify()`.

**`db:reset` Script**
- Reset was re-running migrations but not clearing the seeder tracking table (`SequelizeData`), so seeders would not re-run. Fixed by adding `db:seed:undo` to the reset sequence.

**Double-Booking Prevention**
- Added a student-level overlap check (`assertNoStudentOverlap`) in `BookingService`. Previously only provider conflicts were detected — a student could book two different services at the same time. Now both `create()` and `reschedule()` reject overlapping student bookings.

**Notification Payload Key Mismatch**
- Status-change notifications (`booking_approved`, `booking_rejected`, `booking_cancelled`) were created without a `serviceTitle` field. The frontend was reading `p.service` which never existed in those payloads. Fixed by adding `serviceTitle` to the transition notification payload and updating the frontend to read `serviceTitle` with a fallback chain.

**Notification Rejection Reason Key**
- Backend stored the rejection reason as `rejectionReason`; frontend was reading `reason`. Fixed to match.

---

## Notifications Page

- Fixed "Your booking for **your booking** was approved" — when service name is missing from old payloads, the phrase "for X" is omitted entirely, producing clean output like "Your booking was approved."
- All notification message templates updated to use the correct payload keys.

---

## Navbar

- **Layout** — Restructured from flexbox to CSS Grid (`1fr auto 1fr`) so nav links are always exactly centered between the brand and the right-side controls, regardless of content width.
- **Logged-out alignment** — Added explicit `grid-column` assignments so Sign in / Register always stay right-aligned even when the center nav links aren't rendered.
- **Active underline bug** — Added the `end` prop to all three Dashboard NavLinks (student, staff, admin). Without it, React Router v6 kept the Dashboard underline active on every child route (e.g. `/provider/profile` kept `/provider` highlighted).
- **Bell** — Changed from scale animation to a white background highlight on hover, matching the Sign out button. Unread count changed from a badge overlay to inline `🔔 (2)` format.
- **Brand link** — No hover effect (non-interactive appearance).
- **Name / role badge** — Removed hover effects; only truly clickable elements react.
- **Admin badge** — Was crimson on crimson (invisible). Changed to `#333` dark charcoal so it stands out the same as the green STAFF and blue student badges.
- **Navbar thickness** — Reduced padding from `1rem 2rem` to `0.6rem 2rem` (~10% thinner).

---

## Forms & Input Styling

- **FormField component** — Removed the component's own `mb-3` bottom margin; spacing is now controlled by the parent flex container's `gap`, preventing inconsistent gaps between fields.
- **`input[type="search"]`** — Added to the global CSS input selectors so the Admin Users filter field gets the same full-width, padded, bordered styling with crimson focus ring as every other input on the site.
- **Name fields** — Added explicit `type="text"` to all first/last name inputs across Register, student Profile, and provider Profile. Without it, the legacy CSS selector `input[type="text"]` didn't apply, making those fields render smaller than email/password fields.
- **Register & Login forms** — Standardized to `display: flex; flex-direction: column; gap: 1rem` with consistent button margin.

---

## Profile Pages (Student & Provider)

- Replaced old `grid-2` class layout (which relied on a broken helper class) with explicit `grid-template-columns: 1fr 1fr` for the name row.
- Moved page title outside the card into a `page-header` div, matching the alignment of Dashboard and all other pages.
- Submit button changed to `btn-block` (full width) for visual consistency with Register.
- Provider profile: "Services you provide" section constrained to the same `maxWidth: 560` as the form card.

---

## Service & Booking Pages

- **Service cards** — Added `display: flex; flex-direction: column` to cards and wrapped "View availability" button in `margin-top: auto` so it always pins to the bottom of the card regardless of description length.
- **Service detail width** — Fixed inconsistent page widths caused by `.app-main` lacking `width: 100%` as a flex child of `.app-shell`. All service detail pages now render at the same width.
- **Booking conflict error** — Inline error banner inside the booking modal instead of a toast, so the user sees the conflict message without losing context.
- **Cancel confirmation** — Replaced `window.confirm()` with a proper Modal component with "Keep booking" / "Yes, cancel" buttons.
- **Availability grid** — Fixed from `auto-fill minmax(120px)` to `repeat(3, 1fr)` for a consistent 3-column layout.

---

## Modal Fix

- Two conflicting rules in `legacy.css` were preventing modals from displaying: a duplicate `.modal { display: none }` block was overriding the working styles, and a second `.modal-overlay` definition was hiding the overlay. Removed the duplicate block and added `display: flex` to `.modal-overlay.active`.

---

## Landing Page

- Hero background changed from gradient to solid WSU crimson with rounded corners.
- Title made white, bold, and larger (`3.5rem`).
- Sign in / Create account buttons styled with a darker WSU red background, white text, and a white border hover effect.
- Footer padding reduced (~10% thinner) and set to `margin-top: auto` to always stick to the bottom.

---

## Dashboard

- Appointment list items given left padding (`0.75rem`) so text doesn't sit flush against the card border.
