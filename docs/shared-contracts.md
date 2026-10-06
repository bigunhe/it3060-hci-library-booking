# Shared contracts

## Current foundation

Verified on Android:

- Firebase email/password login
- Login persistence after reopening
- Sign-out
- Server read of rooms/room-02

src/app/index.tsx is a temporary connection test.

Firestore currently permits authenticated room reads only.

Feature writes are not enabled yet.

## Structure

Routes belong in src/app/.

Screen implementations and feature logic belong in src/features/.

A route can simply export its feature screen:

export { default } from '@/features/booking/RoomDiscoveryScreen';

Shared models: src/types/models.ts

Shared Firebase connection: src/lib/firebase.ts

## Routes and ownership

| Route | File under src/app | Owner | Screen |

|---|---|---|---|

| /login | login.tsx | M4 | Email/password login |

| /rooms | rooms.tsx | M1 | Room discovery |

| /booking/schedule | booking/schedule.tsx | M1 | Room schedule |

| /booking/group | booking/group.tsx | M1 | Group selection |

| /booking/review | booking/review.tsx | M1 | Review and confirm |

| /passes | passes.tsx | M3 | My reservations |

| /session/pass | session/pass.tsx | M3 | Digital access pass |

| /session/active | session/active.tsx | M3 | Active session |

| /session/extend | session/extend.tsx | M3 | Extension |

| /session/checkout | session/checkout.tsx | M3 | Handover checklist |

| /session/completed | session/completed.tsx | M3 | Completion receipt |

| /groups | groups/index.tsx | M4 | Saved groups |

| /groups/edit | groups/edit.tsx | M4 | Create/edit group |

| /groups/details | groups/details.tsx | M4 | Group details |

| /staff | staff/index.tsx | M2 | Staff dashboard |

| /staff/verify | staff/verify.tsx | M2 | QR/manual verification |

| /staff/audit | staff/audit.tsx | M2 | Audit log |

| /staff/overstay | staff/overstay.tsx | M2 | Resolve overstay |

| /staff/details | staff/details.tsx | M2 | Booking details |

Root index.tsx and _layout.tsx are leader-owned.

Do not create separate navigation systems or root layouts.

## Navigation parameters

Pass identifiers and a selected date, not entire objects or rosters.

Read authoritative records from Firestore.

- Room schedule: roomId, date (YYYY-MM-DD)
- Group selection and review: bookingId
- All session screens: bookingId
- Group details: groupId
- Group edit: groupId when editing; absent when creating
- Staff booking details and overstay: bookingId
- Staff verification: optional bookingId
- Room discovery: optional groupId, date
- Group selection: optional groupId

Treat all route parameters as untrusted input.

Handle missing records and unauthorized access visibly.

Example navigation:

router.push({

  pathname: '/session/pass',

  params: { bookingId },

});

## Main handoffs

Student login -> /rooms

Staff login -> /staff

M1 confirms a reservation -> /session/pass with bookingId.

M2 authorizes check-in -> the same booking becomes active.

M3 observes that booking and displays its active-session state.

M4's saved-group booking action -> /rooms with groupId.

M1 must preserve that groupId through schedule and group selection.

M1 copies the selected group's name and members into the booking.

Editing a saved group must not change an existing booking's roster.

Successful checkout -> /session/completed with bookingId.

Cancellation or expired hold -> return to discovery/schedule with

a clear explanation.

## Firestore records

| Collection | Document ID | Purpose |

|---|---|---|

| users | Firebase Auth UID | Name, student ID, student/staff role |

| rooms | Stable room ID, e.g. room-02 | Room details |

| groups | Generated ID | Owner's saved group |

| bookings | Generated ID | Reservation and lifecycle |

| auditEvents | Generated ID | Historical booking actions |

Use src/types/models.ts for field names.

Attach the Firestore document ID as id when reading.

Do not duplicate an id field in stored documents.

Staff roles are provisioned by the leader through the console.

Students must not be able to assign themselves staff roles.

## Booking rules

- Group size: 3–8, also within the room's capacity.
- Initial reservation: 60 minutes.
- Temporary hold: 5 minutes.
- Check-in deadline: 15 minutes after start.
- - One extension: 15 or 30 minutes.
   The entire next 60-minute period after the current endAt must
    have no blocking reservation or unexpired hold.
  - Recheck that full period inside the extension transaction.
  - Reserve only the chosen additional 15/30 minutes.
- Store timestamps; display dates/times in Asia/Colombo.
- Prototype dates, names and countdowns are examples, not live data.
- Owner cancellation is allowed before check-in.
- Once active, use checkout rather than cancellation.

Lifecycle:

held -> confirmed -> active -> completed

Alternative outcomes:

held -> cancelled or expired

confirmed -> cancelled or expired

Overstay means an active booking whose endAt has passed.

Do not automatically label an occupied room available.

## Availability and concurrency

Room availability depends on the selected time and blocking bookings.

Students must not receive other groups' private rosters just to see

availability.

The leader must establish shared availability/locking records,

transaction functions, and security rules before live booking,

check-in, extension, or release writes are implemented.

Do not prevent double booking with only a client-side query followed

by addDoc. Two clients could both see the same free time.

Do not independently invent booking locks, expiry processing,

QR tokens, audit writes, or status transitions. These cross features

and must use the leader-approved shared implementation.

A countdown display alone does not expire a database reservation.

An expired hold must stop blocking availability even if its app closes.

## Access-pass behaviour

A confirmed pass does not activate a reservation.

Only authorized staff check-in changes it to active.

The prototype's Go to Active Session button must check actual status.

Manual reference lookup and QR scanning must resolve the same booking.

A QR/reference lookup is not itself permission to authorize check-in.

QR payload and validation format will be defined by the leader.

## Verification

Test success, invalid input, missing records, access denial,

and relevant conflicts. Record real results.

Shared contracts are not permission to write to Firestore:

security rules and transaction handling must also be implemented.