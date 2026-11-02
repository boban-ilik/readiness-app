# Brief: "signs of overtraining" + "overtraining symptoms" + "how to recover from overtraining" (Readiness Coach / thereadiness.app)

Run: 2026-11-02-signs-of-overtraining · Archetype: Custom, diagnostic explainer with a bounded recovery plan (approved automatically at Checkpoint A; runner-up How-to) · Mode: automatic · Source presentation: automatic (sparse inline links to primary sources; every statistic and study linked to its source) · Target URL: https://thereadiness.app/blog/signs-of-overtraining/ · Frontmatter exactly: `title`, `description`, `pubDate: 2026-11-02`; no H1 in the body (the site renders the title).

## 1. Reader contract

**Reader.** A US recreational runner, lifter, cyclist or triathlete who trains most days, wears a Garmin, Apple Watch, Oura, Whoop or similar, and feels flat, tired or slower; the watch may show lower HRV, higher resting heart rate or "Unbalanced"/"Overreaching". No physiology background.

**Goal.** Find out whether this is overtraining, which signs actually mean something, what to do now, and how long until they are back.

**Assumed knowledge.** Can find HRV, resting heart rate and sleep in their watch app or Apple Health; knows roughly how they have trained and slept recently.

**Explain on first use.** Functional overreaching, non-functional overreaching and overtraining syndrome (in plain words, defined by how long performance takes to come back); baseline; weekly average versus single morning; RMSSD and SDNN only where a device passage needs them (one clause each, link out for more).

**Observable success.** The reader can (1) sort their signs into measured and felt and say how much to trust each; (2) explain why a rising HRV or flat resting heart rate does not rule out overreaching; (3) run a short self-check; (4) give an honest time frame per tier with its evidence quality; (5) follow a recovery plan with a clear see-a-doctor rule.

## 2. Search intent, job, and angle

The cluster (signs of overtraining, overtraining symptoms, how to recover from overtraining) wants a symptom list plus "is it this?" and "how do I fix it?". An AI Overview tops both SERPs and will absorb the generic list; the click is earned by measured sizes, the "wrong way" findings, time frames with evidence quality, and a usable self-check.

**Job-to-be-done:** "I feel flat and my numbers look off. Tell me if this is overtraining, which signs to trust, what to do, and how long it takes."

**Angle (user-supplied, binding, sharpened at Checkpoint A):** split the signs a wearable measures (resting heart rate, HRV, sleep, heart rate at a fixed effort) from those only the athlete notices (performance, effort, mood, motivation, appetite, illness). The common expectation is "resting heart rate up, HRV down, sleep worse"; the evidence says the measured signs are small, inconsistent and sometimes reversed, while the felt signs, above all a performance drop and a mood shift, are more sensitive and the only diagnostic ones. No validated wearable threshold exists; say so. Time frames are consensus definitions built mostly from overreaching studies; label them. One honest product mention near the end.

**PAA to answer in-article (no separate FAQ unless it clearly helps):** "What are 10 signs that I might be overtraining?" (the table); "What is stage 3 overtraining syndrome?" (a popularisation of a sympathetic vs parasympathetic symptom table, not the consensus classification); "Can overtraining cause anxiety?" (mood disturbance is a core criterion); "How do I fix overtraining?" (recovery); "How to avoid overtraining?" (short prevention passage).

