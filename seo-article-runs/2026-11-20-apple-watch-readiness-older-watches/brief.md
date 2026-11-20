# Brief: "readiness score apple watch" for owners of older Apple Watches

Run: 2026-11-20-apple-watch-readiness-older-watches · Archetype: Custom, compatibility explainer plus route comparison (user-approved at Checkpoint A) · Sources: sparse inline links · Every source below was read 2026-11-20.

## 1. Reader contract

**Reader.** A US owner of an Apple Watch Series 9, 10 or 11, Ultra 2 or 3, or an SE, who trains a few times a week, has seen Readiness in watchOS 27 coverage, and cannot find the app on their own watch.

**Goal.** Learn whether their watch gets Apple's score and what to do if not.

**Assumed knowledge.** Knows their model name and can open apps on the watch. May not know what HRV is, or that Sleep score, Vitals and Training load exist.

**Explain on first use.** HRV (one plain sentence); "typical range"; Recovery HRV as Apple's name for the new watches' measurement; Apple Health as the store apps read from.

**Observable success.** The reader can (1) say whether their model is listed for Apple's Readiness app, (2) find on their own watch the screens matching Apple's three input groups, (3) state what Apple has and has not said about why, (4) pick one of three routes knowing what each cannot replicate, and (5) compare five apps on the same fields, knowing which is this site's and that none was tested.

## 2. Intent, job, angle, scope

Primary `readiness score apple watch` (US 150/mo, KD 4); variants `apple watch readiness`, `apple watch readiness app`. Do not target `apple watch recovery score`. The dominant intent is using Apple's score; this article serves the minority whose watch lacks it, for buyer fit, not volume.

**Job.** "My Apple Watch does not show Readiness. Can it, why not, and what are my honest options?"

**Angle (approved): "Your watch has the ingredients, not the score."** Apple lists the Readiness app for Series 12 and Ultra 4, and builds the score from activity, vitals and sleep. An older watch already shows Sleep score, Vitals and Training load; it lacks Apple's blend, HRV inside Vitals, daytime vitals and higher-frequency sampling.

**Where the evidence narrows the angle.**
1. "Ingredients" holds only for the 11 older models Apple's compare page lists with all three screens (Series 6 to 11, SE 2, SE 3, Ultra, Ultra 2, Ultra 3), not first-generation SE or Series 5 and earlier.
2. Older watches record HRV (E5, E11), but it is not a Vitals metric there (E6). No captured Apple page says where to view it; say the watch writes it to Apple Health and give no tap path.
3. Apple's activity input also includes active calories and workout effort ratings (E1), so the three screens do not cover every input.
4. Reading the three screens yourself is an editorial suggestion built from Apple's description of each screen, not Apple's advice. Say so there.

**Exclusions.**
- Setup walkthrough, widget tips, "why is my score low", "what is a good score", FAQ block.
- Per-day HRV counts, forum figures ("200 or more", "about 15"), Vita's "60 times".
- stuff.tv, Reddit, YouTube (unread); App Store reviewer quotes; tej.as anecdotes.
- App ratings or user counts; ranking, "best", "cheapest", "winner".
- Speculation that Apple will extend Readiness; medical claims.
- The publisher's score model: link out.

## 3. Claim and evidence plan

Quotes are verbatim. Where Apple's text has a dash, paraphrase with "to" outside quotation marks.

