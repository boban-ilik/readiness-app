# QA: 2026-09-22-what-is-a-good-hrv

## 1. Final status

Pass, editorial. Editor `editor-2026-09-22-native-hrv` (native, claude-fable-5-1), distinct from writer `aa418db576ff47fc4`. Pre-humanize candidate `.runtime/edited-before-humanize.md` (sha256 823d5d62…), final `article.md` (sha256 bf1a548f…). Doctrine hash 8a473bcf…; source presentation automatic; Custom archetype checks and brief section 7 checks 1 to 9 all pass. Humanizer soul check: PRESERVED.

## 2. Material claim, route and citation exceptions

- Removed the E4 link (DOI contains parentheses; destination is a paywalled abstract). Umetani 1998 stays attributed in text; E4 remains in the private ledger. Deviates from the brief.
- Added one link to E20 (Marco Altini, Substack) at the direct quotation "higher is better" to "normal is better"; ledger URL.
- Narrowed unsupported scope claims: "largest reference dataset with a published method" (E3 is not shown to be the largest; E9 is bigger) now states the sample; "most HRV articles borrow their definitions from" and "every age chart on the internet" bounded to what the benchmark shows (E22, research section 3); "no other page states" bounded to pages reproducing the table (E26, Different Health); "there is no millisecond number below which your wearable reading is dangerous" rewritten as a traceability statement (E7, E26).
- Corrected: "Every other row is RMSSD" contradicted the hedged Recovery HRV row (E13b, E19); Recovery HRV "Overnight" replaced with the sourced "shown in Vitals, where it replaces sleep duration" (E13c); Readiness Coach method "published rather than proprietary" now "documented" (E21); "research supports a median rather than a mean" now "averaging rather than single days" (E1, E11); the hrv-training anchor sentence no longer describes three rules the inventory does not verify (E24).
- Title changed to sentence case to match the headings and the approved title.
- Length: draft 3,090 words cut to 2,889 total (about 220 of those are the two tables). Cuts: signposting paragraph, Dial 2025 accuracy tangent, E1 single-reading quotation (E10 effect sizes carry the point), three-weeks duplicate, duplicated "not a target" caveats. Still above the 2,000 to 2,400 target; what remains is the mandatory assets (two tables, provenance caveat, three worked examples, labelled clinical paragraph, device paragraphs).
- Vendor figures (E17, E18, E19) appear only as "reports" or "says" with measurement and population notes; no threshold is called dangerous; sex passage states the E3, E8, E9, E10, E4 conflict without resolving it; clinical paragraph is labelled, population-level (E12) and ends "ask a clinician"; no worked example grades a single reading.
- By-age table: all twelve rows match E3 Table 1; percentile ranges in prose match E3 for the three bins available.
- Competitor benchmark: no material exception. Kubios's sleep-HRV section (night heart rate 20 to 30% lower, REM) is not covered; out of scope per brief exclusions. Optional sleep-article link skipped because E10 does not quantify sleep.

## 3. Mechanical result

`runtime.py qa` passed: 13 links, 13 unique destinations, no self or duplicate internal links; headings (9), links, tables (23 rows), URLs, numbers, dates and entities identical before and after humanization. Zero em or en dashes.

## 4. Reader-visible limitations

- Percentile spread is given for three age bins only (E3 capture); other bins have medians only.
- Apple Recovery HRV's metric rests on a third party (E19); Apple's captured pages do not state it (E13b).
- Empirical Health percentiles have no published sample size (E19); Whoop's averages have no sample, date or method (E18).
- Device accuracy comes from one 13-person study (E15).
- The by-age reference is daytime 10-second ECG in a screened Dutch cohort (E3); no overnight wearable norms with a published method exist in the packet (E23).
- Reddit lived-experience content was not captured (E23).
