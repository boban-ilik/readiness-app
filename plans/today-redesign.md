# Plan: Today screen redesign (ships in 1.2.1)

**Decided:** 31 October 2026, in the 1.2.0 release chat, after the /clarify interview.
**Goal:** day-7 retention of new accounts. Baseline: 4 of 25 users with events reached seven days (app_events, 7 September to 31 October 2026). Check four weeks after release using app_open.
**Why:** Today renders up to 21 blocks in shipping order with equal weight. Users called it chaotic. With 3 to 5 new accounts a week and most gone within a week, the daily visit has to feel worth repeating before any Pro sale can happen.

## Decisions

1. Scope: regroup and collapse. Every feature survives; nothing is cut.
2. Release: inside 1.2.1 with build 77's fixes (Boban's call; the 5.6.3 and 2.3.10 fixes wait for the redesign).
3. Top of screen unchanged: score ring, then the breakdown (recovery, sleep, stress, activity; locked rows for free users as today).
4. Then, fixed order:
   - **Alert slot**: one card, only when active. Sources: illness recovery, illness nudge, reading check, overtraining warning, trial ending, calibration. If several are active, the most urgent one; the rest wait for tomorrow or live in This week.
   - **Today's plan**: one card with three rows: recommendation (the training-day call, with the why on tap), nutrition, water.
   - **This week**: collapsed section: trend insight, forecast, Strava last workout, training load (Strava and Apple merged into one block), streak, cycle phase, life event tagger.
5. Pro pitch: padlocks stay where they are (breakdown rows, trend, forecast). ProSummaryCard and TrialEndingCard become one slim banner under the ring, shown once per day, and every day in the last three trial days.
6. Collapsing: This week starts folded. Each section remembers open or closed on this device (AsyncStorage keys added to USER_SCOPED_KEYS, wiped on sign-out).

## Order of work

1. Static mock of the new Today, free and Pro variants, approved by Boban before any code. (This step.)
2. Build on claude/garmin (the 1.2.1 code): a Section component with remembered collapse state; move blocks into the zones; merge the three training cards into one; merge the two Pro cards into the banner; alert slot picks one card.
3. Jest for the alert-slot choice and the collapse-state helper; tsc, eslint, existing suites green.
4. TestFlight build, Boban checks free and Pro on a device, then 1.2.1 is resubmitted with the screenshot and bug fixes already in App Store Connect.

## Out of scope

Cutting features, History and Profile layout, the paywall screen itself, new analytics beyond one event for section open and close.
