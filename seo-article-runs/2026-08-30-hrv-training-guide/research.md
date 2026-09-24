# Research — "hrv training" (Readiness Coach / thereadiness.app)

## 1. Run context

- Run/stage: `2026-08-30-hrv-training-guide`, stage 2 (research), mode `new`, approval mode `guided`.
- Researcher identity: Claude Code native research subagent (model `claude-fable-5`), dispatched by the seo-article orchestrator. No helper agents spawned.
- Target query: `hrv training`. Working angle: how to use HRV to guide day-to-day training decisions.
- Audience: recreational athletes and serious fitness enthusiasts (runners, cyclists, lifters, triathletes), US market, English.
- Site: https://thereadiness.app — Readiness Coach, an iOS app computing a daily readiness score from HRV, resting heart rate, and sleep read from Apple Health, scored against personal baselines (45% recovery / 40% sleep / 15% stress, 7-day calibration). Free core score; Pro tier with AI briefing/coach; 7-day full access for new accounts.
- Goal: organic traffic converting to app installs; article must be genuinely useful stand-alone and must not read as an ad.
- Requested locale: US/English. Observed: WebSearch is US-only, matching the intended market.
- Capture window: 2026-08-30.
- Source display preference: `automatic` (presentation choice only; this ledger retains full provenance regardless).
- Evidence model (frozen): independent editorial grounded in published research + first-party product documentation. No hands-on lab testing. Every material claim needs a real, checkable citation.
- Inputs used: WebSearch (3 queries + 1 URL-resolution query for the HSS slug), WebFetch (6 fetches incl. 1 redirect + 1 refused), local curl page fetches for capture/status checks, one local browser-pane page load (Whoop, after curl/WebFetch 403), frozen doctrine snapshot at `.runtime/doctrine-snapshot.json`, and one orchestrator-supplied Ahrefs SERP overview (keyword `hrv training`, US, retrieved 2026-08-30) — a true observed ranking source (E10).
- **Checkpoint A amendment (2026-08-30):** the user approved (a) keeping the original three-page selection, (b) adding the observed-#5 HSS page to the selected set, (c) re-benchmarking on the orchestrator-supplied Ahrefs observed SERP, and (d) a scope addition: one compact, cited improve-HRV section (raising baseline HRV: sleep, alcohol, load management) to serve the mixed SERP and PAA questions. Sections 3, 4, 6, 8, 10, 11 reflect this amendment.

## 2. Coverage and limitations

- Tools available: WebSearch, WebFetch, curl (local), local browser pane. Frozen intake excluded Apify, OpenRouter, social research, and spending. No SEO ranking tool was used (an Ahrefs MCP connection exists in this environment but was outside the frozen WebSearch/WebFetch-only scope; see handoff for the upgrade option).
- Ranking route: my own WebSearch discovery established no verified Google positions (ordering is not a SERP). At Checkpoint A the orchestrator supplied an Ahrefs SERP overview for `hrv training` (US, 2026-08-30) — **observed positions now exist** for the URLs it listed (E10). The three originally selected pages (Whoop, Oura, TrainingPeaks/Wegerif) were **not** in that observed top-10; they remain selected by explicit user decision at Checkpoint A (`user_override`, positions null). HSS carries observed position 5.
- Blocked/degraded paths:
  - whoop.com: 403 to curl and WebFetch; captured successfully via local browser pane after the site's automatic verification completed on its own (no challenge was interacted with).
  - jcsm.aasm.org (AASM/SRS consensus URL used on the site today): serves a JavaScript "Client Challenge" stub to my tooling; live resolution unverified. The identical consensus statement was verified via its PMC mirror (E3).
  - pubmed.ncbi.nlm.nih.gov: cookie/challenge wall to both WebFetch and curl; Kiviniemi 2007 abstract not directly readable (E5 marked accordingly).
- Not checked: search volume/keyword difficulty (no tool in scope), SERP features (People Also Ask, video packs) beyond what WebSearch exposes, competitor pages beyond the inspected set, social/forum sentiment (excluded by intake).
- WebFetch caveat: WebFetch answers are produced by a small summarizer model against the fetched page; quotes below marked `retrieved via WebFetch` were returned by it as verbatim. Two successive summaries of E1 disagreed on whether the review recommends rolling averages vs fixed weekly windows; only the directly quoted passages are treated as evidence, and the discrepancy is retained in E1's limitations.

## 3. SERP and competitor benchmark {#serp-and-competitor-benchmark}

### Observed SERP (Ahrefs, orchestrator-supplied) {#observed-serp}

Ahrefs SERP overview, keyword `hrv training`, country US, retrieved 2026-08-30 by the orchestrator (E10). This is a true observed Google organic ranking source. Observed features and organic positions as supplied:

- **AI Overview present at the top** of the SERP — a direct-answer feature that reduces click opportunity for generic definitions and strengthens the case for a page whose value is a usable protocol rather than a definition.
- **PAA questions:** "What is good HRV by age?", "Does 4 7 8 breathing increase HRV?", "Are VO2 max and HRV related?", "Is 37 a low HRV?"
- Organic positions (as reported; positions 1, 3, 6 not included in the supplied data):