**Contribution versus the benchmark (Cleveland Clinic #2, HSS #5, NASM #6; research.md §3):** all three list signs, say "weeks to months" without evidence and say rest. None separates measured from felt, gives sizes, says the measured signs can go the wrong way, states time frames with evidence quality, says plainly that no single marker is diagnostic, gives a self-check, or decodes device labels. That is the page. Keep the shared coverage readers expect (overreaching distinction, fatigue, performance, sleep, mood, resting heart rate, illness, appetite and weight, soreness, rest and gradual return, nutrition, see a professional).

## 3. Claim and evidence requirements

Link each study at its decisive use, once per URL (the QA gate fails duplicate URLs). Use the ledger's display URL (PubMed or PMC page) where one exists, else its source_url (DOI, vendor page). Never link the third-party PDF copy of E1; use its PubMed page.

| Claim territory | Evidence | Handling |
|---|---|---|
| Three tiers defined by recovery time: functional overreaching (days to weeks, about 2 weeks in studies, performance then improves), non-functional overreaching (weeks to months), overtraining syndrome (months, possibly years) | E1, E2, E15 | Label as consensus definitions; say most research is on overreaching because OTS cannot be induced ethically; Kreher's 14 to 21 days boundary is "used by some" |
| Diagnosis: only certain sign is a performance decrease; no single marker meets the criteria; diagnosis is by exclusion and often retrospective | E1, E2, E7 | State once, early and plainly |
| "Stage 3" model and Cleveland's 100/60 bpm figures are not overtraining thresholds; a resting HR under 60 is ordinary in trained people | E1, E2, E29 | Answer the PAA neutrally; describe what the consensus uses instead; do not name or attack Cleveland Clinic in a hostile tone (naming once is acceptable) |
| No simple blood or urine test; resting hormones mostly normal | E1, E2, E17 | One or two sentences |
| Prevalence: about 10% per season (range 7 to 21%) in collegiate swimmers and endurance athletes; career rates 60% (female) and 64% (male) in elite runners and 33% in nonelite adult runners; 29% of young English athletes at least once | E1, E14 | Optional, short, scoped to those groups; never "X% of athletes" or "one-third of all runners"; nothing about recreational adults beyond the runner figure |
| Resting HR: up about 4.5 bpm on average after overload blocks under 2 weeks, no change after longer blocks; not consistent in OTS; changes may sit inside day-to-day noise; max HR lower | E1, E32, E31 | Inline link E32 (and E1 for the bpm figure); say the 10 bpm single-morning rule seen online has no basis in this research |
| HRV: resting HRV "largely unaffected" by overreaching (meta-analysis), small rise when performance fell; weekly-averaged RMSSD rose and resting HR fell in functionally overreached triathletes (performance down 9.0%), reversed by taper; RMSSD likely rose in cyclists after 2 weeks heavy training; in one NFOR case the 7-day average and its variability fell | E3, E6, E8, E9 | The core correction; E9 is a single case; link how-to-increase-hrv for other causes of a low reading |
| Day-to-day noise: about 10% for resting HR and about 12% for Ln rMSSD in short morning recordings; averaging at least 3 to 4 days needed to see the change | E5, E6 | Scope: 5 to 10 minute morning recordings in athletes, not overnight wearables; say so |
| Sleep: in functionally overreached triathletes, sleep duration down 7.9% and efficiency down 1.6%, reversed in taper; half the overload group did not overreach; in cyclists, sleep efficiency 83.1% to 77.8% over 9 days intensified training despite more time in bed | E10, E11 | Modest but consistent; link sleep article |
| Felt signs: performance; increased sense of effort; mood shifts within 2 days of intensified training, dose-response; subjective measures more sensitive and consistent than objective ones in 22 of 54 studies, and where they differed 85% favoured subjective | E1, E2, E12, E13 | Inline link E12 at the "more sensitive" claim |
| Depression and anxiety: depression rises least in overload and most in OTS; "up to 80%" show signs of clinical depression in one report of affected athletes | E1, E12 | 80% figure only scoped "in one report cited by the consensus statement" or omit; anxiety: listed in symptom tables (E2) and MedlinePlus list (E30) |
| Illness: URTI 67% vs 22% vs 11% (overreached vs fatigued-but-not-overreached vs control) in one study; most elite athletes are not sicker than the general public overall, symptoms cluster around heavy training and competition | E10, E18 | Suggestive, not diagnostic |
| Appetite, weight loss, missed periods | E1, E2, E16, E30 | A medical boundary under REDs, not an overtraining threshold |
| Recovery: reduced training may be enough for overreaching; treat OTS with rest; resume individually because "there is no definitive indicator of recovery"; build volume before intensity, 5 to 10 minutes daily up to an hour (Kreher, for NFOR/OTS) | E1, E2 | HSS's 50 to 60% cut and 10% weekly increase only as "one hospital's rule of thumb", or omit |
| Carbohydrate and energy: in one cyclist study a high-carbohydrate diet reduced the severity of overreaching and performance recovered better after 2 weeks; athletes in hard training tend not to raise food intake | E1, E11 | Describe the study; no gram-per-kilo prescription presented as advice |
| Prevention: daily training log including how you feel; adjust load or rest when performance drops; avoid monotony; life stress adds to training stress; mood-based load changes cut swimmer burnout from 10% to zero in one study | E1, E2 | Short |
| Lay rule: rest or cut back for 1 to 2 weeks; still tired after that, see a provider | E30 | Include, labelled as US government patient guidance (MedlinePlus); consistent with the two-week overreaching window (E1). Decision on research §10 question: include. |
| Doctor boundary: unexplained underperformance needs exclusion of anemia and iron deficiency, thyroid, adrenal, diabetes, infections (including glandular fever), eating disorders | E1, E16 | Short, not diagnostic |
| Garmin: HRV Status labels are seven-day averages against your range (Unbalanced = above or below); about three weeks of overnight wear; Training Status "Overreaching" is a load-and-trend label; Garmin says abnormally high HRV relates to functional overreach | E19, E20, E21 | Vendor claims, attributed; not the consensus diagnosis. E21 not re-fetched: keep wording close to the record |
| Apple Watch: SDNN from intermittent background readings plus Breathe sessions | E22 | One sentence; link what-is-a-good-hrv |
| Readiness Coach: compares HRV and resting HR with your own 30-day baselines and scores sleep; deviations lower the score; stacked with short sleep the day drops to Easy Day or below | E25, E26 (core checked by orchestrator on live `main`: same weights, 30-day baselines, tiers) | One product paragraph; say what it cannot see (performance, mood); no tier promised for a specific deviation; no Garmin direct-sync claim |

**Must not appear:** a diagnostic wearable threshold; "resting heart rate goes up" as reliable without the evidence; numbered stages as a classification; blood or urine markers as signs; prevalence generalised to recreational athletes; unsourced percentages (50 to 70%, roughly a third, 20 to 60%); Whoop or Oura methods; diagnosis beyond "see a doctor"; first-person experience; em or en dashes.

## 4. Headline promise and outline

**Title (frontmatter):** "Signs of overtraining: the ones your watch can see, the ones it can't, and how long recovery takes" (user-supplied working title; writer may tighten only if the body requires it).

**Description:** about 150 to 160 characters; names the measured vs felt split and recovery time frames.

**Opening move:** the reader's situation (flat legs, slower splits, an off number or watch label) and the reframing tension: the signs a watch measures are checked first and are the least reliable; the defining sign is a performance drop rest does not fix. Early payoff: direct answer plus the measured-vs-felt table.

**Lean outline (headings are working labels):**

1. **Opening + direct answer**, then the table: sign, can a watch measure it, what studies found (direction, size), how much to trust it. Answers "10 signs".
2. **Overreaching vs overtraining syndrome.** Tiers by recovery time (consensus convention); most of what recreational athletes call overtraining is overreaching; "stage 3" answer; no single test, diagnosis by exclusion, often in hindsight. Optional scoped prevalence.
3. **Signs your watch can see.** Resting HR, HRV, sleep, HR at a fixed effort and max HR: expectation, measured size, why it can go the other way, noise. How to read them: weekly averages of 3 to 4+ readings against your own baseline. Links: how-to-increase-hrv, how-much-sleep-for-recovery.
4. **What your watch's labels mean.** Garmin HRV Status and Training Status, Garmin's high-HRV note, Apple Watch SDNN plus Breathe; none is a diagnosis. Link what-is-a-good-hrv; garmin-hrv-apple-health optional.
5. **Signs only you notice.** Performance (the only certain sign); harder effort; fatigue, vigor, mood (fast, dose-dependent, more sensitive); anxiety and depression; motivation; appetite and weight; soreness; colds (ISEI caveat).
6. **Self-check.** Ordered: fixed-effort test; consensus checklist; weekly averages; other explanations. Branches: bounces back within about 2 weeks of reduced training (functional overreaching) or not (sections 7 and 8).
7. **How long recovery takes, and how to recover.** Time frames per tier with evidence quality. Plan: cut load or rest; eat enough, especially carbohydrate; sleep; trim other stress; return gradually, volume before intensity. Prevention in a few lines. Link hrv-training.
8. **When to see a doctor.** Short sourced list.
9. **Where a readiness app fits.** One paragraph per section 3 product row; links: what-is-a-readiness-score, App Store once.

Length follows the job (roughly 2,500 to 3,300 words). Short paragraphs for phones.

## 5. Internal links (each URL at most once, full URLs)

- https://thereadiness.app/blog/how-to-increase-hrv/ in section 3 at the HRV sign (other causes of a low reading).
- https://thereadiness.app/blog/how-much-sleep-for-recovery/ in section 3 at the sleep sign, or section 7 at sleep (one place only).
- https://thereadiness.app/blog/what-is-a-good-hrv/ in section 4 (what each device reports).
- https://thereadiness.app/blog/garmin-hrv-apple-health/ optional in section 4.
- https://thereadiness.app/blog/hrv-training/ in section 7 (the daily decision once back in training).
- https://thereadiness.app/blog/what-is-a-readiness-score/ in section 9.
- https://apps.apple.com/app/id6760478506 once, in section 9.

## 6. Exclusions

- No HRV by-age table, device decoder detail or baseline protocol (sibling articles own them); no repeat of how-to-increase-hrv's dip table.
- No Reddit, Hoag, Whoop or Oura material (not captured).
- No training plan or deload percentage presented as evidence-based; no supplement advice.
- No lab values or diagnosis; no hostile competitor takedowns.

## 7. Article-specific acceptance checks

1. Every sign says whether a watch can measure it and how much to trust it.
2. Resting HR and HRV passages state the "other way or flat" evidence with sizes and links.
3. No wearable threshold presented as diagnostic; 10 bpm and 100/60 bpm claims corrected.
4. Tier time frames carry the consensus-convention label.
5. "No single marker; performance is the only certain sign; diagnosis by exclusion" stated once, clearly.
6. Self-check has ordered steps and two branches; doctor boundary short and sourced.
7. Every statistic and study linked; each URL once; noise figures scoped to morning recordings.
8. One honest product paragraph after the editorial conclusion, naming what the app cannot see.
9. No em or en dashes; ranges use "to"; frontmatter exactly title, description, pubDate: 2026-11-02; no H1.
10. The four primary PAA questions and "how to avoid overtraining" answered.

## 8. Voice notes

Plain and direct, a coach helping a friend read their week. Judgments stated, then evidenced; the watch is useful and is the weaker half. No invented anecdotes, first person, hype or scare tone.
