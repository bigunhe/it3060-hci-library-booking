# Team workflow

## Branches and ownership

main = release. develop = reviewed integration. chore/project-foundation = leader setup.
Every feature PR targets develop. Only bigunhe manually reviews and merges.
No direct main/develop pushes, force pushes (including --force-with-lease),
published-branch rebases, auto-merge or deleting unmerged work.

| Member | Branch |
|---|---|
| M1 | feature/m1-booking |
| M2 | feature/m2-staff |
| M3 | feature/m3-session |
| M4 | feature/m4-auth-groups |

## First setup — after leader merges foundation into develop

Accept the collaborator invitation. Do not create another Expo project.

```bash
git clone https://github.com/bigunhe/it3060-hci-library-booking.git
cd it3060-hci-library-booking
git switch develop
git pull --ff-only origin develop
git switch -c feature/m2-staff
npm ci
```

Replace the example branch with your assigned branch. npm ci installs the committed
lockfile versions. Read AGENTS.md, shared-contracts.md, function-contracts.md,
your member file and profile-group-contract.md if M4. Use one feature branch.

```bash
npx expo start --android
```

Expo must start after new route files are created, before route typechecking.
Use one Expo server. Run Git/check commands in a second terminal.
CI=1 disables file watching; use normal mode. If CI mode is needed to avoid a
specific CLI crash, restart the server after edits rather than expecting hot reload.
Report dependency/SDK errors; do not independently upgrade the project.

## Before a commit/PR

```bash
git branch --show-current
npx tsc --noEmit
npx expo lint
git status --short
git diff
```

Stage intended paths, not all unrelated edits. Example M2:

```bash
git add src/features/staff src/app/staff
git diff --cached
git commit -m "Implement staff check-in and manual lookup"
git push -u origin feature/m2-staff
```

Later pushes use git push. A rejection is not permission to force push.
On GitHub create a PR with base develop and your branch as compare; request bigunhe.
Describe behavior, actual checks/Android results, screenshots, requirements/CRUD,
shared-file changes, known gaps and prototype deviations. Never merge your own PR.
An AI must not push/create a PR unless its member explicitly instructs it.

## Updating your branch

Commit your work first, then on your feature branch:

```bash
git fetch origin
git merge origin/develop
```

Resolve only conflicts you understand. Shared/other-member conflicts go to the
leader. git merge --abort cancels an unfinished merge. After resolution run checks,
test Android, and push normally. Do not rebase shared history.

## Shared changes and tests

Leader owns config/rules/models/src/lib/root navigation. Members propose needed
shared changes in their PR or coordinate first; no surprise field/route renames.
Use fictional rosters and separate accounts. No passwords, service-account keys,
real student records, node_modules or build outputs in commits.
Firebase client config is not a staff credential; permissions are enforced by rules.
Record expected/actual results, device, screenshots and fixes for report/viva.
Do not claim tests passed unless executed.

## Leader integration

Review diff and evidence before merging; smoke-test connected behavior:
M4 login -> M1 hold/confirm -> M3 pass -> M2 check-in -> M3 extension/checkout -> M2 audit.
Merge to develop only after checks. Others fetch/merge develop after each relevant PR.
Release through a reviewed develop -> main PR after end-to-end Android testing.
