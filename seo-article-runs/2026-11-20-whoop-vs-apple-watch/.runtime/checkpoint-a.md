# Checkpoint A decisions (user, 2026-11-20) and orchestrator addendum

- Archetype: X vs Y. Angle approved by the user: Angle A, "It depends which Apple Watch you have" (research.md section 6), organised by the reader's starting point: Series 12 or Ultra 4 owner; SE 3 or older watch owner; no device yet; wearing both.
- Competitor set approved as frozen (9to5Mac, CNET, Garage Gym Reviews). Lifestack stays supporting evidence.
- Apps (the publisher's included) appear in ONE section, named with the same buying fields and prices, explicitly "not tested, not ranked". The publisher's app is disclosed as the publisher's own, early in that section. Its annual price is higher than Athlytic's and Training Today's; show the prices as they are. Its counterweight is the free daily score.
- For Whoop wearers: Whoop does not export HRV to Apple Health (E7), so the publisher's app would need HRV typed in by hand for a Whoop-only wearer. State that plainly; do not sell the app to Whoop wearers.
- Supplementary evidence S1 (captured after research): `.runtime/sources/whoop-support-canceling-membership.md`. It resolves "what happens when Whoop payment stops": data collection stops when the membership ends, past data stays viewable, 30-day return window, 12-month commitment. Use it; cite the URL.
- Still Unresolved and out of the verdict: which daily score is better; sleep-stage, heart-rate and HRV accuracy; strain vs training load as "better"; AI coaching quality.
- Additional first-party facts (orchestrator, from the repo, 2026-11-20): on Apple Watch the app reads the SDNN HRV type from Apple Health (src/services/healthkit.ts); it does not read the RMSSD type added in iOS 27. The score is calculated on the phone when the app is opened, from what is in Apple Health at that moment; there is no watch app and no all-day score on the wrist (widget only).
- The sibling article (planned URL https://thereadiness.app/blog/apple-watch-readiness-older-watches/) will be published in the same deploy, so it IS a valid internal link target here, at most once.
- No hands-on testing by the publisher. No reviewer verdict borrowed as the article's own.
