# How your Readiness score works

> Draft — user-facing copy for an in-app screen or web page.
> Describes the algorithm as currently implemented in `src/utils/readiness.ts`.

Most recovery apps give you a number and expect you to trust it. We'd rather
show you the reasoning, including where it's uncertain.

---

## The short version

Your score is a weighted blend of three things your watch measured while you
slept and during the day:

| Component | Weight | What it asks |
|---|---|---|
| **Recovery** | 45% | Has your nervous system bounced back? |
| **Sleep** | 40% | Did you get enough, and was it good quality? |
| **Stress** | 15% | How much load has your body been carrying? |

Each is scored 0–100 on its own, then combined and rounded.

---

## Recovery (45%)

Two signals, weighted 60% HRV and 40% resting heart rate when both are present.

**Heart rate variability** is the strongest single indicator we have. We compare
last night's HRV to *your* baseline — not a population average — and express the
difference in standard deviations. Being one standard deviation above your
baseline moves this sub-score about 20 points up; a standard deviation below
moves it the same distance down.

**Resting heart rate** works in the opposite direction: lower than your baseline
is better. Each beat per minute below baseline is worth roughly 3 points.

If we only have one of the two, we use it alone rather than guessing at the
other.

## Sleep (40%)

Four things, weighted rather than treated as equals:

| Signal | Share of sleep score | Target |
|---|---|---|
| **Duration** | 50% | 8 hours |
| **Deep sleep** | 20% | 20% of total sleep |
| **REM sleep** | 20% | 25% of total sleep |
| **Efficiency** | 10% | 85% of time in bed |

**Duration carries half the weight on purpose.** Sleep stages are interesting,
but total time asleep is both the stronger signal and the one you can actually
do something about tonight. A short night with a flattering deep-sleep
percentage is still a short night, and your score reflects that.

Deep sleep, REM, and efficiency are scored so that hitting the target earns a
strong result rather than a perfect one; exceeding it earns the remainder.

If your device only reports total sleep time, we don't penalise you for the
stages it can't measure — the remaining weights are rebalanced across whatever
it did record, so a duration-only device can still reach a full sleep score.

## Stress (15%)

Not every device measures stress, so we fall back through three methods in
order of reliability:

1. **A dedicated stress score**, if your device provides one. We invert it —
   low stress means a high readiness contribution.
2. **Overnight HRV**, compared to your baseline, as a proxy. This is the usual
   path for Apple Watch.
3. **Daytime heart rate elevation** above your resting baseline. A few beats
   above is normal; a lot above suggests your body is working harder than usual
   even at rest.

If none of the three are available, this component sits at a neutral 50 rather
than penalising you for data you never had.

---

## Where the numbers come from — and where they don't

**Honest answer: these weights are a reasoned starting point, not a clinical
finding.** They reflect the broad consensus in sports-science literature that
HRV and sleep are the dominant recoverable inputs, and that day-to-day stress
matters but is the noisiest to measure. They have not been validated against
performance outcomes in a controlled study, and we're not going to pretend
otherwise.

What that means for you in practice:

- **The trend is more trustworthy than any single day.** A score of 71 versus
  73 is noise. A week drifting from the high 70s into the low 50s is signal.
- **Your baseline matters more than the population's.** Until we've learned
  yours, we substitute typical values (an HRV of 55 ms, a resting heart rate of
  60 bpm), and your early scores are correspondingly rough.
- **A number is not a diagnosis.** Readiness is a training aid. It is not a
  medical device and does not detect illness or injury.

## The first week is different

We need about **7 days** of your data before your baselines mean anything. During
that window the app tells you it's still calibrating, and your score is
computed against typical values rather than your own. Scores from day 8 onward
are meaningfully more personal than scores from day 2.

## When we're not confident, we say so

Every score carries a confidence level based on what your device actually
recorded:

- **High** — we have both HRV and sleep.
- **Medium** — we have some of it, but not the full picture.
- **Low** — no wearable data reached us, and the score is an estimate.

At medium or low confidence, the app tells you which signal is missing and what
to do about it, rather than quietly showing you a number built on nothing.

---

*Questions about the methodology are welcome — the reasoning above is the whole
of it, and if you think a weighting is wrong we'd genuinely like to hear why.*
