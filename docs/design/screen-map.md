# Figma screen ownership and implementation agreement

Approved by the team leader: 6 October 2026.

## 1. Reference and scope

The visual reference is [figma-screens.pdf](figma-screens.pdf), containing 20 pages. Page numbers below are PDF page numbers, not the numbered labels printed above some frames.

Reproduce each screen's app content, layout, hierarchy, wording and visual style. Do not substitute a generic dashboard or redesign the flow. The PDF shows sample data; display actual authenticated user and Firestore data in the working application.

Prototype: https://www.figma.com/proto/QtTj7diSzA1609j5KCsazI/HCI_Milestone_2?node-id=30-4649&page-id=3%3A803&starting-point-node-id=30%3A4649

Use the prototype to verify interactions. The navigation below is the agreed implementation map; it does not claim every prototype connection was independently verified.

Read AGENTS.md, ../shared-contracts.md, ../function-contracts.md, ../team-workflow.md and your member document before coding. This document confirms screen ownership and visual requirements; it does not replace the existing operation contracts or grant permission to alter the database schema.

## 2. Screen ownership

| PDF page | Screen | Owner | Route | Required content and actions |
|---|---|---|---|---|
| 1 | Room Discovery | M1 | /rooms | Date choices, level selector, room cards, capacity, equipment/location, live availability, schedule action; Rooms tab active. |
| 2 | Room Schedule | M1 | /booking/schedule | Room/date heading, 60-minute slot choices, past/booked/selected states, selected-slot summary and Continue to Group Setup. |
| 3 | Group Configuration | M1 | /booking/group | Booking context, saved-group selection, New Group entry, roster and size validation, optional study purpose, Review Reservation. |
| 4 | Review & Confirm | M1 | /booking/review | Remaining hold time, room/date/time/group summary, grace-period notice, confirm and cancel/release actions. |
| 5 | My Reservations | M3 | /passes | Upcoming/Active/Past tabs, reservation cards, pass access, details/policy entry and completed receipts; My Passes tab active. |
| 6 | Digital Access Pass | M3 | /session/pass | Real booking reference and QR, room/group data, check-in deadline, active-session entry and cancellation. |
| 7 | Active Session | M3 | /session/active | Room/group/end time, remaining-time countdown, equipment note and End Session action. |
| 8 | Session Expiry & Checkout | M3 | /session/checkout | Ending-soon state, remaining time, handover checklist, extension entry, checkout/release action. Support early checkout without falsely displaying “5 mins left.” |
| 9 | Extend Session | M3 | /session/extend | Current booking, next-hour availability, +15/+30 choices, new end-time preview, one-extension limit and submit action. |
| 10 | Extended Active Session | M3 | /session/active | Extended state of page 7: success notice, original/new end times, updated timer, extension disabled after use and early checkout. |
| 11 | Session Completed | M3 | /session/completed | Release confirmation, actual booking receipt, handover information when available, My Passes and Book Another Room actions. |
| 12 | Login | M4 | /login | Preserve branding and visual hierarchy; adapt SSO to email/password, registration, errors and missing-profile completion. |
| 13 | Saved Study Groups | M4 | /groups | Owner's groups, default marker, member counts/rosters, New Group, edit/details access and Book Room with Group. |
| 14 | Create/Edit Group | M4 | /groups/edit | Group title, capacity meter, add/remove members, owner retained, validation and Save. Reuse the screen for create and edit. |
| 15 | Group Details | M4 | /groups/details | Group summary, roster, size eligibility, default-group control, edit/delete access and Book a Room with This Group. |
| 16 | Staff Dashboard | M2 | /staff | Live room cards and counts, pending/active/overstay/available states, scanner entry and relevant room actions. |
| 17 | Verify Check-In | M2 | /staff/verify | Camera scanner and manual lookup, booking/roster/time verification, explicit authorize action and invalid-arrival feedback. |
| 18 | Audit Log | M2 | /staff/audit | Date/status filters, actual records, booking-details links and applicable overstay release entry. |
| 19 | Resolve Overstay | M2 | /staff/overstay | Overdue booking, end/current time, occupying group, next reservation if present, release confirmation or keep active. |
| 20 | Staff Booking Details | M2 | /staff/details | Booking status, room/schedule/group details and actual audit timeline; return to audit or verify booking. |

## 3. Member boundaries and connections

- M1 owns pages 1–4, including the booking-specific roster on page 3. M4 owns persistent saved-group management on pages 13–15.
- M3 owns all of page 5, including upcoming and historical reservations. M1 must not create a second My Reservations screen.
- M1 owns shared visual constants, common controls and the student navigation: Rooms -> /rooms, My Passes -> /passes, Groups -> /groups.
- M2 owns staff navigation: Rooms -> /staff, Scanner -> /staff/verify, Audit Log -> /staff/audit, using the shared visual style.
- Only M1 coordinates changes to root routing/layout and shared UI files. Other members request a shared change rather than maintaining competing copies.
- Ownership is implementation responsibility, not an assertion that the feature is already finished.

### Booking to session

Page 1 -> page 2 -> page 3 -> page 4 -> page 6 after successful confirmation. Pass the same bookingId to M3. M3 reads that reservation; it must not create a replacement booking.

Page 5 opens page 6 for a confirmed booking, page 7/10 for an active booking and page 11 for a completed booking. Reservation details/policy can be shown in a simple student-facing panel; do not route students into staff-only page 20.

