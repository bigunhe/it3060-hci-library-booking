# M1 — Booking and Availability

Branch: feature/m1-booking

Feature folder: src/features/booking/

Routes: /rooms, /booking/schedule, /booking/group, /booking/review

Read AGENTS.md, team-workflow.md and shared-contracts.md first.

## Responsibilities

- Discover rooms by date and level.

- Show availability for the selected time/date.

- Display room schedules and distinguish past, unavailable,

  held and available slots.

- Select a 60-minute slot and obtain a 5-minute hold.

- Select a saved group or enter a temporary booking roster.

- Validate unique student IDs, 3–8 members and room capacity.

- Review the reservation and remaining hold time.

- Confirm the held booking or cancel/release it.

- Open /session/pass with bookingId after successful confirmation.

Preserve a selected groupId received from saved groups.

Booking roster entry belongs to M1; persistent saved-group

management belongs to M4.

## Leader's shared responsibilities

Establish shared availability/locking data, transaction functions,

security rules, booking transitions, QR format and navigation integration.

These are foundation work before dependent live feature writes.

Do not implement booking conflict checks as query-then-addDoc.

Confirmation must fail visibly if a hold expired or ownership changed.

## Meaningful data operations

Read rooms, availability and saved groups.

Create a booking hold.

Update a held booking into a confirmed reservation.

Cancel/release a hold without deleting historical reservations.

## Optional innovation

Smart Room Match: filter rooms by group size, selected date/time

and actual availability. Explain the matching criteria.

Use ordinary filtering; do not describe it as AI.

Implement only after the core booking journey works.

## Verification

Test valid booking, invalid group size, duplicate members,

expired holds, cancellation and two users competing for one slot.

Verify cancelled/expired holds no longer block availability.

Verify confirmation opens the correct access pass.

## Handoff

M3 receives bookingId for a confirmed booking.

M2 must see that same reservation awaiting check-in.
## Final implementation agreement

Read function-contracts.md before coding. It specifies the operations you own.
Shared helpers are already supplied; do not duplicate them. Check-in, extension
and checkout/release must maintain roomOccupancy exactly as documented.
Only route placeholders exist for other member areas; replace your owned ones.