|Claim|ID|Wording to rely on|Handling|
|---|---|---|---|
|Models and age|E2|"The Readiness app is available on Apple Watch Series 12 and Apple Watch Ultra 4 for ages 13 and older."|Age limit is on this page only; the App Store "9+" is a content rating|
|Exclusivity|E5, E9|Compare page lists "Readiness app" for two models, blank for 17|"Apple lists it for these two models, as of November 2026". E1 never says "only"|
|Inputs|E1, E2|"Your Activity data, daytime and overnight vitals, and sleep data factor into your overall readiness score."|E2 lists the detail|
|Direction of effect|E1|"Increased activity in general can reduce your score, while steady or reduced activity raises it."||
|Scale|E1|Paraphrase: 0 to 10; Go for it 8 to 10, Ready 5 to 7, Pace Yourself 2 to 4, Recover 0 to 1||
|Updates|E2|"updates throughout the day based on calories burned, naps, and your daytime heart rate"||
|First score|E1, E2|"at least 7 nights"; baseline "at least 7 of the past 49 nights"|Never "consecutive"; no minimum sleep length|
|Apple's reason|E3, E4|"The all-new Apple Watch Health Sensing System enables a new readiness score and higher-frequency HRV"|E4: "which power an enhanced suite of health and fitness features including a new readiness score". Verbs stay "enables" and "power". Never "requires", "relies on", "cannot", or the chip alone|
|HRV sampling|E3, E10|New watches: "as often as every five minutes". Earlier watches: "The default tachogram measurement cadence is every four hours"|E10 is Apple's November 2024 paper; any watchOS 27 change is not captured. "24x" is Apple's figure with no stated base (E26)|
|Vitals|E6|"Daytime vitals are available only with Apple Watch Series 12 or Apple Watch Ultra 4."|On those two, HRV "replaces sleep duration"; prefer E6 over the E5 cell. Vitals compares metrics with "your typical range"|
|Sleep score|E7|"sleep duration (50 points), bedtime consistency (30 points), and interruptions (20 points)"||
|Training load|E8|"over the last 7 days to what you've done over the previous 28 days"||
|watchOS 27 models|E3, E9|Series 9 or later, SE 3, Ultra 2 or later|Six older models run it without Readiness|
|Upgrade cost|E4|Series 12 "starts at $399 (U.S.)"; Ultra 4 "starts at $799 (U.S.)"|Launch prices, 2026-09-09; current prices not checked|
|Apps compute their own score|E11|HealthKit documentation lists raw types (HRV, sleep stages, resting heart rate) and none for readiness score, sleep score, vitals classification or training load|Bound to the documentation "as read in November 2026". Never "Apple does not share it"|
|Development, validation|E3, E12|"developed using data from the Apple Heart and Movement Study"|Apple's 2026 accuracy paper measures heart rate. "No published validation found in the Apple pages read", never "none exists"|

App facts: research section 7 (E20 to E23). Readiness Coach: E24, product-facts.md and checkpoint-a.md only.

**What Apple has not said. State it; do not fill it.** Whether an older watch could run Readiness, or whether Apple plans to extend it (U3). The weights of the three inputs (U6). Why the age limit is 13 (U7). Whether the HealthKit RMSSD type is Recovery HRV (U4). Any validation of the score, within the pages read (U5).

**Competitor claims not to repeat as fact.** Tom's Guide: S11 chip alone, "seven consecutive nights", four hours of sleep, "other models may be added" (E16). Body Insights: "relies on those new sensors" (E17). Ness: lagging scores and a coming fix (E19).

## 4. Benchmark

Frozen set: Apple Support 128112 (position 2), Tom's Guide (9), Body Insights (10).

**Shared coverage kept.** Supported models (opening, Table 1); the three inputs; the four bands (one sentence); day-long updating; setup checks and the 7-night wait (one short H3, age 13 added). Only Body Insights serves the unsupported owner, with one route: its own app.

