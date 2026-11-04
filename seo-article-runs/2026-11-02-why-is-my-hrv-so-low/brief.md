# Brief: "why is my hrv so low" + "low hrv causes" (Readiness Coach / thereadiness.app)

Run: 2026-11-02-why-is-my-hrv-so-low · Archetype: Custom, ranked diagnostic explainer (approved at Checkpoint A, automatic mode) · Source presentation: automatic, tightened by the run instruction that every statistic and study is linked to its source · Target URL: https://thereadiness.app/blog/why-is-my-hrv-so-low/ (404 today, free) · Profile: bundled · Frontmatter exactly `title`, `description`, `pubDate: 2026-11-02`, no H1 in the body (site convention: the layout renders the title).

## 1. Reader contract

**Reader.** A US adult with a Garmin, Apple Watch, Oura, WHOOP or similar who woke up to a low HRV number, or has been low for a while, and wants to know why. Three segments: (a) one bad morning, (b) a week or more of low readings with no obvious reason, (c) "I'm fit, so why is mine always low?". No physiology background.

**Goal.** Work out which cause most likely explains their low number, how big that cause usually is, and whether this is a one-night dip, a trend worth acting on, or simply their normal.

**Assumed knowledge.** Can find HRV in their watch app or Apple Health; roughly knows what they did last night and this week (drinks, training, travel, sleep, how they feel).

**Explain on first use.** Baseline; RMSSD versus SDNN in one plain clause each; dip versus trend; night-to-night wobble; the altitude standardized effect in plain words.

**Observable success.** The reader can (1) judge today's number against their own baseline, (2) match the drop to the likeliest of the nine causes by size, duration and what else changed (resting heart rate, symptoms, a trip, a new device), (3) classify it as wobble, dip, trend or their normal, (4) know when a doctor is the next step, and (5) know where to go to raise it.

## 2. Search intent, job and angle

One cluster ("why is my hrv so low", "low hrv causes", "why is my hrv low", "what causes low hrv"). The AI Overview absorbs the generic cause list. PAA to answer in the article's own words: "Should I worry if my HRV is low?" and "Why has my HRV dropped?". Numeric PAA ("Is 20 HRV normal?", "Is an HRV of 17 bad?") gets one short routing paragraph: the answer depends on device metric and age, there is no professional-society cutoff (E42), and the age table and device decoder live on the good-HRV page (link). Do not repeat that table.

**Job-to-be-done (testable):** "After reading, a wearable user with a low HRV reading can name the most likely cause, say roughly how big that cause usually is, and decide whether to wait, look into it, accept it as their normal, or see a doctor."

**Why Custom:** the reader is classifying their own situation, not following ordered steps; the value is an evidence-graded ranking plus a decision rule. A How-to would duplicate the sibling's raising plan and sharpen the cannibalization risk (research §3, §6).

**Angle (owner, with the four research adjustments):** "Low" only means low against your own baseline. The nine usual causes differ a lot in how far they move the number, how long they last and what else changes with them, so rank them. Seven have a sourced size; sleep loss and stress have direction only and the article says so. Age and device differences are not dips: they are the two biggest reasons a number looks low on a chart, so they sit in a separate band. Heat and altitude sizes come from lab and expedition studies, not overnight wearables, and are labelled. Then a dip-trend-normal decision that separates research findings from vendor conventions.

