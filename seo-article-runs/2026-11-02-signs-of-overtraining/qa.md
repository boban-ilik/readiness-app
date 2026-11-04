# QA: signs-of-overtraining (2026-11-02)

## 1. Final status

**Pass.**

Route: writer a5ea3291c9aa5d03d, editor a6ce24c287c5bcb90, both native claude-opus-5-5. Source presentation automatic (sparse inline links, every statistic linked at use). Doctrine: bundled snapshot, logical sha256 8a473bcf31622b9906b2129ef590923eb39737ef9a6d85e444d5c4d7a0a711c5. Stage 5 candidate sha256 f6b0ed2f4ea0c899634415bdf5858646fa05f980d73792976fd0ea2ea6d86f04; article.md sha256 4efdd6672af43a222dc6a7aa88e76614a0b1f5170c075133a5742ca9f7e33e5e. Humanize changed seven sentences of prose (split stacked clauses, cut a signpost and repeated "X, not Y" beats); no fact, number, link, heading or table changed. Soul check preserved.

## 2. Claim, route and citation exceptions

- **E33 (new source, added at Stage 5, not in research.md because research is hash-locked):** MedlinePlus, "Pulse", https://medlineplus.gov/ency/article/003399.htm, review date 1/1/2025, fetched 2026-11-02. Supports the normal adult resting range of 60 to 100 beats per minute and 40 to 60 for well-trained athletes. Used for the stage 3 passage: the 100 and 60 bpm figures are described as the edges of the normal adult range, not overtraining thresholds, and "under 60 is ordinary in trained people" rests on the athlete range. The page does not literally define tachycardia as over 100, so the article does not say so.
- **4.5 bpm (E32 via E1):** the figure is the consensus statement's (E1) summary of the Bosquet 2008 meta-analysis (E32); the E32 abstract gives only standardized effects. The table cell links E32; the resting heart rate section attributes the number to the consensus summary and links E1.
- **Repeated external links (allowed by the run rule):** E1 x5, E2 x3, E5 x2, E10 x2, E32 x2, each in a different section and never twice in one paragraph. Internal URLs and the App Store link each appear once.
- **Scope held:** prevalence limited to the surveyed groups (E1, E14); the 14 to 21 day rule kept as Kreher's NFOR vs OTS boundary "used by some" (E2); noise figures scoped to 5 to 10 minute morning recordings (E5); the "80% clinical depression" figure omitted; the product paragraph stays within E25/E26 ("can drop" to an easy day, no tier promised, no Garmin direct-sync claim).
- **Benchmark:** no material exception. The article covers the shared expectations of Cleveland Clinic, HSS and NASM and adds what none of them gives: the measured vs felt split with sizes, the evidence that measured signs move the "wrong" way, time frames with evidence quality, a self-check, and device-label decoding.

## 3. Mechanical result

`runtime.py qa edited-before-humanize.md article.md --site-url https://thereadiness.app/blog/signs-of-overtraining/`: passed, no reasons; zero em or en dashes; frontmatter exactly title, description, pubDate: 2026-11-02; no H1.

## 4. Reader-visible limitations

- E21 (Garmin HRV Status technology page: three weeks of overnight wear, "mounting evidence" on high HRV and functional overreach) was not re-fetched since 2026-09-22; wording kept close to that capture. Re-check before publishing if possible.
- Several studies are cited from abstracts only (E3, E6, E7, E8, E9, E10, E11, E14, E15, E31, E32, E16); claims are limited to what the abstracts state.
- Length is about 3,500 prose words, above the brief's rough 2,500 to 3,300; the remainder is required coverage and two tables.
- Publishing follow-up (owner action, not done): /blog/hrv-training/ and /blog/how-to-increase-hrv/ would naturally link to this article once live.