**Omitted.** Illustrated setup steps and the widget (Tom's Guide); "why is your score low" (Body Insights). They serve supported owners; link Apple's page instead.

**Supported contribution.** (1) A per-model matrix from Apple's compare page. (2) Apple's reason in its own words, with what it has not said. (3) Three routes, each with what it cannot replicate. (4) Five apps on identical fields, Unknowns shown, the publisher's at its real price. (5) Validation asked of Apple and the publisher alike. No selected page does these. Ness and Fitcoin (unranked) touch (1) in passing; do not claim novelty.

## 5. Headline, description, outline

**Headline promise.** Whether your watch gets Apple's score, what it already has, and three honest ways to get a readiness read.

**Title options.**
1. Readiness score on Apple Watch: which models get it, and what older watches can do (recommended)
2. Readiness score on Apple Watch: your options on an older watch
3. Readiness score on an older Apple Watch: you have the ingredients, not the score

**Meta description draft.** Apple lists its Readiness app for Apple Watch Series 12 and Ultra 4. See what older watches already track, what they lack, and three ways to get a score.

Frontmatter exactly: title, description, pubDate: 2026-11-20.

**Opening move (no heading).** The reader's situation (watchOS 27 installed, no Readiness app), then the direct answer with model names and age limit (E2, E5): nothing to switch on. Early payoff in the first screen: the watch already shows the three things Apple's score is built from. One disclosure sentence: this site makes Readiness Coach, one of the apps compared below, and no watch or app was tested.

**Outline.**

1. **H2: Which Apple Watch models get the Readiness app** (E2, E5, E9). Table 1.
   - **H3: If you have a Series 12 or Ultra 4 and see no score** (E1, E2). Age and Apple's four checks in three or four sentences; link Support 128112.
2. **H2: What Apple's readiness score is built from** (E1, E2; U6). Inputs, direction of effect, scale, day-long updates, unpublished weights.
3. **H2: What your older watch already shows, and what it lacks** (E5 to E8, E10, E11). One short block each: Sleep score, Vitals, Training load, HRV. Then what is missing, as listed in the angle.
4. **H2: Why Apple limits it, in Apple's words** (E3, E4, E10, E26; U3). "Enables" and "power"; five minutes against the 2024 paper's four-hour default; what Apple has not said. Judgment allowed: Apple states a hardware reason, not an impossibility.
5. **H2: Three ways to get a readiness read on an older watch**
   - **H3: Upgrade** (E4, E1, E2). Launch prices, 7-night wait, age limit. Limit: the cost of a watch; weights stay unpublished.
   - **H3: Read the three screens yourself** (E6, E7, E8, E1). Labelled editorial. Logic from Apple's direction-of-effect statements. Cannot replicate: one number, Apple's weighting, daytime updates, HRV.
   - **H3: Use a third-party app** (E11, E5, E20). Each app computes its own score from raw Apple Health data; on an older watch that means the older HRV measurement, not Recovery HRV; it is not Apple's number.
6. **H2: Readiness apps for older Apple Watches, side by side** (E20 to E24). Table 2 and its note. One Readiness Coach paragraph under section 7's rules. One observation, not a verdict: three of the four third-party listings describe a morning score, Bevel's does not say, Apple's updates through the day.
7. **H2: How to choose** (E3, E12, E24). A rule by constraint: Apple's number means upgrading; free with no new app means reading the screens; one number on the current watch means an app, after checking what is free. Then validation, for Apple and the publisher alike.

## 6. Tables

**Table 1. Per-model matrix.** Caption: "As listed on Apple's Watch compare page (US), read 2026-11-20". Source E5; watchOS column E3 and E9; first-row Vitals cell E6. A blank in Apple's table is written "Not listed".

|Models|Readiness app|watchOS 27|Sleep score|Training load|Vitals app metrics|HRV|
|---|---|---|---|---|---|---|
|Series 12, Ultra 4|Yes|Yes|Yes|Yes|Heart rate, respiratory rate, wrist temperature, HRV; daytime view|Recovery HRV|
|Series 11, Ultra 3, SE 3, Series 10, Ultra 2, Series 9|Not listed|Yes|Yes|Yes|Heart rate, respiratory rate, wrist temperature, sleep duration|HRV|
|Series 8, Ultra (first generation)|Not listed|Not listed|Yes|Yes|Heart rate, respiratory rate, wrist temperature, blood oxygen, sleep duration|HRV|
|Series 7, Series 6|Not listed|Not listed|Yes|Yes|Heart rate, respiratory rate, blood oxygen, sleep duration|HRV|
|SE 2|Not listed|Not listed|Yes|Yes|Heart rate, respiratory rate, sleep duration|HRV|
|SE (first generation), Series 5 and earlier|Not listed|Not listed|Not listed|Not listed|Not listed|HRV|

Footnote: blood oxygen in Vitals depends on the US model sold (E2).

**Table 2. Apps, symmetric.** Columns, alphabetical: Athlytic, Bevel, Body Insights, Readiness Coach (this site's app), Ready. Rows: Price and cadence; Trial; What is free, including the daily readiness answer; Platform; Required watch; What the score uses; When it updates. Cells are research.md section 7 as written, Unknown kept as Unknown, with four overrides:
- Readiness Coach, when it updates: when you open the app; no watch app.
- Ready: App Store prices ($1.99 a month, $19.99 a year, $29.99 lifetime).
- Bevel: credit packs ($4.99 to $49.99) noted in the price cell.
- Body Insights, what is free: the listing's free tier; the listing places "Coach" under Premium while the vendor's blog says "Free download". Report both, unresolved.

Note under the table: not tested; each vendor's US App Store listing or site, read 2026-11-20; US prices; alphabetical, not ranked. App names link to their listings (URLs in E20 to E23).

## 7. The publisher's app

Appears three times: the opening disclosure, its Table 2 column, one paragraph in section 6, each time named plainly as this site's own app. App Store link once, in that paragraph: https://apps.apple.com/app/id6760478506

**Say.** iPhone app reading Apple Health; overnight HRV and resting heart rate against a 30-day personal baseline, plus sleep and stress; first 7 days are a calibration week; the daily score with component detail is free; Pro is $9.99 a month or $69.99 a year, shown as it is; new accounts get Pro for 7 days, no card.

**Must not claim.** That it reproduces, matches or approximates Apple's score. Recovery HRV (it reads the SDNN type). Wrist temperature, respiratory rate or blood oxygen. A watch app or a score that updates on the wrist. Validation (none exists). Better accuracy than any app. The Garmin connection.

## 8. Links

**Internal, each once.**

|URL|Anchor context|
|---|---|
|https://thereadiness.app/blog/what-is-a-good-hrv/|Section 3, HRV block: what the older watch's HRV number means|
|https://thereadiness.app/blog/hrv-training/|Section 5, read-it-yourself: acting on a low HRV day|
|https://thereadiness.app/blog/what-is-a-readiness-score/|Section 6, Readiness Coach paragraph: how its score is weighted|
|https://thereadiness.app/blog/whoop-vs-apple-watch/|Section 5, upgrade: weighing a Whoop instead of a new Apple Watch|

Optional: https://thereadiness.app/blog/signs-of-overtraining/ in section 7, on the limits of any score.

**Visible external citations, once each, at the decisive mention.** Apple's pages E1 to E8 and E10 to E12, with E2 in the opening and E5 at Table 1. Do not link Tom's Guide or vendor blogs.

## 9. AI-visibility notes

Full entity names on first use in each section: Apple Watch Series 12, Apple Watch Ultra 4, watchOS 27, the Readiness app, Recovery HRV. The opening answer, each route and the "what Apple has not said" passage stand alone with model, date and source. Uncertainty stays visible and dated.

## 10. House rules and acceptance checks

- No em dashes or en dashes anywhere, including quotes and tables. Ranges use "to".
- No hands-on language. "We" only as the publisher. General-wellness framing; no medical claims.
- **Length: 1,300 to 1,700 words of prose, plus the two tables.** The ranking peers run 850 to 980 words on one route; this covers three routes. Demand is small, so do not pad.
- Checks: (a) model answer and disclosure sit above the first H2; (b) exclusivity is worded from E5, never "Apple says only"; (c) "enables" and "power" are the only causal verbs; (d) the read-it-yourself route is labelled editorial; (e) Table 2 matches research section 7 plus the four overrides; (f) every price carries "US" and the date read.