**Contribution versus the benchmark (WHOOP #2, Polar #3, Nurosym #7):** all three cover baseline-first framing, the usual causes, "a day or two is fine, a sustained low matters", and age; cover that shared ground briefly. None sizes any cause, separates wobble from change with evidence, explains device differences, answers the fit-but-low reader with evidence, sources the resting-heart-rate check, or separates "see a doctor for symptoms" from "the number alone" (research §3 gaps 1 to 6). That is the page.

## 3. Claim and evidence requirements

Every statistic and every study named gets an inline link to its source URL from the ledger (run instruction). One link per source at its decisive use; a later reuse of the same source in another section may link again only if a reader would need it there, otherwise refer back in words. Table cells may carry the link.

| Claim territory (sizes as in research §8a) | Evidence | Handling |
|---|---|---|
| Alcohol: about 2, 6, 13 ms lower RMSSD by dose, first three hours of sleep, 4,098 people vs own alcohol-free nights | E4 | keep "first three hours of sleep"; no drinks conversion (sibling owns it) |
| Alcohol per drink: about 3.3 to 3.8 ms lower HRV, 2.4 to 2.8 bpm higher RHR; earlier drinking and longer sleep shrank it | E5 | "about 21,000 WHOOP members", WHOOP-affiliated authors |
| Group averages (9 million morning readings): about 12% lower after high alcohol, 10% in sickness, 4.6% on training days; heart rate about 6% higher with alcohol and sickness; HRV "sensitive but not specific" | E3 | morning smartphone readings; ranking and heart-rate check |
| Illness: Fitbit, HRV down with respiration and heart rate up (2,745 users); Apple Watch SDNN rhythm changed in the 7 days before a positive test; resting heart rate rose before or at symptoms in a Stanford study | E25, E50, E51 | E50 is rhythm amplitude, E51 is heart rate; never "HRV predicts illness by X days" |
| Altitude: RMSSD lower in the first 7 days above 2,500 m, standardized effect about 0.5 (15 studies, 698 adults); bigger SDNN drop above 3,500 m; fitness did not change it; RMSSD rose at 3,619 m before falling higher in one trek; 1,400 m study reversed on return | E55, E56, E57 | percent size unknown, say so; explain "moderate effect" plainly |
| Heat: RMSSD about 76 to 53 ms (roughly 31% to 34% lower) lying 10 minutes at 35 °C vs 19 °C, 12 young adults; whole-body heating cut vagal activity in 14 of 27 studies; sauna drop then rebound | E52, E77, E53, E54 | lab, during exposure; overnight hot-bedroom size not measured |
| Hard training: recovery up to 24 h (easy), 24 to 48 h (threshold), 48 h or more (hard); fitter people recover faster; more high-intensity weeks held weekly HRV down in 9 elite rowers | E47, E3, E81 | scope labels |
| Overreaching paradox: resting RMSSD rose slightly in endurance athletes whose performance fell | E48 | a trend prompts a look, not a diagnosis |
| Sleep loss: RMSSD significantly lower after experimental deprivation (11 RCTs, 549 people); no pooled size | E13 | direction only |
| Jumpier nights with alcohol and short, irregular sleep; at least 5 of 7 nights to judge a week's wobble | E68 | variability, not level |
| Stress: lower parasympathetic HRV under induced stress in most of 37 studies | E24 | direction only |
| Age: RMSSD at about 47% of early-adult values by the sixth decade, then stable; decline in 8 million Fitbit users | E58, E59 | one line, link good-HRV table |
| Device: Apple Health SDNN from short still samples incl. Breathe; Garmin whole-sleep RMSSD from 5-minute windows; Oura mean of 5-minute samples; WHOOP deepest sleep; night error vs ECG about 6% to 8% Oura, 8% WHOOP, 10% Garmin, 16% Polar (13 adults, 536 nights) | E60, E29, E61, E62, E63, E64 | consequence only: a switch is a measurement change; a change under the device's error may be the device |
| Wobble: CV about 12% (short morning athlete recordings); weekly CV about 5.4% (WHOOP, elite athletes); at least 3 readings a week; no validated meaningful-change threshold | E10, E66, E11 | scope labels; any ms illustration "roughly" (E77) |
| Trend case: 7-day average slid for weeks toward non-functional overreaching in one of two triathletes | E49 | two-athlete case |
| Conventions: Garmin 7-day average vs 3-week range; Polar 28-day average; Readiness Coach 30-day trimmed median after 7 nights | E61, E46, E36 | labelled conventions; not Nurosym as evidence |
| Fit but low: heritability 18% to 48%; activity weakly linked (r = 0.21); saturation in about half of healthy people (24-hour ECG); elite HRV can fall as fitness rises | E26, E3, E69, E12 | scope labels |
| Heart-rate mechanism: a faster heart leaves less time between beats | E74 | plain explanation |
| No professional-society cutoff | E42 | Harvard Health, Christopher P. Cannon, MD |
| Symptoms needing care: palpitations that won't stop, fainting, chest pain or pressure, trouble breathing; dizziness or worsening palpitations | E73 | the number does not detect these |
| Population risk is ECG-based | E72 via good-HRV link | one sentence max |
| Product: asks what changed when a reading is unusual | E75, E36 | one or two sentences; nothing else |

**Must not appear:** a size for sleep loss, stress, overnight heat, altitude in percent, or wearable illness beyond E3's 10%; "HRV predicts illness"; any "dangerously low" threshold; Cleveland's 24-hour SDNN bands as watch thresholds; competitor claims in E46; the forum firmware or seasonal hypotheses; first-person experience; ranking or traffic claims; em or en dashes.

## 4. Headline, description and outline

**Title (frontmatter):** "Why is my HRV so low? Nine causes, how big each dip usually is, and when low is normal" (owner working title; keep unless the body cannot honour "how big each dip usually is", in which case the body must say plainly which dips have no measured size).

**Description (about 150 to 160 characters):** names the nine causes framing, sizes, and dip versus trend versus normal. No dashes.

**Opening move:** the reader's situation (a number lower than yesterday, or lower than everyone else's) and the distinction that reframes it: low against what? Early payoff within the first two or three short paragraphs: most low mornings have a nameable cause from last night, alcohol and illness move the number most, and the resting heart rate usually tells you which. Point to the ranked table.

