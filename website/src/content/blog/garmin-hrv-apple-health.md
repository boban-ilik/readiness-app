---
title: "Why your Garmin doesn't sync HRV to Apple Health (and what to do about it)"
description: "Garmin Connect writes sleep, heart rate and steps to Apple Health, but not HRV. Here's what actually syncs, why the gap exists, and three ways to use your HRV anyway, including a direct Garmin link that needs no typing."
pubDate: 2026-08-28
updatedDate: 2026-11-10
---

*Updated 10 November 2026: Readiness Coach can now link to your Garmin account directly, so the manual entry described below is no longer the only route. The section on what to do about the gap has been rewritten.*

If you wear a Garmin and live on an iPhone, you have probably noticed something odd: Garmin Connect happily writes your sleep, heart rate and steps to Apple Health, but your overnight HRV, the number Garmin itself treats as the anchor of its recovery features, never arrives.

This is not a bug, and it is not something a setting can fix.

## What Garmin actually syncs to Apple Health

Garmin Connect's Apple Health integration covers a long list of metrics: heart rate, resting heart rate, sleep and sleep stages, steps, workouts, weight, respiration and more. HRV is not on the list. Your watch measures it every night and displays it in Garmin Connect as HRV Status, but the value stays inside Garmin's ecosystem.

Users have been asking Garmin to add HRV to the Apple Health sync on Garmin's own forums for years. It has not happened, and Garmin has not said it will. Garmin's own recovery numbers, Body Battery and Training Readiness, are built on that HRV; [we have taken those apart separately](https://thereadiness.app/blog/garmin-body-battery-explained/).

## Why the gap matters

HRV, or heart rate variability, is the variation in time between successive heartbeats. It is one of the most studied non-invasive markers of recovery: reviews of the research consistently find that day-to-day changes in HRV, measured against your own baseline, track how well your body is adapting to training load ([Sensors, 2025](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12787763/); [Journal of Functional Morphology and Kinesiology, 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11204851/)).

The key phrase is *your own baseline*. A raw HRV number means little on its own, because normal values vary enormously between people. What matters is whether today's reading is above or below what is normal for you. That is exactly the kind of signal a readiness score is built on, and it is the one signal your Garmin keeps to itself on iOS.

## Three ways to use your Garmin HRV anyway

**1. Read it in Garmin Connect, apply it yourself.** Garmin's HRV Status screen shows your seven-day average against your baseline range. It works, but it stays in Garmin's app, disconnected from everything else your phone knows about you, and it offers a status, not a plan.

**2. Link your Garmin account to an app that reads Garmin's own API.** Garmin runs a Health API for approved apps, and unlike the Apple Health sync it does include the nightly HRV, along with resting heart rate, sleep and stress. Nothing is installed on the watch and nothing extra syncs to your phone: you sign in to your Garmin account once, and Garmin's servers send each night's summary to the app's servers when Garmin Connect syncs. This is how [Readiness Coach](https://apps.apple.com/app/id6760478506) works since version 1.2: Profile, Garmin Connect, sign in, and from the next sync your HRV, resting heart rate, sleep and stress arrive on their own, marked as coming from Garmin. Your Apple Health data keeps flowing alongside for everything else, and you can unlink at any time, which deletes the Garmin data the app holds.

One detail worth knowing: Garmin reports HRV as RMSSD, Apple Watch reports SDNN, and the two are different calculations that produce different numbers. An app that mixes them in one baseline will show false changes when you switch devices, so Readiness Coach keeps the Garmin baseline separate from the Apple one. [What is a good HRV](https://thereadiness.app/blog/what-is-a-good-hrv/) explains the two measures.

**3. Enter it by hand, once a day, in two taps.** This was the only route before the Garmin link existed, and it still works for anyone who would rather not connect an account. Your sleep and resting heart rate flow in automatically from Apple Health, because Garmin does sync those. Each morning you glance at Garmin Connect's HRV number and type it in. It takes about five seconds, and the app then scores all three signals against your personal baselines and gives you one number with a concrete training call for the day.

Manual entry is a workaround for a data gap that has existed for years. It is now the fallback rather than the plan, but it means the strongest recovery signal your watch records can always be used, even with no account linked.

## What a readiness score does with the number

Once HRV is in, it gets scored the way the research says it should be: as a deviation from your own baseline, not against a population chart. If you want the detail of how that works, we have written up [the full scoring model](/blog/what-is-a-readiness-score/), including the exact weights, because we think a score you cannot inspect is a score you cannot trust.

*Readiness Coach is a general wellness app, not a medical device. It does not diagnose or treat any condition. Garmin devices are consumer fitness wearables, and the Garmin link is an account sync through Garmin's API, not a hardware connection.*
