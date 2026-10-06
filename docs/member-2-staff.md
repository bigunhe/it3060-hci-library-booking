# M2 — Staff Operations

Branch: feature/m2-staff

Feature folder: src/features/staff/

Routes: /staff, /staff/verify, /staff/audit,

/staff/overstay, /staff/details

Read AGENTS.md, team-workflow.md and shared-contracts.md first.

## Responsibilities

- Build the staff room dashboard.

- Display available, pending, active and overstay states.

- Look up a reservation using its reference.

- Add QR scanning using the leader-approved payload format.

- Display booking details and roster before authorization.

- Authorize valid check-in through your checkInBooking operation.

- Explain invalid, cancelled, expired and already-used passes.

- Display audit events and booking details.

- Resolve overstay using your forceReleaseBooking operation.

- Add date/status filters to the audit view.

Manual lookup should work before camera scanning.

Manual and QR lookup must validate the same booking.

Scanning a code does not automatically authorize check-in.

## Boundaries

Do not grant staff roles from the app.

Do not invent QR tokens, booking statuses or transaction rules.

Do not edit M3's session screens.

Do not delete audit history.

Use synthetic demonstration data only when clearly labelled.

Never simulate a successful authorization as live functionality.

Walk-in assignment and CSV export appear in the prototype.

Implement after the core staff flow if time permits; otherwise

document the deviation and avoid presenting inactive controls as working.

## Meaningful data operations

Read room states, reservations and audit records.

Update a confirmed booking to active.

Update an occupied booking through authorized staff release.

Record action events using the shared transaction implementation.

## Verification

Test valid check-in, invalid reference, duplicate check-in,

missed grace deadline and student access denial.

Verify M3 sees staff authorization without a duplicate booking.

Verify staff release and its audit event.

## Handoff

Authorize the existing booking, not a new reservation.

Its bookingId and active status are consumed by M3.
## Final implementation agreement

Read function-contracts.md before coding. It specifies the operations you own.
Shared helpers are already supplied; do not duplicate them. Check-in, extension
and checkout/release must maintain roomOccupancy exactly as documented.
Only route placeholders exist for other member areas; replace your owned ones.
