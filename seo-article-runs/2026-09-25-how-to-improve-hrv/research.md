# Research: "how to improve hrv" + "how to increase hrv" (Readiness Coach / thereadiness.app)

## 1. Run context

- Run/stage: `2026-09-25-how-to-improve-hrv`, stage 2 (research), mode `new`, approval mode `guided`.
- Researcher identity: Claude Code native research subagent (model `claude-opus-5-5`), dispatched by the seo-article orchestrator. No helper agents spawned. No Apify, OpenRouter, Ahrefs or other paid call made by this researcher.
- Primary query: `how to improve hrv` (Ahrefs US 4,300/mo, KD 7, per intake). Co-primary: `how to increase hrv` (4,800/mo, KD 8). Secondary: `how to raise hrv`, `why is my hrv low`, `how to improve hrv score`. One article serves all.
- Audience (intake): recreational athlete with a Garmin, Apple Watch, Oura, Whoop or similar who sees a low or falling HRV number and wants to know what actually raises it. US, English.
- Site: https://thereadiness.app, Readiness Coach, an iOS readiness-score app reading HRV, resting heart rate and sleep from Apple Health. Public score model: 45% recovery (HRV vs personal baseline 60%, RHR 40%), 40% sleep, 15% stress; personal baselines. Version 1.0.3 (open score-math screen, cycle-phase baselines) is in App Store review and not live as of 2026-09-25 (intake).
- Working angle to test (intake): what actually moves HRV ranked by strength of evidence; what is overstated; judging change against your own baseline and trend.
- Requested locale US/English. Observed: both supplied Ahrefs SERPs are country `us`, captured 2026-09-25. WebSearch used for discovery is US-only. Match.
- Source display preference: `automatic` (presentation only; the ledger keeps full provenance).
- Evidence model: independent editorial grounded in primary research (meta-analyses, RCTs, large within-person observational datasets), official vendor documentation, and first-party product code. No hands-on testing.
- House rules (intake): no em dashes or en dashes anywhere; numeric ranges with "to"; cite primary sources; never fabricate statistics; label convention vs research finding; general-wellness framing, clinical points only as "see a doctor" boundaries with sources.
- Inputs used: `.runtime/intake.md`; `.runtime/doctrine-snapshot.json` (links and sources-evidence doctrine read); `.runtime/serp-how-to-improve-hrv-us.json`; `.runtime/serp-how-to-increase-hrv-us.json`; previous run `seo-article-runs/2026-09-22-what-is-a-good-hrv/` (research.md, benchmark-decision.json, competitor captures) for quality bar and two reused evidence records; live site articles in `website/src/content/blog/*.md`; first-party code `src/utils/hrvSamples.ts`, `src/utils/index.ts`, `src/utils/readiness.ts`, `src/utils/cycleBaselines.ts`; curl plus BeautifulSoup/lxml HTML extraction; Europe PMC REST API (abstracts and open-access full-text XML); WebFetch; WebSearch (discovery only); Apple's Nov 2024 heart-rate white paper (PDF, text extracted with pypdf).

## 2. Coverage and limitations

- **Ranking route:** orchestrator-supplied Ahrefs SERP overviews for both queries (positions, result types, PAA, AI Overview cited URLs). Treated as the observed Google ranking route per intake. This researcher did not run the lookups and has not seen raw Ahrefs responses. Position 3 is absent in both files (presumably a SERP feature, `not captured`). The two Reddit rows in the primary file share position 5, which suggests a discussions feature; recorded as supplied.
- **Page capture:** Polar, UCF Health and Different Health captured in full by curl (HTTP 200) and deterministic HTML extraction. Polar's article body is nested inside malformed markup; the first html.parser pass truncated it, so it was re-extracted with lxml and checked against the raw HTML (the "How to increase your heart rate variability" section and all six levers are present in the capture). Cleveland Clinic, the PMC paper, SB Physio and the YouTube page metadata were fetched by curl for exclusion decisions.
- **Blocked or degraded paths:**
  - Reddit: all three SERP threads (r/triathlon 1o89vkv, r/welltory 1fohl3r, r/whoop ku8idw) returned only the "Reddit" JavaScript shell to curl (HTTP 200, about 8 KB, no post text), and WebFetch refused the domain. Per the brief, no workaround was attempted. Thread content is `not captured`; only titles are known.
  - Mayo Clinic Press (`mcpress.mayoclinic.org`, position 11 primary / 10 co-primary): HTTP 403 to curl and to WebFetch. Content `not captured`.
  - Oura "8 ways" page (co-primary position 11): static HTML carries no article body (client-rendered); WebFetch returned a summary only. Treated as a lead; nothing from it is quoted as verbatim.
  - Laborde 2022 slow-breathing meta-analysis (Neurosci Biobehav Rev): paywalled; abstract only via Europe PMC. Its pooled effect sizes are `not captured` (a search snippet gave numbers, recorded as lead only and not used).
  - Mattos 2022 weight-loss review, Xin 2013 fish-oil meta-analysis, Sandercock 2005, Stanley 2013, Laborde 2024, Leal-Menezes 2025, Kageyama 1998, Chen 2016: abstracts only (Europe PMC). Claims below are limited to what the abstracts state.
  - Polar page: no publish or update date in page or metadata (`Unknown`).
- **WebFetch caveat:** WebFetch output is a model summary. Nothing in the ledger is quoted from WebFetch as verbatim except where marked; every selected competitor and every quoted study passage came from a deterministic route (curl HTML, Europe PMC XML/JSON, PDF text).
- **Not checked:** the AI Overview's text (presence and cited URLs only); YouTube video content beyond title, description, upload date and length; Reddit thread bodies; social sentiment beyond SERP titles and PAA wording; sleep-extension trials (no trial measuring HRV after adding sleep was found in this pass); late-meal and travel effects beyond vendor claims.

## 3. SERP and competitor benchmark {#serp-and-competitor-benchmark}

### Observed SERPs (Ahrefs, orchestrator-supplied, 2026-09-25) {#observed-serp}

**Primary: `how to improve hrv`, US (E38).** Features: AI Overview at position 1 (cites Polar, Different Health, UCF Health). People Also Ask: "Is 22 a bad heart rate variability?", "Why is my HRV so low even though I'm fit?", "What's a good HRV by age?", "Why is my HRV only 30?". Discussions: two Reddit threads at position 5.

| Pos | URL | Type | Disposition | Reason |
|---|---|---|---|---|
| 2 | https://my.clevelandclinic.org/health/symptoms/21773-heart-rate-variability-hrv | organic | excluded | General "what is HRV" health-library page (updated 09/02/2026). Its improvement content is two bullets plus one biofeedback sentence (about 100 words under "How can you improve HRV safely?"); the page's job is definition and clinical context, not the reader's "what raises my number" task. Excluded on format and depth, not on authority; its relevant passages are benchmarked below so the article still has to beat them. |
| 4 | https://pmc.ncbi.nlm.nih.gov/articles/PMC2903986/ | organic | excluded | Academic review (Routledge et al. 2010, Can J Cardiol, "Improvements in heart rate variability with exercise therapy"), about clinical populations (MI, heart failure, revascularisation). Evidence lead (E33), not an editorial competitor. |
| 5 | https://www.reddit.com/r/triathlon/comments/1o89vkv/true_unhinged_tips_to_increase_hrv/ | discussion | excluded | Discussion thread, not an article; capture blocked (§2). Title only. |
| 5 | https://www.reddit.com/r/welltory/comments/1fohl3r/my_hrv_is_low_how_can_i_improve_it_part_1_proven/ | discussion | excluded | Discussion thread on a vendor subreddit; capture blocked. Title only. |
| 6 | https://www.polar.com/en/guide/my-hrv-is-very-low | organic | **selected** | Highest-ranking external page whose job is the reader task; #2 for the co-primary; AI Overview source on both. |
| 7 | https://ucfhealth.com/our-services/cardiology/how-to-improve-heart-rate-variability/ | organic | **selected** | Second-highest dedicated how-to-improve page; #9 co-primary; AI Overview source on both. |
| 8 | https://www.youtube.com/watch?v=2M0yhiUmHpo | organic video | excluded | Video (8 min 45 s, uploaded 2025-06-25, "Simple Tool to Boost Heart Rate Variability (HRV) - Dr. Andrew Huberman"), not an article. Its claim is registered in E39 and tested against E15. |
| 9 | https://www.differenthealth.com/blog/how-to-improve-hrv | organic | **selected** | Third-highest dedicated page; #6 co-primary; AI Overview source on both; the only page already ranking levers by evidence. |
| 10 | https://www.reddit.com/r/whoop/comments/ku8idw/if_you_really_want_to_increase_hrv_let_me_show/ | organic | excluded | Discussion thread, not an article; capture blocked. Title only. |
| 11 | https://mcpress.mayoclinic.org/healthy-heart/can-tracking-heart-rate-variability-improve-your-health/ | organic | excluded | Outside the top ten organic rows for the primary query; also HTTP 403 on every route (not inspected). |
| 12 | https://www.sbphysio.com/blog//blog/how-to-improve-hrv | organic | excluded | Outside the top ten; physio-clinic post (2025-07-03) selling a $5 PDF tracker, five emoji-headed tips, no primary citations seen in a skim. |

