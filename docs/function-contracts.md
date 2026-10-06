# Function contracts — implement exactly these operations

M1 provides shared functions and permissions. M2/M3/M4 implement the operations
below in their own feature files, not in src/lib. No duplicate models/Firebase apps.

## Existing shared exports

- src/lib/bookings.ts: createBookingHold(roomId: string, startAt: Timestamp): Promise<string>;
  confirmBooking(bookingId: string, groupName: string, members: GroupMember[], purpose: string): Promise<void>.
- src/lib/cancelBookingHold.ts: cancelBookingHold(bookingId: string): Promise<void> (held only).
- src/lib/bookingLocks.ts: readOwnedBookingLocks(transaction, bookingId, booking): Promise<DocumentReference[]>.
- src/lib/slotLocks.ts: getSlotLockIds(roomId, startAt, endAt): string[].
- src/lib/bookingPass.ts: createPassPayload(bookingId): string; readPassPayload(payload): string.
- src/lib/expireBooking.ts: expireBooking(bookingId: string): Promise<void> (owner/staff due cleanup).
- src/lib/availability.ts: subscribeRoomAvailability(roomId, startAt, endAt, onChange, onError): () => void.
  Callback receives {blockedStarts: number[], overstaying: boolean}. Keep loading until
  the first callback; show an error if onError fires. Call the returned cleanup from
  useEffect. A candidate 60-minute start is available only if all four blocks are
  absent from blockedStarts and overstaying is false. A preview never reserves a slot.

## Rules for every transaction

Require auth.currentUser. Generate event references outside the callback; timestamps
inside it after reads. Read all necessary docs before any writes. Firestore may retry:
no navigation, alerts, setState or external side effects inside the callback.
Use runTransaction, update existing booking, preserve all undocumented fields,
write the event atomically, return only after success. Throw readable errors.
Screens disable repeat presses while awaiting and show errors next to the action.
Never swallow an error or return fake success. Rules independently validate writes.

Audit fields: bookingId, actorId=current UID, action, createdAt=Timestamp.now().
ID: `${bookingId}_${action}`. Create once; never edit/delete audit records.

## M2: src/features/staff/staffOperations.ts

### checkInBooking(bookingId: string): Promise<void>

1. Read booking, current user's profile, roomOccupancy/{roomId}.
2. Require role staff, booking confirmed, now >= startAt and now <= checkInDeadline.
3. Require no occupancy record: another session must be cleared first.
4. Update status active, checkedInAt=now, checkedInBy=current UID.
5. Set roomOccupancy/{roomId} to {bookingId, endAt: booking.endAt}.
6. Create auditEvents/{bookingId}_checked_in. Leave slot locks unchanged.

### forceReleaseBooking(bookingId: string): Promise<void>

1. Read booking, staff profile, occupancy, and readOwnedBookingLocks before writes.
2. Require staff, booking active, now >= endAt, occupancy bookingId matches.
3. After staff confirms physical clearance: status completed, checkedOutAt=now.
4. Delete owned locks and roomOccupancy/{roomId}.
5. Create auditEvents/{bookingId}_force_released.

Dashboard refresh reads staff-visible bookings. For confirmed records whose
checkInDeadline has passed, call shared expireBooking sequentially, handle each
failure, then refresh. Do not call cleanup inside rendering or make a retry loop.

## M3: src/features/session/sessionOperations.ts

### cancelReservation(bookingId: string): Promise<void>

Require owner and status confirmed. Read owned locks, then status cancelled,
delete those locks, create event cancelled. Do not delete room occupancy or history.
This function does not replace cancelBookingHold, and does not cancel active sessions.

### checkoutBooking(bookingId: string): Promise<void>

Require owner and status active. Read booking, occupancy and owned locks. Require
occupancy bookingId matches. Screen requires handover checklist confirmation.
Update status completed, checkedOutAt=now; delete locks and occupancy; event checked_out.
Checkout may be early, on time, or after endAt; late checkout clears overstay.

### extendBooking(bookingId: string, minutes: 15 | 30): Promise<void>

1. Validate minutes is 15 or 30. Require owner, active, extensionMinutes=0, now < endAt.
2. Read occupancy; require same bookingId and matching current endAt.
3. Compute eligibility end = current endAt + 60 minutes.
4. Get the four eligibility IDs using getSlotLockIds(roomId, current endAt, eligibilityEnd).
5. Read ALL FOUR locks in this transaction. Missing or expired held locks are free.
   A reserved lock or an unexpired hold anywhere in that hour rejects extension.
6. Set newEnd = current endAt + minutes. Claim only the first 1/2 eligibility locks.
   Each stored lock is {bookingId, roomId, startAt, endAt=start+15m,
   state:'reserved', holdExpiresAt:null}; overwrite only expired holds.
7. Update booking endAt=newEnd and extensionMinutes=minutes. Preserve originalEndAt.
8. Update occupancy endAt=newEnd. Create event extended in the same transaction.
9. A second extension, late request or conflicting hour must fail visibly.

The locked hour must be checked even for a 15-minute extension. Do not check only
one block, and do not reserve all 60 minutes when extending only 15/30 minutes.

Observe the owner's booking with onSnapshot. Countdown uses stored endAt minus
current time. Timer reaching zero displays overstay; it does not clear the room.
On an owner's due confirmed no-show, use shared expireBooking and show the result.

## M4: src/features/auth-groups/groupOperations.ts

- createGroup(name: string, members: GroupMember[]): Promise<string>
- updateGroup(groupId: string, name: string, members: GroupMember[]): Promise<void>
- deleteGroup(groupId: string): Promise<void>
- setDefaultGroup(groupId: string): Promise<void>

Use profile-group-contract.md. Validate trimmed names, 3–8 members, normalized
unique student IDs. Require owner. createdAt=serverTimestamp() only on creation.
Update only name/members. Delete via a transaction reading group/profile; clear
profile defaultGroupId if it points to this group, then delete the group.
A default group is a profile pointer, never an isDefault field on each group.
Firebase Auth registration must create role student. Existing accounts without a
profile need a retry/completion form, not another createUser call.

## First PRs and completion

M2: checkInBooking + working manual lookup + due no-show cleanup.
M3: reservation/pass read + checkoutBooking; then cancellation and extension.
M4: login/profile completion + group CRUD; then default selection/group handoff.

Include Android evidence and denied scenarios. No force pushes or self-merges.
These permissions are implemented, but a member's operation is not considered
complete until its actual function and security behavior have been tested.
