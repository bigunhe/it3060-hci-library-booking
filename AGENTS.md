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

Android only. Use existing Expo/React Native/TypeScript/Router/Firebase/npm setup.
Keep code minimal and explainable. No separate backend, repository/service classes,
dependency injection or unrelated packages. Ignore Lab 6.
Email/password replaces unavailable SLIIT SSO; no Google login or fake SSO claims.

Read docs/shared-contracts.md, docs/function-contracts.md, docs/team-workflow.md
and your assigned docs/member-N-*.md before coding. M4 also reads
profile-group-contract.md. These final documents supersede earlier chat contracts.

Ownership: M1 src/features/booking and booking routes; M2 staff folder/routes;
M3 session folder/routes and passes; M4 auth-groups folder/login/register/groups.
Leader owns src/lib, src/types, root index/layout, rules, config/dependencies/docs.
Coordinate shared changes before editing. Reuse the existing Firebase instance,
models, QR payload and locks. Do not rename fields/statuses/functions or create
independent implementations of shared helpers. Keep occupancy updates atomic.

Branches: chore/project-foundation -> develop; feature/m1-booking,
feature/m2-staff, feature/m3-session, feature/m4-auth-groups -> develop; release main.
Never force push (including --force-with-lease), rebase published history,
push directly to main/develop, merge a PR, enable auto-merge or change protections.
Leader manually reviews and merges. Commit work before merging origin/develop.
An AI must not push/create a PR unless its member explicitly instructs it.

Run typecheck and lint and report actual Android test results. Never claim unrun
tests passed. No fake availability/check-in/QR success or hard-coded staff roles.
No public-write rules, passwords, service-account keys or real student records.
Client Firebase config is an identifier, not authorization. Do not hide errors
with `as any`, lint suppression or silently caught exceptions. Keep screenshots
and expected/actual evidence for the report/viva. Each member explains their own code.