**Co-primary: `how to increase hrv`, US (E38).** Features: AI Overview (cites Polar, Different Health, UCF, Oura, Mayo Clinic Press). PAA: "What is a good HRV for age?", "Why is my HRV so low even though I'm fit?", "Why is my HRV only 28?", "Can low HRV be reversed?". Organic as supplied: #2 Polar (selected), #4 PMC2903986, #5 r/triathlon, #6 Different Health (selected), #7 Cleveland Clinic, #8 YouTube, #9 UCF (selected), #10 Mayo Clinic Press, #11 https://ouraring.com/blog/8-ways-to-improve-your-hrv/ (Oura, 2025-11-03, excluded: outside the top ten, client-rendered, lead only via WebFetch summary). All three selected pages rank in both top tens and are cited by both AI Overviews, which is the strongest available signal that one article serves both queries.

**Intent reading.** Both SERPs reward list-of-levers articles from vendors (Polar, Oura), a health practice (UCF), a health-assessment company (Different Health) and big medical brands (Cleveland, Mayo). No tool, product grid or local pack. Three Reddit threads ("true unhinged tips", "proven", "let me show you") and a Huberman video show readers are hunting for hacks, which is the behaviour an evidence-ranked article can redirect. PAA is split between number anxiety ("Is 22 bad?", "Why only 28/30?", both already answered by `/blog/what-is-a-good-hrv/`) and two questions this article must answer directly: "Why is my HRV so low even though I'm fit?" and "Can low HRV be reversed?". The AI Overview will absorb the generic list (sleep, exercise, stress, alcohol, breathing, hydration). Clicks have to be earned by what it cannot compress: effect sizes, time scales, which effects are only in-session, which popular claims fail on their own sources, and a method for telling real change from noise.

**Selection basis:** all three `observed_rank`, positions from the primary-query file, locale `us/en`, provider `ahrefs serp-overview`. Captures frozen 2026-09-25 under `.runtime/competitors/` and registered with `register-competitors` (aggregate `.runtime/competitor-pages.json`, sha256 `65a6b626…`, 34,017 bytes):

- `polar-my-hrv-is-very-low.md`: Polar Guides, no byline, date Unknown (position 6)
- `ucf-how-to-improve-hrv.md`: UCF Health cardiology page, no byline, 2023-12-07 (position 7)
- `differenthealth-how-to-improve-hrv.md`: Different Health, "Medically reviewed by" David Uher, published 2026-07-01, updated 2026-07-26 (position 9)

### Passage-grounded benchmark

**Polar (about 1,500 words of article text, position 6 / co-primary 2).** What it answers: why HRV is low (stress, overtraining, illness, anxiety or depression, alcohol before bed, dehydration, large late meal, late exercise), why it matters (consistently low HRV associated with poor cardiovascular health, links Routledge 2010), then six numbered levers: manage stress, exercise at the right intensity, sleep consistently, drink more water and less alcohol, eat a balanced diet, breathe deep. Strength: baseline-first framing ("there's no use comparing your score to anything except your 28-day average"), "occasional day or two of low HRV isn't something to worry about", "don't compare your score to anyone else". Every lever links a study, which looks rigorous, but the studies do not support the wording:
- Weighted blanket: "A trial study looking at the bedding used by people recovering from wisdom tooth extractions found that those who used weighted blankets reported higher HRV scores". The linked study (E31) applied deep pressure **during** the extraction, measured normalized HF% during and after surgery, and involved no bedding and no overnight HRV.
- Leafy greens: "eating leafy greens, like spinach and kale, can improve your HRV". The linked study (E30) is observational (586 older men, food-frequency questionnaire), found an association with normalized HF power, and found **no** association for other fruit and vegetables, fish or omega-3.
- Hydration: "even mild dehydration could result in lower HRV". The linked trials (E23) dehydrated people by under 1% of body weight over four hours at 30 °C and measured daytime HRV; nothing about overnight wearable HRV.
- Work stress: long-commute and overtime study (E32) is a 1998 cross-sectional sample of 223 Tokyo male office workers, daytime short-term HRV.
- Breathing: "even six minutes of slow, diaphragmatic breathing each day can boost your PSNS" is attributed to "the Psychophysiology Journal" with no link or paper; then points to Polar Serene.
- No effect sizes, no time scale, no way to tell a real change from noise beyond "28-day average". Two product promo blocks (Grit X2) and a Serene plug.

**UCF Health (about 1,100 words, position 7 / co-primary 9).** What it answers: HRV definition, factors (age, genetics, ANS balance), low/average/good HRV described with no numbers, factors to act on (stress with a box-breathing protocol, sleep quality, physical activity incl. avoid overtraining and add strength, nutrition and hydration), measuring (choose a device: Oura, Polar H10, HRV4Training; wear it snugly; record baseline "at the same time each day, preferably in the morning"; interpret; monitor regularly). Weaknesses: **zero citations**; dated 2023-12-07; "Genetics can set the stage for your baseline HRV, but it's not fixed. By adopting healthier habits, you can positively shape genetic predispositions" is unsupported and sits oddly against heritability data (E26); box breathing is presented as "promoting good heart rate variability" with no evidence, and in the one RCT that tested box breathing against overnight wearable HRV there was no change (E15); "Regular aerobic activities ... elevate HRV" stated as fact with no size or time frame; no guidance on how long a baseline takes or what change counts. Ends in a cardiology CTA. Strength: the only page with a concrete, copyable breathing protocol and a device list.

**Different Health (about 1,600 words, position 9 / co-primary 6).** What it answers: explicitly ranked "roughly by how strong the evidence is": aerobic exercise "the strongest lever" (cites Amekran 2024, 16 RCTs, E6), slow breathing "the fastest lever" (about 6 breaths/min, 5 to 10 min daily; cites Lehrer & Gevirtz 2014), then sleep, alcohol (cites a 2026 PLOS Digital Health study of "nearly 21,000 adults"), stress, in a five-row evidence table; a tracking method ("compare a rolling weekly average to where you began"; "give them a few weeks"); a sample training week; six FAQs mirroring PAA ("How long does it take to increase HRV?", "Can you increase HRV quickly?", "What lowers HRV?"). This is the strongest competitor and it already occupies the intake's "ranked by evidence" framing, so the article must exceed it on substance, not claim the framing as new. Weaknesses found against primary sources:
- The alcohol study is attributed to "Pena MSB, et al."; the DOI it links (10.1371/journal.pdig.0001284) is Grosicki GJ, Robinson AT, Joyner MJ … Holmes KE (E5), a WHOOP-affiliated analysis. Its effect size (about 3.3 to 3.8 ms lower HRV per extra drink versus personal average) is not reported on the page.
- "Aerobic exercise: the strongest lever" rests on one meta-analysis in Cureus (16 RCTs, 623 participants, programs of at least 4 weeks, mostly short resting ECG recordings, E6). Not disclosed: effects are standardized mean differences (no millisecond estimate), older adults respond less (E7), and a larger 2025 meta-analysis of 34 long-term RCTs found a significant change only in LF/HF with high heterogeneity (E8).
- Breathing "may help lift resting HRV over time": the only RCT we found that measured overnight wearable HRV across a month of daily breathwork found no change in any group (E15). The page does not mention it.
- No sizes for anything except the vague "larger effects at higher doses"; no mention of day-to-day noise (E10) or how big a change must be before it means anything; illness, menstrual cycle, age and genetics appear only as a list in one FAQ; nothing on what is overstated (supplements, cold plunges).
- The 5 to 10 min/day breathing and "weeks to months" time frame are editorial, not sourced.
- Ends in an in-lab assessment CTA.

**Cleveland Clinic (excluded, position 2 primary / 7 co-primary), relevant passages only.** Improvement section: "Take care of your body" (activity, healthy foods), "Take care of your mind" (stress, anxiety, depression), and "Biofeedback training is one method to help improve HRV. By controlling your breathing, you can improve your HRV." Factor list: lower sleep quality or amount, increase in BMI, stress/anxiety/depression, aging. Also states "Most wrist-worn fitness devices ... usually aren't sensitive enough to detect HRV accurately" and gives 24-hour SDNN bands (below 50 ms unhealthy, above 100 ms healthy) citing Shaffer & Ginsberg 2017. Closing note is the same baseline-first message ("heart rate variability is really just about you"). Nothing here that the selected three do not cover more deeply; the 24-hour SDNN thresholds are already handled on `/blog/what-is-a-good-hrv/`.

