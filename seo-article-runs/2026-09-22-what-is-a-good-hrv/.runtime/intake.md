# Intake (Stage 1) — run 2026-09-22-what-is-a-good-hrv

- Mode: new article. Approval mode: guided (user approves Checkpoint A and B).
- Site: thereadiness.app (Astro blog, Markdown in website/src/content/blog). Product: Readiness Coach, iOS readiness-score app that reads HRV/RHR/sleep from Apple Health and works with any watch (Garmin wedge; manual HRV entry for watches that do not write HRV).
- Market/locale: US, English. Reader: adult wearable owner (Apple Watch, Garmin, Oura, Whoop, Fitbit) who has just looked at an HRV number and wants to know if it is good; recreational athletes over-represented.
- Primary query: "what is a good hrv" (Ahrefs US 6,400/mo, KD 26). Secondary: "hrv by age" (3,700/mo, KD 5). One article should serve both.
- Working title: "What is a good HRV? Normal ranges by age, and why yours is the one that matters."
- Angle (user-approved direction): population and by-age tables are wide, device-dependent and metric-dependent (RMSSD vs SDNN, night vs spot readings); the reader's own baseline is the useful reference; the app computes a personal baseline from 30 days (trimmed median, needs 7+ samples, population default 55 ms SDNN until then, see src/utils/index.ts and src/utils/readiness.ts) and scores deviation from it. Ties to existing article /blog/what-is-a-readiness-score/.
- Goal: rank for both queries; convert a subset to app installs via honest positioning, not hype.
- Source presentation: automatic (previous run used inline citations to primary studies).
- Editorial profile: bundled (frozen in .runtime/doctrine-snapshot.json). House rules from the previous run: no em dashes or en dashes anywhere in the article (use commas, colons, full stops; hyphens only in compounds); numeric ranges with "to"; cite primary sources; never fabricate statistics; label convention vs research finding.
- Existing site pages (internal-link inventory): https://thereadiness.app/ , /blog/ , /blog/garmin-hrv-apple-health/ , /blog/how-much-sleep-for-recovery/ , /blog/hrv-training/ , /blog/what-is-a-readiness-score/ . Also /privacy/ and /support/ (not link targets).
- Ranking inputs supplied by orchestrator (Ahrefs SERP overview, observed): .runtime/serp-what-is-a-good-hrv-us.json and .runtime/serp-hrv-by-age-us.json. Use them as the observed SERP; do not re-run paid SERP tools.
- Research budget: no Apify or paid social research unless the researcher finds it materially necessary; Reddit threads already on the SERP may be read directly as lived-experience leads.
- Writer/editor routes: automatic (native subagents).
- Health note: general-wellness framing; no medical claims; any clinical thresholds must be sourced and labelled.
