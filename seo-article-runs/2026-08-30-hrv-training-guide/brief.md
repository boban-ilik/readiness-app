# Brief — "hrv training" how-to (Readiness Coach / thereadiness.app)

Run: 2026-08-30-hrv-training-guide · Archetype: how-to (approved, Checkpoint A) · Mode: guided

## 1. Reader contract

**Reader.** A recreational-to-serious athlete (runner, cyclist, lifter, triathlete) in the US who already owns a wearable that records overnight HRV — Apple Watch, Garmin, or similar — and sees an HRV number most mornings without knowing what to do with it.

**Goal.** Wake up, look at this morning's HRV, and decide today's session with a method they can inspect and reproduce — not a proprietary colour from a vendor app.

**Assumed knowledge.** Trains several times a week; knows what intensity, volume, and a rest day are; can find HRV in their watch app or Apple Health. No physiology background assumed.

**Concepts that need explanation on first use.** HRV itself (beat-to-beat variation, not heart rate); RMSSD/lnRMSSD (name it once, plainly); autonomic nervous system (sympathetic/parasympathetic in one breath each); baseline and deviation; why population norms mislead.

**Observable success.** After reading, the reader can (a) compute a personal baseline from 7+ consecutive mornings of their own data, (b) classify today as green / amber / red against that baseline, and (c) pick a session consistent with the classification — and knows the specific situations in which they should distrust the number.

## 2. Search intent, job, and angle

