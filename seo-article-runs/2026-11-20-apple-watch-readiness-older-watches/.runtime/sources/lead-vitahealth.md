<!-- capture: unranked lead (vitahealth) | url: https://vitahealth.fit/blog/en/apple-watch-readiness-supported-models | fetched: 2026-11-20 by curl (browser User-Agent), HTTP 200 | extraction: deterministic HTML-to-text (BeautifulSoup/lxml script), no model summarisation | app-vendor blog; no observed position for the target query; lead only -->

$/$

![Apple Watch Readiness: Which Models Support It](/_next/image?url=%2Fblog%2Fcovers%2Freadiness-score-apple-watch.jpg&w=3840&q=75)
EnglishSeptember 13, 20267 min read

# Apple Watch Readiness: Which Models Support It

Apple Watch Readiness runs only on Series 12 and Ultra 4. Check every model in one table and see how to get a daily readiness score on an older watch.

Written by Vita Team

[English](/blog/en/apple-watch-readiness-supported-models)[Português (Brasil)](/blog/pt-br/readiness-apple-watch-modelos-compativeis)[Español](/blog/es/readiness-apple-watch-modelos-compatibles)[Deutsch](/blog/de/apple-watch-readiness-kompatible-modelle)

Apple Watch Readiness is the daily 0-10 recovery score Apple announced on September 9, 2026. If you updated to watchOS 27 and can't find it, your watch is probably not on the list.

Only two watches get it. Everything else, including watches sold last year, does not.

Apple Watch Readiness works only on Apple Watch Series 12 and Apple Watch Ultra 4. Every other model, including Series 11, Ultra 3, and SE 3, can install watchOS 27 but will not show a Readiness score. Apple points to the redesigned heart sensors in the 2026 watches as the reason.

## Every Apple Watch model and its Readiness status

### Continue reading

