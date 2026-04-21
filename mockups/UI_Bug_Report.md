# SBS Mockups - Visual/UI Bug Report

**Date:** March 6, 2026
**Reviewer:** Claude
**Scope:** All 17 HTML mockup pages + shared style.css

---

## Critical Bugs (Layout Breaking / Visually Broken)

### 1. `admin-services.html` — Duplicate element IDs on the service modal
**File:** `admin-services.html`, lines 245–246
Two elements share the ID `serviceModal` — one is a `<div class="modal-overlay">` and the next is `<div class="modal">`. Because `getElementById` returns only the *first* match, the JavaScript `openModal('add')` and `openModal('edit')` calls will target the empty overlay `<div>` instead of the actual modal with the form. The modal will never visually appear.

**Fix:** Rename the overlay to a unique ID (e.g., `serviceModalOverlay`) and update the JS to toggle both elements, or remove the standalone overlay div and use the `.modal` approach consistent with other pages.

---

### 2. `service-detail.html` — Calendar days 1–4 marked as `other-month` are incorrect
**File:** `service-detail.html`, lines 82–85
March 2026 starts on a **Sunday**, so day 1 should be the first cell — not greyed out as `other-month`. Days 1–4 are all valid March dates but are visually styled as belonging to a different month (greyed/dimmed), making them appear unavailable.

**Fix:** Remove the `other-month` class from days 1–4. If you want to show leading days from February, those would be Feb 22–28 before March 1 begins on Sunday.

---

### 3. `search-services.html` — Missing footer
**File:** `search-services.html`
This is the only student-facing page that completely lacks a `<footer>` element. Every other page has one, creating visual inconsistency.

**Fix:** Add the standard footer before `</body>`.

---

### 4. `student-dashboard.html` — Navbar uses `<ul>` while other student pages use `<div>` for navbar links
**File:** `student-dashboard.html`, line 14 vs. other student pages
The student dashboard wraps nav links in `<ul class="navbar-links"><li>` elements, while all other student pages (search-services, my-bookings, notifications, etc.) use `<div class="navbar-links"><a>` directly. This creates different spacing and potentially different styling behavior because CSS may not account for `<li>` wrappers on the `<div>`-targeted rules.

**Fix:** Standardize to one pattern. The `<div>` pattern is used on most pages and is likely the intended structure.

---

## Medium Bugs (Visual Inconsistencies)

### 5. `index.html` — Logo inconsistency (emoji vs. plain text)
**File:** `index.html`, line 14
The homepage logo reads `📚 SBS` with a book emoji, while every other page across the entire app just displays `SBS` as plain text. This creates a jarring brand inconsistency when navigating away from the homepage.

**Fix:** Use `SBS` consistently, or add the emoji to all pages.

---

### 6. `login.html` — Empty navbar-links div and unnecessary avatar
**File:** `login.html`, lines 14, 17
The login page includes an empty `<div class="navbar-links"></div>` which may introduce unwanted spacing. It also shows a user avatar (`👤`) in the navbar, which is misleading — the user isn't logged in yet.

**Fix:** Remove the empty navbar-links div, and either remove or replace the avatar with a "Home" link or the login/register buttons.

---

### 7. `register.html` — Same empty navbar + avatar issue as login
**File:** `register.html`, lines 14, 17
Identical to the login page issue — empty navbar-links div and a user avatar displayed before the user has an account.

**Fix:** Same as above.

---

### 8. `admin-dashboard.html` — Metrics grid declared as `grid-3` but contains 6 cards
**File:** `admin-dashboard.html`, line 53
The container uses `class="grid grid-3"` (3-column layout) with 6 metric cards. While this technically works (cards wrap to a second row), the second row's spacing may appear inconsistent compared to using a more explicit layout. More importantly, some screens may see an awkward 3+3 break rather than a balanced 2-row layout.

**Fix:** This is minor — visually verify the wrap behavior looks intentional. Consider `grid-3` is acceptable for this.

---

### 9. `booking-confirmation.html` — Missing footer
**File:** `booking-confirmation.html`
No `<footer>` element present, unlike other student pages.

