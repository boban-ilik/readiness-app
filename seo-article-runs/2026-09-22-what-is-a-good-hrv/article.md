---
title: "What is a good HRV? Normal ranges by age, and why yours is the one that matters"
description: "A sourced HRV-by-age table, a decoder for what Apple Watch, Garmin, Oura and Whoop actually report, and a baseline method for judging your own number."
pubDate: 2026-09-23
---

Your watch showed you an HRV number this morning, and the app probably gave it a colour. The colour told you less than you hoped.

Put the same person to bed wearing an Apple Watch and a Whoop and the two apps can show numbers that look nothing alike the next morning, say 35 on one and 60 on the other, with no disagreement about the body in between. They are not calculating the same thing, they are not sampling the same hours, and neither measures what the age charts online were built from.

So the direct answer, with its conditions attached. There is no universal good HRV. In the Lifelines cohort, a reference dataset of 84,772 screened healthy adults with a published method, median RMSSD runs from about 50 ms in the early twenties to about 20 ms by the early sixties, and the spread inside each age group is enormous: among 40 to 44 year olds, the 2nd to 98th percentile covers roughly 8 to 124 ms. Which device you wear, which calculation it uses and how old you are move the number more than your fitness does on any given day. The comparison that carries information is your number against your own recent nights.

## What the number is measuring

HRV is heart rate variability: the variation in the gaps between one heartbeat and the next, measured in milliseconds. It is not heart rate. A heart beating 60 times a minute does not tick once per second; the gaps stretch and shrink from beat to beat, and the size of that variation is the signal. More variation at rest generally reflects more activity from the parasympathetic branch of the nervous system, the side that handles recovery.

Two calculations dominate consumer devices, and they produce different numbers from the same heartbeats.

**RMSSD** measures beat-to-beat change (the root mean square of successive differences). It is the standard measure of parasympathetic activity, and it holds up over very short recordings.

**SDNN** is the standard deviation of all the beat intervals in the recording. It captures slow swings as well as beat-to-beat ones, so it depends heavily on how long the recording is. Over 24 hours it is the clinical standard for stratifying cardiac risk. Over ten seconds it is a different animal: a 10-second SDNN does not even correlate well with a 5-minute one, whereas RMSSD does.

