# M3 session screens — implementation handoff

This batch implements Figma PDF pages 5–11 using the existing theme and booking data.
Stay on backup/m4-auth-groups for the leader's combined backup implementation.

## Included

- /passes: owner-only live bookings; Upcoming, Active and Past tabs; details/policy;
  expired status calculated from timestamps; previous booking entry and receipts.
- /session/pass: actual booking reference and local QR generated with the existing
  SLIIT-LIBRARY:1:<bookingId> payload; check-in deadline; owner cancellation;
  explicit cleanup action for a due expired hold/no-show.
- /session/active: countdown, ending-soon/overstay messages, room equipment,
  extension entry, actual extended state and checkout entry.
- /session/checkout: real remaining time, three handover confirmations, extension
  entry and atomic checkout. Supports early and late checkout.
- /session/extend: next-hour availability, +15/+30 options, new-end preview,
  one-extension limit, transaction recheck and owner overlap protection.
- /session/completed: actual receipt, recorded occupancy duration when available,
  return to passes and book another room.
- Confirmation now links to the same booking's access pass.

## Setup

Install the one new pure-JavaScript dependency:

    npx expo install qrcode-generator

Restart Expo after copying the route files. The restart regenerates typed routes.
No new native modules or security-rule changes are included.
Existing lifecycle rules must already be published for real cancellation,
extension and checkout. Do not loosen permissions if an action is denied.

## Preview and real lifecycle

A confirmed booking's pass has a 'Preview Session Screens' button. This only adds
preview=1 to the session route. The banner clearly labels the screen preview.
It allows inspection of active, extension, checklist and receipt layouts.
Preview never checks in, extends, checks out, or releases a booking.
For a not-yet-active booking, its countdown preview shows its booked duration.
Real countdowns use stored endAt minus current time and update every second.

Real session actions require staff activation of the same booking and matching
roomOccupancy. A student cannot authorize their own check-in. Zero remaining time
shows an overstay; the room is not released until checkout/staff release.

## Operations

All operations are in src/features/session/sessionOperations.ts.
Cancellation updates confirmed -> cancelled, deletes owned locks and writes its event.
Checkout updates active -> completed, sets checkedOutAt, deletes owned locks and
matching occupancy, and writes its event in one transaction.
Extension reads all four 15-minute blocks in the next hour, then claims only one
or two blocks. It updates endAt, extensionMinutes, occupancy and the audit event.
It also uses the existing booking guard and conflict helper for the owner's other
bookings. Original end time is retained. Repeat and late extensions fail visibly.

## Checks executed in the development container

- TypeScript passed, including declarations generated for actual routes.
- Expo lint passed, with no warnings in the submitted files.
- Android production JavaScript/Hermes bundle exported successfully.
- Independently decoded a generated QR and verified its exact reference payload.
- Eleven in-memory checks ran against the actual operation functions: 15/30 minute
  extension block counts, second-extension rejection, checkout release/history,
  conflict at minute 45, expired-hold reuse, cross-room owner overlap, wrong owner,
  cancellation, occupancy mismatch and invalid extension length.
- The harness also checks all transaction reads occur before writes.

These are not live Firebase security tests or Android emulator tests.

## Leader Android checks — record actual results

1. Sign in and open My Passes. Only the owner's reservations should appear.
2. Create/confirm a booking, then open its QR pass from confirmation.
3. Inspect the pass's room, roster count, full reference and grace deadline.
4. Tap Preview Session Screens. Open extension, choose 15/30 minutes and review
   the end time. Return, open checkout, check all three items, inspect receipt.
   Verify the booking remains confirmed and no occupancy/audit writes were made.
5. Cancel a second confirmed reservation and verify its slot becomes available.
6. Once M2 check-in is integrated, activate a real reservation as staff.
   The pass should enable Go to Active Session and the Active tab should update.
7. Extend once and verify the extended notice, end time and single-use limit.
   Check a conflicting next hour and an overlapping owner booking both fail.
8. Complete the checklist and checkout. Verify completed receipt, history retained,
   occupancy removed, all owned locks deleted and room availability refreshed.
9. Check sign-out, denied access, empty tabs, unavailable connection, expired pass
   and active overstay without automatic room release.

## Scope notes

Individual checklist answers are local UI state, not persisted inspection results.
The receipt does not invent historical 'conditions met' claims.
Ending-soon warnings are in-app; no background push notifications are configured.
No scheduled cleanup server exists; due reservations have an explicit cleanup action.
The QR is generated locally; manual reference fallback remains visible.
