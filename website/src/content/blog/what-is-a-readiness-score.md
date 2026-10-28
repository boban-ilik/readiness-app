---
title: "What is a readiness score? Our exact model, weights included"
description: "Most readiness scores are black boxes. Here is the complete model behind Readiness Coach: 45% recovery, 40% sleep, 15% stress, all measured against your personal baselines."
pubDate: 2026-08-28
---

Every recovery wearable now ships a readiness number: WHOOP has Recovery, Oura has Readiness, Garmin has Body Battery and Training Readiness. What almost none of them ship is an explanation. You get a number out of 100 and a colour, and you are asked to trust it.

We think that is backwards. A score that tells you whether to train hard today should show its working. So here is ours, in full.

## The shape of the score

A readiness score answers one question: how ready is your body to take on training load today? The research points at a small set of signals that, tracked against your own normal, reflect how well you are recovering: heart rate variability, resting heart rate, and sleep ([Sensors, 2025](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12787763/); [JFMK, 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11204851/)).

Readiness Coach combines them like this:

**Recovery: 45% of the score.** HRV is the primary signal. Your overnight reading is compared to your personal baseline and normalised, so the score reflects deviation from *your* normal, not from a population chart. Resting heart rate works the same way in reverse: lower than your baseline is good. When both are present, HRV carries more weight than RHR, because the research treats it as the more sensitive recovery marker.

**Sleep: 40% of the score.** Duration is half of the sleep component, measured against a 7-hour target. Why 7 and not 8? Because the joint consensus of the American Academy of Sleep Medicine and the Sleep Research Society recommends adults sleep 7 or more hours per night ([Journal of Clinical Sleep Medicine, 2015](https://jcsm.aasm.org/doi/10.5664/jcsm.4950)). Deep sleep, REM and efficiency make up the rest, and the weights renormalise over whatever your device actually reports. A watch that only tracks total sleep time is not penalised for stages it cannot measure.

**Stress: 15% of the score.** Tiered by what your device provides: a native stress score if one exists, otherwise an HRV-based proxy, otherwise elevation of daytime heart rate above your resting baseline.

## Personal baselines, not population averages

The single most important design decision is that everything is scored against *you*. Your first seven days build your baselines; before they exist, the app says so plainly and marks the score as low-confidence rather than pretending.

This is also why any readiness product, ours included, is nearly useless on day one and genuinely useful by week two. If an app gives you a confident score the first morning, it is scoring you against strangers.

## What the score is not

A readiness score is a decision aid, not a verdict. If the score says 45 and you feel great, the disagreement itself is information. And it is worth saying clearly: this is a general wellness tool. It does not diagnose, treat or predict any medical condition, and no consumer wearable score should claim to.

## Try it against your own intuition

The honest test of any readiness score is a few weeks of comparing it to how you actually feel and perform. [Readiness Coach](https://apps.apple.com/app/id6760478506) is free to try, with every new account getting the full app for its first week while your baselines calibrate. If you wear a Garmin and wonder how your HRV gets in, [we wrote about that too](/blog/garmin-hrv-apple-health/).
