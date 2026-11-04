# Brief: "body battery garmin" + "garmin training readiness" (Readiness Coach / thereadiness.app)

Run: 2026-11-02-garmin-body-battery-explained · Archetype: Custom, documentation-grounded explainer (Checkpoint A, automatic) · Mode: automatic · Source presentation: automatic, resolved to sparse inline links; every Garmin claim and every statistic linked at its decisive mention · Target URL: https://thereadiness.app/blog/garmin-body-battery-explained/ (slug free on 2026-11-02)

## 1. Reader contract

**Reader.** A US Garmin owner who checks Body Battery most mornings, maybe Training Readiness too. Has seen the number sit low after a full night or disagree with how they felt, and half suspects "fancy marketing" (Reddit titles, E14).

**Goal.** Understand what the number is built from according to Garmin, why it moves, what it cannot tell them, and what to trust it for.

**Assumed knowledge.** Can find Body Battery on the watch and in Garmin Connect; knows roughly how they slept, drank and trained this week. May not know what HRV or RMSSD is.

**Explain on first use.** HRV (one plain sentence); Garmin's stress score and its 25 threshold; personal baseline; sleep pressure; RMSSD only where HRV Status needs it.

**Observable success.** The reader can (1) list what Garmin says Body Battery is built from and its 5 to 100 bands, (2) tell Body Battery, Training Readiness and HRV Status apart, (3) match a low morning to a likely cause (alcohol, getting sick, a hard late session, an unworn or short night, a new or reset watch, positive stress, sleep pressure) and know roughly how large the underlying HRV effect can be, (4) state precisely what Garmin has and has not published about the calculation, and (5) see what a score with a published formula shows that Body Battery does not.

## 2. Intent, job, angle

Primary `body battery garmin` (US 2,200/mo, KD 7) plus variants; secondary `garmin training readiness` (200, KD 0). Branded informational; the AI Overview and Garmin's pages answer "what is it". PAA to answer: good score, does it mean anything, how to get to 100, how accurate; secondary: which watches have Training Readiness, what is a good Training Readiness score.

**Job:** "My Body Battery says one thing and my body says another. What is it made of, when should I believe it, and what is it not telling me?"

**Angle.** Body Battery is Garmin's estimate on a 5 to 100 scale, built from heart rate, HRV and movement, read through Garmin's stress score, sleep and activity, and personalised against a baseline Garmin learns over about 5 to 7 days. Garmin documents the inputs, the bands, daily Charged and Drained totals and what happens when the watch is off. Garmin has not published how the inputs are weighted or combined, or what your Body Battery baseline is. So the number can track your physiology and still not tell you why it moved. A score built from the same Garmin signals with a published formula lets you see which component did what.

Research corrections the writer must hold (research §8a, §11):
1. Body Battery is 5 to 100 (E2, E12). Training Readiness 1 to 100 (E8). Stress 0 to 100 (E5).
2. Stress is estimated "primarily using a combination of HR and HRV data" (E5), never "from HRV" alone.
3. "What it leaves out" is narrowed. Garmin does state a Body Battery personal baseline with a learning period (E12), documents long-term trends (E2) and daily Charged and Drained totals (E12), shows a baseline range for HRV Status (E6) and factor contributions for Training Readiness (E9). Not published on the pages checked: Body Battery formula, weights, baseline value or range. The unworn night is documented behaviour (model-based estimate, E12), not an omission.