**Recurring coverage (2 or more of the 3 selected pages), expected by the reader:** stress management (all 3); sleep, including a consistent schedule (all 3; schedule in Polar and UCF); exercise helps but overtraining lowers HRV (all 3); slow or deep breathing (all 3; Polar and UCF also yoga or meditation); alcohol lowers overnight HRV (Polar, Different Health); hydration and diet (Polar, UCF); measure consistently and compare with your own baseline or average, not with others (all 3); a single low day is not alarming, persistent low HRV is worth a doctor (Polar, Different Health).

**Single-source observations:** explicit evidence ranking and an evidence table (Different Health only); a time frame for change, "weeks to a few months" (Different Health only, editorial); a sample training week (Different Health only); a copyable breathing protocol (UCF box breathing); weighted blanket, leafy greens, commute study (Polar only); device shopping list (UCF only); strength training for HRV (UCF only; Yang 2024 NMA E9 ranks resistance training highest for HF only).

**Shared gaps (the contribution space):**
1. **No page separates the three kinds of change.** Things that *pull HRV down* for a night or days (alcohol, illness, sleep loss, a hard session, the luteal phase), things that *raise the baseline over weeks* (aerobic training; weight loss in people with overweight), and things that *raise HRV only while you do them or shortly after* (slow breathing, cold water after exercise). The evidence strength and the right expectation differ for each (E3, E4, E5, E6, E10, E13, E14, E15, E17, E18, E22, E28). This is the core structural contribution.
2. **No page gives sizes.** The packet has millisecond and percentage anchors: about 2, 6 and 13 ms lower RMSSD in the first three sleep hours after low, moderate and high alcohol doses (E4); about 3.3 to 3.8 ms per extra drink relative to personal average in WHOOP data (E5); about 12% lower after high alcohol, 10% lower during sickness, 4.6% after training, 3.2% across the cycle (E3); vagal HRV suppressed 24 to 48 h after intense exercise (E10); day-to-day coefficient of variation around 12% for rMSSD in short field recordings (E10). Readers can finally compare "my 8 ms drop" against known causes and against noise.
3. **No page tests the popular claims against their own sources.** Polar's weighted blanket, leafy greens and hydration claims overreach their studies (E30, E31, E23); breathing's overnight effect has a null RCT co-authored by Andrew Huberman, whose clip ranks on the SERP (E15, E39); fish oil does not change RMSSD or SDNN (E20); cold water raises HRV right after exercise but not on waking (E17, E18) and whole-body immersion lowered RMSSD in early deep sleep in one study (E19); caffeine does not change post-exercise HRV recovery (E21).
4. **No page says what cannot be moved.** Age (E27, E3), genetics (18% heritability for 10-second ECG RMSSD in 149,067 Lifelines participants, 40% to 48% for 24-hour ambulatory RMSSD in twins; E26) and device metric (Apple Watch SDNN vs overnight RMSSD elsewhere; covered on `/blog/what-is-a-good-hrv/`) set much of the number. This answers the PAA "Why is my HRV so low even though I'm fit?" honestly, together with Plews' observation that in elite athletes HRV can fall while fitness rises (E12).
5. **No page gives a usable test for "is it working?".** Supported building blocks: average at least 3 readings a week, weekly averages beat single days (E11); establish a baseline of at least 7 days (E1); compare changes with your own day-to-day noise, while noting there is no evidence that any particular threshold is meaningful (E10); programs in trials ran 4 or more weeks and effects looked larger at 8 or more weeks (E6, E8). The product's open method (30-day trimmed median, deviations scored against a fixed 15 ms spread) can be the worked example, labelled as convention (E36).
6. **No page warns that the number can rise for bad reasons or be contaminated.** A rising HRV in highly trained endurance athletes can accompany overreaching (E2, E12). On Apple Watch, every Breathe session writes an HRV sample to Apple Health (E29), so slow breathing inflates Health's HRV record by construction, which matters to anyone judging "breathing raised my HRV" from the Health app.

**Competitor and vendor claims that must not be promoted to facts** are registered in E39.

## 4. Fit verdict

**`article_fit`, confidence: high.**

1. Both result sets reward articles: seven of the top ten organic rows on each query are articles; one academic paper; one video; Reddit threads. No tool or product dominance.
2. The site can credibly produce it: the product's premise is HRV against a personal baseline; the site already owns the prerequisite pages (what is a good HRV, HRV training, sleep for recovery) and can link rather than re-explain; the app code supplies an open, checkable baseline method (E36) and a genuinely useful device caveat (E29, E35).
3. Click opportunity after features: the AI Overview on both queries will absorb the generic list. The contribution in §3 gaps 1 to 6 is the kind of material an Overview compresses poorly (sizes, time scales, source checks, a verification method).
4. Business purpose: a reader trying to raise HRV needs to judge change against a baseline over weeks, which is what the app does daily.
5. Information gain is real and sourced, not manufactured testing.
6. Realistic peers: Different Health (the prior run recorded it as a DR 21 site) ranks #6 and #9 alongside Cleveland Clinic and Mayo; a physio clinic blog ranks #12. KD 7 and 8. Authority is not a barrier on this SERP.

## 5. Refresh diagnosis

Not applicable (mode `new`).

## 6. Archetype recommendation

**How-to. Confidence: medium.** Runner-up: Custom.

- **The job:** a procedure for a reader whose number is low: (1) check it is really low for you (same device, same window, against your baseline, not a chart; link out for numbers and devices); (2) remove the things that pull it down night to night, ordered by evidence and size (alcohol, illness, sleep loss, hard-session timing, cycle context); (3) build the baseline over weeks (aerobic training; weight loss where relevant), with honest time frames and no promised millisecond gain; (4) use in-session tools for what they do (slow breathing, cold water) without mistaking them for baseline changes; (5) ignore what fails on evidence (supplements, single-session hacks, chasing the daily number); (6) verify with weekly averages over 4 to 12 weeks, with failure branches (no change, change for a bad reason, persistent unexplained drop: see a doctor).
- **Evidence for How-to:** the query is procedural and so is the observed SERP: all three selected pages are action lists with a measurement step; Different Health adds a sample week; PAA includes "Can low HRV be reversed?". The How-to contract's "failure branches" and "verification" are exactly the intake's "judge change against your own baseline and trend" requirement, and they are the weakest part of every competitor.
- **Evidence against How-to / for Custom:** the levers are parallel, not strictly sequential, and a large share of the value is explanatory (evidence ranking, what is overstated). A Custom "evidence-ranked lever guide" would describe that honestly. Why How-to still wins: the ranking can live inside steps 2 to 5 as graded evidence, and the ordered procedure (check, remove dips, build baseline, verify) is a real sequence that none of the competitors provide. The site's `/blog/hrv-training/` is also a How-to but for a different task (daily training decision); the overlap is managed in §9.
- **Information-gain requirements:** (1) the three-kinds-of-change structure with a graded evidence label per lever (E3 to E28); (2) sizes a reader can compare with their own drop (E3, E4, E5, E10); (3) a short "overstated" section built from primary-source checks (E15, E17 to E21, E23, E30, E31), phrased as what the source measured, not as a takedown; (4) "what you cannot move" for the fit-but-low reader (E26, E27, E12); (5) a verification method with numbers and its limits (E1, E10, E11, E36); (6) the Apple Watch Breathe-session caveat (E29).
- **Runner-up if the user prefers:** Custom with the same evidence standard, headed by the ranked table rather than the procedure.

## 7. Commercial completeness

Not applicable: informational article, no product comparison. Vendors appear as documentation sources or as claim-makers, not as options under review.

## 8. Evidence ledger

