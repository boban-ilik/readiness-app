# Brief: "how to increase hrv" + "how to improve hrv" (Readiness Coach / thereadiness.app)

Run: 2026-09-25-how-to-improve-hrv · Archetype: How-to (approved, Checkpoint A) · Mode: guided · Source presentation: automatic (sparse inline links to primary sources; vendor figures attributed in text) · Target URL: https://thereadiness.app/blog/how-to-increase-hrv/

## 1. Reader contract

**Reader.** A US recreational athlete with a Garmin, Apple Watch, Oura, Whoop or similar whose HRV looks low or has been falling, and who wants to raise it. No physiology background; some are "fit but low" and confused by it.

**Goal.** Leave with a plan: what pulls their number down and how much, what raises their baseline and how long it takes, what only changes the number while they are doing it, what to ignore, and how to tell in a few weeks whether anything worked.

**Assumed knowledge.** Can find HRV in their watch app or Apple Health; knows roughly how they slept and trained this week.

**Explain on first use.** Baseline; acute dip versus baseline change; in-session effect; day-to-day noise; weekly average.

**Observable success.** After reading, the reader can (1) say whether today's low number is actually low for them, (2) name the likely cause of a one-night dip and its typical size, (3) pick the one or two changes most likely to raise their baseline and give them a realistic time frame, (4) explain why a breathing session or a cold plunge can make the number jump without changing their baseline, and (5) run a four-week check with weekly averages and know what to do if nothing moves.

## 2. Search intent, job, and angle

The cluster (increase 4,800, improve 4,300, raise 1,200, why is my HRV low 350, improve HRV score 400; one SERP) wants a practical list of what raises HRV. The AI Overview on both queries absorbs the generic list; the click is earned by sizes, time scales, in-session versus baseline effects, source checks, and a way to tell change from noise. PAA to answer in-article: "Why is my HRV so low even though I'm fit?" and "Can low HRV be reversed?". Number-anxiety PAA ("Is 22 bad?", "Why only 28/30?") belongs to /blog/what-is-a-good-hrv/; link there.

**Job-to-be-done:** "My HRV is low. Tell me what actually raises it, how much, how fast, and how I'll know it worked."

**Angle (approved):** HRV moves in three different ways, and most advice mixes them up. Some things pull it down for a night or a few days (alcohol, illness, lost sleep, a hard session, the luteal phase), some raise your baseline over weeks (aerobic training; weight loss if you carry excess weight), and some raise it only while you do them (slow breathing, cold water after exercise). Fix the dips first, build the baseline second, use in-session tools for what they are, ignore what fails, and judge the result with weekly averages against your own baseline. Evidence strength and sizes are given for each lever inside the steps.

