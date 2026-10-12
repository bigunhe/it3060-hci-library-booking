# Staff integration checkpoint

Base: backup/m4-auth-groups commit 63ae616, including M1, M4 and M3.
Staff source: feature/m2-staff commit db5cb2d, imported into integration/m2-staff.
The leader integrates the staff feature into the same app with role-based startup.

## Patch scope

Staff routes, staff helpers and one root Stack entry for staff (header hidden).
Student login, booking, groups, session screens and Firebase rules are preserved.
The existing staff transaction functions are retained; reference parsing now also
accepts a leading # and their check-in eligibility helper is available to the UI.

## Corrections

- Removed hard-coded dashboard room cards, counts, rosters and sample references.
- Removed verification's sample-details fallback without a loaded reservation.
- Dashboard listens to rooms, occupancy and bookings; status counters use actual data.
- Missed confirmed bookings are cleaned up on dashboard focus/refresh, with results shown.
- Verification supports full reference or the existing QR payload and requires an
  explicit authorization button; camera scanning never authorizes automatically.
- Camera is opt-in and stops when leaving verification. Manual lookup is the emulator
  test path; scanner needs a device/camera test.
- Details observe the actual booking, roster and audit timeline.
- Audit uses actual records and counts, date/status filters, and links to details.
- Overstay requires a matching active occupancy past its end time and an explicit
  physical-clearance checkbox before atomic release.
- All staff screens have sign-out; bottom navigation uses staff-only routes.
- Loading/error/empty states are explicit. No failed data request becomes a demo success.
- Removed the four lint errors and unused-variable warnings by using real data.
- Root staff Stack header is hidden so there is no duplicate navigation header.

## Dependencies

expo-camera ~57.0.6 and @expo/vector-icons ^15.0.2 were already installed by the
leader during the folder import. This ZIP does not overwrite package.json/lockfile.
Keep using Expo Go for this checkpoint. For a standalone APK, configure the camera
plugin/permissions through Expo app config and test the resulting build separately.

## Checks executed in the development container

TypeScript passed with generated route declarations. Expo lint passed without warnings.
Android/Hermes export passed. Eleven in-memory logic checks ran on the actual staff
functions and dashboard mapper: valid activation/event/occupancy; duplicate denial;
student denial; early/late check-in; occupied-room rejection; early release rejection;
overdue atomic release retaining history; reference/QR parsing; real room-state mapping;
and invalid/inactive status rejection. The harness rejects transaction reads after writes.
All source JSX was scanned for standalone same-line whitespace text nodes; none found.
These are not live Firebase security tests or Android runtime/camera tests.

## Mac / Firebase test sequence

1. Restart Expo after applying routes; run TypeScript and Expo lint.
2. Verify student login, room booking, groups and My Passes still work.
3. Use a separate Firebase account with an existing users/{uid} profile whose role is
   staff. Staff roles are assigned by the leader in Firebase Console, never in the app.
4. Student: confirm a future room reservation and copy its full 20-character reference.
5. Staff: sign in through the same login; startup should open /staff with staff tabs.
6. Enter the full reference in manual lookup. Before startAt, check-in stays blocked.
7. At startAt and within 15 minutes, inspect the roster and authorize. Verify booking
   status active, checkedInAt/checkedInBy, occupancy and checked_in event.
8. Student: sign in again; My Passes should show Active and the countdown should work.
9. Student: complete normal checkout. Staff: sign in and verify room occupancy clears,
   dashboard updates, and Details/Audit show completed status and recorded events.
10. Verify reused/invalid references and student access to staff actions are denied.
11. For overstay, use an actual due active reservation. Confirm physical clearance and
    release; check all its locks/occupancy are gone while history remains.

Do not alter booking times/statuses to imply that an unexecuted test passed.
No security-rule changes are needed if the existing shared lifecycle rules are published.
If a real action returns permission-denied, retain the error and inspect the rules.

## Known scope limits

CSV export and walk-in assignment are not implemented; no inactive controls pretend otherwise.
Full booking references are required for lookup; shortened card labels are display-only.
Local demo room data is not a verified institutional inventory.
No app feature grants staff privileges or removes booking/audit history.
