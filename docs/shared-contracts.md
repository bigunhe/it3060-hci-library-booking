# Shared contracts — handoff baseline

Read this file, function-contracts.md and your member task before coding.
The source models and these final docs replace earlier chat instructions.

## Implemented versus pending

Implemented: Firebase connection and persistent email/password auth; room read;
60-minute hold creation; confirmation; held cancellation; basic booking screens;
slot-lock helper; QR payload/parser; availability subscription; expiry cleanup;
role-aware startup gate; permissions for documented transitions.

Android evidence reported by leader: persistent sign-in/sign-out, room read,
hold conflict, and confirmation. Other transition tests must be recorded separately.
Do not claim the other members' functions exist: they do not yet.
/login currently wraps a clearly labelled test screen. /staff, /passes and
/groups are route placeholders. They do not pretend to implement those features.

## Ownership and structure

Shared files are leader-owned: src/lib/, src/types/, root index.tsx and
_layout.tsx, Firebase rules, dependencies, project config and integration docs.
M1 owns src/features/booking/, /rooms and /booking/*.
M2 owns src/features/staff/ and /staff/*.
M3 owns src/features/session/, /passes and /session/*.
M4 owns src/features/auth-groups/, /login, /register and /groups/*.

Routes belong in src/app; non-route helpers belong in src/features or src/lib.
A screen can live directly in its route file; no extra wrapper is required.
Do not create a separate app/backend, another Firebase initialization, generic
repository classes or another navigation system.

## Routes

| Route | Owner | Params |
|---|---|---|
| / | Leader | Startup gate |
| /rooms | M1 | optional groupId, date |
| /booking/schedule | M1 | roomId, date |
| /booking/group | M1 | bookingId, optional groupId |
| /booking/review | M1 | bookingId, optional groupSize |
| /passes | M3 | none |
| /session/pass | M3 | bookingId |
| /session/active | M3 | bookingId |
| /session/extend | M3 | bookingId |
| /session/checkout | M3 | bookingId |
| /session/completed | M3 | bookingId |
| /login | M4 | none |
| /register | M4 | none |
| /groups | M4 | none |
| /groups/edit | M4 | optional groupId |
| /groups/details | M4 | groupId |
| /staff | M2 | none |
| /staff/verify | M2 | optional bookingId |
| /staff/details | M2 | bookingId |
| /staff/audit | M2 | optional bookingId |
| /staff/overstay | M2 | bookingId |

Only entry routes and current booking screens are present. Each member creates
remaining owned route files as needed. Restart Expo after creating routes so
TypeScript regenerates its route list. Do not bypass route errors with `as any`.
Pass IDs rather than full documents/rosters. Treat params as untrusted.

## Collections

| Collection | ID | Stored data |
|---|---|---|
| users | Auth UID | name, studentId, role, defaultGroupId |
| rooms | stable room ID | Room fields except id |
| groups | auto ID | SavedGroup fields except id |
| bookings | auto ID | Booking fields except id |
| slotLocks | roomId + '_' + block-start milliseconds | SlotLock fields |
| roomOccupancy | room ID | bookingId, endAt only |
| auditEvents | bookingId + '_' + action | bookingId, actorId, action, createdAt |

Use src/types/models.ts. Attach document ID as id on reads; never store it.
Students list bookings/groups with where('ownerId', '==', uid). Do not query
all private records and filter afterward. Staff can read all bookings/audit.
For a student's audit view, query only a known owned bookingId.
Room/lock/occupancy reads are public to signed-in users, without private rosters.
Staff roles are assigned only by the leader in Firebase Console.

## Fixed booking rules

- Group contains 3–8 members, within room capacity. Include the booking owner.
- Initial reservation is 60 minutes; hold lasts 5 minutes.
- Current basic screen supports starts at HH:00 or HH:30 in Asia/Colombo.
- Internal locks represent 15-minute blocks. They are not 15-minute bookings.
- Staff check-in window: startAt through checkInDeadline (start + 15 minutes).
- One extension, 15 or 30 minutes, before current endAt.
- Extension requires the entire next 60 minutes to be free, not only the added part.
- Timers derive from stored timestamps. Never store a countdown as authority.
- held -> confirmed -> active -> completed.
- held/confirmed can become cancelled or expired; active uses checkout/release.
- Booking/audit history is retained. Release deletes locks and occupancy only.

## Occupancy and expiry — keep these consistent

Staff check-in creates roomOccupancy/{roomId} in the same transaction as activation.
Extension updates its endAt. Checkout/staff release deletes it.
A room is overstaying when occupancy exists and endAt <= now; it is not free.
New holds are conservatively blocked for that room until clearance. Existing
future confirmed reservations stay in history; staff cannot activate another
booking until the existing occupancy record has been cleared.

Held locks whose holdExpiresAt has passed are reusable immediately. A background
server is not needed to release a hold. The old held booking record may remain
until owner/staff calls expireBooking; it must be displayed as expired by time.
Confirmed no-shows require expireBooking after checkInDeadline to release locks.
M2 runs due no-show cleanup on dashboard load/refresh. M3 can clean up an owner's
missed booking when viewing it. If neither app runs, no-show locks remain blocked.
This is an explicit prototype limitation: no scheduled background cleanup service.
Never expire an active session just because its end time passed.

## Cross-member handoffs

M4 sign-in/profile completion -> / (leader gate: student /rooms, staff /staff).
Missing profile -> /login; M4 must offer profile completion for that signed-in user.
M4 group Book action -> /rooms with groupId. M1 copies that group's name/roster
into the booking, keeping old booking rosters unchanged after group edits.
M1 confirmation -> /session/pass with bookingId after M3 implements that route.
Until then the existing confirmation screen shows its booking reference.
M2 changes that exact booking to active. M3 observes it with onSnapshot.
M3 checkout -> /session/completed. Availability updates from lock/occupancy changes.

QR payload: SLIIT-LIBRARY:1:<20-character booking ID>. Use bookingPass.ts.
No personal data in the code; staff fetches and validates the actual record.
Manual reference and QR lookup must call the same check-in operation.

## Limitations and evidence

Firebase email/password replaces unavailable SLIIT SSO; it does not verify
institutional identity. In-app reminders first; background notifications, walk-ins
and CSV export are optional only after the end-to-end flow works.
Use fictional demonstration names/IDs and no shared test passwords in Git.
No screen may simulate a successful backend operation. Record actual test results.
