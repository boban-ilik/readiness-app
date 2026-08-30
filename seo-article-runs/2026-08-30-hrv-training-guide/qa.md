# QA — 2026-08-30-hrv-training-guide

**Status: pass.** The article fulfils the approved reader contract (compute a 7-day baseline, classify a morning green/amber/red, pick a session, know when to distrust the number), keeps the approved how-to shape, and delivers the contribution the benchmark supports: an open-math protocol plus cited failure modes that none of the four frozen competitor captures provides. Final length 2,530 words.

## Material claim findings and resolutions

- **Unsupported prevalence claims repaired (7 edits).** The draft asserted "most wearables report HRV as RMSSD" and "Apple Watch, most Garmin … already do this" without ledger support (which metric any given watch reports is unverified in the ledger). Rewritten to research-metric framing (E1) and a hedged reader-owned-device statement. Similar narrowing applied to "any page … is guessing" (intro), "pages … typically without citations" (Q&A, now anchored to the one observed example, E11), "most guides skip" (now "tend to skip"), and "the research doesn't hand you a universal cut-off" (now "the research reviewed here").
- **Guardrails verified intact:** paradoxical-HRV finding scoped to highly trained endurance athletes in both places it appears (E2 §5.1); no Kiviniemi effect sizes or VO2 numbers, general finding attributed with an explicit verification caveat (E5); E4's HRV sentence labelled as the authors' discussion with heart rate named as the measured outcome; alcohol numbers (63.6→66.6 bpm, p<0.001, 40 g/60 g, 3 days) match E4; sleep claim matches E3; no population age table anywhere; improve-HRV section is 134 words with exactly the three approved levers; product appears only in the prerequisites data-location context and the disclosed closing section; 45/40/15 weights and 7-day calibration match E7; wellness disclaimer present.
- No claim was found that exceeds its evidence ceiling after these edits. The rolling-baseline instruction ("keep updating the average") is presented as a bounded protocol rule, not a research claim, consistent with E1's unresolved rolling-vs-fixed framing.

## Links

All 8 links verified against the brief §5 inventory: internal garmin-hrv-apple-health (§prerequisites), how-much-sleep-for-recovery (§raising baseline), what-is-a-readiness-score (§close), App Store CTA (§close only); external E1 (PMC12787763), E2 (PMC11204851), E3 (PMC4434546 — the verified PMC mirror, not the JS-challenged jcsm.aasm.org URL), E4 (PMC12073130). Anchors keep their promises; each external link sits at first decisive use; no invented, duplicate, or self-referential destinations.

## Humanize and mechanical result

Humanize pass made four minimal prose edits (a paired-dash antithesis, a reflexive dash, duplicate honesty-framing, one jargon verb); soul check PRESERVED; all protected values unchanged. Mechanical regression gate (`runtime.py qa` with site-url https://thereadiness.app/blog/hrv-training/): **passed, zero regressions** — headings 11, links 8/8, tables 5, entities 65/65, numbers 55/55.

## Reader-visible limitations

- The green/amber/red thresholds are stated honestly as protocol judgment, not evidence-derived cut-offs; the article says so.
- Kiviniemi 2007 is cited direction-only with an in-text verification caveat (E5 partial access) — accepted per brief.
- The Apple Health navigation path and Garmin-sync behaviour are volatile product details; worth a periodic re-check after iOS/Garmin updates.
- E10's observed SERP omitted positions 1, 3, 6; the benchmark is the accepted four-capture set.

## Route

Writer: claude-fable-5 (native). Editor: claude-fable-5 (native), distinct fresh-context subagent; humanize routed through the bundled skill by the editor. No human review required beyond the volatile-product-detail note above.
