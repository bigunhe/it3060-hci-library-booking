# M3 — Active Session and Lifecycle

Branch: feature/m3-session

Feature folder: src/features/session/

Routes: /passes, /session/pass, /session/active,

/session/extend, /session/checkout, /session/completed

Read [AGENTS.md](http://AGENTS.md), [team-workflow.md](http://team-workflow.md) and [shared-contracts.md](http://shared-contracts.md) first.

## Responsibilities

- Display upcoming, active and past reservations.

- Display the confirmed booking's access pass and check-in deadline.

- Use the leader-approved QR payload.

- Observe staff check-in and show the active session.

- Calculate remaining time from stored timestamps.

- Show an ending-soon state and handover checklist.

- Offer one 15/30-minute extension when permitted.

- Show the resulting end time before confirming extension.

- Display the extended-session state.

- Complete early/normal checkout through the shared function.

- Display the completion receipt.

- Allow owner cancellation before check-in through the shared function.

Keep the extended state within the active-session screen where practical.

Do not duplicate an entire screen just to change a label.

## Boundaries

The pass button must not bypass staff authorization.

Do not store a countdown as the authoritative remaining time.

Do not mark an occupied room free just because its timer reaches zero.

Do not implement independent extension conflict checks or expiry writes.

In-app reminders should work first.

Background/closed-app notifications require separately approved setup;

document any scope deviation accurately.

## Meaningful data operations

Read and observe the owner's reservations.

Update endAt and extensionMinutes through the shared function.

Cancel a confirmed owner reservation.

Complete checkout and record its event through the shared function.

## Verification

Test pending-to-active transition, countdown after reopening,

valid/conflicting extension, extension limit, early checkout,

normal checkout, overstay and unauthorized booking access.

Verify room availability and staff views reflect checkout.

## Handoff

M1 provides bookingId after confirmation.

M2 activates that booking.

M3 manages the same reservation through completion.