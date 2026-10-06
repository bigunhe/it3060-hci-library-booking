# Team Git workflow

## Branches

- main: reviewed releases

- develop: integration

- chore/project-foundation: leader's initial setup

Member branches:

- feature/m1-booking

- feature/m2-staff

- feature/m3-session

- feature/m4-auth-groups

All member PRs target develop.

Only the leader reviews and merges PRs.

No direct pushes to main/develop.

No force pushes, including --force-with-lease.

No automatic PR merging.

## First-time setup

Wait until the leader confirms the foundation is merged into develop.

Accept the GitHub collaborator invitation.

Run commands individually:

git clone [https://github.com/bigunhe/it3060-hci-library-booking.git](https://github.com/bigunhe/it3060-hci-library-booking.git)

cd it3060-hci-library-booking

git switch develop

git pull --ff-only origin develop

Create your assigned branch. Example for M2:

git switch -c feature/m2-staff

Use your own branch name from the list above.

Do not create a separate Expo project or repository.

Install the recorded dependency versions:

npm ci

Read:

- [AGENTS.md](http://AGENTS.md)

- docs/[shared-contracts.md](http://shared-contracts.md)

- Your member task document

Run:

npx tsc --noEmit

npx expo lint

Run on an Android device or emulator:

npx expo start

Press a for a running Android emulator.

On a physical phone, open the project using a compatible Expo Go version.

If Expo's interactive progress logging crashes:

CI=1 npx expo start --android --clear

Report SDK/version mismatch errors to the leader.

Do not independently upgrade Expo or replace dependencies.

## While developing

Check your branch:

git branch --show-current

Work in your assigned feature folder and route files.

Coordinate changes to shared files with the leader.

Do not commit:

- node_modules or generated builds

- passwords or service-account keys

- real student data

Use synthetic test group members.

Do not use another member's test account.

## Commit and push

Save files, then run:

npx tsc --noEmit

npx expo lint

git status --short

git diff

Stage intended files by their exact paths:

git add <file-paths>

Review:

git diff --cached

git diff --cached --check

Commit:

git commit -m "Describe the feature change"

First push, example for M2:

git push -u origin feature/m2-staff

Later pushes:

git push

Replace placeholders with actual paths.

If a push is rejected, stop and inspect the reason.

Never solve a rejection with a force push.

## Update from develop

First commit your current work.

Do not merge with uncommitted changes.

While on your feature branch:

git fetch origin

git merge origin/develop

This brings the integrated code into your feature branch without

rewriting published history.

If conflicts occur:

- Resolve only changes you understand.

- Coordinate shared or other-member changes with the leader.

- Do not blindly accept all incoming/current changes.

- Use git merge --abort if you need to return to the pre-merge state.

After resolving a merge:

npx tsc --noEmit

npx expo lint

Test your feature again, then push normally.

## Open a PR

On GitHub:

- Base: develop

- Compare: your feature branch

- Request review from bigunhe

Include:

- Implemented screens and behaviour

- Requirements and meaningful CRUD operations covered

- Actual checks and Android test results

- Screenshots of the working feature

- Known issues and prototype deviations

- Shared files/dependencies changed, with reasons

Keep PRs small enough to review.

Do not claim mocked behaviour is a completed backend feature.

Do not merge your own PR.

An AI assistant must not push or create a PR unless the member

explicitly instructs it to do so.

## After merging

The leader announces integrated changes.

Other members fetch and merge origin/develop before depending on them.

When continuing the same feature branch, merge origin/develop first.

Do not delete branches containing unmerged work.

## Evidence for the report and viva

Record tests as you implement:

- Scenario and expected result

- Actual result and pass/fail

- Device/emulator used

- Screenshot where useful

- Issue found and fix

Each member must understand and explain their own code.

Use AI assistance as support, and review generated changes yourself.