Then there is the recording window. A 10-second ECG at a clinic, a 5-minute reading from a chest strap and a whole-night average from a ring produce three different numbers for the same person on the same day. The [2017 review by Shaffer and Ginsberg](https://pmc.ncbi.nlm.nih.gov/articles/PMC5624990/) says it plainly: 24-hour, short-term and ultra-short-term normative values "are not interchangeable." That is the sentence age charts tend to leave out.

## HRV by age: the table, and where the numbers come from

This is the median RMSSD by age for adults in the Lifelines Cohort Study, the dataset behind the by-age table you may have seen elsewhere, with its method stated this time.

| Age | Women, median RMSSD (ms) | Men, median RMSSD (ms) |
|---|---|---|
| 20 to 24 | 52.1 | 47.6 |
| 25 to 29 | 47.5 | 42.3 |
| 30 to 34 | 42.3 | 36.9 |
| 35 to 39 | 37.9 | 32.8 |
| 40 to 44 | 33.9 | 29.0 |
| 45 to 49 | 29.2 | 26.0 |
| 50 to 54 | 26.6 | 23.7 |
| 55 to 59 | 22.5 | 21.0 |
| 60 to 64 | 20.5 | 19.1 |
| 65 to 69 | 17.8 | 17.7 |
| 70 to 74 | 18.3 | 16.0 |
| 75 and over | 16.1 | 14.9 |

Source: Tegegne et al., [Reference values of heart rate variability from 10-second resting electrocardiograms: the Lifelines Cohort Study](https://pmc.ncbi.nlm.nih.gov/articles/PMC7734556/), European Journal of Preventive Cardiology, 2020, Table 1.

The medians hide the spread, and the spread is the point. At 20 to 24, the 2nd to 98th percentile runs from 11.3 to 205.5 ms for women and 9.6 to 174.0 ms for men. At 40 to 44 it is 9.7 to 123.7 and 8.1 to 105.5. At 60 to 64 it is 5.5 to 79.3 and 4.8 to 86.6. Two healthy people of the same age and sex can differ by a factor of ten and both sit inside that range. Means run higher than medians in every row because a minority with very high values pulls the average up, so when a site quotes an "average HRV for your age", ask which one it means.

Now the caveat that goes unstated on the pages that reproduce this table. These values come from **10-second resting electrocardiograms taken during the day** in a Dutch population cohort, and the authors first excluded everyone with cardiovascular disease, hypertension, type 2 diabetes or obesity, and everyone taking beta-blockers or antidepressants: 64,433 people out of the original 153,793. What is left is a screened healthy sample measured briefly, awake and at rest. Your ring measured you asleep, for hours, with an optical sensor and a proprietary algorithm. The table is useful for orientation, roughly where a healthy person your age sits on a short daytime ECG, and useless as a target for your watch, because it is not the same measurement.

Two things the large datasets agree on. HRV declines with age, in the Lifelines ECGs, in 24-hour Holter recordings, in 8 million Fitbit users and in 9 million smartphone-camera readings alike. And the shape of the decline depends on the metric: in a 24-hour Holter study of 260 healthy people aged 10 to 99 (Umetani and colleagues, Journal of the American College of Cardiology, 1998), SDNN fell only gradually while RMSSD dropped to about 47% of its early-adult level by the sixth decade and then stabilised, a plateau the Lifelines authors also saw at about 60. An RMSSD table and an SDNN table do not age the same way, which is one more reason to know which one your device reports.

On sex, the evidence does not agree, and this article will not pretend it does. In Lifelines, women have a higher median RMSSD than men in every adult age group up to 64. A meta-analysis of 172 studies found women had lower SDNN but greater high-frequency power, the spectral marker of vagal activity. The Fitbit study found a sex difference in SDNN-type measures but not in RMSSD, the smartphone dataset found HRV "not associated with sex" at all, and the 24-hour study found women lower than men under 30 and no difference after 50. Age dominates. Sex effects are small, depend on the metric, and are not worth adjusting your expectations for.

## What your device is actually reporting

| Device | Metric | When and how it samples | Source |
|---|---|---|---|
| Apple Watch, standard Health HRV | SDNN | Short samples taken automatically "while you're still", at scattered times through the day and night | Apple HealthKit documentation; Apple Support |
| Apple Watch Recovery HRV (Series 12 and Ultra 4 only) | Not stated by Apple in its support pages; Empirical Health says RMSSD | Shown in Vitals, where it replaces sleep duration | Apple Support; Empirical Health |
| Garmin | RMSSD | Continuous through sleep in 5-minute windows, averaged over the entire sleep period | Garmin HRV Status page |
| Oura | RMSSD | Nightly average during sleep | Cao et al. 2022, Oura versus ECG |
| Whoop | RMSSD | Overnight, "dynamically weighted" toward the last slow-wave sleep of the night | Dial et al. 2025 validation study |
| Fitbit | RMSSD | 5-minute windows, per Fitbit's own published study | Natarajan et al. 2020 |
| Polar | RMSSD | Average of the first four hours of sleep only | Dial et al. 2025 |

The Apple row is the one that catches people. [Apple's HealthKit documentation](https://developer.apple.com/documentation/healthkit/hkquantitytypeidentifier/heartratevariabilitysdnn) states that Health uses SDNN, "the standard deviation of the inter-beat (RR) intervals between normal heartbeats", recorded automatically by the watch. The rest of the table is RMSSD, with one hedge: the newer Recovery HRV on Series 12 and Ultra 4 may be RMSSD, but that claim comes from a third party, not from Apple's support pages, so treat it as unconfirmed and keep separate baselines for the two Apple numbers. A page that says "Apple Watch reports RMSSD" is wrong for the standard Health metric.

The Garmin row is the best documented. [Garmin's HRV Status page](https://www.garmin.com/en-US/garmin-technology/health-science/hrv-status/) describes 5-minute windows averaged across the whole sleep and includes a warning worth keeping: differences in the timing and duration of measurement make it "a challenge to make apples-to-apple comparisons" between devices. Garmin also does not sync HRV to Apple Health; the [Garmin HRV to Apple Health workaround](https://thereadiness.app/blog/garmin-hrv-apple-health/) covers the manual route.

The Whoop and Polar rows come from a [2025 validation study in Physiological Reports](https://pmc.ncbi.nlm.nih.gov/articles/PMC12367097/) that tested five wearables against ECG over 536 nights in 13 healthy adults. Oura tracked the ECG most closely, Whoop moderately, and Garmin and Polar less well, though thirteen people is a small sample.

Put the vendors' own population figures side by side. Whoop reports that its members average 65 ms for men and 62 ms for women, with no sample size, date or method on the page, from a reading weighted toward deep sleep in a population Whoop itself describes as tending toward athletes and health-conscious people. Oura says its members average 41 ms, based on 6 million members aged 18 and over from January to August 2026, from a whole-night average. Empirical Health, which aggregates Apple Watch data, reports that its users' SDNN centres in the mid-30s and uses 18 to 76 ms as its reference range. Those are not three fitness levels. They are three calculations, three sampling windows and three self-selected populations. None of them is a norm, and none of them is a target for you.

## So what is a good HRV for you?

A good HRV sits at or above your own baseline and is stable or rising over weeks, measured on the same device in the same window. Marco Altini, whose HRV4Training app produced the 9-million-reading dataset above, [puts the mindset shift well](https://marcoaltini.substack.com/p/apple-watch-and-heart-rate-variability): move from "higher is better" to "normal is better".

### Build a baseline

The [2025 narrative review in Sensors](https://pmc.ncbi.nlm.nih.gov/articles/PMC12787763/) on HRV monitoring with mobile devices is direct: a stable personal baseline means collecting daily HRV "for at least 7 consecutive days under consistent conditions." Same device, same window (overnight, for most wearables), no deliberate changes to sleep or training while you collect; seven nights is the floor. Garmin waits "around three weeks" of overnight wear and expresses the baseline as a range rather than a single number (its example is 33 to 45 ms), then calls you "balanced" when your 7-day average sits inside it.

### A worked example of a baseline method

Readiness Coach, the app behind this site, uses a documented convention, so it can stand in as the illustration. It reads the SDNN samples Apple Health holds for the overnight window, keeps a rolling 30-day history, and switches to a personal baseline once seven nights exist. To build the baseline it sorts the nights, drops the lowest 20% as likely sick or stressed outliers, and takes the median of the rest. Each morning's value is then scored by how far it sits from that median, against a fixed spread of 15 ms. Until seven nights exist, it falls back on a population default of 55 ms SDNN and labels the score low-confidence. The [readiness score explainer](https://thereadiness.app/blog/what-is-a-readiness-score/) covers the rest of the scoring. This is the product's convention, not a research finding: the research supports the shape of it (a week or more of nights, averaging rather than single days, outliers handled), not the specific constants.

### Reading one morning against it

A single reading is never graded on its own, and the size of the everyday swings has been measured. In [an analysis of 9 million morning readings](https://pmc.ncbi.nlm.nih.gov/articles/PMC8659706/) from 28,175 HRV4Training users, high alcohol intake was associated with about a 12% lower HRV the next morning, sickness with about 10% lower, training with about a 4.6% change, and the menstrual cycle with about a 3.2% change between follicular and luteal phases. Those are group averages from morning smartphone-camera measurements, not a forecast for your next night, but they give you the scale: a one-day dip of 10% after a late night with drinks is roughly what the data would predict. The same paper's summary is worth keeping. HRV is "a more sensitive but not specific marker of stress": it tells you something is loading your system, not what.

Three readers with three numbers, answered the way the evidence allows:

**"Is 43 ms on a Garmin good at 45?"** Metric: overnight RMSSD, averaged across the whole sleep. Age row: the Lifelines median for 45 to 49 year olds is 29.2 ms for women and 26.0 ms for men, from a 10-second daytime ECG, so the number sits above that orientation point, but the measurements are not the same. What decides it is where 43 sits inside your Garmin baseline range. If your range after three weeks is 38 to 50, this is an ordinary night. If it is 45 to 58, it is a low one, and last night's sleep, a drink or a coming cold is the first place to look.

**"Is 26 ms on an Apple Watch good at 58?"** Metric: SDNN from short samples taken while still, not overnight RMSSD, so the table above is the wrong reference. For Apple Watch SDNN specifically, Empirical Health reports that among its users values below 18 ms fall around the bottom 10% and its reference range is 18 to 76 ms, so 26 sits inside that range; that is aggregator data with no published sample size, so treat it as orientation. What decides it is seven or more nights of your own overnight SDNN. If 26 is your normal, it is your normal. If your median is 34 and this is the third morning in a row well below it, that is a pattern worth noticing.

**"Is 87 ms on an Oura good at 30?"** Metric: nightly RMSSD. Age row: the Lifelines median for 30 to 34 year olds is 42.3 ms for women and 36.9 ms for men, and the 2nd to 98th percentile for adults in their early twenties reaches above 200 ms, so a high number is not unusual and not suspicious in itself. The same applies to anyone asking whether 170 is good. What decides it is again your baseline. If 87 is inside your normal range, it is normal for you. If it is far above your usual nights with nothing to explain it, read the next section before celebrating.

## When a low or high reading is worth attention

**A clinical note, and its limits.** At the population level, low HRV is associated with cardiovascular risk. A [meta-analysis of eight studies and 21,988 people without known heart disease](https://doi.org/10.1093/europace/eus341) found that those with the lowest SDNN had a 35% higher relative risk of a first cardiovascular event than those with the highest (pooled relative risk 1.35, 95% confidence interval 1.10 to 1.67). Two things stop that from being a wearable threshold. The studies used ECG-based SDNN, not overnight ring or watch readings, and a population-level association says nothing about any one person's risk. No cutoff this article could trace was derived from wearable readings; the ones in circulation come from 24-hour ECGs in cardiac patients or carry no source at all.

What is worth attention is a pattern against your own baseline, in either direction. If your number stays far below your baseline for weeks with nothing to explain it, the persistence matters more than the level. If your number is suddenly far higher than your baseline, that can be an irregular heart rhythm distorting the calculation rather than a jump in fitness, because HRV calculations are defined on normal beats. In elite athletes, both rises and falls in HRV have been linked to negative adaptation, and Garmin's own documentation treats abnormally high values relative to your baseline as a possible overreach sign. A watch cannot tell those causes apart. If either pattern persists, ask a clinician.

## The next question is a different one

Once you know how your number sits against your baseline, the question changes from "is this good?" to "what do I do today?". That is a separate decision with its own rules, covered in the [daily HRV training decision protocol](https://thereadiness.app/blog/hrv-training/). Build the baseline first. Everything else depends on it.

If you would rather not keep the spreadsheet, Readiness Coach runs the baseline method described above from your Apple Health data and shows each morning as a deviation from your own normal rather than a population chart. It is [on the App Store](https://apps.apple.com/app/id6760478506), and the method is yours to run by hand either way.