| Pos | URL | Notes (as supplied) | Disposition |
|---|---|---|---|
| 2 | sbphysio.com/blog/blog — "How to Improve HRV Naturally" | DR 21 | excluded — improve-HRV intent, not use-HRV-for-training |
| 4 | pmc.ncbi.nlm.nih.gov/articles/PMC11204851 | our E2 source, ranking organically | excluded — academic review; it is this run's own evidence source, not an editorial competitor |
| 5 | hss.edu/health-library/move-better/heart-rate-variability — "How to Use Heart Rate Variability Data in Your Training" | DR 80, est. 45,845 monthly traffic | **selected** — highest-authority match for the reader task |
| 7 | hrv4training.com (homepage) | DR 57 | excluded — tool/product homepage, not an article |
| 8 | elitehrv.com — "12 Ways to Improve Your Heart Rate Variability" | DR 56 | excluded — improve-HRV intent |
| 9 | trainingpeaks.com — "The Athlete's Handbook to Training With HRV" | DR 80, est. 7,816 traffic; Ahrefs reported the blog-root URL | excluded — resolved (below) to a ~250-word link-hub, no substantive body to benchmark |
| 10 | kubios.com — "HRV-guided training" | DR 51 | excluded — prior exclusion stands (researcher/practitioner audience) |

**Mixed intent confirmed:** positions 2 and 8 plus all four PAA questions are improve-HRV intent; positions 4–5, 7, 9–10 are use-HRV/monitoring intent, and an academic review holds #4. Consequence (user-approved scope addition): the article stays a use-HRV-for-training How-to but includes one compact cited improve-HRV section (raising baseline HRV: sleep, alcohol, load management — E2, E3, E4) to serve the mixed SERP and the PAA questions.

**TrainingPeaks URL resolution:** Ahrefs reported the position-9 entry at the blog-root URL. The actual page is https://www.trainingpeaks.com/blog/the-athlete-handbook-training-hrv/ — a **distinct page** from the selected Wegerif article: a staff-bylined hub of ~250 words plus seven teaser cards linking to other TrainingPeaks HRV articles (capture: `trainingpeaks-athlete-handbook-hub.md`). It contains no substantive standalone coverage, so it is excluded from the content benchmark; the Wegerif article (`/blog/using-heart-rate-variability-to-schedule-the-intensity-of-your-training/`) remains the selected TrainingPeaks page as the domain's substantive guide, with `observed_position` null (it was not itself in the observed top 10) under the Checkpoint A user override. A SERP-strategy note either way: what TrainingPeaks actually ranks with is a hub, which suggests Google is rewarding topical breadth on this domain, not that a hub is the format to imitate for a single article.

The three originally selected pages (Whoop, Oura, TrainingPeaks/Wegerif) did **not** appear in the observed positions supplied. Their selection stands by explicit user decision at Checkpoint A (guided run); this is recorded as `user_override` with null positions, and their benchmark role is content depth, not ranking proof.

### Inspected result set (original WebSearch discovery)

Three WebSearch queries, US, 2026-08-30. Ordering within each result list is as returned by WebSearch and is **not** a verified Google organic ranking. Every URL surfaced, with disposition:

| # | URL | Disposition | Reason |
|---|-----|-------------|--------|
| 1 | https://www.whoop.com/us/en/thelocker/heart-rate-variability-training/ | **selected** | Dominant consumer-recovery brand's canonical guide for the exact reader task; appeared in 2 of 3 query variants; freshest (Apr 2026). |
| 2 | https://ouraring.com/blog/train-better-using-hrv/ | **selected** | Major wearable brand's how-to for the same task (baseline, push-day/rest-day decisions); representative of the consumer-editorial format the query rewards. |
| 3 | https://www.trainingpeaks.com/blog/using-heart-rate-variability-to-schedule-the-intensity-of-your-training/ | **selected** | Only strong independent (non-wearable-vendor) editorial guide; appeared in all 3 variants; expert author (ithlete founder); primary-study citations; modified May 2026. |
| 4 | https://www.trainingpeaks.com/blog/the-athlete-handbook-training-hrv/ | excluded | Second TrainingPeaks URL; kept one page per domain, choosing the stronger recurring one (#3). |
| 5 | https://www.trainingpeaks.com/coach-blog/hrv-guided-training/ | excluded | Third TrainingPeaks URL, coach-audience skew; same domain cap. |
| 6 | https://rouvy.com/blog/how-to-use-hrv-for-training | excluded | Smaller brand; coverage substantially overlaps the three selected; sample capped at three per the SERP reference. |
| 7 | https://www.kubios.com/blog/hrv-guided-training/ | excluded | HRV-analytics vendor blog aimed at researchers/practitioners; audience mismatch with recreational athletes. |
| 8 | https://www.runbikecalc.com/blog/hrv-training-complete-guide | excluded | Low-authority calculator site; no evident ranking strength or distinct coverage. |
| 9 | https://medium.com/in-fitness-and-in-health/hrv-is-an-effective-tool-to-guide-everyday-endurance-athletes-38be98e6d877 | excluded | Medium repost of a coach's article; platform page, weaker fit signal. |
| 10 | https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7432021/ | excluded | Academic trial protocol (professional endurance athletes), not a competing article for this reader task; useful as evidence lead only. |
| 11 | https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9518127/ | excluded | Clinical population (elders after stroke); intent mismatch. |
| 12 | https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9518028/ | excluded | Clinical population (coronary artery disease); intent mismatch. |
| 13 | https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8001752/ | excluded | Academic study (adolescent runners at altitude); evidence lead, not a competitor. |
| 14 | https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9505647/ | excluded | Academic study (WHOOP HRV variability in water polo); evidence lead, not a competitor. |
| 15 | https://clinicaltrials.gov/study/NCT02426476 | excluded | Trial registry page (HRV biofeedback in pain patients); not an article, off-intent. |