- [Sleeping Heart Rate Apple Watch: What's Normal?](/blog/en/sleeping-heart-rate-apple-watch)
- [Apple Watch Vitals: What Outliers Mean](/blog/en/apple-watch-vitals)

Find your watch in the first column. The last column is what you can still get today with the watch you already own.

| Apple Watch model | Year | Runs watchOS 27 | Apple Readiness | Readiness in Vita |
| Series 12 | 2026 | Yes | Yes | Yes |
| Ultra 4 | 2026 | Yes | Yes | Yes |
| Series 11 | 2025 | Yes | No | Yes |
| Ultra 3 | 2025 | Yes | No | Yes |
| SE 3 | 2025 | Yes | No | Yes |
| Series 10 | 2024 | Yes | No | Yes |
| Series 9 | 2023 | Yes | No | Yes |
| Ultra 2 | 2023 | Yes | No | Yes |
| Ultra (1st gen) | 2022 | No | No | Yes |
| Series 8 | 2022 | No | No | Yes |
| SE (2nd gen) | 2022 | No | No | Yes |
| Series 7 | 2021 | No | No | Yes |
| Series 6 | 2020 | No | No | Yes |

Two models out of thirteen. That is the whole picture.

## Why Series 11 and Ultra 3 miss out on Readiness

Apple's reason is hardware, not software. Series 12 and Ultra 4 ship a redesigned optical and electrical heart sensor system with larger, more efficient green LEDs. Those let the watch read heart rate every five seconds through the day, and HRV as often as every five minutes.

That is roughly 60 times more heart rate samples and 24 times more HRV samples than the previous generation collects.

So the gate is not a watchOS version you can wait for. Series 11 owners who bought in 2025 will not get Readiness through a future update, because the sensor is the stated requirement. Same for Ultra 3, SE 3, Series 10, Series 9, and Ultra 2.

Worth saying plainly: those watches already track heart rate, HRV, resting heart rate, sleep, training load, and overnight vitals. The inputs are on your wrist. Apple just doesn't compute the score from them.

Want a readiness score on the watch you already own? [Download Vita for free](https://apps.apple.com/app/apple-store/id6756969020?pt=128399471&amp;ct=website&amp;mt=8) and it reads what your watch already writes to Apple Health.

## Readiness on Series 9, Series 10, Series 11, Ultra 2, Ultra 3, and SE 3

These six models install watchOS 27 normally. You get the new Siri, the new gestures, and the rest of the release. You open the Health app looking for Readiness and it isn't there.

Nothing is broken and there's no setting to switch on. The feature is scoped to the 2026 hardware.

What these watches do collect is enough to build a readiness score anyway:

- HRV, sampled overnight and during the day
- Resting heart rate, with enough history for a baseline
- Sleep stages and duration
- Workout load from the last 7 to 14 days
- Wrist temperature, on Series 8 and later and every Ultra

That list covers the same signals most readiness systems use. If you want the detail on how those inputs turn into a number, read our guide on [what a good readiness score looks like](/blog/en/readiness-score-apple-watch).

## Readiness on Series 6, Series 7, Series 8, SE 2, and Ultra 1

These five models don't get watchOS 27 at all. They stay on watchOS 26, which Apple still supports with security updates.

Two things follow. You won't see Readiness, and you also won't see the other watchOS 27 health additions. But your watch keeps recording heart rate, HRV, and sleep into Apple Health exactly as before, so a third party app can still give you a daily score.

This is the group with the least to lose from switching approach. You were never getting the native feature, so an app that works on your hardware is the only path.

## How to get a daily readiness score without a new watch

Vita reads the data your watch already writes to Apple Health and builds a 0-100 readiness score from HRV trend, resting heart rate trend, sleep, and recent load. It runs on your iPhone, so the watch model isn't the gate.

Three practical notes:

1. Give it 14 days. Any readiness score is a comparison against your own baseline, and a baseline needs history. Vita reads back through your existing Apple Health data, so this is usually faster than starting from zero.
2. Wear the watch to sleep. Sleep and overnight HRV do most of the work in any readiness model. If you sleep without the watch, read [how readiness works without sleep data](/blog/en/apple-watch-readiness-without-sleep-data) first.
3. Check it once, in the morning. Readiness is a decision tool for today's session, not a number to refresh.

Health data stays on your iPhone. Vita processes it on device and doesn't upload it anywhere.

## Should you upgrade to Series 12 for Readiness?

Depends on what you want out of the score.

The Series 12 sensor genuinely samples more often, and more samples means a steadier signal. If you're a competitive athlete making daily load decisions, that resolution has real value, and the watch starts at $399 with availability from September 18, 2026.

For most people the answer is no. Readiness is a trend signal read against your own baseline. Nightly HRV plus resting heart rate plus sleep already gives you that trend, and every watch from Series 6 on collects it. Paying $399 to have the same inputs scored by Apple instead of an app is a hard sell.

If you were already upgrading, the sensor is a fine reason to pick Series 12. If Readiness alone is what's pulling you, try a readiness app on your current watch for a month first. For what to look for, see our breakdown of [how to choose an Apple Watch recovery app](/blog/en/best-apple-watch-app-recovery-readiness).

## FAQ

### Why don't I have Readiness on my Apple Watch Series 11?

Apple limited Readiness to Series 12 and Ultra 4. Series 11 runs watchOS 27 but does not get the feature.

Apple's stated reason is the redesigned optical and electrical heart sensors in the 2026 models, which sample heart rate every five seconds. Since the requirement is hardware, a future watchOS update is not expected to add Readiness to Series 11.

### Does Apple Watch Series 9 get the Readiness score?

No. Series 9 supports watchOS 27 but not Readiness.

Series 9 still records HRV, resting heart rate, sleep, and workout load into Apple Health, so a third party app can calculate a readiness score from the same data.

### Can Apple Watch Ultra 2 get Readiness?

No. Ultra 2 installs watchOS 27 but Readiness is restricted to Ultra 4 and Series 12.

Ultra 2 and Ultra 3 owners are in the same position as Series 9 through Series 11 owners. The data collection works, the native score is withheld.

### Which Apple Watch models support watchOS 27?

Eight models: Apple Watch SE 3, Series 9, Series 10, Series 11, Series 12, Ultra 2, Ultra 3, and Ultra 4. It became available on September 14, 2026.

Series 6, Series 7, Series 8, SE 2, and the first generation Ultra were dropped from watchOS 27 and stay on watchOS 26.

### Is there an alternative to Apple Readiness for older watches?

Yes. Apps that read Apple Health can build a readiness score from HRV, resting heart rate, sleep, and training load, which every Apple Watch since Series 6 records.

Vita does this with a 0-100 daily score and works on any watch that writes to Apple Health, including models that stayed on watchOS 26.

## Next step

If your watch isn't one of the two that got Readiness, you don't need new hardware to get a daily recovery number. [Install Vita on the App Store](https://apps.apple.com/app/apple-store/id6756969020?pt=128399471&amp;ct=website&amp;mt=8) and it scores the data your watch is already collecting.

Sources: [Apple Watch Series 12 and Ultra 4 announcement](https://9to5mac.com/2026/09/09/apple-watch-series-12-and-ultra-4-unveiled-with-upgraded-health-tracking-system/), [watchOS 27 compatibility list](https://9to5mac.com/2026/06/08/watchos-27-compatibility-list/), and [why older models miss out on Readiness](https://gadgetsandwearables.com/2026/09/10/apple-watch-readiness-series-11-older-models/).

Recovery insights from your Apple Watch

## Track your daily readiness with Vita

Get practical recovery context from your Apple Watch data and stop guessing if you should push or recover.

Download on the App Store

## Related posts

[![Sleeping Heart Rate Apple Watch: What's Normal?](/_next/image?url=%2Fblog%2Fcovers%2Fsleeping-heart-rate-apple-watch.jpg&w=828&q=75)March 14, 2026Sleeping Heart Rate Apple Watch: What's Normal?Sleeping heart rate Apple Watch guide: learn what's normal at night, what raises it, and when a change in your overnight trend deserves rest or follow-up.Read article](/blog/en/sleeping-heart-rate-apple-watch)[![Apple Watch Vitals: What Outliers Mean](/_next/image?url=%2Fblog%2Fcovers%2Fapple-watch-vitals.jpg&w=828&q=75)March 14, 2026Apple Watch Vitals: What Outliers MeanApple Watch Vitals guide: learn what each overnight metric means, why alerts happen, and when an out-of-range trend deserves rest or follow-up.Read article](/blog/en/apple-watch-vitals)[![Body Battery Apple Watch: What to Use Instead](/_next/image?url=%2Fblog%2Fcovers%2Fbody-battery-apple-watch.jpg&w=828&q=75)March 13, 2026Body Battery Apple Watch: What to Use InsteadBody Battery Apple Watch isn't a native Apple metric. Learn which Apple Watch signals replace it, how to read them, and how Vita turns them into one score.Read article](/blog/en/body-battery-apple-watch)

$
/$
