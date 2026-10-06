# M4 — Authentication and Saved Groups

Branch: feature/m4-auth-groups

Feature folder: src/features/auth-groups/

Routes: /login, /groups, /groups/edit, /groups/details

Read [AGENTS.md](http://AGENTS.md), [team-workflow.md](http://team-workflow.md) and [shared-contracts.md](http://shared-contracts.md) first.

## Responsibilities

- Adapt the prototype login to Firebase email/password.

- Support sign-in, student registration and sign-out.

- Create the student profile using the shared UserProfile fields.

- Preserve login across reopening.

- Coordinate signed-in routing with the leader:

  students -> /rooms; staff -> /staff.

- List the signed-in owner's saved groups.

- Create, inspect, edit and delete saved groups.

- Validate 3–8 members and unique student IDs.

- Include the owner in the group roster.

- Support one default group per owner.

- Open /rooms with groupId when booking with a saved group.

Use fictional roster details for testing.

Roster student IDs do not imply those members have Firebase accounts.

## Boundaries

Use the existing Firebase connection and persistence setup.

Do not add SLIIT SSO or Google login.

Do not allow registration to select or write a staff role.

Staff accounts/roles are provisioned by the leader.

Do not edit the root index/layout without coordinating with the leader.

Do not rewrite booking rosters when a saved group changes.

Do not add authentication libraries without approval.

## Meaningful data operations

Create/read the student's profile.

Create, read, update and delete owner-scoped saved groups.

Update default-group selection consistently.

Deleting a saved group must not delete existing reservations.

Use a confirmation before deletion.

## Verification

Test correct/incorrect login, registration, duplicate email,

reopening, sign-out and role-based routing.

Test group creation/edit/deletion, default changes, invalid size

and duplicate IDs.

Verify another user cannot access or modify the owner's groups.

Verify the selected group reaches M1's booking journey.

## Prototype deviation

Real SLIIT SSO is unavailable to the team.

Firebase email/password provides a demonstrable authenticated workflow.

Document that it does not prove institutional student identity.