M2 authorizes check-in on page 17. M3 observes the booking becoming active, then enables page 7. A student tapping “Go to Active Session” must not authorize their own check-in.

Page 7/10 -> page 8 for checkout; page 8 -> page 9 when extension is permitted; a successful extension returns to the extended active state (page 10). Successful checkout opens page 11. At zero remaining time, an occupied room stays occupied until checkout or authorized staff release.

### Saved groups to booking

M4 opens /rooms with groupId from pages 13/15. M1 preserves that selection throughout booking and uses the saved roster as the initial booking roster.

From page 3, “New Group” enters M4's editor. Coordinate returning to the same held booking with bookingId and the saved groupId before implementing this cross-feature action. Do not silently discard the current booking or create a second hold. The hold still expires normally while editing.

Changes to a saved group do not change the roster stored in an existing confirmed reservation.

### Staff flow

Page 16 -> page 17 for verification or page 19 for overstay resolution. Page 18 -> page 20 for details or page 19 for an applicable release. Staff actions update the same bookings and room occupancy observed by M1/M3.

## 4. Shared visual rules

- Preserve the reference's white/light surfaces, navy headings and primary buttons, subtle outlined cards, green success, amber warning and red destructive/overstay states.
- Use one agreed font family, colour palette, spacing scale, corner-radius set and icon family. M1 publishes the actual values in the shared theme. Exact font names and colour codes are not established by this screenshot PDF; do not describe guesses as measured Figma values.
- Members can implement logic immediately. Before independently styling every screen, agree shared values with M1 and review one representative screen each.
- Follow the reference's control order, alignment, text hierarchy, button labels and relative spacing. Repeated headers, inputs, buttons, cards and badges must look consistent across owners.
- Use a small theme and a few genuinely reused controls; do not add a design framework or a generic form/navigation abstraction.
- Render app content only. Do not draw phone frames, notches, fake battery/time/network indicators, outer screenshot labels, “Selected Direction” tags or PDF presentation footers.
- Respect Android safe areas and the real system status/navigation bars. Allow content to scroll when needed; do not shrink an entire screenshot to fit the screen.
- Keep controls readable and usable, including with the keyboard open. Preserve visible error feedback and disabled/busy states during writes.
- Empty, loading, expired, offline/error and invalid-input states must use the same visual language. Never replace a failed database request with a fabricated success.
- QR codes must encode the actual payload from the shared contract; the sample QR image is not a usable implementation.
- Sample counts, dates, names, references and countdowns are examples, not constants to hard-code.

## 5. Functional truth and prototype differences

### Already agreed

- Authentication uses Firebase email/password because real SLIIT SSO is unavailable. Preserve page 12's branding, but label the authentication method accurately. M4 supplies minimal registration/profile-completion states using the same styling.
- Standard bookings are 60 minutes. Fifteen-minute internal locks do not mean students can reserve a 15-minute room session.
- An extension is granted only if the entire next 60 minutes is free, even for a +15-minute extension. One extension per booking, +15 or +30 minutes, following the existing transaction contract.
- Page 10's sample “next reservation starts at 2:00 PM” conflicts with an extension after an original 1:30 PM end under the agreed full-next-hour rule. Display actual valid data and enforce the rule, not the example sentence.
- Page 10 is a state of the active-session screen, not a second implementation of its timer.
- Current expiry cleanup is performed through the documented application operations; no scheduled backend cleanup has been supplied. Do not promise automatic closed-app cleanup or notifications.

### Must not be invented or silently expanded

- “Verified” roster labels do not prove SLIIT student identity. Student IDs and names are entered data; remove/reword that claim unless real verification is implemented and approved.
- Group purpose/year metadata shown on page 15 is not part of the current saved-group schema. Do not hard-code it as real user data or add schema fields without leader agreement. Booking purpose belongs to the reservation.
- Adding a member by student ID does not imply an institutional directory lookup exists. Use the documented roster data and an honest name-entry interaction if needed.
- Walk-in assignment and CSV export remain secondary scope per M2's member document. Implement only after the core flow and leader agreement. Otherwise explicitly mark the omission; do not leave buttons pretending to work.
- Automatic warnings, extension approval requests, cleaning inspections and push notifications shown in examples are not established shared features. Do not claim an event occurred unless it did.
- The current model does not persist each handover checkbox or verified cleaning inspection. Do not reconstruct historical receipts with invented “conditions met” claims. Coordinate any required persistence change with M1.
- Extra controls needed for meaningful CRUD, such as delete-group confirmation and default selection, should follow the supplied style. Do not redesign the whole screen to add them.

## 6. Definition of a finished screen

1. Screen is implemented in its assigned route and uses actual data.
2. Compare an Android screenshot side by side with its PDF page: structure, typography, colours, spacing, labels, controls and active navigation state.
3. Primary actions and back/return paths work; cross-member links preserve bookingId/groupId as agreed.
4. Loading/error/empty/disabled states are handled. Relevant permissions and invalid actions are tested.
5. TypeScript and lint pass according to AGENTS.md.
6. PR description lists PDF pages covered, Android screenshots, tested actions, dependencies and any prototype deviations.
7. M1 reviews the first representative screen early and reviews integration before merging into develop.

## 7. Instructions for AI-assisted implementation

Tell your AI your member number and exact PDF page(s). Supply those reference images and this document together with the existing member/function contracts. Require faithful reproduction, simple explainable code, error handling and no unauthorized shared-file changes. If a detail is unreadable or conflicts with the data contract, ask the leader instead of guessing.