Shared metadata: all records retrieved 2026-09-25 by this researcher unless stated. "via Europe PMC" = abstract or open-access full-text XML from the Europe PMC REST API (https://www.ebi.ac.uk/europepmc/). PMC URLs listed were checked HTTP 200 on 2026-09-25. DOI links returned 302 redirects (normal). Evidence grades used in §8a: **strong** (meta-analysis of RCTs or very large within-person datasets with consistent direction), **moderate** (meta-analysis with heterogeneity or indirect measurement, or several consistent observational sources), **weak** (small, indirect, observational association, or measured in a setting unlike overnight wearables), **null** (tested and not found).

E1 and E2 are reused from the 2026-08-30 and 2026-09-22 runs with the same IDs and scope; E27 reuses that run's E3 record (renumbered here).

---

**E1** (reused) `source` Esco et al. 2025, Sensors, narrative review of HRV monitoring via mobile devices
- source_url: https://pmc.ncbi.nlm.nih.gov/articles/PMC12787763/ (HTTP 200 2026-09-25). method: narrative review. support: direct. confidence: high.
- Quotes (verified in prior runs): "athletes must first establish a stable personal baseline…involving collecting daily waking HRV for at least 7 consecutive days under consistent conditions."; "Single-time-point HRV measures are highly susceptible to transient fluctuations caused by daily stressors, disruptions in sleep, environmental factors, and measurement inconsistencies."
- scope: athletes, waking HRV via mobile devices. Supports: baseline of at least 7 days; do not judge single readings. dedupe_key: sensors2025-hrv-review

**E2** (reused) `source` Addleman et al. 2024, J Funct Morphol Kinesiol, HRV in strength and conditioning
- source_url: https://pmc.ncbi.nlm.nih.gov/articles/PMC11204851/ (HTTP 200). method: narrative review. support: direct. confidence: high.
- Quote (§5.1, verified in prior run): "Several studies have not found significant changes in highly trained endurance athletes' HRVs after an overload training period, or even identified a paradoxical increase in HRV in overtrained athletes."
- scope: highly trained endurance athletes only; do not generalise to recreational readers except as a caution. dedupe_key: jfmk2024-sc-review

**E3** `source` Altini & Plews 2021, Sensors, 9 million free-living morning measurements (HRV4Training)
- source_url: https://pmc.ncbi.nlm.nih.gov/articles/PMC8659706/ ; doi 10.3390/s21237932. Abstract via Europe PMC. method: large observational dataset, cross-sectional (28,175 users) and within-person longitudinal (9 million measurements over 5 years). support: direct. confidence: high for direction and group-average sizes.
- Quotes: "HRV at the population level reduced with age (p < 0.05, r = -0.35, effect size = moderate) and was weakly associated with physical activity level (p < 0.05, r = 0.21, effect size = small) and not associated with sex". Acute: "a 4.6% change in HRV ... in response to training", "a 12% reduction in HRV ... after high alcohol intake", "a 3.2% change in HRV ... between the follicular and luteal phases of the menstrual cycle", "10% reduction in HRV ... during sickness". BMI and HRV: "r = -0.10, effect size = small". Summary: "HRV is a more sensitive but not specific marker of stress."
- scope: morning smartphone-camera (PPG) measurements by self-selected app users; group averages, not individual predictions. Already cited on `/blog/what-is-a-good-hrv/` for the reading-one-morning section; reuse here for ranking and cross-sectional associations, not a repeat of that section. dedupe_key: altini2021-9m

**E4** `source` Pietilä et al. 2018, JMIR Mental Health, alcohol and nocturnal HRV in 4,098 Finnish employees
- source_url: https://pmc.ncbi.nlm.nih.gov/articles/PMC5878366/ ; doi 10.2196/mental.9519. Full text via Europe PMC. method: within-person observational, continuous beat-to-beat ECG-grade R-R recording, first 3 hours of sleep, each person's alcohol nights vs alcohol-free nights. support: direct. confidence: high.
- Quotes: "RMSSD was decreased by 2.0 ms with low, 5.7 ms with moderate, and 12.9 ms with high alcohol intake." Dose groups: "low (≤0.25 g/kg), moderate (>0.25-0.75 g/kg), and high (>0.75 g/kg)". "Alcohol intake was dose-dependently associated with increased sympathetic regulation, decreased parasympathetic regulation, and insufficient recovery." "The effects of alcohol in suppressing recovery were similar for both genders and for physically active and sedentary subjects but stronger among young than older subjects". "Regular PA or young age do not protect from these effects of alcohol."
- scope: Finnish employees, mean age 45.1, first 3 hours of sleep only (not whole night), self-reported doses. The "recovery percentage" figures (9.3, 24.0, 39.2 percentage units) are a Firstbeat-derived index, not raw HRV; prefer the RMSSD figures. dedupe_key: pietila2018-alcohol

**E5** `source` Grosicki et al. 2026, PLOS Digital Health, alcohol and nocturnal HRV in 20,968 WHOOP members
- source_url: https://pmc.ncbi.nlm.nih.gov/articles/PMC12970902/ ; doi 10.1371/journal.pdig.0001284 (first published 2026-03-09). Abstract and full-text XML via Europe PMC. method: retrospective within-person cohort, 5,109,185 person-days, generalized additive models, person-mean centering. support: direct. confidence: high for direction, medium for exact size (vendor-affiliated authors; a reviewer note in the full text says the manuscript "does not describe how artifacts were handled in the RMSSD calculation").
- Quotes: "consuming one drink more than personal average, compared with one less, was associated with an increase in RHR by 2.8 bpm (99.9% CI: 2.7, 2.9) in females and 2.4 bpm (99.9% CI: 2.3, 2.4) in males, while HRV declined by 3.8 ms (99.9% CI: -4.1, -3.5) in females and 3.3 ms (99.9% CI: -3.5, -3.1) in males." "Drinking earlier in the day, obtaining longer post-drinking sleep, and reducing activity each reduced these effects." HRV metric: "HRV was calculated as the root mean squared of successive beat-to-beat interval differences (RMSSD)."
- Authors: Grosicki GJ, Robinson AT, Joyner MJ, Carter JR, von Hippel W, Presby DM, Fielding F, Bigalke JA, Kim J, Chapman C, Holmes KE; affiliations include WHOOP, Inc. conflicts: vendor data and authors; note this in any public use.
- Contradiction logged: Different Health cites this DOI as "Pena MSB, et al." (§3). dedupe_key: grosicki2026-alcohol

**E6** `source` Amekran & El Hangouche 2024, Cureus, meta-analysis of exercise-training RCTs in healthy adults
- source_url: https://pmc.ncbi.nlm.nih.gov/articles/PMC11250637/ ; doi 10.7759/cureus.62465. Abstract and full text via Europe PMC. method: systematic review and random-effects meta-analysis of RCTs. support: direct. confidence: medium (small total n; Cureus; SMD only; mostly 5-minute daytime ECG recordings).
- Quotes: "Sixteen RCTs with a total of 623 participants were selected". "exercise training improved the standard deviation of normal-to-normal intervals (SDNN) (SMD: 0.58 (0.16, 1.00); p = 0.007), the root mean square of successive differences in heart period series (RMSSD) (SMD: 0.84 (0.36, 1.31); p = 0.0005)". "the effect of exercise on HRV indices may be influenced by sex, age, and type of exercise". Inclusion: "Aerobic or anaerobic exercise training programs lasting 4 or more weeks." Subgroups split at "< 12 and ≥ 12 weeks". Discussion notes "short-term moderate-intensity aerobic training and high-intensity interval training programs failed to significantly affect HRV parameters in physically inactive adults".
- scope: healthy adults 18+, supervised training, short resting recordings, not overnight wearables. No millisecond effect reported: an expected ms gain is `Unknown`. Europe PMC lists two authors; Different Health lists three (minor). dedupe_key: amekran2024-exercise

**E7** `source` Sandercock, Bromley & Brodie 2005, Med Sci Sports Exerc, meta-analysis of exercise training and HRV
- source_url: https://doi.org/10.1249/01.mss.0000155388.39002.9d (abstract via Europe PMC, PMID 15741842). support: direct. confidence: medium (older, small, HF and RR interval only).
- Quotes: "A meta-analysis of 13 studies measuring HF (N=322 cases) produced an overall effect size of d=0.48". "Subgroup analysis revealed significantly smaller responses of RR interval to training in older subjects". "a trend toward an attenuated response to training was exhibited in older subjects". "Exercise training results in significant increases in RR interval and HF power. These changes are influenced by study population age."
- Supports: training raises vagal HRV; response smaller with age. dedupe_key: sandercock2005

**E8** `source` Zhang, Bi & Luo 2025, Front Cardiovasc Med, meta-analysis of long-term exercise RCTs
- source_url: https://pmc.ncbi.nlm.nih.gov/articles/PMC12198180/ ; doi 10.3389/fcvm.2025.1364905. Abstract via Europe PMC. support: partial (tempers E6). confidence: medium.
- Quotes: "In total, 34 studies involving 1,434 participants were included." "Long-term exercise interventions significantly reduced the LF/HF ratio (P < 0.05)." "intervention effects were more pronounced in populations with existing health conditions and in interventions lasting ≥8 weeks." "The high heterogeneity among the included studies ... warrant cautious interpretation".
- Use: the exercise effect is real but heterogeneous and larger in people with health conditions; the abstract reports a significant pooled change only for LF/HF, so "exercise reliably raises RMSSD by X" is not supportable. dedupe_key: zhang2025-longterm-exercise

**E9** `source` Yang et al. 2024, Rev Cardiovasc Med, network meta-analysis of exercise modality and HRV
- source_url: https://pmc.ncbi.nlm.nih.gov/articles/PMC11262364/ ; doi 10.31083/j.rcm2501009. Abstract via Europe PMC. support: partial. confidence: low to medium (SUCRA rankings are probabilistic and sensitive to few trials).
- Quote: "HIIT is the most effective exercise modality in improving the SDNN, RMSSD, and LF/HF power ratio; RT for the HF power".
- Use only as "some evidence that interval training and resistance training also raise resting HRV", never as "HIIT is best". dedupe_key: yang2024-nma

**E10** `source` Buchheit 2014, Front Physiol, "Monitoring training status with HR measures: do all roads lead to Rome?"
- source_url: https://pmc.ncbi.nlm.nih.gov/articles/PMC3936188/ ; doi 10.3389/fphys.2014.00073. Full text via Europe PMC. method: expert review. support: direct. confidence: high for the quoted methodological points.
- Quotes: "In general, intense exercise acutely decreases vagal-related HRV indices for 24 [to] 48 h" [range dash in the original rendered as "to" per house rule]; day-to-day variation of time-domain indices in short field recordings: "coefficient of variation (CV) for rMSSD ≈12%"; training-load-driven daily variation "CV = 10 to 20% for Ln rMSSD" [paraphrased range]; "changes in a given measure should be interpreted by taking into account the error of measurement and the smallest important change"; SWC conventions "SWC = 0.5 [Le Meur et al., 2013b] or 1 [Plews et al., 2012, 2013b] × CV"; and the caveat: "there is currently no evidence that changes greater than any fraction of the CV would actually be meaningful in practice".
- scope: athletes, 5 to 10 minute morning recordings; the CV figures are not overnight-wearable figures. Supports: expect roughly a tenth of your number as ordinary day-to-day wobble (Interpretation), and do not claim a validated threshold. dedupe_key: buchheit2014-rome

**E11** `source` Plews et al. 2014, Int J Sports Physiol Perform, how many readings per week
- source_url: https://doi.org/10.1123/ijspp.2013-0455 (abstract via Europe PMC, PMID 24334285). support: direct. confidence: medium (trained triathletes, small sample).
- Quotes: "To establish the minimum number of days that heart-rate-variability ... data should be averaged to achieve correspondingly equivalent results as data averaged over a 1-wk period." Conclusion: "Practitioners using HRV to monitor training adaptation should use a minimum of 3 (randomly selected) valid data points per week."
- Supports: weekly averages of at least 3 readings. dedupe_key: plews2014-compliance

**E12** `source` Plews et al. 2013, Sports Med, "Training adaptation and HRV in elite endurance athletes"
- source_url: https://doi.org/10.1007/s40279-013-0071-8 (abstract via Europe PMC, PMID 23852425). support: direct. confidence: medium (elite athletes).
- Quotes: "in elite athletes, studies have revealed both increases and decreases in HRV to be associated with negative adaptation. Additionally, signs of positive adaptation, such as increases in cardiorespiratory fitness, have been observed with atypical concomitant decreases in HRV." Solutions include "the use of appropriate averaging techniques" and indices "to overcome the issue of HRV saturation in elite athletes (i.e., reductions in HRV despite decreases in resting heart rate)."
- Use for the "fit but low" PAA only with an elite-athlete scope label. dedupe_key: plews2013-elite

**E13** `source` Zhang et al. 2025, Front Neurol, meta-analysis of sleep deprivation RCTs and HRV
- source_url: https://pmc.ncbi.nlm.nih.gov/articles/PMC12394884/ ; doi 10.3389/fneur.2025.1556784. Abstract via Europe PMC. support: direct. confidence: medium (11 studies, 549 participants, heterogeneous protocols).
- Quotes: "sleep deprivation was associated with a non-significant reduction in SDNN (p > 0.05), while RMSSD showed a significant decrease (p < 0.05)". "existing studies exhibit considerable heterogeneity due to inconsistencies in HRV measurement methods, variations in deprivation duration".
- scope: experimental sleep deprivation, not habitual short sleep and not sleep extension. Evidence that *adding* sleep raises HRV above baseline: `not captured` (no trial found). The sleep-duration recommendation itself (7+ hours) is already sourced on `/blog/how-much-sleep-for-recovery/`. dedupe_key: zhang2025-sleepdep

**E14** `source` Laborde et al. 2022, Neurosci Biobehav Rev, meta-analysis of voluntary slow breathing
- source_url: https://doi.org/10.1016/j.neubiorev.2022.104711 (abstract via Europe PMC, PMID 35623448; full text paywalled). support: direct for direction; effect sizes `not captured`. confidence: high for direction.
- Quotes: 223 studies included "(172 DURING, 16 IM-AFTER1, and 49 AFTER-INT)". "Results indicate increases in vmHRV with VSB, DURING, IM-AFTER1, and AFTER-INT." "VSB exercises could be advised as a low-tech and low-cost technique ... with few adverse effects expected."
- A WebSearch snippet reported small post-session and post-intervention effect sizes; lead only, not used. Most AFTER-INT studies are resting lab measurements, not overnight wearable readings (scope inferred from the design labels; full text not read). dedupe_key: laborde2022-vsb

**E15** `source` Balban et al. 2023, Cell Reports Medicine, RCT of daily 5-minute breathwork vs mindfulness for one month
- source_url: https://pmc.ncbi.nlm.nih.gov/articles/PMC9873947/ ; doi 10.1016/j.xcrm.2022.100895. Full text via Europe PMC. method: remote randomized controlled study (NCT05304000); physiological data from WHOOP (overnight RMSSD). support: direct. confidence: medium (about 100 participants with physiology data, one month, remote).
- Authors: Balban MY, Neri E, Kogon MM, Weed L, Nouriani B, Jo B, Holl G, Zeitzer JM, Spiegel D, Huberman AD (Andrew Huberman is senior author).
- Quotes: arms were "cyclic sighing", "box breathing", "cyclic hyperventilation with retention" and mindfulness meditation. "No significant changes were found in heart rate variability or resting heart rate over the course of the study in either of the groups". "we compared each breathwork group with mindfulness meditation and found no differences in changes in resting heart rate or heart rate variability between any of the breathwork groups and mindfulness meditation (data not shown)." Physiology n from Figure 4 caption: "mindfulness meditation (n = 22) and all breathwork (n = 78)". Positive findings were mood and respiratory rate.
- Use: the best available direct test of "daily breathing raises my overnight wearable HRV" is null. Also contradicts UCF's box-breathing claim and the Huberman clip's framing (E39). dedupe_key: balban2023-breathwork

**E16** `source` Lehrer et al. 2020, Appl Psychophysiol Biofeedback, HRV biofeedback meta-analysis
- source_url: https://doi.org/10.1007/s10484-020-09466-z (abstract via Europe PMC, PMID 32385728; correction PMID 34623527). support: partial. confidence: medium.
- Quote: "A significant small to moderate effect size was found favoring HRVB ... HRVB has the largest effect sizes for anxiety, depression, anger and athletic/artistic performance and the smallest effect sizes on PTSD, sleep and quality of life."
- Use: biofeedback evidence is about symptoms and performance, not about raising resting or overnight HRV. dedupe_key: lehrer2020-hrvb

**E17** `source` Laborde et al. 2024, Clin Physiol Funct Imaging, post-exercise recovery techniques and vagal HRV
- source_url: https://doi.org/10.1111/cpf.12855 (abstract via Europe PMC, PMID 37754676). support: direct. confidence: medium.
- Quotes: "physical post-exercise recovery techniques displayed a small to moderate positive effect on RMSSD (k = 22, Hedges' g = 0.40 ...)". "cold water immersion displayed a moderate to large positive effect (g = 0.75, 95% CI: 0.42-1.07) compared with none for other techniques." "physical post-exercise recovery techniques can accelerate PNS reactivation as indexed by vmHRV".
- scope: measured in the post-exercise recovery window, not overnight or next morning. dedupe_key: laborde2024-recovery

**E18** `source` Stanley, Peake & Buchheit 2013, Eur J Appl Physiol, consecutive days of cold water immersion
- source_url: https://doi.org/10.1007/s00421-012-2445-2 (abstract via Europe PMC, PMID 22752345). support: direct. confidence: medium (11 cyclists, crossover).
- Quotes: "ln rMSSD immediately following CWI was higher (+144 % [92; 211]) compared with PAS. There was no difference between the trials in TT performance (-0.2 % [-3.5; 3.0]) or waking ln rMSSD (-1.2 % [-5.9; 3.4])." "its effects on vagal-HRV vary over time and depend on prior exercise intensity."
- Use: cold water raises HRV right after, not the next morning. dedupe_key: stanley2013-cwi

**E19** `source` Chauvineau et al. 2021, Front Sports Act Living, depth of cold water immersion and sleep
- source_url: https://pmc.ncbi.nlm.nih.gov/articles/PMC8044518/ ; doi 10.3389/fspor.2021.659990. Abstract via Europe PMC. support: partial. confidence: low (12 well-trained male runners).
- Quote: "Heart rate variability analysis showed a significant reduction (p < 0.05) in RMSSD, low frequency (LF), and high frequency (HF) in WHOLE compared with both PARTIAL and CONT during the first sequence of SWS."
- Use only as "one small study found the opposite of the hack claim in early deep sleep". dedupe_key: chauvineau2021-cwi-sleep

**E20** `source` Xin, Wei & Li 2013, Am J Clin Nutr, meta-analysis of fish-oil RCTs and HRV
- source_url: https://doi.org/10.3945/ajcn.112.049833 (abstract via Europe PMC, PMID 23515005). support: direct. confidence: medium.
- Quotes: "Fifteen studies were included." SDNN "(SMD = 0.10, P = 0.35)" and RMSSD "(SMD = 0.05, P = 0.35) ... were not significantly influenced by fish-oil supplementation." "the high-frequency power (HF) ... was significantly increased by fish-oil supplementation (SMD = 0.30, P = 0.005)".
- Use: the best-studied HRV supplement does not move the time-domain metrics wearables report. Other supplements (magnesium, ashwagandha and similar): no meta-analytic evidence searched or found in this pass; `not captured`, so the article must not state "there is no evidence" for named supplements beyond fish oil. dedupe_key: xin2013-fishoil

**E21** `source` Almeida et al. 2024, Curr Cardiol Rev, caffeine and post-exercise HRV
- source_url: https://pmc.ncbi.nlm.nih.gov/articles/PMC11284693/ ; doi 10.2174/011573403x289842240307114736. Abstract via Europe PMC. support: direct for the narrow scope. confidence: medium.
- Quote: "no substantial variations between the placebo and CAF conditions in terms of both ... (RMSSD) (standardized mean difference (SMD) -0.03 ... p=0.77) and high frequency (HF) index". Scope: 2.1 to 6.0 mg/kg before exercise, post-exercise recovery. Evening caffeine and overnight HRV: `not captured`. Optional use only. dedupe_key: almeida2024-caffeine

**E22** `source` Mattos et al. 2022, Clin Nutr, systematic review of lifestyle weight loss and HRV
- source_url: https://doi.org/10.1016/j.clnu.2022.09.009 (abstract via Europe PMC, PMID 36228570). support: direct for the population. confidence: low to medium (12 studies, mostly diet-only, no pooled estimate).
- Quote: "Most of the studies revealed that weight loss through lifestyle changes seems to promote beneficial effects on HRV, restoring sympathovagal balance by increasing parasympathetic activity and reducing sympathetic activation." Population: "overweight and obese individuals".
- scope ceiling: only readers with overweight or obesity; no claim for lean athletes. dedupe_key: mattos2022-weightloss

**E23** `source` Young et al. 2019, Sci Rep, mild hypohydration RCTs (Polar's hydration source)
- source_url: https://pmc.ncbi.nlm.nih.gov/articles/PMC6848126/ ; doi 10.1038/s41598-019-52775-5. Abstract via Europe PMC. support: partial. confidence: low for the wearable claim.
- Quotes: participants "were exposed to a temperature of 30 °C for four hours and either did or did not drink two 150 ml glasses of water"; "When not given water 0.59% (Study 1) and 0.55% (Study 2) bodyweight was lost." "In study 2 declines in HRV were found to mediate the effect of hypo-hydration on ratings of anxiety."
- Use: hydration evidence is weak and daytime-only (12 and 56 participants); it does not show that drinking more water raises overnight HRV. dedupe_key: young2019-hydration

**E24** `source` Kim et al. 2018, Psychiatry Investig, stress and HRV meta-analysis and review
- source_url: https://pmc.ncbi.nlm.nih.gov/articles/PMC5900369/ ; doi 10.30773/pi.2017.08.17. Abstract via Europe PMC. support: direct for "stress lowers HRV". confidence: medium.
- Quotes: "37 publications meeting our criteria". "In most studies, HRV variables changed in response to stress induced by various methods. The most frequently reported factor associated with variation in HRV variables was low parasympathetic activity".
- scope: stress lowers HRV (mostly acute, induced stress). That *stress-management programs raise baseline HRV* is not established by this source; keep separate. dedupe_key: kim2018-stress

**E25** `source` Natarajan, Su & Heneghan 2020, medRxiv preprint (Fitbit), physiological signs of COVID-19 on wearables
- source_url: https://doi.org/10.1101/2020.08.14.20175265 (abstract via Europe PMC). support: direct for direction. confidence: medium (preprint; the peer-reviewed version in npj Digital Medicine not re-checked in this pass).
- Quote: "Respiration rate and heart rate are typically elevated by illness, while heart rate variability is decreased."
- Pair with E3 (about 10% lower HRV during sickness). dedupe_key: natarajan2020-covid

**E26** `source` Heritability of HRV: Tegegne et al. 2020 (Hypertension) and Kupper et al. 2004 (Circulation)
- Tegegne: https://pmc.ncbi.nlm.nih.gov/articles/PMC7480943/ ; doi 10.1161/hypertensionaha.120.15227. Quote: Lifelines "(n=149 067; mean age, 44.5)", 10-second resting ECGs; "The heritability (SE) estimates were 15.6% (0.90%) for SD of normal-to-normal intervals and 17.9% (0.90%) for root mean square of successive differences."
- Kupper: https://doi.org/10.1161/01.cir.0000146334.96820.6e (abstract via Europe PMC, PMID 15492317). Quote: "In 772 healthy twins and singleton siblings, ambulatory ECG was recorded during 24 hours." Genetic contribution "to the mean ambulatory RMSSD (ranging from 40% to 48%)".
- support: direct. confidence: high. Interpretation: a meaningful share of why one person's HRV differs from another's is inherited; estimates depend on recording length. Counters UCF's "not fixed ... you can positively shape genetic predispositions". dedupe_key: hrv-heritability

**E27** (reused from 2026-09-22 run, its E3) `source` Tegegne et al. 2020, Eur J Prev Cardiol, Lifelines RMSSD reference values
- source_url: https://pmc.ncbi.nlm.nih.gov/articles/PMC7734556/ (HTTP 200). Quote (verified in prior run): "In both sexes, the 25th percentile, median and 75th percentile of RMSSD steadily became lower from a young age until age 60 years, and then remained stable."
- scope: 10-second resting ECG, screened healthy Dutch adults. Use only for "HRV falls with age", linking to `/blog/what-is-a-good-hrv/` for the table. dedupe_key: tegegne2020-lifelines

**E28** `source` Schmalenberger et al. 2020, J Clin Med, menstrual cycle and vagal HRV
- source_url: https://pmc.ncbi.nlm.nih.gov/articles/PMC7141121/ ; doi 10.3390/jcm9030617. Abstract via Europe PMC. support: direct. confidence: medium (40 and 50 participants; cites an earlier meta-analysis).
- Quotes: "A recent meta-analysis revealed that cardiac vagal activity (mostly indicated by vagally-mediated heart rate variability; HRV) decreases significantly from the follicular to luteal menstrual cycle phase in naturally-cycling participants." "higher-than-usual P4 significantly predicted lower-than-usual HRV within a given participant". dedupe_key: schmalenberger2020-cycle

**E29** `source` Apple, "Using Apple Watch to measure heart rate, calorimetry, and activity" (white paper, November 2024)
- source_url: https://www.apple.com/health/pdf/Heart_Rate_Calorimetry_Activity_on_Apple_Watch_November_2024.pdf (HTTP 200, text extracted with pypdf). method: official documentation. support: direct. confidence: high.
- Quotes: "Apple Watch also measures heart rate and tachograms in the background when the user is still or during a user-initiated Breathe session in the Mindfulness app." "During a Breathe session, the user is guided through a deep breathing exercise while remaining still for one minute or more." "Along with these heart rates, estimated HRV and a tachogram are published to HealthKit." "Apple Watch calculates HRV using the standard deviation of normal-to-normal measurements (SDNN)".
- Interpretation: on Apple Watch, a Breathe session adds an HRV sample taken during slow breathing to Apple Health, where it sits alongside background samples. Anyone judging "breathing raised my HRV" from Apple Health is partly measuring the breathing itself. dedupe_key: apple-hr-whitepaper-2024

**E30** `source` Park et al. 2009, Am J Clin Nutr, diet and HRV in the Normative Aging Study (Polar's leafy-greens source)
- source_url: https://pmc.ncbi.nlm.nih.gov/articles/PMC2714396/ ; doi 10.3945/ajcn.2008.26849. Abstract via Europe PMC. support: contradictory to Polar's wording. confidence: high as a description of the study.
- Quotes: "HRV variables were measured among 586 older men with 928 total observations". "intake of green leafy vegetables was positively associated with normalized high-frequency power". "No significant association was seen between HRV measures and intakes of other fruit and vegetables, vitamin C, carotenoids, tuna and dark-meat fish, or n-3 (omega-3) fatty acids." dedupe_key: park2009-diet

**E31** `source` Chen et al. 2016, J Formos Med Assoc, deep pressure during wisdom tooth surgery (Polar's weighted-blanket source)
- source_url: https://doi.org/10.1016/j.jfma.2016.07.008 (abstract via Europe PMC, PMID 27568389). support: contradictory to Polar's wording. confidence: high as a description.
- Quotes: "we investigated the effects of deep pressure input on autonomic responses to wisdom tooth extraction in healthy adults." Measures were "assessed at the baseline, during wisdom tooth extraction, and in the posttreatment phase." "deep pressure input in the experimental group was associated with higher HF-HRV and lower LF/HF-HRV during extraction compared with those in the control group."
- Polar's description ("bedding used by people recovering from wisdom tooth extractions ... weighted blankets ... higher HRV scores") does not match: no bedding, no sleep, measured during surgery. dedupe_key: chen2016-deeppressure

**E32** `source` Kageyama et al. 1998, Ind Health, commuting, overtime and HRV (Polar's work-stress source)
- source_url: https://doi.org/10.2486/indhealth.36.209 (abstract via Europe PMC, PMID 9701898). support: partial. confidence: low for generalisation.
- Quote: "Workers with a one-way commute of 90 min or more exhibited decreased vagal activity at supine rest". Sample: "223 male white-collar workers in the Tokyo Megalopolis". Cross-sectional, daytime short-term HRV. dedupe_key: kageyama1998

**E33** `source` Routledge et al. 2010, Can J Cardiol, exercise therapy and HRV (SERP position 4)
- source_url: https://pmc.ncbi.nlm.nih.gov/articles/PMC2903986/. Abstract via Europe PMC. support: partial (clinical populations). confidence: medium.
- Quote: "exercise therapy may improve HRV in myocardial infarction, chronic heart failure and revascularization patients by increasing vagal tone and decreasing sympathetic activity."
- Use: clinical boundary only; not evidence for healthy athletes. dedupe_key: routledge2010

**E34** `source` Leal-Menezes et al. 2025, Clin Auton Res, HIIT vs moderate continuous exercise and HRV recovery
- source_url: https://doi.org/10.1007/s10286-024-01103-7 (abstract via Europe PMC, PMID 39821813). support: partial. confidence: low to medium (9 studies in meta-analysis; 6 of 16 high risk of bias).
- Quote: HIIT showed "a slower recovery to baseline levels for HF ... within the first 10 min of recovery, which did not occur after 1 h." "healthy individuals restore modulation of the autonomic nervous system to baseline levels after this time interval, regardless of exercise intensity."
- Tension with E10's "24 to 48 h": different measures and windows (lab minutes-to-hours vs next-morning resting HRV after intense training in athletes). Keep E10 for next-morning expectations; do not cite E34 as "HRV recovers within an hour" for overnight readings. dedupe_key: lealmenezes2025

**E35** `site_observation` Readiness Coach HRV sample selection (first-party code)
- source: `src/utils/hrvSamples.ts` in the project repo (read 2026-09-25, branch `claude/font-scale-104`). support: direct. confidence: high for current code; live-app behaviour assumed to match the shipped version but not re-verified on device.
- Observed: comment "Apple Watch writes several SDNN samples a day: a handful overnight, and ultra-short daytime readings whenever the wearer is still."; overnight window `OVERNIGHT_START_HOUR = 20`, `OVERNIGHT_END_HOUR = 12`; today's value is the mean of all samples in [yesterday 20:00, today 12:00]; no filtering by source or session type.
- Implication (Interpretation, combined with E29): a Breathe session done before noon adds a during-breathing SDNN sample to the app's "overnight" mean. **Flag to orchestrator, not fixed:** possible product issue for the 1.0.x backlog; the article must not claim the app excludes Breathe readings. dedupe_key: app-hrvsamples

**E36** `site_observation` Readiness Coach baseline and scoring convention (first-party code, cross-checked with prior run E21)
- source: `src/utils/index.ts` `computeHRVBaseline` (fewer than 7 samples returns population default 55 ms; otherwise sort, drop the bottom 20%, median of the rest); `src/utils/readiness.ts` (`HRV_SD: 15`; `z = (hrv - hrvBaseline) / 15`; HRV sub-score `clamp(50 + z * 20, 0, 100)`; weights recovery 0.45, sleep 0.40, stress 0.15). The 30-day history window is per intake and the 2026-09-22 run's E21; not re-verified line by line here.
- Interpretation: because the baseline is a trimmed median of about a month, a real improvement shows up slowly and single bad nights do not drag it down. Label as product convention, not research. dedupe_key: app-baseline

**E37** `site_observation` Cycle-phase baselines (not live)
- source: `src/utils/cycleBaselines.ts` (commit 54da6cc "feat(1.0.3)"): after at least two complete logged cycles, today's HRV is compared with the same phase of earlier cycles; correction bounded to plus or minus 25% for HRV. Intake: 1.0.3 is in App Store review, not live. Use only if 1.0.3 has shipped by publication; otherwise omit. dedupe_key: app-cycle-baselines

**E38** `serp_observation` Ahrefs SERP overviews, US, 2026-09-25 (orchestrator-supplied)
- `.runtime/serp-how-to-improve-hrv-us.json`, `.runtime/serp-how-to-increase-hrv-us.json`. Positions, result types, PAA and AI Overview citations as tabulated in §3. Limitation: this researcher did not see raw provider responses. dedupe_key: serp-2026-09-25

**E39** `lead_only` Competitor and creator claims register (not facts)
- Polar: weighted blanket, leafy greens, hydration and commute claims (tested in E31, E30, E23, E32); "six minutes of slow, diaphragmatic breathing each day can boost your PSNS" attributed to "the Psychophysiology Journal" with no link (untraceable); "regular exercise is one of the most effective ways to improve your HRV" (uncited on page; directionally supported by E6, E7).
- UCF Health: "By adopting healthier habits, you can positively shape genetic predispositions" (unsupported; see E26); box breathing "promoting good heart rate variability" (no evidence given; E15 null for overnight HRV); no citations anywhere.
- Different Health: "Aerobic exercise: the strongest lever" (rests on E6; tempered by E8); breathing "may help lift resting HRV over time" (E14 supports lab resting effects; E15 null for overnight wearable HRV); alcohol reference author "Pena MSB" (wrong; E5).
- Oura "8 ways" (WebFetch summary, not verbatim): stability framing ("focus on stability or higher-than-normal readings"), member-data alcohol claim ("a median HRV decrease of 12%"), flight claim ("5 to 39% reduction"). Vendor data, no method captured; lead only.
- YouTube (Huberman clip, 2025-06-25): description says long exhales and the physiological sigh "raise heart-rate variability". Direct test in his own group's RCT found no change in daily WHOOP HRV over a month (E15). Present as "raises HRV while you do it; a month of daily practice did not move overnight HRV in the one trial that checked", not as a gotcha.
- Cleveland Clinic: "Most wrist-worn fitness devices ... usually aren't sensitive enough to detect HRV accurately" (uncited on page; out of scope for this article).
- dedupe_key: competitor-claims-2026-09-25

**E40** `calculation` Alcohol dose groups in US standard drinks (for readability of E4)
- Inputs: E4 dose cut-offs 0.25 and 0.75 g/kg; assumed body mass 70 kg; US standard drink = 14 g of pure alcohol (NIAAA definition, known convention, not re-fetched in this pass; verify before publishing).
- Result: low ≤ 17.5 g (about 1.25 drinks or fewer); moderate 17.5 to 52.5 g (about 1.25 to 3.75 drinks); high > 52.5 g (more than about 3.75 drinks) for a 70 kg person. Scales with body mass. Status: Calculated; label as approximate. dedupe_key: calc-alcohol-drinks

**E41** `calculation` What 12% day-to-day wobble means in milliseconds (illustration)
- Inputs: E10 CV for rMSSD about 12% (short field recordings in athletes). For a reader whose baseline is 50 ms, one CV is about 6 ms; for 30 ms, about 3.6 ms.
- Status: Calculated illustration; the CV of overnight wearable HRV for a given person is `Unknown` and personal. Must be framed as "roughly", with E10's caveat that no threshold is validated. dedupe_key: calc-cv-ms

### 8a. Ranked lever table (evidence grade, kind of change, and what the packet supports)

| Lever | Kind of change | Evidence grade | Supported claim ceiling | IDs |
|---|---|---|---|---|
| Alcohol (less, earlier, fewer drinks) | Removes acute dips | Strong | Dose-dependent lower overnight RMSSD in large within-person datasets: about 2, 6 and 13 ms in the first 3 sleep hours for low, moderate, high doses; about 3.3 to 3.8 ms per extra drink vs personal average; about 12% after high intake | E4, E5, E3, E40 |
| Illness | Acute dip (not a lever, a cause to recognise) | Strong (observational) | About 10% lower during sickness; wearables show HRV falls and resting HR rises | E3, E25 |
| Hard training timing | Acute dip | Moderate to strong | Intense exercise lowers vagal HRV for 24 to 48 h; training days about 4.6% change | E10, E3 |
| Sleep loss | Acute dip | Moderate | Sleep deprivation lowers RMSSD in an RCT meta-analysis (SDNN change not significant); adding sleep above need: not captured | E13 |
| Menstrual cycle | Predictable swing (context, not a lever) | Moderate | Vagal HRV lower in luteal phase; about 3.2% in free-living data | E28, E3 |
| Acute psychological stress | Acute dip | Moderate | Stress lowers parasympathetic HRV indices; stress-management raising baseline: not established here | E24 |
| Aerobic (and other) training over weeks | Raises baseline | Moderate | RCT meta-analyses show higher SDNN/RMSSD/HF after 4+ week programs; smaller in older adults; heterogeneous; no ms estimate | E6, E7, E8, E9 |
| Weight loss (if overweight) | Raises baseline | Weak to moderate | Most of 12 studies in overweight/obese adults found benefit; no pooled size | E22 |
| Slow breathing (about 6/min) | In-session and shortly after; small lab resting effect after programs | Strong (in-session), null (overnight wearable, one RCT) | Raises HRV during and immediately after; one month of daily breathwork did not change WHOOP overnight HRV | E14, E15, E16, E29 |
| Cold water immersion | In-session only (post-exercise) | Moderate (acute), null for waking | Faster post-exercise vagal reactivation; no difference in waking ln rMSSD; one small study lower RMSSD in early deep sleep | E17, E18, E19 |
| Hydration | Unclear | Weak | Mild daytime hypohydration lowered HRV in two small heat-exposure trials | E23 |
| Fish oil / supplements | None on time-domain HRV | Null (fish oil) / not captured (others) | No significant change in SDNN or RMSSD; small HF rise | E20 |
| Caffeine | None on post-exercise recovery | Null (narrow scope) | No effect on post-exercise RMSSD/HF recovery | E21 |
| Leafy greens, weighted blankets | Not supported as stated | Weak / mismatched | Observational association in older men; deep pressure during surgery | E30, E31 |
| Age, genetics, device metric | Not movable | Strong | HRV falls with age; 18% to 48% heritable depending on recording | E27, E3, E26 |

## 9. Site and internal-link inventory

All URLs checked 2026-09-25 by curl: HTTP 200 unless stated; `www.thereadiness.app` 301-redirects to `https://thereadiness.app/`; canonical form is `https://thereadiness.app/…/` with trailing slash (confirmed on `/blog/what-is-a-good-hrv/`). The target slug `/blog/how-to-improve-hrv/` returns 404 (free). Not link targets: `/privacy/`, `/support/`.

| Destination | Topic | Overlap with this article | Why it may help the reader | Status and caveats |
|---|---|---|---|---|
| https://thereadiness.app/blog/what-is-a-good-hrv/ | HRV by age table, device decoder, baseline method, numeric PAA ("Is 43 ms good?"), when low/high is worth attention | High on context: it already answers "Is 22/28/30 bad?", by-age norms, SDNN vs RMSSD by device, and uses Altini 2021 for single-morning swings. **Must-consider link.** | Send number-anxiety and device questions there instead of repeating them; natural at "first check it is really low for you". | 200. Do not duplicate its table, device decoder or the "reading one morning" worked examples. |
| https://thereadiness.app/blog/hrv-training/ | Daily HRV-guided training decision (7-day baseline, green/amber/red), "When HRV lies to you", and a short "Raising your baseline HRV" section (sleep 7+, less alcohol, sensible training load) | Direct overlap: its "Raising your baseline HRV" section is a three-lever version of this article, and its alcohol evidence is a heart-rate study (Nutrients 2025). **Must-consider link.** | Link where the reader moves from "raise my baseline" to "what do I do today". | 200. Flag, not fixed: once this article ships, that section is a natural place for a link to it (production change for the owner). Also contains an en dash in the range "45 to 55" (written with a dash, Quick answers, line 139) against the house rule. |
| https://thereadiness.app/blog/how-much-sleep-for-recovery/ | AASM/SRS 7+ hours consensus; why the app targets 7 | Low; supports the sleep lever without re-sourcing it | At the sleep lever. | 200. |
| https://thereadiness.app/blog/garmin-hrv-apple-health/ | Garmin HRV does not sync to Apple Health; three workarounds | Low | For Garmin readers who want to track their trend in an Apple Health app. | 200. |
| https://thereadiness.app/blog/what-is-a-readiness-score/ | The app's public score model | Low | Where the article shows the product's baseline method as a worked verification example. | 200. |
| https://thereadiness.app/blog/ | Blog index | None | Navigation only. | 200. |
| https://thereadiness.app/ | Home / product | None | Soft product mention at the end. | 200. |
| https://apps.apple.com/app/id6760478506 | App Store listing | None | Used by the prior article; 301 to `https://apps.apple.com/us/app/readiness-coach-hrv-score/id6760478506`. | 301 (valid redirect). |

## 10. Unknowns and research gaps

- **Expected millisecond gain from training:** `Unknown`. Meta-analyses report standardized effects only (E6, E7). The article must not promise "+X ms in Y weeks".
- **Time course for a baseline rise:** trials ran 4 or more weeks, with larger effects at 8 or more weeks in one meta-analysis (E6, E8). "Weeks to months" is a defensible Interpretation; any specific week count is convention.
- **Sleep extension:** no trial found showing that more sleep than needed raises HRV; E13 covers deprivation only.
- **Slow breathing effect sizes (E14):** not captured (paywall). Direction only.
- **Overnight-wearable CV:** the 12% figure (E10) is from short morning field recordings; each reader's overnight CV is personal and `Unknown`.
- **Stress-management programs raising baseline HRV:** not established in this packet (E24 covers stress lowering HRV).
- **Supplements other than fish oil (magnesium, ashwagandha, adaptogens):** not searched to meta-analysis level; `not captured`. Do not assert "no evidence" for them by name; say the best-studied one (fish oil) does not change RMSSD.
- **Late meals, travel, evening exercise:** vendor claims only (Polar, Oura); `not captured` as primary evidence.
- **Reddit threads, Mayo Clinic Press page, AI Overview text:** not captured (blocked).
- **Polar publish date:** Unknown.
- **Standard-drink definition (E40):** known convention (14 g, NIAAA), not re-fetched; verify before publishing if used.
- **Product:** whether a morning Breathe session is inflating users' "overnight" HRV in the live app (E35) is an inference from code plus Apple's documentation, not an observed user case. Whether 1.0.3 has shipped by publication (E37) is unknown.
- **Question for the user:** should the article mention the Breathe-session contamination as a general Apple Health caveat only (safe, fully sourced by E29), or also as a known app behaviour (requires a product decision first)?

## 11. Checkpoint A handoff

- **Fit verdict:** `article_fit`, high confidence. Mode new; no reroute.
- **Recommended archetype:** How-to (medium confidence); runner-up Custom (evidence-ranked lever guide).
- **Angle test result:** the intake angle is supported with three corrections. (1) "Ranked by strength of evidence" is already Different Health's framing, so it is not novel by itself; the differentiator has to be the *kind* of change (removes dips, raises baseline over weeks, raises HRV only in-session), sizes, and source checks. (2) Slow breathing does not belong in the "what moves it" list for the overnight number without qualification: it raises HRV during and just after practice, and the one RCT that tracked overnight wearable HRV for a month found no change (E15). (3) Hydration is weak evidence (E23), body weight applies only to readers with overweight (E22), and age is context, not a lever (E27, E26). Sleep is well supported for loss (E13) but not for "more sleep raises it above your normal". Cold plunges and supplements are correctly placed in "overstated" (E17 to E20).
- **Competitors:** 3 selected, all `observed_rank`, formats all list-of-levers articles: Polar (pos 6 / co-primary 2), UCF Health (7 / 9), Different Health (9 / 6). Excluded with reasons: Cleveland Clinic (#2, general explainer, about 100 words on improving), PMC2903986 (#4, academic), two Reddit discussions (#5) and r/whoop (#10) (threads, blocked), YouTube (#8, video), Mayo Clinic Press (#11, outside top ten and 403), SB Physio (#12), Oura (co-primary #11). Captures registered; runtime accepted.
- **Strongest publication candidates for public links:** E4 and E5 (alcohol sizes), E3 (acute sizes and cross-sectional associations), E6 (training meta-analysis), E15 (breathing null for overnight HRV), E18 (cold water, waking HRV unchanged), E20 (fish oil), E26 (heritability), E29 (Apple Breathe HRV to HealthKit), E10 and E11 (noise and weekly averaging).
- **Proposed boundary for the brief:** one How-to article for both queries plus "why is my hrv low", "how to raise hrv", "how to improve hrv score"; answer "Why is my HRV so low even though I'm fit?" and "Can low HRV be reversed?" in-article; route numeric and device questions to `/blog/what-is-a-good-hrv/` and daily training decisions to `/blog/hrv-training/`; general-wellness framing with a sourced see-a-doctor boundary (persistent unexplained drop; E33 for clinical context, and the prior article's clinical section by link). No new paid research needed.
- **Flags for the orchestrator (not acted on):** possible app behaviour where morning Breathe sessions feed the "overnight" HRV mean (E35); `/blog/hrv-training/` "Raising your baseline HRV" section will want a link to this article after publication, and it contains an en dash.
- **Choices at Checkpoint A:** accept How-to; choose Custom instead; supply more evidence (for example Reddit thread text or a named expert); or stop.
