# Brief: "what is a good hrv" + "hrv by age" (Readiness Coach / thereadiness.app)

Run: 2026-09-22-what-is-a-good-hrv · Archetype: Custom (approved, Checkpoint A) · Mode: guided · Source presentation: automatic (sparse inline links to primary sources; vendor figures attributed in text)

## 1. Reader contract

**Reader.** A US adult who owns a wearable (Apple Watch, Garmin, Oura, Whoop or Fitbit), has just seen an HRV number in an app, and wants to know whether it is good. Recreational athletes are over-represented; no physiology background.

**Goal.** Leave knowing (a) whether their number is in a normal range for their age, (b) why the number depends on the device and metric, and (c) the reference that actually matters, their own baseline, and how to build one.

**Assumed knowledge.** Can find HRV in their watch app or Apple Health. Knows their age and roughly how they slept.

**Concepts to explain on first use.** HRV (beat-to-beat variation, not heart rate); RMSSD and SDNN (two different calculations, named once, plainly); overnight versus spot readings; baseline; median and percentile; "normal" versus "good".

**Observable success.** After reading, the reader can (1) name which metric their device reports, (2) place their number against the right age row with the table's caveat understood, (3) explain why 65 ms on one device and 41 ms on another can be the same physiology, and (4) start a seven-night baseline and judge a single morning against it, including the two or three everyday causes of a one-day dip.

## 2. Search intent, job, and angle

Both queries want an explainer with a by-age chart; every People Also Ask box is "is [number] good for me?". An AI Overview sits on both and will absorb the generic answer (no universal number, declines with age, use your baseline). The click is earned by what the Overview cannot compress: a sourced table with its provenance, a device decoder, and worked examples for specific numbers.

**Job-to-be-done:** "Tell me whether the HRV number my watch just showed me is good, and what to compare it to."

**Angle (approved):** the honest direct answer first (there is no universal good HRV, and the number depends on device, metric and age more than most articles admit), then the three things the reader needs: a by-age table they can trust, a decoder for their own device, and a baseline method with numbers. The app's open method is one worked example, labelled as the product's convention.

