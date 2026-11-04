# QA: why-is-my-hrv-so-low (2026-11-02)

## 1. Final status

**Pass.** There is one pre-publish check in §4.

| Item | Value |
|---|---|
| Writer | native, a2a5932d93d8517b8, claude-opus-5-5 |
| Editor | native, a3fd865126cc43fe9, claude-opus-5-5; ran the edit, humanize and QA stages |
| Profile and doctrine | bundled; doctrine sha256 8a473bcf…a711c5 |
| Source mode | automatic, plus the owner's rule that every statistic is linked |
| Pre-humanize file | sha256 946e3054…1f6dea, relinked under orchestrator corrections |
| article.md | sha256 4d4a390b…64480f, about 3,037 body words |

All ten checks in brief §7 pass.

## 2. Material claim, route and citation exceptions

- **Repeated statistics are now linked.** Later restatements of figures from E3 (sickness and training-day cells, the 6% heart-rate figures, the 28,175-user correlation) and E64 (per-device errors) originally referred back to an earlier link. Under the orchestrator's correction, each now carries its own link. E3 appears 5 times and E64 twice. I judge this compliant with the every-statistic-linked rule. The "12% and 10%" in the resting heart rate check sit in the same sentence as a linked "that dataset".
- **Final relinks (orchestrator).** The altitude subsection's "fell more above 3,500 m" now links E55, and the Garmin convention bullet now links E61 where the 3-week and 7-day figures first appear in that section. Both were link-only changes, made identically in the pre-humanize file and in article.md.
- **Conventions are attributed in words, not linked.** These are vendor conventions, not research statistics, and they are labelled as conventions:
  - Polar's 28-day advice (E46, a lead-only record on a competitor page).
  - WHOOP's deepest-sleep sampling (E63, also a competitor page).
- **Claim fixes made at Stage 5:**
  - E5 is now framed as one drink above a person's usual average versus one below.
  - E24 now says HRV changed in most studies, most often as lower parasympathetic activity.
  - Illness timing is now "before a positive test" (E50).
  - E73's call-your-provider advice is limited to palpitations that get worse or more frequent.
  - E53 was rescoped.
  - The E3 d-value comparison with altitude was cut, as was the Apple Watch short-night inference.
- **Humanize pass:** wording and bold formatting only. No claim, number or link changed.
- **Product claims** are limited to E36, E75 and the intake's Apple Health and Garmin data sources.

## 3. Mechanical result

`runtime.py qa` passed with no reasons. Structure, dates, entities, numbers and URLs are preserved. There are no duplicate or self-referential internal links. The only repeated links are E3 (5), E64 (2), E55 (2) and E61 (2), all external and deliberate. There are zero em dashes, en dashes or minus signs.

## 4. Reader-visible limitations and pre-publish checks

- **Mixed evidence, stated in the article.** The ranking mixes units and settings. Heat and altitude evidence comes from lab and expedition studies, and the overnight effect of heat is unknown. Sleep loss and stress have direction only. The trend case covers two athletes.
- **Overlap with the how-to-increase-hrv sibling.** The fit-but-low answer repeats the sibling's E26, E3 and elite-paradox material. Saturation (E69) is the new material. Ahrefs groups this cluster with the sibling's parent topic, so watch for cannibalization.
- **Unverified owner statements.** E75 is an owner statement not checked on device. The E36 constants come from published posts.
- **Pre-publish check:** at publish, confirm that the App Store short link redirects (it returned 301 on 2026-11-02) and that the how-to-increase-hrv page is live.