Queries: `hrv training`; `how to use HRV to guide training`; `hrv training guide athletes daily readiness`. The first query's result list skewed academic (PMC pages), consistent with mixed intent on the head term; the how-to variants surfaced the commercial-editorial set. The intended intent segment for this article is the "how do I actually use this to decide today's workout" reader, which the three selected pages serve.

Captures frozen 2026-08-30 under `.runtime/competitors/` and re-registered via `register-competitors` after the Checkpoint A amendment (aggregate sha256 `3242c423…`, 35,618 bytes; the earlier 3-page registration `eb73f3c9…` is superseded):

- `whoop-hrv-training.md` — Kristen Holmes, Apr 8, 2026 (user_override, position null)
- `oura-train-better-using-hrv.md` — Oura Team, Mar 18, 2024 (updated Jul 8, 2024) (user_override, position null)
- `trainingpeaks-how-to-use-hrv.md` — Simon Wegerif, published 2016-03-11, modified 2026-05-11 (page JSON-LD) (user_override, position null)
- `hss-hrv-training-data.md` — HSS / Vincent Luppino PT, DPT, published 8/22/2023 (observed_rank, position 5)

Reference capture, not registered: `trainingpeaks-athlete-handbook-hub.md` (the observed-#9 hub, excluded).

### Passage-grounded benchmark

**Whoop (~1,600 words + FAQ).** Strongest structural depth of the three. Its "Using WHOOP Recovery to guide your training" section gives four named training states with observable signatures — e.g. functional overreaching: "Mostly yellow and perhaps 1-2 green recoveries per week … HRV trends downward, RHR trends upward" — which is the closest any competitor comes to a decision framework. But every rule is expressed in Whoop's proprietary green/yellow/red Recovery buckets, unusable without the $30/mo product, and the page explicitly argues readers away from raw HRV: "research has shown that our proprietary algorithm is more predictive of next-day capacity" (vendor claim, no citation given). FAQ answers ("What is a good HRV by age?") are personal-baseline-first, which matches the evidence. No external citations at all — researcher names ("Kiviniemi, Plews, Buchheit, Flatt, etc") are dropped without links.

**Oura (~900 words).** Shortest and shallowest. Gives the correct core heuristics — "Establish a baseline: … Give yourself at least 2 weeks", "There is no gold standard range for HRV; it is highly personal", high-vs-baseline = push day, low = recovery — but each is a single sentence; there is no protocol for what counts as a meaningful deviation, no numbers, and every link is an internal Oura blog link. Ends in a "Shop Now" CTA. Coverage of patterns ("A small drop … is normal; A large drop … early warning; consistently low … not enough recovery") is useful but unquantified.

**TrainingPeaks (~1,100 words).** The only page with primary-source citations (6 references incl. Kiviniemi 2007, Plews 2012, Buchheit 2009). Best explanation of mechanism (super-compensation, "the sympathetic 'fight or flight' branch … more active" during stress) and the only page that addresses why HRV won't always match how you feel (three cited reasons) and the RHR insensitivity point ("by the time it has risen 3 to 5 beats, it may already be too late"). Weaknesses: core text dates to 2016 (author's app ithlete ran "from 2009 to 2025", i.e. discontinued); no step-by-step daily decision protocol; assumes a chest-strap/app morning-reading workflow rather than the overnight-wearable workflow most 2026 readers have; funnels to TrainingPeaks Premium.

