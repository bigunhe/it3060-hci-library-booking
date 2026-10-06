This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch [https://docs.expo.dev/llms.txt](https://docs.expo.dev/llms.txt) — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.



## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: [https://docs.expo.dev/router/introduction.md](https://docs.expo.dev/router/introduction.md)



## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: [https://docs.expo.dev/eas/index.md](https://docs.expo.dev/eas/index.md)

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: [https://docs.expo.dev/versions/latest/index.md](https://docs.expo.dev/versions/latest/index.md)

---



## HCI Milestone 3 project rules

This is the SLIIT Library room reservation Android app.

Use React Native, TypeScript, Expo Router, Firebase Authentication,

and Cloud Firestore. Use npm and commit package-lock.json.

Prioritize simple, working code that each member can explain in a viva.

Use straightforward functions and React components.

Do not introduce a separate backend, dependency injection, generic

repository layers, or unrelated packages.

Android is the delivery target. Firebase email/password replaces

institutional SSO because the team has no access to SLIIT SSO.

Do not add Google login or describe this implementation as real SLIIT SSO.

## Ownership

- M1: src/features/booking/

- M2: src/features/staff/

- M3: src/features/session/

- M4: src/features/auth-groups/

- Leader: shared Firebase setup, types, navigation integration,

  security rules, dependencies, and project configuration.

Member route files in src/app must follow the route ownership documented

in docs/[shared-contracts.md](http://shared-contracts.md). Do not invent routes or alter another

member's files without coordinating with the leader.

Import the shared Firebase connection from src/lib/firebase.ts.

Use the shared models in src/types/models.ts.

Do not initialize another Firebase app or silently rename shared fields.

Before feature work, read:

- docs/[team-workflow.md](http://team-workflow.md)

- docs/[shared-contracts.md](http://shared-contracts.md)

- Your member task document in docs/

If required contracts or task documents are missing, ask the leader

before implementing dependent work.

## Git workflow

Foundation branch: chore/project-foundation

Integration branch: develop

Release branch: main

Member branches:

- feature/m1-booking

- feature/m2-staff

- feature/m3-session

- feature/m4-auth-groups

Create member branches from the leader-approved foundation on develop.

Work only on your assigned branch. Submit PRs into develop.

Never force push, including --force-with-lease.

Do not reset shared history, push directly to main/develop,

merge PRs, enable auto-merge, or change repository protections.

The leader manually reviews and merges PRs.

To update a feature branch, first commit your work, then fetch origin

and merge origin/develop. Do not rebase published branches.

If conflicts involve another member's code or shared contracts,

coordinate with the leader.

## Implementation and verification

Follow the final Figma screens and documented interaction flows.

Flows cross member boundaries; ownership does not mean separate apps.

Do not hard-code production room availability, booking results,

user roles, or successful QR verification.

Temporary test screens must be clearly identified.

Do not make Firestore publicly writable or allow users to grant

themselves staff privileges. UI visibility does not enforce permissions.

Never commit passwords, service-account keys, or real student records.

Firebase client configuration identifies the project; security rules

must control database access.

Run TypeScript and lint checks before submitting:

- npx tsc --noEmit

- npx expo lint

Test your feature on Android. Record actual test results and screenshots.

Never claim a test passed without running it.

Each PR must explain:

- What changed

- Which screens and requirements it covers

- What was tested and the results

- Remaining issues and any prototype deviations