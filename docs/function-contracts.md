# Feature function contracts

This document takes precedence over earlier task-document wording that

assigns all lifecycle implementations to the leader.

## Ownership

M1 supplies shared data definitions, booking locks, hold creation,

confirmation, hold cancellation, availability, security rules,

startup integration and this contract.

M2 implements staff operations and their screens.

M3 implements student reservation lifecycle operations and their screens.

M4 implements authentication/profile/group operations and their screens.

Members must not rename shared fields, routes or these functions.

Shared security-rule changes are coordinated with the leader.

## Existing functions — do not duplicate

src/lib/bookings.ts:

- createBookingHold(roomId, startAt): Promise<string>

- confirmBooking(bookingId, groupName, members, purpose): Promise<void>

src/lib/cancelBookingHold.ts:

- cancelBookingHold(bookingId): Promise<void>

- Applies only to held bookings.

src/lib/bookingLocks.ts:

- readOwnedBookingLocks(transaction, bookingId, booking)

- Returns lock references owned by the booking.

- Perform this read before any transaction writes.

- Never delete another booking's locks.

src/lib/bookingPass.ts:

- createPassPayload(bookingId): string

- readPassPayload(payload): string

## M2 implementation file

src/features/staff/staffOperations.ts

Required exports:

checkInBooking(bookingId: string): Promise<void>

- Require a signed-in staff user.

- Read the booking and staff profile in a transaction.

- Require status confirmed.

- Require current time >= startAt and <= checkInDeadline.

- Change status to active.

- Set checkedInAt and checkedInBy.

- Leave time locks intact.

- Write auditEvents/{bookingId}_checked_in.

- Duplicate or invalid check-in must fail.

forceReleaseBooking(bookingId: string): Promise<void>

- Require a signed-in staff user.

- Require status active and current time >= endAt.

- Read owned locks before writing.

- Change status to completed and set checkedOutAt.

- Delete owned locks.

- Write auditEvents/{bookingId}_force_released.

- Release only after staff physically confirms room clearance.

## M3 implementation file

src/features/session/sessionOperations.ts

Required exports:

cancelReservation(bookingId: string): Promise<void>

- Require the booking owner.

- Require status confirmed.

- Read owned locks before writing.

- Change status to cancelled.

- Delete owned locks.

- Write auditEvents/{bookingId}_cancelled.

- Active sessions use checkout, not cancellation.

checkoutBooking(bookingId: string): Promise<void>

- Require the booking owner and status active.

- Screen must require completion of the handover checklist.

- Read owned locks before writing.

- Change status to completed and set checkedOutAt.

- Delete owned locks.

- Write auditEvents/{bookingId}_checked_out.

extendBooking(

  bookingId: string,

  minutes: 15 | 30

): Promise<void>

- Require the booking owner and status active.

- Require extensionMinutes == 0 and current time < endAt.

- Check the ENTIRE next 60 minutes beginning at current endAt.

- Any reserved lock or unexpired hold in that hour blocks extension.

- Read all eligibility locks inside the transaction.

- Claim only the chosen additional 15/30 minutes.

- Additional locks use state reserved and holdExpiresAt null.

- Update endAt and extensionMinutes.

- Preserve originalEndAt.

- Write auditEvents/{bookingId}_extended.

- Never rely only on an earlier screen availability check.

## Audit events

Each operation must write its event in the same transaction.

Fields:

- bookingId

- actorId: signed-in user's UID

- action: corresponding shared AuditEvent action

- createdAt: Timestamp

Use the deterministic IDs specified above.

Do not update/delete existing audit events.

Generate timestamps inside the transaction callback.

## Transaction requirements

Read all needed documents before any writes.

Do not perform navigation, setState or alerts inside a transaction.

Firestore may rerun its callback.

Update the booking, relevant locks and audit event atomically.

Return only after success.

Throw readable errors; screens catch and display them.

Security rules must authorize each operation independently.

An operation is not complete until its permissions are published

and allowed/denied scenarios have been tested.

## Screen connections

M1 confirms -> /session/pass with bookingId.

M3 displays a confirmed pass without activating it.

M2 check-in changes the existing booking to active.

M3 observes that booking with onSnapshot.

M3 checkout and M2 staff release preserve the booking history.

M1 availability observes slotLocks, not private booking rosters.

## M4 implementation file

src/features/auth-groups/groupOperations.ts

Required exports:

createGroup(name: string, members: GroupMember[]): Promise<string>

updateGroup(groupId: string, name: string, members: GroupMember[]): Promise<void>

deleteGroup(groupId: string): Promise<void>

setDefaultGroup(groupId: string): Promise<void>

- Require a signed-in owner.

- Validate names, unique normalized student IDs and 3–8 members.

- Use the shared SavedGroup fields.

- Never change another user's group.

- Editing/deleting a group must not change existing bookings.

- Default-group coordination must follow the leader's final

  profile/group contract; do not invent independent storage.

Authentication uses the existing auth connection.

Student registration must never grant the staff role.

## First integration PRs

M2: check-in operation and minimal verification interaction.

M3: checkout operation and minimal checkout interaction.

M4: create/read/edit/delete owner-scoped groups.

Include actual Android test results.

Leader reviews and merges; members never merge or force push.

## Remaining foundation dependencies

Lifecycle permissions, profile/group permissions, final default-group

storage, availability/expiry handling and startup routing are still pending.

Do not treat this document as evidence those dependencies are implemented.