**HSS (~1,100 words, observed #5).** The authority outlier: DR 80 medical institution ("#1 in orthopedics"), named credentialed expert (Vincent Luppino, PT, DPT, OCS) quoted throughout, est. 45,845 monthly page traffic. Strengths: cleanest plain-language definition of the set ("Heart rate variability, or HRV, is the measure of the variation in time between heartbeats, measured in milliseconds"); practical measurement tips; the only page that answers the PAA-style "what's normal" question with numbers ("A normal HRV at rest for someone in their 20s is 55 to 105; for someone in their 60s, it's 25 to 45"); personal-baseline advice ("look at your HRV average over the course of a week to learn your baseline… It is better to follow your own individual trend of HRV over time"); covers confounders (age, hormones, stress, sleep, temperature) and a concrete box-breathing protocol — i.e., it already partially serves improve-HRV intent, which likely helps it on this mixed SERP. Weaknesses: **zero citations** — every claim rides on one PT's authority, and its population reference ranges are uncited and cut against its own baseline-first advice; the decision rule never gets past "high day = go harder, low day = stretch/breathwork" (one anecdotal quote); nothing on baselines math, meaningful-deviation size, load management, overtraining trends, or the paradoxical-HRV caveat; a 2-to-5-minute/24-hour measurement framing that predates the overnight-wearable workflow most readers now have; published 8/2023 with no visible update. It wins on E-E-A-T shorthand, not on completeness.

**TrainingPeaks "Athlete's Handbook" hub (observed #9, excluded).** ~250 words + seven teaser links; no standalone coverage. Its ranking is a domain-authority/topical-breadth effect, not a content bar to clear.

**Recurring coverage (2+ pages)** — expected by the reader, include: what HRV is / ANS mechanism (all 3); compare to your own baseline, never population norms (all 3); high-vs-baseline = train hard, low = ease off (all 3); lifestyle stressors (sleep, alcohol, work stress) move HRV as much as training (all 3); overtraining warning trends (all 3); how to raise baseline HRV over time (Whoop, Oura).

**Shared gaps (the contribution space, now across all four selected pages):**
1. No page gives an **open, reproducible decision method**: what baseline window to compute, how big a deviation matters, and what to do on a borderline day. Whoop's rules require Whoop's proprietary score; Oura says "high vs low" with no thresholds; TrainingPeaks explains theory, not a daily protocol; HSS stops at one PT's "high day = harder, low day = stretch" anecdote. E1 supplies citable method scaffolding (≥7-day baseline, consistent conditions, RMSSD/lnRMSSD).
2. No page states **honest failure modes** with citations: paradoxical HRV in overtrained endurance athletes (E2), single-time-point noise (E1), RMSSD-alone limits (E1). TrainingPeaks gestures at this; the wearable pages and HSS don't.
3. Whoop and Oura are **vendor-locked** ($200+ ring, $30/mo strap sub); HSS is vendor-neutral but assumes a 2-to-5-minute/24-hour measurement model rather than the overnight-wearable data most readers already have. None serves the Apple Watch / Apple Health reader who has overnight HRV, RHR, and sleep and needs a way to combine them.
4. Only TrainingPeaks cites any external evidence; the wearable pages cite their own blogs and **HSS — the highest-authority page — cites nothing at all**. An article with real, linked primary/secondary sources exceeds 3 of 4 on verifiability and can politely correct HSS's uncited population ranges with personal-baseline evidence (E1) — the exact point HSS's own expert half-makes.
5. Mixed-intent coverage: only HSS partially serves the improve-HRV segment (box breathing). None connects improve-HRV advice to evidence (sleep consensus E3, alcohol/RHR E4, load management E2) — the approved compact improve-HRV section fills this with citations.

## 4. Fit verdict

**`article_fit` — confidence: high** (raised from medium-high after the observed SERP arrived).

- The observed SERP rewards articles: editorial guides hold #2, #5, #8, #9, #10; an academic review ranks #4; only one tool homepage (#7). No product-grid, video, or local dominance.
- Mixed intent is now confirmed rather than suspected (positions 2, 8 and all PAA are improve-HRV) and is handled by the approved scope addition rather than by re-aiming the article.
- Click opportunity: an AI Overview sits on top, which taxes definition-only content; a page whose value is a usable protocol, worked example, and honest limitations retains a reason to click. DR spread in the observed set runs from 21 (sbphysio at #2) to 80 — a DR-21 physio blog holding #2 is direct evidence this SERP does not demand Whoop/HSS-scale authority.
- The site can credibly produce it: the product's whole premise is HRV/RHR/sleep vs personal baseline, and the site already publishes an open scoring model (E7) — first-party grounding competitors lack.
- Business purpose is direct: readers wanting day-to-day HRV guidance are the app's exact install audience.

## 5. Refresh diagnosis

Not applicable (mode `new`).

## 6. Archetype recommendation

**How-to. Confidence: high.** Runner-up: none close (Custom would only fit if the SERP demanded a hybrid reference/stat page; it doesn't).

- Evidence for: the reader task is procedural — measure correctly (prerequisites), establish a baseline (ordered steps), interpret today's number (decision branches), act (session modification), and verify over weeks (trend checks + failure modes). All four selected competitors are how-to-shaped; none fulfills the procedure completely. The observed SERP confirms how-to titles at #5 and #9.
- Evidence against: mixed intent (improve-HRV at #2, #8 and all PAA; academic at #4) plus a top AI Overview. Mitigated by the approved compact improve-HRV section and a tight "what HRV is" section, not a pivot to explainer or listicle.
- Information-gain requirement (the supported contribution): an **open-math daily decision framework** — 7+ day personal baseline (E1), explicit deviation guidance, green/amber/red day branches expressed in reader-owned data (any Apple Health-connected device), plus a cited **"when HRV lies to you" section** (E1, E2: illness, alcohol (E4), paradoxical high HRV in overreached endurance athletes, single-reading noise) and honest limitations. First-party grounding: the site's published 45/40/15 scoring weights and 7-hour sleep target (E3, E7) — presented as one worked example of combining signals, not as an ad. This is real gain over Whoop (closed math), Oura (no math), TrainingPeaks (no protocol), without manufacturing testing claims.
- **Contribution vs HSS specifically (does it survive the strongest observed competitor?): yes.** HSS wins on institutional authority and expert byline — this site cannot and should not try to out-credential a hospital. It can out-evidence and out-protocol it: HSS has zero citations, no baseline math, no meaningful-deviation guidance, no failure modes, uncited population ranges that contradict its own baseline-first advice, and a pre-wearable measurement framing. The article's differentiators (linked primary evidence, reproducible decision method, overnight-wearable workflow, honest limitations) are all axes where HSS is empty, not merely thinner. PAA coverage ("What is good HRV by age?", "Is 37 a low HRV?") should be answered the evidence-honest way — personal baseline over population tables (E1), explicitly contrasting with the uncited age-range numbers HSS prints.
- **Approved scope addition:** one compact cited improve-HRV section (raising baseline HRV: sleep (E3), alcohol (E4), load management (E2)) to serve the mixed SERP and PAA. Boundary: it stays one section of a use-HRV How-to; it does not become a "12 ways to improve HRV" listicle.

## 7. Commercial completeness

Not applicable — how-to informational article, no commercial comparison or recommendation rows. (Competitor products are context, not options under review.)

## 8. Evidence ledger

Shared metadata: all records retrieved 2026-08-30 by this researcher. `retrieved via WebFetch` = quote returned as verbatim by the WebFetch summarizer against the live page.

---

**E1** — `source` — Sensors (Basel) 2025 narrative review, HRV monitoring via mobile devices
- source_url: https://pmc.ncbi.nlm.nih.gov/articles/PMC12787763/ (the intake's ncbi.nlm.nih.gov URL 301-redirects here; display_url may use either)
- title: "Monitoring Training Adaptation and Recovery Status in Athletes Using Heart Rate Variability via Mobile Devices: A Narrative Review" — Esco MR, Fields AD, Mohammadnabi MA, Kliszczewicz BM. Sensors, 2025.
- method: narrative review. support: direct. confidence: high (peer-reviewed review; quotes retrieved via WebFetch).
- Claims + quotes (section names as reported):
  - Baseline: "To do this appropriately, athletes must first establish a stable personal baseline…involving collecting daily waking HRV for at least 7 consecutive days under consistent conditions." (Data Interpretation — Establishment of a Baseline)
  - Measurement protocol: "An optimal protocol involves a 1 min stabilization period, followed by a 1 min recording period using a device that automatically calculates the HRV metric, such as RMSSD or adjusted lnRMSSD." (HRV Recording Procedures — Ultra-Short Time Periods)
  - Single-reading noise: "Single-time-point HRV measures are highly susceptible to transient fluctuations caused by daily stressors, disruptions in sleep, environmental factors, and measurement inconsistencies." (Introduction)
  - RMSSD-alone limit: "[RMSSD's] capacity to reflect the full spectrum of autonomic balance, particularly in scenarios where sympathetic activation plays a central role, is limited." (Additional Considerations)
  - Cites Kiviniemi 2007 (ref [9]) and Vesterinen 2016 (ref [10]) as HRV-guided-training studies (titles confirmed in reference list; outcome numbers not quoted by the review per second fetch).
- Limitations/conflicts: two WebFetch passes disagreed on rolling-average vs fixed-week framing; only the quotes above are used. Scope: athletes using mobile/wearable HRV; generalizes well to the article's reader.
- dedupe_key: sensors2025-hrv-review

**E2** — `source` — JFMK 2024 narrative review, HRV in strength & conditioning
- source_url: https://pmc.ncbi.nlm.nih.gov/articles/PMC11204851/ (resolves 200)
- title: "Heart Rate Variability Applications in Strength and Conditioning: A Narrative Review" — Addleman JS, Lackey NS, DeBlauw JA, Hajduczok AG. Journal of Functional Morphology and Kinesiology, 2024.
- method: narrative review. support: direct. confidence: high (quotes retrieved via WebFetch).
- Claims + quotes:
  - Resistance-training recovery: "Increasing resistance training load via increasing the volume and/or intensity results in a prolonged reduction in both HRV and subsequent performance testing at 48 h post-training session that may resolve only after a multi-day recovery period." (§4.2)
  - HRV-guided lifting: "Different athletes have been found to experience varying time frames of recovery for HRV following intense resistance training at both the group and individual levels, implying that HRV-guided programming may be a beneficial tool to modify intensity depending on an athlete's day-to-day recovery." (§6.2)
  - Measurement consistency: "Consistency in measurement time and methodology is of foremost importance… most commercially available wearable devices monitor HRV during slow-wave (deep) sleep to minimize noise in the signal that is common when awake and moving." (§3)
  - Paradox/caution: "Several studies have not found significant changes in highly trained endurance athletes' HRVs after an overload training period, or even identified a paradoxical increase in HRV in overtrained athletes." (§5.1)
  - Guideline: "Decreasing HRV may be a sign of overreaching and/or overtraining syndrome. In aerobic athletes, HRV metrics may not be as sensitive to overreaching and/or overtraining syndrome and may be best utilized in addition to secondary markers." (§8, Guideline 3)
- Scope: mixes strength and endurance athlete evidence; the paradoxical-HRV finding is scoped to highly trained endurance athletes — do not generalize to all readers.
- dedupe_key: jfmk2024-sc-review

**E3** — `source` — AASM/SRS 2015 adult sleep consensus
- source_url (verified): https://pmc.ncbi.nlm.nih.gov/articles/PMC4434546/ — Sleep, 2015, DOI 10.5665/sleep.4716. Joint consensus of the American Academy of Sleep Medicine and Sleep Research Society.
- display_url note: the site currently cites https://jcsm.aasm.org/doi/10.5664/jcsm.4950 (J Clin Sleep Med co-publication). That URL serves a JavaScript client-challenge stub to my tooling; live resolution **unverified** (not established as broken — my tools can't execute its JS). Recommendation: keep or switch display to the verified PMC/DOI link.
- method: consensus statement. support: direct. confidence: high.
- Quote: "Adults should sleep 7 or more hours per night on a regular basis to promote optimal health." Sleeping less than 7 hours is associated with (as listed): weight gain/obesity, diabetes, hypertension, heart disease and stroke, depression, increased risk of death, impaired immune function, increased pain, **impaired performance**, increased errors, greater accident risk. (retrieved via WebFetch)
- Scope: adults 18–60. Grounds the site's 7-hour sleep target (E7).
- dedupe_key: aasm2015-consensus

**E4** — `source` — Nutrients 2025, alcohol and nocturnal resting heart rate
- source_url: https://pmc.ncbi.nlm.nih.gov/articles/PMC12073130/ (resolves 200)
- title: "The Impact of Alcohol on Sleep Physiology: A Prospective Observational Study on Nocturnal Resting Heart Rate Using Smartwatch Technology" — Strüven, Schlichtiger, Hoppe, Thiessen, Brunner, Stremmel. **Nutrients**, 2025.
- **Correction to intake:** intake labeled this "J Clin Med 2025"; the page's citation_journal_title meta tag says **Nutrients** (verified directly in page HTML). If the site's existing article cites it as J Clin Med, that citation label needs fixing (flagged, not fixed — outside this task).
- method: prospective observational study. support: direct. confidence: high for the RHR effect; medium for HRV wording (see limitation).
- Quotes (retrieved via WebFetch): "Alcohol consumption led to a statistically significant increase in nocturnal resting HR from 63.6 ± 9.2 bpm at baseline to 66.6 ± 9.0 bpm" (p < 0.001); exposure was "40 g per day for women and 60 g per day for men" over three days. On HRV: "suppression of the vagal system is also reflected by reduced HR variability under alcohol exposure" — but the study device did not measure HRV as a primary outcome; treat the HRV sentence as discussion, not a measured result of this study.
- Scope: healthy adults, moderate fixed dose, 3-day protocol; not dose-response.
- dedupe_key: nutrients2025-alcohol-rhr

**E5** — `source` (access-degraded) — Kiviniemi 2007 HRV-guided endurance training study
- source_url: https://pubmed.ncbi.nlm.nih.gov/17849143/ — "Endurance training guided individually by daily heart rate variability measurements", Kiviniemi AM et al., 2007 (Eur J Appl Physiol).
- support: **partial**. confidence: **medium**. PubMed abstract inaccessible to my tools (cookie/JS wall). Existence and title verified two ways: cited as ref [9] in E1's reference list, and cited with full bibliographic line in the frozen TrainingPeaks capture. Outcome description available only secondhand from the TrainingPeaks capture: 30 club runners, three groups (coach-designed / control / HRV-guided); both trained groups improved max running speed, "the improvements were significantly larger in the HRV group, which was also the only group to show an increase in VO2 peak."
- Ledger rule: the writer may cite the study for the general finding (HRV-guided endurance training matched or beat predefined plans in this RCT) only with the outcome framing attributed carefully; **specific numbers must not be invented**. If exact effect sizes are wanted, the full text must be obtained at brief/write stage.
- dedupe_key: kiviniemi2007

**E6** — `serp_observation` — WebSearch result sets
- claim: candidate pool and dispositions in §3; ordering not a verified Google ranking. input_provenance: 3 WebSearch queries listed in §3, US, 2026-08-30. support: direct for "these URLs were returned"; `lead_only` for any ranking inference. confidence: high/low respectively.
- dedupe_key: serp-hrv-training-2026-08-30

**E7** — `site_observation` — Readiness Coach published scoring model
- source_url: https://thereadiness.app/blog/what-is-a-readiness-score/ (fetched 200, passages extracted from HTML 2026-08-30)
- Quotes (verbatim from page text): "Recovery: 45% of the score. HRV is the primary signal. Your overnight reading is compared to your personal baseline and normalised, so the score reflects deviation from your normal, not from a population chart." / "When both are present, HRV carries more weight than RHR, because the research treats it as the more sensitive recovery marker." / "Sleep: 40% of the score. Duration is half of the sleep component, measured against a 7-hour target." / "Stress: 15% of the score. Tiered by what your device provides: a native stress score if one exists, otherwise an HRV-based proxy, otherwise elevation of daytime …" (passage truncated at extraction; full page frozen at `scratchpad` not required — live page is the canonical source and is first-party).
- support: direct (first-party product documentation). confidence: high for what the site claims about its own product; product claims stay clearly attributed to the product, per the evidence model.
- dedupe_key: readiness-scoring-page

**E8** — `serp_observation`/competitor-claim register — vendor claims that must NOT be promoted to facts
- Whoop capture: "research has shown that our proprietary algorithm is more predictive of next-day capacity" — uncited vendor claim; usable only as "Whoop says…" if at all.
- Whoop capture: recovery-state signatures (yellow/green distributions etc.) — Whoop-product-specific constructs, not general physiology.
- Oura capture: "there is a target number in the 40s that athletes can all strive for" (RHR) — uncited; conflicts with personal-baseline framing; do not reuse.
- support: these are captured statements (direct as "page says X"), `lead_only` as facts. confidence: high/low respectively.
- dedupe_key: competitor-vendor-claims

**E9** — `source` (lead only) — Vesterinen 2016, individual endurance training prescription with HRV
- Cited as ref [10] in E1. Not fetched (budget). Candidate second RCT-family citation for the effectiveness section if the writer wants more than Kiviniemi; must be fetched and verified before use.
- support: lead_only. confidence: unknown.
- dedupe_key: vesterinen2016

**E10** — `serp_observation` — Ahrefs observed SERP for `hrv training` (US)
- input_provenance: Ahrefs SERP overview, keyword `hrv training`, country US, retrieved 2026-08-30 by the orchestrator and supplied to this researcher at Checkpoint A. Treated as a true observed Google organic ranking source per the orchestrator's attestation; this researcher did not run the lookup and has not seen the raw Ahrefs response (limitation).
- claim_or_observation: AI Overview present at top; organic positions 2 (sbphysio, DR 21), 4 (PMC11204851), 5 (HSS, DR 80, est. 45,845 traffic), 7 (hrv4training.com homepage, DR 57), 8 (elitehrv, DR 56), 9 (trainingpeaks.com Athlete's Handbook, DR 80, est. 7,816 traffic; blog-root URL as reported, resolved by this researcher to /blog/the-athlete-handbook-training-hrv/), 10 (kubios, DR 51); PAA: "What is good HRV by age?", "Does 4 7 8 breathing increase HRV?", "Are VO2 max and HRV related?", "Is 37 a low HRV?". Positions 1, 3, 6 not included in the supplied data.
- support: direct for the listed positions/features as observed on the capture date. confidence: high for positions; DR/traffic figures are Ahrefs estimates (medium). One dated sample; cannot establish what always ranks.
- dedupe_key: ahrefs-serp-hrv-training-2026-08-30

**E11** — `site_observation`/competitor-claim register — HSS capture claims that must NOT be promoted to facts
- HSS capture: "A normal HRV at rest for someone in their 20s is 55 to 105; for someone in their 60s, it's 25 to 45" and "A 25-year-old male's normal heart rate variability might be 50 to 100 milliseconds" — uncited population ranges attributed to one PT; usable only as "HSS says…", and E1's personal-baseline framing is the evidence-supported counterpoint.
- HSS capture: "the HRV measures within many fitness trackers are thought to be highly reliable" — uncited; do not reuse as fact.
- HSS capture: box-breathing steps and Luppino quotes — attributable quotes (direct as "page says X"), not physiological evidence.
- support: direct as captured statements; `lead_only` as facts. confidence: high/low respectively.
- dedupe_key: hss-vendor-claims

---

Negative-claim audit: no `Unknown`/absence claim in this packet coexists with captured direct/partial evidence for the same scope. Specific reconciliations: (a) "PubMed abstract inaccessible" (E5) is `not captured`, not "does not publish"; (b) jcsm.aasm.org is `resolution unverified`, not "broken" — the PMC mirror carries the verified content; (c) the early failed Whoop fetches are history; the final capture is complete and supersedes them; (d) E4's journal-name correction narrows the intake's label, it does not contradict the study content; (e) §2's original "observed Google positions were not established" statement is superseded for the URLs listed in E10 — it remains true that Whoop, Oura, and the Wegerif TrainingPeaks page have no observed positions (absent from the supplied top-10 rows; positions 1, 3, 6 unreported, so their absence from the SERP is `not captured`, not established); (f) the first HSS fetch attempt 404'd on a guessed slug — history; the canonical URL resolves 200 and is fully captured. Universal-claim stress test: the packet supports "HRV-guided training performed as well as or better than predefined plans in specific small studies" — it does **not** support "HRV training is proven superior" or any all-athletes prevalence claim; E2's paradoxical-HRV finding actively forbids "low HRV always means overtrained." These ceilings bind the writer.

## 9. Site and internal-link inventory

Complete inventory per intake; all verified fetching HTTP 200 via curl on 2026-08-30:

| Destination | Topic | Reader value in this article | Caveats |
|---|---|---|---|
| https://thereadiness.app/ | Home | Product context only; likely CTA target | Keep to CTA block per links doctrine |
| https://thereadiness.app/blog/what-is-a-readiness-score/ | Full scoring model, weights | Natural link where the article shows a worked example of combining HRV+RHR+sleep (E7) | Strongest editorial internal link |
| https://thereadiness.app/blog/garmin-hrv-apple-health/ | Garmin HRV → Apple Health gap, manual entry | For Garmin-owning readers in the measurement section | Niche; only if the measurement section mentions device routes |
| https://thereadiness.app/blog/how-much-sleep-for-recovery/ | 7h AASM target | Where sleep's role in readiness/HRV is discussed (E3) | Topically adjacent, not core |
| https://apps.apple.com/app/id6760478506 | App Store listing | Install CTA | Non-editorial; CTA placement only |

This is an inventory, not final anchor placement. No broken/redirected/duplicate candidates found in the set.

## 10. Unknowns and research gaps

- Observed SERP is one dated sample (2026-08-30) with positions 1, 3, 6 unreported; whether Whoop/Oura/Wegerif rank anywhere on page 1 is not captured. Raw Ahrefs response not seen by this researcher (orchestrator-supplied summary, E10).
- Search volume / difficulty: still unknown (not included in the supplied SERP data).
- AI Overview content: presence observed, wording/sources not captured — unknown how much definitional intent it absorbs.
- Kiviniemi 2007 exact effect sizes: not captured (E5); needed only if the writer wants precise numbers.
- Vesterinen 2016 content: lead only (E9).
- jcsm.aasm.org live status: unverified (JS challenge); PMC mirror verified (E3).
- Intake citation label error: PMC12073130 is Nutrients, not J Clin Med (E4) — the site's existing article citing it should be checked (out of this task's scope).
- No SERP-feature audit (AI overviews, PAA, video) — unknown click-opportunity share.

## 11. Checkpoint A handoff (amended after Checkpoint A decisions)

- **Verdict:** `article_fit`, confidence high (observed SERP now in evidence, E10). **Archetype: How-to**, confidence high, with the user-approved scope addition of one compact cited improve-HRV section.
- **Contribution:** open-math daily HRV decision framework (7+ day personal baseline, explicit deviation guidance, decision branches in reader-owned Apple Health data) + cited "when HRV misleads you" limitations section; grounded in E1/E2 for method, E3/E4 for confounders, E7 for the first-party worked example. Survives HSS, the strongest observed competitor: HSS's axes of strength (institutional authority, expert byline) don't overlap the contribution's axes (citations, reproducible method, wearable-era workflow, honest limits), on which HSS is empty (§3, §6).
- **Competitors:** 4 selected and frozen (Whoop, Oura, TrainingPeaks/Wegerif — user_override per Checkpoint A approval, positions null; HSS — observed position 5). Registered aggregate sha256 `3242c423…`. Excluded-with-reason: 6 observed-SERP URLs (E10 table) + 12 WebSearch-discovered URLs (§3 table); the observed-#9 TrainingPeaks hub is captured as a reference file but not registered.
- **Proposed benchmark decision:** `status: benchmarked`, basis `observed_serp`, reference "Ahrefs SERP overview, keyword 'hrv training', US, 2026-08-30 (orchestrator-supplied)" — see `.runtime/benchmark-decision.json`. Structure validated against runtime.py expectations. Note: the runtime forbids null-position excluded entries under `observed_serp`, so `inspected_results` carries the observed organic set (real positions) plus the three null-position user_override selections only; the WebSearch-discovered exclusions remain recorded in §3 of this file, which the decision's rationale references.
- **Publication-candidate sources (display shortlist):** E1, E2 (method + limits), E3 (7-hour target), E4 (alcohol/RHR), E5 (effectiveness, with care), E7 (product example). The private ledger stays authoritative regardless of display mode.
- **Proposed next-stage boundary:** brief and outline for a How-to serving the practical-decision segment, including the single improve-HRV section (E2/E3/E4) and PAA-honest answers (personal baseline over population tables, contra HSS's uncited ranges); fetch Kiviniemi full text and/or Vesterinen only if the brief calls for precise effect sizes; no new competitor research unless the set is replaced.
- **Remaining choices:** record the benchmark decision as proposed, or adjust the selection (resets registration and research completion again).