**Contribution versus the benchmark (Polar #6/#2, UCF Health #7/#9, Different Health #9/#6):** Polar is baseline-first but its cited studies do not say what the page says (research.md §3). UCF has no citations and sells box breathing as raising HRV. Different Health is the strongest page and already ranks by evidence, so ranking is shared ground; it misattributes its alcohol study, omits that exercise trials give no millisecond estimate and that older adults respond less, and omits the null breathwork RCT. None separates the three kinds of change, gives sizes a reader can compare with their own drop, says what cannot be moved, warns that a rise can be contamination or overreaching, or gives a numeric check. That is the page.

## 3. Claim and evidence requirements

| Claim territory | Evidence | Handling |
|---|---|---|
| Alcohol lowers overnight HRV, dose-dependently: about 2, 6 and 13 ms lower RMSSD in the first three hours of sleep after low, moderate, high intake (4,098 people, within-person) | E4 (quote verified by orchestrator against PMC5878366) | inline link; state "first three hours of sleep"; translate doses with E40 as approximate drinks for a 70 kg person, labelled approximate |
| About 3.3 to 3.8 ms lower HRV per extra drink versus personal average; earlier drinking and more post-drinking sleep reduced the effect | E5 (Grosicki 2026, WHOOP members, PLOS Digital Health) | attribute ("in data from about 21,000 WHOOP members"); one link |
| Group-average acute sizes: about 12% lower after high alcohol, 10% during sickness, 4.6% change with training, 3.2% across the cycle; HRV "sensitive but not specific" | E3 (Altini & Plews 2021) | attribute; do not repeat the "reading one morning" section of what-is-a-good-hrv; use for ranking dips |
| Intense exercise lowers vagal HRV for 24 to 48 h | E10 | state; schedule-aware advice, not "avoid hard sessions" |
| Sleep deprivation lowers RMSSD in an RCT meta-analysis; adding sleep above need raising HRV is not established | E13 | say both halves; link to sleep article for the 7-hour guideline |
| Luteal-phase vagal HRV is lower | E28, E3 | context, not a lever; no cycle coaching (separate planned article) |
| Acute stress lowers parasympathetic HRV; stress programmes raising baseline not established here | E24 | say both halves |
| Exercise training over 4+ weeks raises SDNN and RMSSD in RCT meta-analyses; no millisecond estimate; smaller response in older adults; larger 2025 meta-analysis heterogeneous | E6, E7, E8, E9 | inline link to E6; never promise "+X ms in Y weeks" |
| Weight loss improves HRV in most studies of adults with overweight or obesity; no pooled size | E22 | conditional ("if you carry excess weight"); weak-to-moderate label |
| Slow breathing (about 6/min) raises HRV during and just after; a month of daily breathwork did not change overnight WHOOP HRV in an RCT (Huberman senior author) | E14, E15 (quote verified by orchestrator against PMC9873947), E16 | inline link to E15; phrase as what the study measured, not a takedown; name Huberman once, factually |
| Apple Watch writes an HRV sample to Apple Health during each Breathe session | E29 (Apple white paper, quoted) | general Apple Health caveat only; must not say or imply that Readiness Coach filters these out (open product issue, E35) |
| Cold water speeds post-exercise vagal reactivation but did not change waking HRV; one small study lower RMSSD in early deep sleep after whole-body immersion | E17, E18, E19 | in-session / overstated section |
| Fish oil does not change RMSSD or SDNN (meta-analysis of RCTs); caffeine does not change post-exercise HRV recovery | E20, E21 | overstated section; do not claim "no evidence" for magnesium, ashwagandha or other supplements by name (not researched) |
| Polar's weighted-blanket, leafy-greens and hydration claims overreach their own studies | E31, E30, E23 | describe what each study measured; attribute to "one vendor guide" or Polar by name once; neutral tone |
| Hydration: weak evidence (daytime heat-exposure trials) | E23 | weak label |
| HRV falls with age; heritability 18% (10-second ECG, 149,067 people) to 40% to 48% (24-hour RMSSD, twins) | E27, E26 | "what you cannot move"; answers "fit but low" |
| In elite endurance athletes HRV can fall while fitness rises, and rise with overreaching | E12, E2 | scoped to elite athletes; one paragraph |
| Day-to-day wobble: CV for rMSSD about 12% in short morning recordings; no validated threshold; roughly 6 ms on a 50 ms baseline | E10, E41 | "roughly", with the caveat; illustration labelled |
| Average at least 3 readings a week; weekly averages; baseline at least 7 days | E11, E1 | verification step |
| Readiness Coach convention: 30-day trimmed median baseline (drop lowest 20%), needs 7 nights, deviations scored against a 15 ms spread | E36 | labelled as the product's convention, one short worked example in the verification step; internal link to the scoring article |
| Cycle-phase baselines in the app | E37 | omit unless 1.0.3 has shipped when this publishes (orchestrator checks at publish) |
| Persistent unexplained drop over weeks, or symptoms: see a doctor | E33, prior article's clinical section | one short boundary with a link; no diagnosis |

**Must not appear:** any promised millisecond gain or week count as fact ("weeks to months" is an allowed interpretation, labelled); "breathing raises your HRV" without the in-session qualifier; "no evidence" for named supplements other than fish oil; genetics "not fixed" or "you can shape your genes"; the app filtering Breathe readings; clinical thresholds; ranking, traffic or AI-citation promises; em dashes or en dashes anywhere.

## 4. Headline promise and outline

**Working title:** How to increase HRV: what actually raises it, and by how much

**Promise:** a step-by-step plan that says which changes lower your HRV and by how much, which raise your baseline and how slowly, which only change the reading while you do them, and how to prove in four weeks that it worked.

**Opening move:** the reader's situation (a low or falling number this week) and the distinction that reframes it: most "how to increase HRV" advice mixes three different kinds of change, and the one that raises your baseline is the slowest. Direct answer in the first paragraph: stop the dips first (alcohol is the biggest, most measurable one), build the baseline with consistent aerobic training over weeks, and judge it with weekly averages, not single mornings. Early payoff: the alcohol sizes.

**Lean outline (headings are working labels, not final copy):**

1. **The short answer.** Three kinds of change in one short list, the plan in one paragraph, time frame honesty.
2. **Step 1: Check that it is really low for you.** Same device, same time of night, against your own baseline, not a chart. Link to what-is-a-good-hrv for age ranges and device differences (do not repeat them). Rough day-to-day wobble so a 4 ms dip is not read as a crisis (E10, E41). Completion check: you know your baseline and whether this week is below it.
3. **Step 2: Remove what pulls it down.** Ordered by size and evidence: alcohol (sizes, doses in drinks, earlier and less; E4, E5, E40), illness (recognise, rest; E3, E25 lead only if used), lost sleep (E13; link sleep article), hard-session timing (24 to 48 h; E10; link hrv-training for the day-to-day decision), acute stress (E24), menstrual phase as context (E28). Completion check: the dips shrink or disappear from your weekly chart.
4. **Step 3: Build the baseline over weeks.** Consistent aerobic training (E6 with the no-ms and older-adult caveats, E7, E8), weight loss if relevant (E22). Honest time frame: trials ran 4 or more weeks; expect weeks to months (interpretation). What the elite-athlete exception means for them (E12, one paragraph). Completion check: a higher four-week average, not a higher single morning.
5. **Step 4: Use in-session tools for what they are.** Slow breathing raises HRV during and just after, calms you, and is worth doing for that; one month of daily breathwork did not change overnight HRV (E14, E15). Apple Watch Breathe caveat (E29). Cold water after hard sessions: faster short-term recovery of the number, not a higher waking HRV (E17, E18, E19). Completion check: you know which of your numbers were measured during breathing.
6. **Step 5: Skip what does not work (or is overstated).** Fish oil (E20), caffeine (E21), weighted blankets and leafy greens as "HRV boosters" (E31, E30), hydration as a major lever (E23). One line on supplements not researched here. Short, factual, no takedown tone.
7. **What you cannot change.** Age (E27), genetics (E26), device metric (link out). "Why is my HRV so low even though I'm fit?" answered here. "Can low HRV be reversed?" answered: dips yes, baseline partly, set point no.
8. **Step 6: Check whether it worked.** At least 3 readings a week, weekly averages (E11), four weeks minimum, compare with your baseline and with your wobble (E10, E41). Branches: no change after 8 to 12 weeks (look back at Step 2 first; some people's baseline barely moves); a rise with poor sleep or heavy training (possible overreaching in the elite sense, or contamination by in-session readings); a persistent unexplained drop with symptoms (see a doctor, short boundary). Worked example with the app's open method (E36), labelled as the product's convention, internal link to the scoring article.
9. **Next step.** Link hrv-training for the daily decision; product CTA after the editorial conclusion.

Answer the two PAA questions inside sections 7 and 8; no separate FAQ unless it clearly helps. A compact phone-readable table (lever, kind of change, size or time frame, evidence) near the top is encouraged.

## 5. Internal links (earned placements)

- /blog/what-is-a-good-hrv/ in Step 1 (age ranges and device differences) and optionally in section 7 (device metric).
- /blog/hrv-training/ in Step 2 (hard-session timing, day-to-day training decision) and in the next-step paragraph.
- /blog/how-much-sleep-for-recovery/ in Step 2 at the sleep lever.
- /blog/what-is-a-readiness-score/ in Step 6 at the worked example of the app's method.
- /blog/garmin-hrv-apple-health/ optional in Step 6 for Garmin readers.
- Home page or App Store link only in the closing product mention.

## 6. Exclusions

- No by-age table, device decoder or "is 30 ms bad" worked examples (owned by what-is-a-good-hrv).
- No green/amber/red training protocol (owned by hrv-training).
- No cycle-phase coaching beyond context; separate planned article.
- No Reddit quotations (not captured); no Mayo Clinic or Oura quotations (not captured).
- No named-supplement verdicts beyond fish oil and caffeine.
- No sample training week (not supported by the packet; do not invent one).
- No mention of the app's cycle-phase baselines unless 1.0.3 is live at publication.

## 7. Article-specific acceptance checks

1. Every lever states its kind of change (dip, baseline, in-session) and an evidence strength word.
2. Every number traces to its E-ID; the alcohol figures say "first three hours of sleep"; drink conversions are labelled approximate.
3. No promised millisecond gain or fixed week count; "weeks to months" labelled as an interpretation.
4. The breathing passage states the in-session effect and the null overnight RCT together, factually.
5. The Apple Watch Breathe caveat is general and sourced to Apple; the app is not described as filtering it.
6. Competitor studies are described by what they measured; tone is neutral.
7. The verification step has numbers (3 readings a week, weekly averages, 4 weeks minimum) and three failure branches.
8. The doctor boundary is short, labelled, and not diagnostic.
9. No em dashes or en dashes anywhere; numeric ranges use "to"; hyphens only inside compound words.
10. Internal links at the placements above with accurate anchors; no link list at the end.

## 8. Voice notes for the writer

Plain and direct, an expert coach helping a friend read their chart. Judgments stated, then evidenced. No manufactured anecdotes, no first-person experience claims, no hype. Short paragraphs for phones.
