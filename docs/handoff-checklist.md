# Leader handoff and integration checklist

## Apply and verify this batch

1. Apply the full patch with its installer, not pieces of functions.
2. Publish the entire resulting firestore.rules once in Firebase Console.
3. Restart the existing Expo server so new routes get typed declarations.
4. Run npx tsc --noEmit and npx expo lint on the actual Mac project.
5. Recheck hold/confirm, same-slot rejection, held cancellation/reuse and sign-out.
6. Root may send existing profile-less accounts to the temporary login route.
   Use its clearly labelled Continue to rooms button for setup verification.
   M4 replaces this test screen with real missing-profile completion.
7. These are newly implemented permissions, not a claim that every lifecycle UI exists.

## Staff setup

Leader creates a separate email/password account in Firebase Auth and its
users/{uid} profile in Console: name, studentId, role='staff', defaultGroupId=null.
No registration form can assign staff. Do not put the password in Git/docs.
Students create profiles through M4's form. Until that form exists, use Console
with role='student' for leader test profiles. Do not manually create occupancy
records for normal operations; check-in writes them atomically.

## Merge foundation

Commit intended source/docs/rules files on chore/project-foundation; keep backup
files out. Push that branch and open a PR into develop. Inspect the diff and
checks manually, then merge when ready. Do not force push or enable auto-merge.
Tell members the approved develop commit and their assigned branch/task file.
All create branches from that develop commit, not from the old empty scaffold.

## GitHub protection

For main and develop, require PRs, block force pushes and branch deletion, and
require leader review. Configure CODEOWNERS review for shared files. Verify the
ruleset applies to collaborators; do not assume a Markdown instruction enforces it.
For leader-authored PRs GitHub cannot count self-approval: retain manual inspection,
and arrange a teammate review if protection requires an approval.

## Integration proof

- Student login/profile, own-group CRUD, default group deletion.
- M1 copied roster unchanged after saved-group edit.
- Two different users competing for same time: only one hold succeeds.
- Expired hold reuse; old owner cannot delete replacement owner's locks.
- Confirmation -> correct pass; no pass button bypasses staff check-in.
- Student check-in/staff-release/role escalation rejected.
- Staff check-in -> same booking observed active by M3.
- 15-minute extension rejected if a conflict exists later in the NEXT HOUR.
- Valid 15/30 extension updates booking, occupancy, locks and audit together.
- Second extension and extension after endAt rejected.
- Checkout releases room, keeps booking/audit history.
- Overstay remains occupied until checkout/staff clearance.
- Missed check-in cleanup releases locks; active booking never auto-expires.

## Timing target, not a promise

Oct 6: foundation merged; members start; first functional PRs as soon as possible.
Oct 7: member features integrated, Android flow tested, APK build attempted early.
Oct 8: report/usability evidence and buffer for fixes. Do not leave integration
until all UI polish is done. A working connected flow takes priority.

## Report deviations

Email/password replaces unavailable SSO. No scheduled server-side no-show cleanup;
owner/staff app performs it. In-app reminders rather than closed-app notification
service. Walk-ins/CSV only if implemented; never show inactive controls as completed.
Map each member's meaningful data operations to the exact milestone rubric.
Keep receipt/countdown screens meaningful instead of forcing artificial CRUD.
