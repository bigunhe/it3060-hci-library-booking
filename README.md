# SLIIT Library Booking — HCI Milestone 3

Android app using Expo 57, React Native, TypeScript, Firebase Auth and Firestore.
Deadline priority: a small, working, explainable app with integrated member features.

Start with [shared contracts](docs/shared-contracts.md), [function contracts](docs/function-contracts.md),
[team workflow](docs/team-workflow.md), and your member task document.
Leader: [handoff checklist](docs/handoff-checklist.md).

```bash
npm ci
npx expo start --android
```

In a second terminal:

```bash
npx tsc --noEmit
npx expo lint
```

Start Expo once after new route files are added so route types regenerate.
One server, one running emulator. An Android physical phone with compatible Expo Go
can also test. Current staff/session/groups routes are placeholders for assigned members.

Firebase project: sliit-library-booking. Leader publishes firestore.rules via Console.
Email/password replaces inaccessible SLIIT SSO. Staff profiles are provisioned in Console.
No passwords, admin keys or real student records in this public repository.

Each member works on their assigned feature branch and submits a PR into develop.
Leader reviews/merges manually. Never force push or directly push main/develop.

M1: Booking & Availability + shared setup/integration.
M2: Staff Operations. M3: Active Session/Lifecycle. M4: Authentication & Saved Groups.
