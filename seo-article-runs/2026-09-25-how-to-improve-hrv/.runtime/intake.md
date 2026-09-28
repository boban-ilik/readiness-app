# Intake (Stage 1) — run 2026-09-25-how-to-improve-hrv

- Mode: new article. Approval mode: guided (user approves Checkpoint A and B).
- Site: thereadiness.app (Astro blog, Markdown in website/src/content/blog). Product: Readiness Coach, iOS readiness-score app that reads HRV/RHR/sleep from Apple Health and works with any watch that writes there (Garmin a key segment; manual HRV entry for watches that do not write HRV). Its score model is public: 45% recovery (HRV vs personal baseline 60%, RHR 40%), 40% sleep, 15% stress; personal 30-day baselines (trimmed median, 7+ nights). From 1.0.3 (in App Store review, not yet live) an in-app screen shows each step of the calculation.
- Market/locale: US, English. Reader: recreational athlete who owns a Garmin, Apple Watch, Oura, Whoop or similar and sees a low or falling HRV number, and wants to know what actually raises it.
- Primary query: "how to improve hrv" (Ahrefs US 4,300/mo, KD 7, TP 29,000). Co-primary: "how to increase hrv" (4,800/mo, KD 8; same parent topic, same SERP). Secondary: "how to raise hrv" (1,200, KD 5), "why is my hrv low" (350, KD 12), "how to improve hrv score" (400, KD 6). One article should serve all.
- Working angle (user-approved direction): what actually moves HRV, ranked by strength of evidence (sleep, training load and recovery, alcohol, illness, acute stress, aerobic fitness over weeks, slow breathing, hydration, body weight, age), what does not or is overstated (supplements, single-session hacks, cold plunges as HRV hacks, chasing the daily number), and how to judge change against your own baseline and trend rather than a single morning. Tie to the app's open score model where it genuinely helps; honest, not salesy.
- Goal: rank for the cluster; convert a subset to installs via honest positioning.
- Source presentation: automatic (previous runs used inline citations to primary studies).
- Editorial profile: bundled (frozen in .runtime/doctrine-snapshot.json). House rules from previous runs: no em dashes or en dashes anywhere in the article (commas, colons, full stops; hyphens only in compounds); numeric ranges with "to"; cite primary sources; never fabricate statistics; label convention vs research finding.
- Existing site pages (internal-link inventory): https://thereadiness.app/ , /blog/ , /blog/garmin-hrv-apple-health/ , /blog/how-much-sleep-for-recovery/ , /blog/hrv-training/ , /blog/what-is-a-good-hrv/ , /blog/what-is-a-readiness-score/ . Must-consider links: /blog/what-is-a-good-hrv/ and /blog/hrv-training/ where they genuinely help. Not link targets: /privacy/, /support/.
- Overlap to manage: /blog/hrv-training/ (HRV-guided training, green/amber/red) and /blog/what-is-a-good-hrv/ (ranges, baseline). This article must not duplicate them; link out instead.
- Ranking inputs supplied by orchestrator (Ahrefs SERP overview, observed 2026-09-25): .runtime/serp-how-to-improve-hrv-us.json and .runtime/serp-how-to-increase-hrv-us.json. Use them as the observed SERP; do not re-run paid SERP tools.
- Research budget: no Apify or paid social research unless materially necessary; Reddit threads on the SERP may be read directly as lived-experience leads if accessible (Reddit blocks many automated fetchers; record that as a limitation if so).
- Writer/editor routes: automatic (native subagents).
- Health note: general-wellness framing; no medical claims; clinical conditions (heart disease, medication effects) only as "see a doctor" boundaries with sources.

## Checkpoint A decision (user, 2026-09-25)
- Archetype: How-to (step-by-step), approved by the user over the Custom evidence-ranked guide.
- Title lead word: "increase" (co-primary, higher volume), with "improve" in text and headings. Example direction: "How to increase HRV: what actually raises it, and by how much".
- Research corrections accepted: breathing is an in-session tool, not an overnight lever; hydration weak; weight loss only for readers with overweight; age and genetics are context, not levers; the differentiator is kind of change + sizes + source checks, not evidence ranking alone.
- The article must not claim the app excludes Apple Watch Breathe readings (open product issue).