**Lean outline (working labels, not final copy):**

1. **Opening.** Situation, baseline framing in one or two sentences, the early payoff above. Completion: reader knows the page ranks causes and ends in a decision.
2. **Low against what?** Your own baseline versus someone else's number; the numeric PAA routed with E42 and a link to the good-HRV page; device and age named as the reasons a number "looks low" on a chart. Short.
3. **The nine causes, ranked by how much they usually move HRV.** Compact phone-readable table: cause, typical size (honest unit or "not measured"), how long it lasts, what else you would see. Rows 1 to 7 are dips (alcohol, illness, altitude, heat, hard training, poor sleep, stress); age and device are a separate band labelled "not dips". One sentence on the ranking basis (mixed study types and units, so the order is approximate). Then short context per cause only where the table needs it.
4. **The resting heart rate check.** Illness and alcohol push resting heart rate up as HRV falls; a hard session or a low-stress-but-short night may not. Mechanism (E74). Gives the reader a way to tell causes apart.
5. **Dip, trend, or your normal.** Wobble (E10, E66, E64, E68, E11); a dip (nameable cause, recovers); a trend (weekly average below your range for a sustained period, no nameable cause; E49, E48; conventions labelled); your normal (stable for weeks; age, genetics, saturation, metric; fit-but-low answer). Answers both PAA questions.
6. **When to see a doctor.** Symptoms (E73) are the trigger, not the number; an unexplained sustained low plus feeling unwell is worth a conversation; population-risk research is ECG-based (one sentence, link good-HRV section). Short, calm.
7. **What to do next.** Raising it: link how-to-increase-hrv. Product: Readiness Coach reads HRV, resting heart rate and sleep from Apple Health and Garmin, judges a reading against your own baseline, and asks what changed when a reading is unusual; link what-is-a-readiness-score and the App Store once.

No separate FAQ unless the PAA answers do not fit naturally in sections 2 and 5.

## 5. Internal links (each URL exactly once; the mechanical gate fails duplicates)

- https://thereadiness.app/blog/what-is-a-good-hrv/ in section 2 (age table, device decoder, no cutoff). Later mentions of age or devices refer back in words.
- https://thereadiness.app/blog/how-to-increase-hrv/ in section 7 (raising plan). If the fit-but-low passage needs the sibling's section, link there instead and refer to it in words in section 7; one link only.
- https://thereadiness.app/blog/hrv-training/ at the hard-training cause or in section 7, one place.
- https://thereadiness.app/blog/how-much-sleep-for-recovery/ at the poor-sleep cause.
- https://thereadiness.app/blog/garmin-hrv-apple-health/ at the device cause, Garmin sentence.
- https://thereadiness.app/blog/what-is-a-readiness-score/ in the product paragraph.
- https://apps.apple.com/app/id6760478506 once, near the end, after the product sentence.

## 6. Exclusions

- No by-age table, device decoder table, baseline worked example or "is 30 ms bad" examples (good-HRV page).
- No raising plan, lever table, breathing, cold water, supplements, weight loss, four-week check (sibling).
- No green/amber/red training protocol (hrv-training).
- Menstrual cycle, dehydration, late meals: not among the nine; at most one line on the cycle (E3 3.2%), or omit.
- No Reddit or forum quotations; no Mayo or AHA claims (not captured).
- No claim that the app filters Breathe readings or does anything beyond E75 and E36.

## 7. Article-specific acceptance checks

1. Every cause states a size with its unit or says no size has been measured; age and device are labelled not dips.
2. Heat and altitude carry their study scope; heat says the overnight size is unknown; the ranking basis is stated once.
3. The resting-heart-rate check is sourced and does not overclaim illness detection.
4. Research findings and vendor conventions are visibly distinguished.
5. Both PAA questions are answered plainly; the numeric PAA is routed with E42.
6. The doctor section is symptom-led, short, sourced to E73, not diagnostic.
7. Every statistic and named study links to its ledger URL; no invented or out-of-ledger sources.
8. Each internal URL exactly once; App Store once near the end; no link list.
9. No em or en dashes anywhere, frontmatter and tables included; ranges use "to".
10. No sibling content repeated beyond the compact alcohol and Altini sizes.

## 8. Voice notes for the writer

Plain, direct, an expert explaining a chart to a friend who is a bit worried. State the judgment, then the evidence. Short paragraphs for phones. Editorial presence through curation and consequence (for example: a one-night drop smaller than your device's error may be the device; the overreaching paradox means a falling trend is a prompt to look, not a verdict). No anecdotes, no first person, no hype, no "experts say".