**Contribution versus the benchmark (Whoop #2, Kubios #4, Different Health #6):**
- Whoop: personal-baseline advice with no method; member averages with no sample, date or metric; one uncited sex claim. We give the method and the caveats.
- Kubios: best citations but image-only charts, researcher and chest-strap audience, an uncited "dangerously low" cutoff. We serve the watch owner and refuse uncited cutoffs.
- Different Health: the only real table, verified against its source, but it hides that the data is 10-second daytime ECG from a screened healthy sample, and it wrongly says Apple Watch reports RMSSD. We publish the same table with the provenance stated and the device facts right.
- Nobody: decodes the device, quantifies what moves a single reading, or gives a baseline method with numbers. That is the page.

## 3. Claim and evidence requirements

| Claim territory | Evidence | Handling |
|---|---|---|
| No universal good HRV; large between-person spread | E6 (Nunan, up to 260,000% interindividual variation), E7 | inline link to E7 (open access) |
| RMSSD versus SDNN definitions; norms for different recording lengths are not interchangeable | E7 (quoted) | inline link once |
| By-age RMSSD medians and 2nd to 98th percentiles, women and men | E3 (Lifelines, Table 1) | table with source cell; provenance caveat in prose beside it (10-second resting ECG, daytime, Dutch cohort, excluded CVD, hypertension, diabetes, obesity, beta-blockers, antidepressants) |
| Age decline is consistent across datasets; pattern depends on metric (RMSSD falls faster, then stabilises about 60) | E3, E4, E9, E10 | attributed, one link to E4 abstract |
| Sex differences small and metric-dependent | E3 (women higher RMSSD), E8 (women lower SDNN, higher HF), E9 and E10 (no RMSSD difference) | state the conflict; do not pick a side |
| Apple classic Health HRV is SDNN, sampled while still at scattered times | E13a (quoted), E13b, E20 | inline link to Apple docs |
| Apple Recovery HRV exists on Series 12 and Ultra 4; metric not published by Apple; a third party says RMSSD | E13b, E13c, E19 | attribute; hedge |
| Garmin: overnight RMSSD, 5-minute windows averaged over whole sleep, about three weeks to a baseline, own warning that devices are not comparable | E14 (quoted), E15 | inline link to Garmin page |
| Oura: overnight RMSSD; Whoop: RMSSD weighted toward the last slow-wave sleep; Polar: first 4 h; Fitbit: 5-minute RMSSD | E15, E16, E9 | one link to E15 |
| Whoop members average 65 ms (men) and 62 (women); Oura members 41 ms (6 million, 2026); Apple Watch SDNN users centre in the mid-30s, 18 to 76 ms reference | E18, E17, E19 | attributed as vendor and aggregator figures; never as norms |
| Single readings are noisy; baseline needs at least 7 consecutive days under consistent conditions | E1 (quoted), E11 | inline link to E1 |
| Acute effects: about 12% lower HRV after high alcohol intake, about 10% during sickness, 4.6% with training, 3.2% across the menstrual cycle; HRV "sensitive but not specific" | E10 (quoted) | inline link; state these are group averages from morning smartphone readings |
| Readiness Coach method: 30-day window, usable after 7 nights, drop the lowest 20%, median, deviation scored against a 15 ms spread; population default 55 ms SDNN until then | E21 | attributed as the product's convention; internal link to the scoring article |
| Clinical association: low SDNN linked to higher first-cardiovascular-event risk at population level | E12, E7 | one labelled paragraph; not a wearable threshold, not individual risk; "if it stays low, ask a clinician" |

**Must not appear:** "men have higher HRV"; any ms value called dangerous or alarming for a wearable reading (Kubios's 10 ms, Shaffer's 24-hour 50 ms rule in cardiac patients, Empirical's "below 18 is low" as more than a percentile); "wearables report RMSSD" as a universal; Whoop or Oura averages as population norms; any ranking, traffic or AI-citation promise; medical advice beyond "ask a clinician".

## 4. Headline promise and outline

**Working title:** What is a good HRV? Normal ranges by age, and why yours is the one that matters.

**Promise:** the reader gets a real by-age table, learns what their own device is measuring, and leaves with a way to judge their number that does not depend on strangers' averages.

**Opening move:** the reader's situation (a number on a screen this morning) plus the supported tension: the same person can read 35 on an Apple Watch and 60 on a Whoop. Then the direct answer in one paragraph with its qualifications beside it.

**Lean outline (headings are working labels, not final copy):**

1. **The short answer.** No universal good HRV. Typical adult resting RMSSD medians run from the low 50s in the twenties to around 20 by the sixties (E3), with a spread so wide that the 2nd to 98th percentile for a 40-year-old spans roughly 8 to 120 ms. Your device, the metric it uses, and your age move the number more than your fitness does on any given day. The useful comparison is you against you.
2. **What the number actually is.** HRV plainly; RMSSD versus SDNN in two sentences each (E7); overnight average versus spot sample; why a 10-second ECG, a 5-minute strap reading and a whole-night wearable average are three different numbers (E7 "not interchangeable").
3. **HRV by age: the table, and where it comes from.** The Lifelines medians and percentiles for women and men by five-year bin (E3), with the provenance caveat in the same section. What the table is good for (orientation) and not good for (a target for your watch). Age decline is the one finding every dataset agrees on; the metric changes the shape (E4). Sex: small, inconsistent, say so (E3, E8, E9, E10).
4. **What your device is measuring.** Decoder table: Apple Watch classic HRV (SDNN, spot samples while still, E13a), Apple Recovery HRV (Series 12 and Ultra 4, metric unpublished, E13b, E19), Garmin (overnight RMSSD, 5-minute windows, whole sleep, E14), Oura (overnight RMSSD, E16), Whoop (RMSSD weighted to last slow-wave sleep, E15), Fitbit (5-minute RMSSD, E9), Polar (first 4 h, E15). The illustration: Whoop 65/62, Oura 41, Apple mid-30s (E18, E17, E19) and why that is not three different fitness levels. Garmin owners: internal link to the Garmin-to-Apple-Health article.
5. **So what is a good HRV for you?** Higher than your own baseline, stable or rising. Baseline method with numbers: same device, same window, at least seven consecutive nights (E1); Garmin uses about three weeks (E14); Readiness Coach's convention as a worked example (E21, internal link to the scoring article). Reading one morning: the acute-effect sizes (E10) and the rule that one reading is never graded. Worked examples: "43 ms on a Garmin at 45", "26 ms on an Apple Watch at 58", "87 ms on an Oura at 30", each answered as metric, age row, and baseline.
6. **When a low or high reading matters.** Labelled paragraph: population-level association between low SDNN and cardiovascular risk (E12), why that is not a wearable threshold, the two honest triggers (persistently far below your own baseline for weeks; a reading that is suddenly far higher, which can be a rhythm artefact rather than fitness, E25 lead only, phrase as "can be"), and "ask a clinician" as the action. Nothing else clinical.
7. **Next step.** One paragraph: once you know what your number means, the daily decision is a separate question; internal link to the HRV training protocol. Product CTA after the editorial conclusion, per links doctrine.

Q&A: fold the numeric PAA questions into section 5's worked examples rather than a separate FAQ block, unless the writer finds a compact three-question FAQ genuinely helps scanning.

## 5. Internal links (earned placements)

- /blog/what-is-a-readiness-score/ in section 5, at the worked example of the app's baseline method (anchor on the method, not the product name).
- /blog/garmin-hrv-apple-health/ in section 4, Garmin row.
- /blog/hrv-training/ in section 7, the next step.
- /blog/how-much-sleep-for-recovery/ optional in section 5 where sleep is named as a mover; skip if it crowds the passage.
- Home page only in the CTA block.

## 6. Exclusions

- No how-to-improve-HRV content beyond naming the everyday movers with their effect sizes; that is a separate planned article.
- No training-decision protocol; link to the existing How-to.
- No cycle-phase coaching beyond the 3.2% figure in context; separate planned article.
- No Reddit quotations (content not captured).
- No Kubios PNS index, no BodySpec status tiers, no vendor by-age charts reproduced.

## 7. Article-specific acceptance checks

1. Every number in the by-age table matches E3 Table 1 and the provenance caveat sits in the same section.
2. Each device row cites official documentation or a validation study; Apple Recovery HRV's metric is hedged.
3. The Whoop and Oura figures appear only with "reports" or "says" and the measurement note.
4. The sex-difference passage states the conflict and does not resolve it.
5. The clinical paragraph is labelled, population-level, and ends in "ask a clinician".
6. Every worked example answers with metric, age row and baseline, and none grades a single reading.
7. No em dashes or en dashes anywhere; numeric ranges use "to"; hyphens only inside compound words.
8. Internal links appear at the placements above with accurate anchors; no link list at the end.
9. The article makes no ranking, traffic or AI-visibility claim and no medical claim beyond E12 as bounded.

## 8. Voice notes for the writer

Plain, direct, expert helping a friend read a screen. Judgments stated then evidenced. Keep the tension visible: population tables are useful and misleading at once. Editorial presence comes from the device decoder, the provenance caveat nobody states, and the refusal to grade a single number. No manufactured anecdotes, no first person.
