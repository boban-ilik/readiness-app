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
| 8 | Approve the What's New text | Boban | 7 |
| 9 | Create version 1.2.0 in App Store Connect, attach the build, set What's New and review notes, set automatic release | Claude | 5 passed, 8 |
| 10 | Boban's yes to submit for review, then Claude submits | Boban, then Claude | 9 |
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
