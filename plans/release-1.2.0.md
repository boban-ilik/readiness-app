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

## Second rejection and the 1.2.1 resubmission (31 October 2026)

- Build 75 rejected under 2.3.10: the screenshots carried a drawn status bar ("9:41" and hand-made icons from the frame template). Apple offered to approve the bug fixes as they were; Boban chose to fix the screenshots and ship the audit fixes as 1.2.1 instead.
- Screenshots regenerated with `assets/appstore-6.5/framed/build_121.py`: the capture's real iOS status bar, only the island pill drawn. Uploaded and reported COMPLETE.
- App Store version renamed 1.2.0 to 1.2.1; What's New gained a fixes paragraph.
- Builds: 76 (audit fixes 1 to 8) failed the Garmin confirm step on a device while the same code passed in the simulator; 77 added three retries and the error text, and connected on the device; 78 built before two late fixes and was never uploaded; 79 is the submitted build, with the Today redesign (plans/today-redesign.md), the banner copy fix and the dev-only free toggle.
- Deployed to production Supabase: garmin-callback v3, garmin-confirm v1 (needed by the 1.2.1 confirm flow).
- Resubmitted via Update Review then Resubmit to App Review at 13:48 UTC on 31 October 2026. State: Waiting for Review, build 79, automatic release.
- Still open: Rising/Steady on the forecast cards; duplicate same-day tags; the demo account's Disconnect Garmin risk; the morning notification untested on 1.2.x.

## Third rejection: 1.4.1 (2 November 2026)

- Build 79 rejected under 1.4.1 Physical Harm: the reviewer read the Garmin link as "connects to external medical hardware" and asked for regulatory documents, region limits or a jurisdiction statement, and a medical disclaimer in the description.
- Done with Boban's approval: medical disclaimer appended to the description (before the EULA line); reply sent in App Store Connect at 11:57 local explaining the app reads consumer wearable data through HealthKit and Garmin's Health API, connects to no hardware, and makes no medical claim; version resubmitted with the same build 79 via Update Review then Resubmit.
- If Apple holds the hardware reading: options are an App Review appointment (Tuesdays and Thursdays) or an appeal; no documents of the kind requested exist for consumer wearables.

## Fourth submission: build 80 (3 November 2026)

- Build 79 rejected again under 1.4.1 on 3 November with the identical notice and no engagement with the reply.
- Merged PR #6 (Garmin worded as a cloud account sync, wellness disclaimers in the app) and PR #5 (accessibility: icon-button labels, selection state, tertiary contrast) into claude/garmin (b29ff81). Jest 215 tests, tsc and eslint clean.
- Build 80 built locally, uploaded, VALID, attached to 1.2.1.
- Description: the GENERAL WELLNESS, NOT MEDICAL ADVICE block from docs/APP_STORE_LISTING.md replaces the earlier disclaimer paragraph. Review notes: the ABOUT GARMIN (NOT MEDICAL HARDWARE) paragraph replaces NEW IN 1.2; notes trimmed to 3,960 characters to fit Apple's 4,000 limit.
- Reply sent 12:52 local (message 7). Resubmitted via Update Review then Resubmit to App Review.
- Recommended in parallel: an App Review appointment (Tuesdays and Thursdays, "Meet with Apple" link in the rejection) or an App Review Board appeal; and, if build 80 bounces, shipping 1.2.1 with the Garmin link behind a flag and fighting the classification separately.
- Incident: while updating the notes by script, the API echo matched "detail" and printed the full notes, demo password included, into the session transcript once. Changing the demo password is Boban's call.

## After build 80 (4 November 2026)

- claude/garmin has moved past the submitted code: the forecast Rising/Steady fix (4425d52, first task done by the DeepSeek Harness worker and reviewed here) and the hardening PR #7 (6504018). Tag v1.2.1-build80 marks what Apple is reviewing; on approval, main moves to that tag, not to the branch tip.
- Production database: hrv_source column added to readiness_scores (migration 20261103000000). Builds from the branch tip write it; build 80 does not read or write it.
- Next build from the tip is 1.2.2 material. Device checks owed before it ships: sign-out wipe, widget clear on sign-out, Keychain session surviving an app kill, Dynamic Type on Today and the paywall, VoiceOver on the paywall close and coach chat.

## Approved (4 November 2026)

- 1.2.1 build 80 approved by App Review on 4 November 2026; Ready for Sale with automatic release. Fourth submission, after 5.6.3 (rating prompt), 2.3.10 (drawn status bar in screenshots) and 1.4.1 (Garmin read as medical hardware) rejections.
- Step 12 done: tag v1.2.1 at b29ff81 (the exact approved code); main merged to it as 09aa86b (main also carries the CI workflow commit pushed on 3 November; app code equals the tag).
- Step 13 owed on 5 November: scores save for real users, Garmin data arrives overnight for the connected account, morning notification fires.
- Next release from the claude/garmin tip is 1.2.2: bump app.json before the next build, create the 1.2.2 version in App Store Connect, and attach a build with that version string. Build 82 (1.2.1) stays a TestFlight-only build.
- Website: the Body Battery post's direct-Garmin paragraph restored (2bc2716); the garmin-hrv-apple-health post still describes the pre-1.2 situation and needs an update.

## 1.2.2 staged (4 November 2026)

- App Store version 1.2.2 created (ec81aef5-94ca-459d-b3c0-17fe55b72f93), automatic release, inherited description, keywords, screenshots and review notes from 1.2.1; What's New written. Build 83 (commit 7d4b089) attached. Not submitted: Boban chose to submit on 5 November after the morning check of 1.2.1.
- 5 November plan: morning check (scores saved overnight, Garmin data for the connected account, morning notification), then "submit" creates the 1.2.2 review submission.
