---
title: "Garmin Body Battery explained: what it measures, why it drains, and what it leaves out"
description: "What Garmin Body Battery is built from, why it drains or stalls when you feel fine, how it differs from Training Readiness, and what Garmin has not published."
pubDate: 2026-11-02
---

A full night in bed, a body that feels fine, and a Body Battery stuck in the 40s. Garmin's own [Body Battery FAQ](https://support.garmin.com/en-US/?faq=VOFJAsiXut9K19k1qEn5W5) has a line for exactly this morning: "How rested you feel and your Body Battery score do not always align."

That line is the useful starting point. Body Battery is Garmin's estimate of your energy reserve on a 5 to 100 scale. It is built from heart rate, heart rate variability and movement, read through Garmin's stress score, your sleep and your activity, and scored against a personal baseline the watch learns when you first start wearing it. Garmin documents those inputs, the bands and how the number behaves. What Garmin has not published, on any of the pages we checked, is how the inputs are weighted and combined, or what your baseline actually is. So the number can follow your physiology closely and still give you no way to see why it landed where it did.

Below: what goes into the number, how it differs from Training Readiness and HRV Status, the common reasons a morning comes in low (with sizes where research has them), and what a score with its working shown looks like.

## What Body Battery is built from

Garmin's [Body Battery technology page](https://www.garmin.com/en-US/garmin-technology/health-science/body-battery/) describes the raw material. The watch continuously analyses "combinations of heart rate, heart rate variability (HRV) and movement data" to work out whether you are awake or asleep, when you are physically active, and how stressed you are while you are not. HRV is the small variation in timing from one heartbeat to the next. It tends to run higher when the body is at rest and lower under stress, which is why Garmin leans on it across these features.

