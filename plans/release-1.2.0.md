# Plan: ship Readiness Coach 1.2.0

Agreed 28 October 2026.

**Goal:** 1.2.0 live on the App Store for everyone, with SDK 58, the direct Garmin source, the Apple Health fix and the Typical label, and nothing broken that worked in 1.1.

## Decisions

- **Scope:** as built on `claude/garmin`, plus the consent-screen VO2 wording fix. Nothing new.
- **Testing:** a short device checklist on the final build (widgets, paywall and restore, a morning notification, Strava, Garmin disconnect and reconnect). Submit only if it all passes.
- **Release:** automatic, all at once, as soon as Apple approves.
- **Listing:** only the What's New text changes (drafted by Claude, approved by Boban). Screenshots, description and promo text stay.

## Assumptions

- The Garmin client secret stays as it is (decided 28 October 2026). The portal has no self-service rotation; the secret was exposed in a chat, which Boban accepted as a known risk.
- Review notes say Garmin is optional, needs the reviewer's own Garmin account, and the app works fully from Apple Health without it.
- Builds run locally on the Mac and upload to Apple with `xcrun altool` (EAS free iOS builds reset on 1 November 2026).
- After release, main moves to the 1.2.0 code and is tagged `v1.2.0` (main = the live App Store version).

## Order of work

| # | Step | Who | Depends on |
|---|---|---|---|
| 1 | ~~Regenerate the Garmin client secret~~ (dropped: secret stays as it is) | | |
| 2 | ~~Confirm the token refresh with the new secret~~ (dropped with step 1) | | |
| 3 | Build on the Mac (contains the consent wording fix), upload to Apple, wait for processing | Claude | none |
| 4 | Write the 10-minute test checklist | Claude | none |
| 5 | Run the checklist on the new build from TestFlight, report anything that fails | Boban | 3, 4 |
| 6 | If anything fails: fix, rebuild, retest only what failed | Claude, then Boban | 5 |
| 7 | Draft What's New, add the Garmin line to the review notes | Claude | none |
| 8 | ~~Approve the What's New text~~ (approved 28 October 2026, text below) | Boban | 7 |
| 9 | ~~Create version 1.2.0 in App Store Connect, attach the build, set What's New and review notes, set automatic release~~ (done 28 October 2026: build 69; review notes: NEW IN 1.1 section replaced by NEW IN 1.2 Garmin section) | Claude | 5 passed, 8 |
| 10 | ~~Boban's yes to submit for review, then Claude submits~~ (submitted 28 October 2026; rejected 29 October; resubmitted 29 October with build 75, Waiting for Review. See below.) | Boban, then Claude | 9 |
| 11 | Apple approves; the release goes out automatically | Apple | 10 |
| 12 | Move main to the 1.2.0 code, tag `v1.2.0`, push | Claude | 11 |
| 13 | Morning after release: check that scores save and Garmin data arrives for users who connected | Claude | 11 |

## Success criteria

- Every checklist item passes on the exact build that is submitted.
- Garmin data keeps arriving after release.
- 1.2.0 is ready for sale, and new scores keep saving the day after release.

## Risks

- The Garmin client secret has been exposed in a chat and is not rotated. Accepted risk; Garmin support can rotate it later if needed.
- Automatic release has no pause; a problem after release means a 1.2.1 through review.
- The reviewer can't test Garmin without a Garmin account; the review note covers it.
- EAS numbers the builds, so the build number may be 69 or higher.

## Open, not blocking

- Whether the controller change to Readiness DOO needs the change notice promised in Section 8 of the privacy policy.
- Usage Data → Product Interaction on the App Store privacy label (steps already given; independent of 1.2.0).

## Rejection and resubmission (29 October 2026)

Build 69 was rejected under guideline 5.6.3: the rating sheet appeared on the reviewer's first launch, over the Health Access screen. Cause: the good-day rating ask counted days from the account's join date, and the demo account is old, so a fresh install qualified at once.

Fixes shipped in build 75 (commits 700dcf7 to ee5e8d1 on `claude/garmin`):

- No rating ask before the 3rd separate day the app is opened on the device (the 5.6.3 fix).
- A slow answer on the Health Access sheet no longer reads as "Health access denied" (the 10 s guard treated the wait as a denial; found on a fresh install of build 72).
- Visual: illness card buttons, ring tap hint, Tag my day chip height, event tag text inside the chip, forecast pills inside the card.

Also done: reply sent to App Review (29 October, 9:37); the review notes' Garmin paragraph now says the demo account is already connected to a Garmin account, so Garmin data shows with no setup. Builds 70 to 74 were intermediate; 73 failed on a full disk (Xcode DerivedData, 30 GB), so the build command now clears `DerivedData/Readiness-*` first.

Resubmitting a rejected version through the API returned "Version is not ready to be submitted yet" until the version page's **Update Review** button was pressed in App Store Connect; after that, **Resubmit to App Review** worked.

Demo account note: it is connected to Boban's Garmin, so the reviewer sees Garmin data. Disconnect in Profile would delete that connection and its stored data.

## Approved What's New (28 October 2026)

Garmin, direct. Connect your Garmin account in Profile and Readiness reads your overnight HRV, resting heart rate, sleep and stress straight from Garmin, so there's no HRV to type in by hand. It's optional, and you can disconnect any time.

Typical means typical. When your recovery is close to your usual, the Breakdown now says Typical instead of Reduced or Moderate.

Also: rebuilt on a newer foundation for current iOS, and today's activity updates every time Today refreshes.
