# Checkpoint A decisions (user, 2026-11-20) and orchestrator addendum

- Archetype: Custom (compatibility explainer plus route comparison). Angle approved by the user: Angle A, "Your watch has the ingredients, not the score" (research.md section 6): lead with Apple's model limit; what Apple's score is built from; what an older watch already shows for sleep, vitals and training load and what it lacks; Apple's stated reason and what Apple has not said; three routes (upgrade, read the native screens yourself, use an app), each with what it cannot replicate; a symmetric table of apps including the publisher's.
- Competitor set approved as frozen (Apple Support 128112, Tom's Guide, Body Insights). tej.as stays an alternate, not a benchmark page.
- The user was told that the honest table shows Readiness Coach Pro at $69.99 a year next to Athlytic at $29.99 and Ready at $19.99, and approved writing it that way. Show the prices as they are. The counterweight is that the daily score is free. No ranking of apps; "not tested" stated.
- The "read the native screens yourself" route is an editorial suggestion built from Apple's descriptions of each screen, not Apple's advice. Say so.
- Demand is small (primary query 150 a month); the article is written for buyer fit. Do not pad it to chase the dominant "how do I use Apple's score" intent.
- No SERP was pulled for "apple watch recovery score"; do not target it.
- Additional first-party facts (orchestrator, from the repo, 2026-11-20): on Apple Watch the app reads the SDNN HRV type from Apple Health (src/services/healthkit.ts); it does not read the RMSSD type added in iOS 27. The score is calculated on the phone when the app is opened, from what is in Apple Health at that moment; no watch app, widget only. So "When it updates" for Readiness Coach is: when you open the app.
- Body Insights: its App Store listing puts "Coach" daily guidance under Premium while its ranking blog says "Free download". Report what each source says; do not resolve it by guessing.
- The sibling article (planned URL https://thereadiness.app/blog/whoop-vs-apple-watch/) will be published in the same deploy, so it IS a valid internal link target here, at most once.
- Final slug stays `apple-watch-readiness-older-watches`.
