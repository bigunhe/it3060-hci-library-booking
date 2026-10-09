# M1 booking UI: changes and integration

## Included

- PDF pages 1–4: Room Discovery, Schedule, Group Configuration, Review/Confirm.
- Real Firebase rooms/availability. Existing booking transactions and rules unchanged.
- Saved-group selection (including incoming groupId/default group) and manual roster entry.
- StudentNavigation: Rooms / My Passes / Groups, currently used on Rooms.
- Components now live in components/ui; constants/ui contains compatibility re-exports.
- BookingDraftProvider keeps form data between Group and Review, without names in URLs. Reopening/reloading may require group re-entry while the hold is still valid.
- Root layout hides headers only for Rooms and Booking.

## Explicit limitations / integration tasks

1. Demo timetable: hourly 60-minute sessions, 08:30–17:30 Sri Lankan time. This is not verified SLIIT opening hours. Adjust bookingDisplay.ts when agreed. No holiday/closed-day configuration.
2. Other dates use a YYYY-MM-DD field alongside the date strip, avoiding a new dependency.
3. New Group on the booking page creates a temporary reservation roster. It does not save a reusable group or open M4's editor yet. Existing saved groups are loaded. This temporary cross-feature deviation needs integration with M4 later.
4. Confirmation shows the saved reference, then View My Passes opens /passes. Once M3 supplies /session/pass, change that button to router.replace({ pathname: '/session/pass', params: { bookingId } }) with label View Access Pass. QR issuance is not implemented by this batch.
5. Passes and Groups remain placeholders until member code is merged. No member-owned screens were overwritten.
6. Navigation uses text labels/selected indicators; reference icons and final visual spacing remain polish. M3/M4 may use StudentNavigation with their active label inside their safe-area screens. Do not render it twice.
7. Smart Room Match is not included. Room filtering currently uses date and level.
8. Palette follows the report. Font uses the system fallback; pixel-perfect matching is not claimed.
9. Android hardware Back leaves a hold until its five-minute expiry. Explicit Cancel & Release cancels immediately.

## Checks performed on supplied source copy

TypeScript and Expo lint passed, including a TypeScript rerun after Expo route generation.
Nine date/slot assertions passed: Sri Lankan date rollover, date validity, slot duration, overlap, adjacency and overstay blocking.
Android rendering and live Firebase writes have NOT been tested here; verify on the leader's emulator.

## Android smoke test

1. Sign in as a student with a matching users/{uid} profile.
2. Rooms: choose the seeded room's level and tomorrow's date.
3. Schedule: select a free slot, then Continue to Group Setup.
4. Owner is included. Add two distinct demo members, a group name and optional purpose.
5. Review: check room/date/time/roster and the decreasing hold timer.
6. Confirm: verify confirmation reference and Firestore status=confirmed.
7. Create a separate hold and cancel. Its slot should become selectable again.
8. The confirmed slot must stay unavailable.
9. Capture actual errors; do not relax permissions to hide them.

## Integration

Read docs/design/shared-ui.md and screen-map.md. Coordinate root layout changes with M1.
Keep compatibility re-exports until teammates update old imports. Shared rules/schema/functions were not changed.
