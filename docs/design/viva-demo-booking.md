# Explicit viva/demo booking mode

## Purpose

Create a real booking for demonstration at any current time, including outside the
normal displayed timetable. Staff activation and student checkout use the actual
existing operations and write real booking, lock, occupancy and audit records.
This is labelled demo mode, not normal library booking policy or production evidence.

## Firestore setup

Publish the entire updated firestore.rules file supplied in this patch.
In Firebase Console -> Firestore Database -> Data, create:

- Collection: settings
- Document ID: vivaDemo
- Field: enabled
- Field type: boolean
- Field value: true

No room documents or manual booking time slots need to be added.
All signed-in clients can read this setting; no client can write it.
The console-controlled setting gates creation of new demo bookings.
After the viva, set enabled to false. This hides demo buttons and prevents new demos.
Existing labelled records remain visible in history.

## App behavior

With the setting enabled, every enabled room card has Start Viva Demo · Now.
The button always uses today's current time, regardless of the selected schedule date.
It starts the normal five-minute hold and opens Group Configuration.
Group capacity, unique student IDs, ownership, room conflicts and account overlaps
still apply. An occupied room cannot start another demo.

The lock interval begins at the current 15-minute boundary. For example, a demo
created at 18:17 uses the 18:15–19:15 interval, even outside opening hours. Its fresh
check-in deadline is 18:32, fifteen minutes after actual creation. These deliberate
demo timing differences are validated independently in Firestore security rules.
The session timer uses the real stored end time. Remaining time is therefore about
45–60 minutes, not a simulated/accelerated clock. Early checkout can be demonstrated
immediately after activation without waiting for the timer to reach zero.

Only demo bookings store demo: true. Normal bookings keep their existing future-start
and confirmation restrictions. Old normal records need no migration.
The flag cannot be added/removed during confirmation or lifecycle updates.
Labels identify demos in booking, pass, session, staff and receipt/history views.

## Viva journey

1. Student: choose a free room -> Start Viva Demo · Now.
2. Select a valid saved group (or enter 3–8 members within room capacity).
3. Review and confirm before the five-minute hold expires.
4. Open the actual pass. Copy its FULL 20-character booking reference.
5. Sign out; sign in with the staff account.
6. Staff Scanner -> enter full reference -> Look Up Reservation -> inspect roster
   -> Authorize Check-In. It is immediately eligible during its fresh deadline.
7. Show active booking, roomOccupancy and checked_in audit event in Firestore.
8. Sign out; sign in as the booking owner. My Passes -> Active -> countdown.
9. Complete handover checklist -> checkout. The booking becomes completed,
   occupancy/owned locks disappear, and the checked_out event is retained.
10. To repeat, cancel a previous confirmed demo or check out its active session first.

No staff authorization is simulated or performed by the student demo button.
Unconfirmed holds expire after five minutes. Confirmed no-shows have a fifteen-minute
window; existing owner/staff cleanup releases their locks afterward.

## Camera

The emulator's VirtualScene camera shows a generated room, not a real camera feed.
Use manual full-reference lookup for the simplest emulator demo. Camera QR testing
can use a real Android phone or a QR image imported into the emulator's virtual scene.
No fake CAMERA ACTIVE or automatic authorization state is introduced.

## Validation executed in the development container

- TypeScript and Expo lint passed.
- Android/Hermes export passed.
- Fourteen Firestore emulator checks executed against the actual app operations and
  updated rules: missing/disabled setting; denied client setting writes; gated demo
  creation; four locks; owner overlap rejection; immediate confirmation; student
  authorization rejection; staff activation/occupancy/event; duplicate rejection;
  occupied-room rejection; early checkout/history; stale interval rejection; normal
  past-start rejection; and normal future booking with demo mode disabled.

The emulator test uses isolated synthetic accounts and an isolated local database.
It does not publish rules or change the actual Firebase project.
The Mac/Android UI and real project still need the above walkthrough after setup.