Head query "hrv training" (US) mixes two intents — *train by HRV* (HSS #5, TrainingPeaks #9, Kubios #10) and *improve my HRV* (sbphysio #2, elitehrv #8, all four PAA questions). An AI Overview sits on the SERP, which rewards pages that contribute a usable protocol rather than definitions the Overview can paraphrase.

**Job-to-be-done:** "turn the HRV number my watch already gives me into a daily training decision."

**Angle (approved):** an open-math daily decision protocol — every rule expressed in data the reader owns, every threshold explained, every citation real — plus the failure modes no competitor covers. Secondary intent served by one compact, cited section on raising baseline HRV (boundary in §6).

**Contribution vs benchmark (all four captures):**
- HSS (#5, DR80): wins on institutional credentials — we do not contest that. It has zero citations, no baseline math, a decision rule that never exceeds "high day = harder, low day = stretch", uncited population ranges that contradict its own baseline-first advice, and a pre-wearable measurement framing. We win on evidence, protocol, and the overnight-wearable workflow.
- Whoop: four named training states but locked to its proprietary Recovery score and $30/mo hardware; argues readers away from raw HRV with an uncited vendor claim (must not be repeated as fact — E8).
- Oura: correct heuristics, no numbers, no protocol, ends in "Shop Now".
- TrainingPeaks (Wegerif): only cited competitor; theory strong, core text 2016, chest-strap workflow, no daily protocol.

Nobody on the SERP gives: reproducible baseline method + explicit deviation branches + cited failure modes + works-with-what-you-own. That is the entire page.

## 3. Claim and evidence requirements

| Claim territory | Evidence | Handling |
| --- | --- | --- |
| Baseline needs 7+ consecutive days, consistent conditions | E1 (Sensors 2025, quoted) | inline citation |
| Ultra-short measurement protocol; RMSSD/lnRMSSD | E1 | inline |
| Single readings are noisy; trends over points | E1 (quoted) | inline |
| Wearables sample HRV in deep sleep; consistency matters | E2 (JFMK 2024, quoted) | inline |
| Resistance training suppresses HRV ~48h+; individual recovery varies; HRV-guided lifting plausible | E2 (quoted, §4.2/§6.2) | inline |
| Falling HRV can flag overreaching; in aerobic athletes pair with secondary markers | E2 Guideline 3 (quoted) | inline |
| Paradoxical HRV rise in overtrained athletes | E2 — **scope strictly to highly trained endurance athletes** | inline, scoped |
| HRV-guided endurance training matched/beat predefined plans (Kiviniemi 2007) | E5 — **partial access**: general finding only, framing attributed via the review; **no effect sizes, no VO2 numbers** | narrow claim or drop numbers |
| Alcohol raises nocturnal RHR (63.6→66.6 bpm, p<0.001, fixed 3-day dose) | E4 (Nutrients 2025 — journal name is Nutrients, not J Clin Med) | inline; HRV sentence in that paper is discussion, not a measured outcome — do not cite it for HRV |
| Adults need 7+ hours sleep | E3 (AASM/SRS consensus) | inline; link the verified PMC/DOI URL, not the JS-challenged jcsm.aasm.org one |
| Readiness Coach weights 45/40/15, personal baselines, 7-day calibration | E7 (first-party) | attributed as our product's documented method; disclosure required |
| "Good HRV by age" population tables | E11 — HSS's uncited ranges are claims, not facts | answer the PAA with baseline-first logic; do not print a population table |

Vendor claims register (E8): Whoop's "more predictive than raw HRV" and similar stay unrepeated or explicitly labelled vendor claims. No invented sources, stats, quotes, anecdotes, or hands-on testing.

## 4. Headline promise and outline

**Working title:** *How to Train With HRV: A Daily Decision Protocol You Can Actually Check*
(H1 promise = a protocol, checkable, daily. Meta description drafted at write stage from the same promise.)

**Opening move.** Reader's situation, then the boundary: the morning glance at a number — "HRV 52. Is that good?" — and the honest answer that the number is meaningless without *your* baseline; promise the protocol and name what the page won't do (diagnose anything, sell a wearable). Early payoff: the three-branch decision rule visible within the first two screens.

**Outline (lean; headings will describe real boundaries, not template labels):**

1. **What HRV actually measures** — beat-to-beat variation, ANS in two sentences, RMSSD named once; why higher-than-*your*-normal ≈ recovered, lower ≈ stressed. (E1, E2)
2. **What you need before this works** — prerequisites: a device that records overnight HRV; where the number lives (Apple Health); the Garmin exception → internal link garmin-hrv-apple-health; 7+ mornings of patience. (E1, E2)
3. **Step 1 — Build your baseline** — 7+ consecutive days, consistent conditions; wearables sample deep sleep, so overnight readings are fine; observable check: you have a 7-day average you can state. (E1, E2)
4. **Step 2 — Read today against your baseline** — deviation logic in plain terms; green (within/above normal range) / amber (modestly below) / red (well below, or several low days) ; note on unusually *high* spikes. Observable check: today classified. (E1)
5. **Step 3 — Decide the session** — branch table: green = planned session incl. hard days; amber = keep the session, cut intensity or volume; red = recovery work or rest; borderline rule: consult secondary markers (sleep hours, RHR, how you feel) per E2 Guideline 3; strength-training note (48h suppression, E2). Worked example thread starts here (one runner, one week of numbers — hypothetical and labelled as such, not an invented anecdote).
6. **Step 4 — Verify over weeks** — trends not single days (E1); what four good weeks looks like; the Kiviniemi finding with careful framing (E5); when to stop trusting the protocol and see a professional (illness, persistent decline).
7. **When HRV lies to you** — the centrepiece: single-reading noise (E1); alcohol the night before (E4, with the measured RHR numbers); illness/stress confounders; paradoxical high HRV in overreached *endurance* athletes (E2, scoped); RMSSD's limits (E1). Placement immediately after the protocol so the rules can't be applied naively.
8. **Raising your baseline HRV** — compact and bounded (§6): sleep 7+ h (E3 → internal link how-much-sleep-for-recovery), alcohol (E4), sensible load management (E2). Three levers, cited; explicitly *not* a 12-hacks listicle.
9. **Quick answers** — PAA-shaped Q&A, baseline-first: "What's a good HRV for my age?" (population tables mislead; E1/E11, politely contra the uncited ranges elsewhere); "Is 37 a low HRV?" (same logic); breathing exercises (acute vs baseline distinction — only if supportable from E1/E2, else drop). VO2max question dropped: evidence too thin (E5 partial).
10. **One way to run this every morning** — disclosure-forward close: Readiness Coach is our app; it operationalises exactly this method with published weights (E7 → internal link what-is-a-readiness-score); free core score, first week fully unlocked; wellness-not-medical disclaimer. CTA to App Store. The protocol above must remain fully executable without the app.

## 5. Internal links and citation display

Internal (verified 200): garmin-hrv-apple-health (§2, prerequisite exception), how-much-sleep-for-recovery (§8), what-is-a-readiness-score (§10 worked-method link), App Store (§10 CTA only). Home page: skip. No link stacking; anchors descriptive.

**Source presentation: inline** (site convention; matches existing posts). External citations: E1, E2, E3 (PMC URL), E4 — the four load-bearing sources, linked at first decisive use. E5 referenced through the E1 review's framing.

## 6. Scope boundaries and exclusions

- Improve-HRV section stays ≤ ~200 words, three cited levers, no supplement/biohack content, no breathing-protocol how-to (acute HRV ≠ baseline HRV unless evidence says otherwise).
- No population HRV-by-age tables presented as guidance.
- No device reviews, comparisons, or "best wearable" content.
- No medical, diagnostic, or treatment claims; general-wellness disclaimer near the product close.
- No effect sizes or numbers from Kiviniemi 2007 (partial access).
- No first-person testing claims; the worked example is a labelled hypothetical.
- Product appears in §2 (implicitly, via data location), §10 (explicitly, disclosed). Nowhere else.

## 7. AI visibility

Self-contained early answer (the three-branch rule stated compactly near the top), explicit entities (RMSSD, autonomic nervous system, named journals), primary-source links beside claims, honest uncertainty kept visible (endurance-athlete paradox, Kiviniemi access limits). Q&A section gives the AI Overview extractable, correctly-scoped answers with our framing.