**Contribution versus the benchmark** (Garmin technology page #2, Garmin support FAQ #6, Garmin blog #8, Sonar Health #10). All four cover inputs, scale, sleep, stress and activity, alcohol, illness. None lays the three Garmin numbers side by side, puts sizes on the drains, gathers Garmin's scattered explanations of a low morning into one diagnostic list, separates "has not published" from "does not do", shows a published formula, or answers the Training Readiness query as an article. Garmin's FAQ is the clearest page; credit and build on it, do not restate it. Contribution: clearer synthesis of Garmin's own documentation, stronger evidence (primary-study sizes), and a worked contrast.

**Exclusions.**
- No claims about Garmin internals beyond Garmin's pages. Never "hides", "black box", "Garmin does not". Use "Garmin has not published", bounded to its public pages.
- No exclusivity ("the only score with a published formula") and no owner-prevalence claims; no Reddit paraphrase beyond the question being asked.
- No "Body Battery points" per drink or session; sizes are HRV and resting heart rate, described as the signals Garmin uses.
- No list of watches with Training Readiness or Body Battery; do not repurpose the FAQ's TrueUp list. No Garmin Connect history ranges (not captured).
- Caffeine: report the manual ("no impact on your Body Battery") and the stress page (stimulants "can also produce higher than normal stress levels") side by side, unresolved.
- No medical claims; general-wellness framing.
- Not a "how to get it to 100" guide; answer briefly and link /blog/how-to-increase-hrv/.
- Do not say Readiness Coach reads Body Battery or Training Readiness (not in E25).
- Do not echo the older site post's "almost none of them ship an explanation" (E22 note). Do not state Readiness Coach baseline constants (E23 note); weights only.

## 3. Claim and evidence plan

| Claim | Evidence | Handling |
|---|---|---|
| Body Battery analyses "combinations of heart rate, heart rate variability (HRV) and movement data"; awake/asleep, activity, stress during inactivity | E1 | link Garmin technology page |
| Plain inputs (HRV, stress, sleep, activity); 5 to 100 with four bands (5 to 25 very low, 26 to 50 low, 51 to 75 medium, 76 to 100 high) | E2, E12 | link manual for bands |
| Stress 0 to 100 from HR and HRV; under 25 charging, over 25 draining; not measured during activity | E5, E1 | link stress page |
| Lower RHR and higher HRV vs "your personal baseline" signal effective rest; fitness "built into" the feedback | E1 | quote or close paraphrase |
| Learning period 5 to 7 days on new or reset watch, may sit at or near 5; recalibration | E12 | link FAQ |
| Charged and Drained over 24 h, reset at midnight, roughly balanced | E12 | one sentence |
| Sleep pressure drains while resting | E1 | credit Garmin |
| "How rested you feel and your Body Battery score do not always align"; sleep-time stressors | E12 | anchors section 3 |
| Watch off several hours: "model-based estimate"; wear it to sleep | E12, E2 | documented behaviour |
| Positive excitement reads as stress; stress data "doesn't tell you ... why" | E5, E3 | central to section 4 |
| Body Battery "is supposed to diminish during the day"; "90 or 60 in the morning" | E3 | PAA answers |
| Alcohol: RMSSD about 2.0, 5.7, 12.9 ms lower in the first 3 h of sleep at low, moderate, high doses; 4,098 Finnish employees, within-person; Garmin's blog cites this study | E15, E3 | link PMC; keep first-3-hours scope; link how-to-increase-hrv for the drinks conversion |
| About 12% lower HRV, 6% higher HR after high alcohol; about 10% lower HRV, 6% higher HR during sickness (9 million morning phone measurements, group averages) | E16 | link |
| Illness: HRV usually falls slowly; "Early on, it is difficult to say if a low battery is because of illness or something else"; 1 °C fever raises average HR by over 7 bpm, per Garmin | E4 | link Garmin sick post; attribute the fever figure to Garmin |
| HRV down and RHR up the day before a positive COVID test (14 athletes, WHOOP); HRV rhythm changes in the week before diagnosis (health workers, Apple Watch) | E19, E18 | optional, one sentence, direction only |
| Moderate to maximal exercise ending within 4 h of habitual sleep onset progressively lowers nocturnal HRV; maximal vs light ending 2 h before sleep: 14.1% (8.3 ms) lower HRV, 3.9 bpm higher RHR; 4.08 million person-nights of WHOOP users, associations | E17 | link; name WHOOP data and observational design |
| Moderate evening exercise is not shown to harm sleep; vigorous exercise ending within about an hour of bed may | E20 | bound the late-session claim |
| Garmin stress score tracks HR and RMSSD but only marginally predicts self-reported stress (Vivosmart 4, lab, n = 60) | E21 | link; scope to the stress score |
| HRV Status: overnight RMSSD over whole sleep in 5-minute windows; three weeks to activate; baseline range (example 33 to 45 ms); 7-day average vs range; range hidden in Poor | E6, E7, E10 | table; link what-is-a-good-hrv |
| Training Readiness: 1 to 100 bands (Prime 95 to 100, High 75 to 94, Moderate 50 to 74, Low 25 to 49, Poor 1 to 24); six factors (sleep score, recovery time, HRV status, acute load, sleep history 3 nights, stress history 3 days); biggest change at waking, drops after activity; shows "how underlying factors contributed"; "not designed to predict performance"; block-training caveat | E8, E9 | link TR technology page and FR965 manual once |
| Which watches have Training Readiness | E8 | "check your model's owner's manual"; FR965 as an example |
| Not published: Body Battery formula, weights, baseline value or range (technology, FAQ, manual, two blog posts, stress, HRV Status, TR pages) | §8a | "Garmin has not published", bounded, "checked November 2026" |
| Readiness Coach: 45% recovery (HRV 60%, RHR 40%, vs personal baseline), 40% sleep (duration half, 7-hour target), 15% stress (device stress score inverted when available); first seven days build baselines; breakdown per component | E22, E23 | link what-is-a-readiness-score |
| Weights are "a reasoned starting point", not validated | E23 | beside the weights |
| Reads overnight HRV, RHR, sleep and stress directly from a connected Garmin account; Garmin RMSSD kept separate from Apple SDNN | E24, E25 | **release-conditional**: one self-contained sentence or short paragraph removable with one edit (1.2.1 in App Review; live 1.1 reads Garmin via Apple Health plus manual HRV). Link garmin-hrv-apple-health near the Apple Health route |

Each statistic appears once with its source; the Q&A adds no new numbers.

## 4. Lean outline

Frontmatter, exact keys only:
- title: "Garmin Body Battery explained: what it measures, why it drains, and what it leaves out"
- description: about 150 to 160 characters, plain, no dashes
- pubDate: 2026-11-02

Astro renders the title as H1; the body starts with prose, then H2s.

**Opening (no heading).** The reader's situation plus Garmin's own admission: a low morning after a full night, and Garmin's FAQ says feeling and number "do not always align". Early payoff in the first two short paragraphs: what the number is and the one thing Garmin has not published. One sentence on where the article goes. No "In this article".

1. **What Body Battery is built from** (E1, E2, E5, E12). Signals, stress and the 25 threshold, charge vs drain, baseline and learning period, sleep pressure, fitness, bands table, Charged and Drained, the caffeine pair. Done when the reader can name the inputs and read a band.
2. **Body Battery, Training Readiness and HRV Status are three different numbers** (E6 to E10). One table (what it answers, built from, scale, baseline, when it updates, what Garmin shows). Short Training Readiness and HRV Status paragraphs. Done when the reader knows which number answers which question.
3. **Why it drains, or will not charge, when you feel fine** (E12 anchor, then E15, E16, E3, E4, E18/E19, E17, E20, E5, E1, E2, E7). One scannable paragraph each: alcohol; getting sick; a hard session late in the day; watch off or a short night; new or reset watch near 5; excitement and other good stress; sleep pressure. Each: Garmin's statement, size where one exists, scope, effect on the morning number. Link how-to-increase-hrv and hrv-training once each. Done when the reader can match a low morning to a likely cause.
4. **What the number does not tell you** (§8a, E5, E21, E1, E6, E9). Published vs not published, precisely. "Doesn't tell you why". E21. Contrast with HRV Status (baseline range shown) and Training Readiness (factor contributions shown). Judgment: a reasonable design for a daily energy gauge, and the reason you cannot reconstruct a 60 vs a 90. Done when the reader can state the boundary without overclaiming.
5. **What a readiness score with the working shown looks like** (E22 to E25). Readiness Coach as the worked example, disclosed as this site's app. Weights, baseline, breakdown, unvalidated-weights caveat, isolated direct-Garmin sentence, RMSSD kept separate. Links: what-is-a-readiness-score, garmin-hrv-apple-health. App link once: https://apps.apple.com/app/id6760478506 . Not a verdict against Garmin; the two can be read side by side.
6. **Quick answers** (PAA), 2 to 4 sentences each, no new statistics: good Body Battery score; does it mean anything and how accurate; how to get to 100; good Training Readiness score and which watches have it.

No conclusion section. The editor may swap sections 5 and 6 if the app link stays near the end and appears once.

## 5. Internal links (full URLs, verified 200)

| URL | Placement |
|---|---|
| https://thereadiness.app/blog/what-is-a-good-hrv/ | Section 2, HRV Status |
| https://thereadiness.app/blog/how-to-increase-hrv/ | Section 3 alcohol sizes and/or the "get to 100" answer |
| https://thereadiness.app/blog/hrv-training/ | Section 3, what to do on a low morning |
| https://thereadiness.app/blog/what-is-a-readiness-score/ | Section 5, full model |
| https://thereadiness.app/blog/garmin-hrv-apple-health/ | Section 5, Apple Health route |

Optional: https://thereadiness.app/blog/how-much-sleep-for-recovery/ beside the 7-hour target.

## 6. Visible citations

Inline links, matching prior site articles. Garmin pages at decisive first mention (E1, E2, E5, E12, E6 or E7, E8 or E9, E3, E4); each study once at its statistic (E15, E16, E17, E21; E18/E19 and E20 optional). Do not link Sonar. Name the Garmin Health API only if useful, and never imply its public page lists HRV. No reference list.

## 7. Passage rules

Canonical entity names. Each section 3 paragraph and each Q&A answer is self-contained (entity, scale, scope). Units and scope sit beside every number.

## 8. House style and acceptance checks

- No em or en dashes anywhere, including inside quotes (Garmin's "5-7" becomes "5 to 7"; paraphrase around it). Ranges use "to".
- Plain, direct prose; varied rhythm; no invented experience or testing. "We" only for Readiness Coach as publisher.
- Checks: (a) 5 to 100 everywhere; (b) stress never "from HRV" alone; (c) no "Garmin does not / hides"; (d) no exclusivity or prevalence claims; (e) Training Readiness section sourced; (f) weights caveat beside weights; (g) app link exactly once near the end; (h) the five internal links placed where they help, or omission justified in qa.md; (i) direct-Garmin sentence isolated.