From those signals come the four inputs Garmin names in its [vivoactive 5 owner's manual](https://www8.garmin.com/manuals/webhelp/GUID-5D183A14-BB43-4A9B-B441-5F824214CE40/EN-US/GUID-87E1392B-2C55-40B7-A1FF-3AB9252DA0A0.html): HRV, stress, sleep and activity. They move the battery in three ways.

- **Stress charges or drains it.** Garmin's stress score runs from 0 to 100 and is estimated, in Garmin's words, ["primarily using a combination of HR and HRV data"](https://www.garmin.com/en-US/garmin-technology/health-science/stress-tracking/). Below 25 counts as rest and charges Body Battery. Above 25 drains it, and faster the higher it goes. How relaxed you are sets the strength of the charge: Garmin says a lower resting heart rate and higher HRV "compared to your personal baseline" are good signs of effective rest. Stress is not scored during physical activity, because the activity is itself a stressor.
- **Activity drains it.** Exercise has its own route. Intensity and duration both count, so a long, hard session drains far more than a short walk. Garmin also says fitness is "built into" the feedback: as you get fitter, the same workout or the same stressful day has a smaller relative effect.
- **Sleep recharges it, against a headwind.** A good night is the main recharge. Garmin adds a counterweight it calls sleep pressure, the need for sleep that builds from the moment you wake up. Its steady drain can outweigh the charge from light rest, so the battery "is not automatically increasing just because you are resting". A short night after a long day leaves some of that pressure in place until you catch up.

All of this is personalised: Garmin's stress analytics adapt to you, and the charge is judged against a baseline your watch has to learn first.

The number itself sits in four bands, set out in the same manual, which likens Body Battery to "a gas gauge on a car":

| Body Battery | Garmin's label |
|---|---|
| 76 to 100 | High reserve energy |
| 51 to 75 | Medium reserve energy |
| 26 to 50 | Low reserve energy |
| 5 to 25 | Very low reserve energy |

In Garmin Connect you also get a daily account. Charged is the energy your body recovered, Drained is the energy it used, both are calculated over 24 hours and reset at midnight, and Garmin's FAQ says the two should be roughly balanced across a day. The manual adds that Connect shows long-term trends.

One input question Garmin answers two ways. The vivoactive 5 manual says food and stimulants like caffeine have "no impact on your Body Battery". Garmin's stress page lists stimulants among the things that "can also produce higher than normal stress levels", and stress is what drains the battery outside exercise. Nothing on the Garmin pages we checked reconciles the two, so this article leaves them side by side.

## Body Battery, Training Readiness and HRV Status are three different numbers

If your watch shows all three, they can disagree on the same morning without any of them being wrong, because each answers a different question.

| | Body Battery | Training Readiness | HRV Status |
|---|---|---|---|
| Question it answers | How much energy reserve do you have right now? | How ready are you to train today? | Is your overnight HRV normal for you? |
| Built from | Heart rate, HRV and movement, read as stress, sleep and activity | Six factors: last night's sleep score, recovery time, HRV status, acute load, sleep history (3 nights), stress history (3 days) | Overnight RMSSD averaged across the whole sleep, charted in 5-minute windows |
| Scale | 5 to 100, four bands | 1 to 100, five bands from Poor to Prime | Milliseconds, with a status: Balanced, Unbalanced, Low, Poor or no status |
| Personal baseline | Learned over typically 5 to 7 days; Garmin has not published its value | Draws on your HRV status, which has one | A range in milliseconds, shown after about three weeks of overnight wear |
| When it changes | All day, charging and draining | Updated through the day; biggest change when you wake, drops after a recorded activity | Once a night, when you wake |
| What Garmin shows | Current level, graph since midnight, Charged and Drained, long-term trends | Score, a short message and how each factor contributed | Last night's average, 7-day average, baseline range, trends |

**Training Readiness** is the training question. The [Forerunner 965 owner's manual](https://www8.garmin.com/manuals/webhelp/GUID-0221611A-992D-495E-8DED-1DD448F7A066/EN-US/GUID-C21BE0C8-A08E-4DA1-B6C6-2E0E2DDDB372.html) lists its six factors and five bands: Poor (1 to 24), Low (25 to 49), Moderate (50 to 74), High (75 to 94) and Prime (95 to 100). Garmin's [Training Readiness technology page](https://www.garmin.com/en-US/garmin-technology/running-science/physiological-measurements/training-readiness/) adds that the primary drivers are last night's sleep and the leftover recovery demands of recent activities, with training load, HRV status, recent stress and earlier nights' sleep also counting. HRV actually enters twice, through HRV status and through the sleep score, which Garmin derives partly from HRV. The widget shows "how underlying factors contributed" to the score, though Garmin has not published the factor weights. Garmin is also plain about the limit: the analysis "is not designed to predict performance", and in a deliberate overload block a low score likely just reflects the work you planned.

**HRV Status** is the slow, overnight question. Garmin's [HRV Status technology page](https://www.garmin.com/en-US/garmin-technology/health-science/hrv-status/) says it uses RMSSD (the root mean square of successive differences between heartbeats, a standard HRV calculation), measured continuously while you sleep. After around three weeks of overnight wear it shows your baseline as a range (Garmin's example is 33 to 45 ms). The [Forerunner 965 manual](https://www8.garmin.com/manuals/webhelp/GUID-0221611A-992D-495E-8DED-1DD448F7A066/EN-US/GUID-9282196F-D969-404D-B678-F48A13D8D0CB.html) then classifies your seven-day average against it: Balanced inside the range, Unbalanced above or below it, Low well below it. If your values average well below the normal range for your age, the status reads Poor and Garmin stops displaying the range. For what those milliseconds mean and how they compare across devices, see [what counts as a good HRV](https://thereadiness.app/blog/what-is-a-good-hrv/).

So a Body Battery of 45 next to a Balanced HRV Status is not a contradiction. One is a running energy account for today. The other is a week of nights measured against your own longer history.

## Why it drains, or will not charge, when you feel fine

Garmin's FAQ gives the general reason: Body Battery "considers factors beyond sleep duration", and elevated stress during sleep can reduce the recharge even if you sleep through the night. Its list of things that raise stress includes bright lights, alcohol, excessive physical activity, physical exhaustion, extreme temperatures, loud noises, pain, illness and frequent waking.

The causes below are the ones worth checking first. Where research has a size, it is a size for HRV and heart rate, the signals Garmin's charging logic reads. Garmin has not published how many Body Battery points any of them is worth.

**Alcohol.** Garmin's blog on [why your Body Battery runs low](https://www.garmin.com/en-US/blog/fitness/5-reasons-your-body-battery-running-low/) calls alcohol "a huge stressor": metabolising it drains the battery faster and degrades the restorative quality of sleep. Garmin cites a Finnish study for the point that even a single drink can matter. That study [followed 4,098 employees](https://pmc.ncbi.nlm.nih.gov/articles/PMC5878366/) and compared each person's drinking nights with their own alcohol-free nights. RMSSD in the first three hours of sleep was about 2.0 ms lower after a low dose (up to 0.25 g of alcohol per kg of body weight), 5.7 ms lower after a moderate dose and 12.9 ms lower after a high dose (over 0.75 g/kg). In a separate [set of 9 million morning measurements](https://pmc.ncbi.nlm.nih.gov/articles/PMC8659706/) taken by app users with a phone camera, high alcohol intake went with about 12% lower HRV and 6% higher heart rate on average. Lower HRV and higher heart rate are the pattern Garmin's stress table files under draining, not charging, so a weaker overnight charge is the expected result.

**Getting sick.** Garmin's post on [Body Battery and getting sick](https://www.garmin.com/en-US/blog/fitness/why-your-body-battery-may-struggle-to-charge-when-you-start-to-get-sick/) explains that an immune response pushes the nervous system toward its stress side and that HRV "usually starts to decrease slowly", faster with more severe illness. The same post states that a 1 °C (1.8 °F) rise in body temperature can raise average heart rate by over 7 beats per minute. In the 9-million-measurement dataset above, sickness went with about 10% lower HRV and 6% higher heart rate on average. The shift can come before you feel ill: in [14 female college athletes wearing WHOOP](https://pmc.ncbi.nlm.nih.gov/articles/PMC10333556/), HRV fell and resting heart rate rose the day before a positive COVID-19 test, and [health care workers wearing Apple Watch](https://pmc.ncbi.nlm.nih.gov/articles/PMC7901594/) showed changes in the daily rhythm of their HRV in the days before diagnosis. Both are single studies of one infection, so treat them as direction, not timing you can rely on. Garmin's own caution is the right one: "Early on, it is difficult to say if a low battery is because of illness or something else."

**A hard session late in the day.** Two separate things happen. During the session, Body Battery drains by intensity and duration, and stress is not scored, so a hard workout counts as drain however good it felt. Then comes the night. Across [4.08 million nights from 14,689 WHOOP users](https://pmc.ncbi.nlm.nih.gov/articles/PMC12000559/), moderate to maximal exercise that ended between 4 hours before and 2 hours after a person's usual sleep onset went with progressively lower overnight HRV. Doing maximal rather than light exercise that ended 2 hours before usual sleep onset was associated with 14.1% (8.3 ms) lower HRV and 3.9 bpm higher resting heart rate. These are associations in wearable data from physically active users, and two of the authors are affiliated with WHOOP. Exercise ending 4 or more hours before sleep showed no association with sleep changes. Sleep itself holds up better than those numbers might suggest: a [meta-analysis of 23 studies](https://pubmed.ncbi.nlm.nih.gov/30374942/) found evening exercise did not harm sleep overall, though vigorous exercise ending within about an hour of bedtime may make sleep shorter and harder to start.

**The watch was off.** Garmin's FAQ says Body Battery can estimate short gaps, but if the watch is off for several hours or longer, it "will resume from a model-based estimate" when you put it back on. A morning after a night on the charger is therefore an estimate, not a measurement. Garmin's manual asks you to wear the watch while sleeping, and the FAQ asks for a proper fit.

**A short night or a long day.** Here the data is real, but the sleep pressure from a long day has not cleared, so the morning starts lower. The same drain explains a number that keeps falling while you sit on the sofa in the evening. That is expected behaviour, not a fault.

**A new or reset watch.** Garmin's FAQ says Body Battery needs a learning period of typically 5 to 7 days on a new watch or after a factory reset, and may sit at or near 5 until it has enough data to set your baseline. If the baseline is lost later, it can drain to 5 and stay there for several days while it recalibrates. Garmin says this happens automatically. A 5 in your first week is the learning period, not a reading of your energy.

**Excitement and other good stress.** Garmin's stress page lists happy causes of high stress: the excitement of a new job, a first date, the jitters on the morning of a big race. Its blog adds playing with your kids or a rock concert, and notes that something like driving can drain one person and relax another. The heart signals do not know whether the day was good or bad, so a great day can still end with a low battery.

One low morning with an obvious cause needs nothing beyond the obvious. Garmin's own line is that the occasional low day "is no cause for alarm", and that a battery that is "perpetually low" is the signal to look for things to change. For deciding what to do with a low reading on a training day, our guide to [training by HRV](https://thereadiness.app/blog/hrv-training/) covers the daily call.

## What the number does not tell you

Garmin publishes a fair amount about Body Battery. Across its technology page, support FAQ, manual and blog, it documents the raw signals and the inputs built from them, the stress line at 25, the 5 to 100 scale and its bands, the existence of a personal baseline and its learning period, sleep pressure, the daily Charged and Drained totals, long-term trends, and what happens when the watch is off.

What Garmin has not published, on the pages we checked in November 2026 (the Body Battery, stress, HRV Status and Training Readiness technology pages, the support FAQ, the vivoactive 5 manual and two Garmin blog posts), is:

- how those inputs are weighted or combined into the number;
- the value or range of your Body Battery baseline, which means there is no published "normal for you" band to read a given morning against.

Garmin's stress page states the related limit itself: "What your stress data doesn't tell you is why these various states are occurring." A first date and a deadline can look the same to a heart-rate sensor. Independent research points the same way. In a [lab study of 60 participants](https://pmc.ncbi.nlm.nih.gov/articles/PMC12647429/) wearing a Garmin Vivosmart 4 alongside a chest-strap ECG, Garmin's stress score separated rest from stress tasks and correlated with heart rate and RMSSD, but it had "only marginal predictive value" for how stressed people said they felt. That is one device in a lab, and it tested the stress score, not Body Battery. It is still evidence that Garmin's stress reading can follow your body more closely than your mood.

Garmin's other two numbers show more of their working. HRV Status shows you its baseline range, and Training Readiness shows how each factor contributed. Body Battery shows the result, the day's Charged and Drained account and, on compatible watches, insights into the most influential moments of your day. Nothing Garmin has published lets you split a morning reading into the contribution of each input.

For a gauge you glance at between meetings, that is a reasonable design. One number is the point. The cost shows up when you compare two mornings. If Monday reads 60 and Tuesday reads 90, the published material gives you no way to say how much of the gap came from sleep, from stress during the night, or from Sunday's long run. Context and the causes above usually narrow it down. The number alone does not.

## What a readiness score with the working shown looks like

Readiness Coach, the app this site publishes, takes the other route: it publishes its weights. It is a morning readiness score rather than an all-day energy gauge, so it is not a like-for-like replacement for Body Battery, but it uses the same kinds of signals. Each component is scored from 0 to 100 on its own and then combined using these weights, which are a reasoned starting point and have not been validated against performance outcomes in a controlled study:

- **Recovery, 45%.** Overnight HRV (60% of the component) and resting heart rate (40%), each compared with your own baseline.
- **Sleep, 40%.** Duration is half of it, measured against a 7-hour target; deep sleep, REM and efficiency make up the rest.
- **Stress, 15%.** Your device's stress score, inverted, when one is available; otherwise an HRV-based proxy or daytime heart rate above your resting baseline.

Your first seven days build your baselines, and until then the app marks the score as low confidence. The full model, with the reasoning, is in [what a readiness score is and how ours works](https://thereadiness.app/blog/what-is-a-readiness-score/).

Because the components are scored separately, a low morning can be traced to recovery, sleep or stress. That still will not tell you whether the cause was a drink or a cold. The sizes above show why: in the 9-million-measurement dataset, heavy drinking and sickness moved HRV and heart rate in the same direction by similar amounts. Garmin's "doesn't tell you why" applies to ours too.

On iPhone, Garmin data can reach the app through Apple Health; [getting Garmin HRV into Apple Health](https://thereadiness.app/blog/garmin-hrv-apple-health/) explains that route and its HRV gap.

Readiness Coach can also connect to your Garmin account and read overnight HRV, resting heart rate, sleep and stress directly, keeping Garmin's RMSSD separate from Apple Health's SDNN rather than averaging the two.

None of this makes Body Battery wrong, and you do not have to choose. Body Battery tells you how the day is going. A score with published weights tells you which part of this morning moved. If you want to try the second next to the first, [Readiness Coach is on the App Store](https://apps.apple.com/app/id6760478506). It is a general wellness app, not a medical device, and it does not diagnose anything.

## Quick answers

### What is a good Body Battery score?

Garmin's bands put 76 to 100 at high reserve energy and 51 to 75 at medium, so a morning in the upper band after a normal night is what you would hope for. Garmin expects the number to be highest when you wake and says it "is supposed to diminish during the day", so a low evening is normal. The morning number is the one to watch; Garmin's blog notes "a huge difference between 90 or 60 in the morning".

### Does Body Battery mean anything, and how accurate is it?

Body Battery is an estimate built from heart rate, HRV and movement, not a direct measurement of energy. It follows real signals: Garmin's stress score tracks heart rate and HRV, and Garmin judges rest partly against your own baseline. Trust it less after hours off the wrist (Garmin then uses a model-based estimate) and during the first week on a new watch, and read it as a record of what your body is doing rather than how you feel. Garmin has not published the formula or weights, so there is no published method to check the energy estimate against. Garmin also states that its watches "are not approved medical devices".

### How do I get my Body Battery to 100?

Garmin's position is that you should not try to keep it full: it is meant to fall during the day, and the daily Charged and Drained totals should roughly balance. A good night's sleep is the biggest recharge, and naps and genuinely restful moments help a little. The things that block a full overnight charge are the ones above: alcohol, illness, a hard late session, a short night and stress during sleep. For the longer-term side, [how to increase HRV](https://thereadiness.app/blog/how-to-increase-hrv/) covers what raises the underlying signal.

### What is a good Training Readiness score, and which watches have it?

On Garmin's 1 to 100 scale, a score of 75 or more is the green light: Garmin's message for High is "Ready for challenges" and Prime is the best possible. Moderate reads "Good to go", while Low ("Time to slow down") and Poor ("Let your body recover") ask you to ease off. Garmin documents Training Readiness in owner's manuals for compatible watches such as the Forerunner 965; search your own model's manual for "Training Readiness" to check yours.