**Fix:** Add the standard footer.

---

### 10. `service-detail.html` — Missing footer
**File:** `service-detail.html`
No `<footer>` element present.

**Fix:** Add the standard footer.

---

### 11. `booking-detail.html` — Missing footer
**File:** `booking-detail.html`
No `<footer>` element present.

**Fix:** Add the standard footer.

---

### 12. Provider pages — No footer on any provider page
**Files:** `provider-dashboard.html`, `provider-profile.html`, `provider-requests.html`, `provider-schedule.html`
None of the provider role pages include a footer, while student pages (dashboard, my-bookings, etc.) do have footers.

**Fix:** Add a consistent footer to all provider pages.

---

### 13. Admin pages — No footer on any admin page
**Files:** `admin-dashboard.html`, `admin-users.html`, `admin-services.html`, `admin-reports.html`
None of the admin pages include a footer.

**Fix:** Add a consistent footer to all admin pages.

---

## Minor Bugs (Polish / Best Practices)

### 14. `search-services.html` — Stale "next available" date on Physics Tutoring
**File:** `search-services.html`, line 253
Physics Tutoring shows "Next available: Mar 5 at 4:00 PM" which is in the past (today is March 6). This should show a future date to make the mockup data look realistic.

**Fix:** Change to a future date (e.g., "Mar 9 at 4:00 PM").

---

### 15. `admin-services.html` — The modal overlay div serves no purpose
**File:** `admin-services.html`, line 245
`<div id="serviceModal" class="modal-overlay"></div>` is an empty self-closing div that sits right before the real modal. Because they share the same ID, the overlay never gets toggled properly and does nothing visually.

**Fix:** Either remove this empty overlay or give it a unique ID and properly toggle it alongside the modal for a backdrop effect.

---

### 16. `my-bookings.html` — Tab switching sets `display: grid` but the bookings list may not use grid layout
**File:** `my-bookings.html`, lines 273–275
The JavaScript sets `.style.display = 'grid'` when switching tabs, but the `.bookings-list` class in CSS may use `display: flex` or `display: block` as its layout. This mismatch could cause unexpected card arrangement when switching to the "Past" tab.

**Fix:** Verify the CSS for `.bookings-list` and use the matching display value (likely `block` or `flex`), or simply toggle a class instead of inline styles.

---

### 17. `notifications.html` — `fadeOut` animation referenced but not defined in CSS
**File:** `notifications.html`, line 239
The dismiss button applies `animation: 'fadeOut 0.3s ease-out'` but no `@keyframes fadeOut` is defined in style.css. The notification items will simply vanish after the 300ms timeout with no smooth transition.

**Fix:** Add a `@keyframes fadeOut` definition to style.css:
```css
@keyframes fadeOut {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(20px); }
}
```

---

### 18. Inconsistent navbar structure across role types
**Files:** Multiple
- **Student pages** mostly use `<div class="navbar-links"><a>` (except dashboard which uses `<ul><li><a>`)
- **Admin pages** use `<ul class="navbar-links"><li><a>`
- **Provider pages** use `<div class="navbar-links"><a>`

This means the same CSS class `.navbar-links` must account for both `<div>` and `<ul>` wrappers, and `<li>` elements may receive default list styling or different spacing.

**Fix:** Pick one pattern and use it everywhere. The `<ul><li>` approach is semantically more correct for navigation.

---

### 19. `provider-dashboard.html` — Calendar uses `<table>` while `service-detail.html` uses `<div>` grid
**Files:** `provider-dashboard.html` (line 65) vs. `service-detail.html` (line 72)
Two different calendar implementations exist — one as an HTML `<table>` and one as a CSS grid of `<div>` elements. They likely render differently and have separate CSS rules.

**Fix:** This is a consistency issue rather than a bug. Consider unifying the calendar component.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| Medium   | 9 |
| Minor    | 6 |
| **Total** | **18** |

The most impactful fixes would be: resolving the duplicate ID on the admin services modal (#1), correcting the calendar `other-month` dates (#2), standardizing footers across all pages (#3, 9–13), and adding the missing `fadeOut` keyframes (#17).
