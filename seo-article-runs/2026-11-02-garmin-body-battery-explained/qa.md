# QA: Garmin Body Battery explained

**Status: Pass.** article.md completes the brief's reader contract and section 8 acceptance checks. Body text is 3,498 words. Frontmatter has exactly title, description and pubDate 2026-11-02. There are no em or en dashes.

## Route and identities

- Writer: native subagent a0fee782018bb0183, model unknown.
- Editor and humanizer: separate native subagent a8a9ac1b9fd229bd1, model unknown.
- Profile: bundled doctrine. No OpenRouter or Apify calls were made.
- Humanizer disposition: soul check preserved. Rewrites were limited to prose tells, and protected tokens are identical before and after.

## Mechanical result

`runtime.py qa` passed against https://thereadiness.app/blog/garmin-body-battery-explained/. Links, headings, tables, numbers, entities and dates are unchanged across humanization. All 23 links are unique, with no duplicates and no self-link.

## Material claim and link exceptions

- **Garmin FAQ link (E12):** support.garmin.com returns HTTP 403 to curl. It was captured through the browser pane and is a valid public page.
- **All other links:** the 22 remaining links returned HTTP 200 on 2026-11-02. This includes https://thereadiness.app/blog/how-to-increase-hrv/.
- **Removed calculation:** the editor removed a derived "roughly 10 to 12%" range that merged two separate E16 figures. That passage now says only that alcohol and sickness move HRV and heart rate in the same direction by similar amounts.
- **Unsourced conversion:** "1 °C (1.8 °F)" is an editor unit conversion beside Garmin's figure (E4), not a sourced number.
- **Alcohol doses:** these stay in g/kg (E15). The drinks-conversion pointer went with a duplicate internal link, so US readers get no drinks equivalent in this article.
- **Caffeine:** two Garmin statements (E2 vs E5) are shown side by side and left unresolved, as the brief requires.
- **Citation pattern:** each source is linked once, at its first decisive use. Later claims from the same Garmin page are attributed in the text ("Garmin's FAQ says") without repeating the link.

## Reader-visible limitations and caveats for publishing

1. **Release-conditional paragraph.** Section 5's one-sentence paragraph beginning "Readiness Coach can also connect to your Garmin account" describes the 1.2.1 direct Garmin source, which is in App Review (E24). The live 1.1 reads Garmin only via Apple Health plus manual HRV. Delete that paragraph if 1.2.1 is not live at publication. The surrounding text stays accurate without it.
2. **Volatile vendor wording.** "Garmin has not published" is bounded to the named pages as checked in November 2026. Garmin's technology pages carry no dates and can change.
3. **No lived experience.** The Reddit and Facebook threads on the SERP could not be read (E14), so the article contains no owner reports.
4. **Training Readiness watch list.** The article answers "which watches have it" by pointing to owner's manuals. No Garmin model list was captured.
5. **Owner follow-up, outside this run.** https://thereadiness.app/blog/garmin-hrv-apple-health/ is written for 1.1 and will need an update once 1.2.x ships. https://thereadiness.app/blog/what-is-a-readiness-score/ opens with a line about vendor opacity that is broader than this packet supports for Garmin.

No human review is required beyond the release check in item 1.
