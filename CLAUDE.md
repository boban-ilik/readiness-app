# Readiness — invariants

Mobile app: a daily AI readiness score + coaching from Apple Watch / Garmin data.
React Native (Expo, iOS-first) + Supabase (Postgres + Deno edge functions) +
RevenueCat + Claude. TypeScript throughout.

## Rules that are easy to get wrong

1. **Per-day keys use `localDateStr`.** Any cache/row keyed to a calendar day must
   use `localDateStr` from `@utils/index`, never `toISOString().split('T')[0]`
   (that is the UTC date and shifts a day across timezones).

2. **New per-user storage goes in `src/services/storageKeys.ts`.** Any `@readiness/`
   key holding personal data (profile, baselines, cycle, coach, Strava/Garmin,
   AI caches, notification dedupe) must be added to `USER_SCOPED_KEYS` or
   `USER_SCOPED_PREFIXES` so the sign-out / account-switch wipe removes it.
   A test in `src/services/__tests__/userScopedStorage.test.ts` guards this.

3. **HealthKit and Garmin reads go through `@services/healthSource`.** Do not
   import `healthkit`/`garmin` directly from new hooks or utils; `healthSource`
   is the seam that switches between Apple Health and Garmin per signal.

4. **`supabase/functions/_shared/` mirrors client logic.** Rules in `_shared`
   (training tiers, baseline wording, illness, water, reading-check) must stay
   in step with their client counterparts; a parity test in
   `src/utils/__tests__/coaching.test.ts` checks the training tier.

5. **No em dashes in user-facing copy.** Use "·" or a hyphen. App Review has
   rejected on copy details before.

6. **`jest`, `typescript` and other build tools live in `devDependencies` only.**
   A duplicate entry in `dependencies` once broke `npm ci`.

## Commands

- `npx tsc --noEmit` — type-check
- `npx eslint . --ext .ts,.tsx` — lint
- `npx jest --ci --coverage` — tests (with a coverage gate on the overall suite)
- `deno task test` — Deno unit tests for the edge-function helpers
