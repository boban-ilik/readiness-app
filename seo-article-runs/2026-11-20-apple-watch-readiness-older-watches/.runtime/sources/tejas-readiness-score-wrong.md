<!-- capture: tej.as blog post, SERP position 11 (not selected; captured alternate) | url: https://tej.as/blog/apple-watch-readiness-score-wrong | fetched: 2026-11-20 by curl (browser User-Agent), HTTP 200 | extraction: deterministic HTML-to-text (BeautifulSoup/lxml script), no model summarisation | author Tejas Kumar; published 2026-10-08 (time element); whole body as served -->

**The Apple Watch Readiness score got me wrong in both directions: on the mornings I was the most run down I’ve been all year, my new [Apple Watch Ultra 4](https://www.apple.com/apple-watch-ultra-4/) gave me 8s and 9s and told me to “Go For It”. On good mornings it gave me a 6.** So I built my own readiness app, called Heartwood. It reads the same kinds of signals Apple does and on every one of those bad mornings it told me to rest.

On 10 September I was a big fan, by the way:

> Everything Apple has done with the new health app and Apple Watch is extremely good and really well thought out.

Privacy, trust, and health data is their moat so it’s really good to see them leaning into this.

The focus on HRV is also good. I can now get rid of my Ōura ring.
> — Tejas Kumar (@TejasKumar_)
> September 10, 2026

I didn’t get rid of my [Oura](https://ouraring.com) ring. The app I built to replace Apple’s score reads it every morning.

This post is about where Apple’s score goes wrong, how I built Heartwood, and why you’ll never be able to download it.

## 21 red mornings in a row

There’s a page on this site, [/status](/status), that shows how I’m doing from my own body’s numbers. Heartwood updates it each morning. On 3 October it looked like this:

![A chart from tej.as/status covering 5 August to 3 October 2026. A blue line for 7 night heart rate variability sinks below a shaded band labeled my normal in mid September while a violet line for 7 night resting heart rate climbs above it. Under the chart, a row of small red squares marks every morning from 12 September to 2 October as a rest day, ending in one tall green bar on 3 October.](/img/blog/apple-watch-readiness-score-wrong/status-chart.webp)
A chart from tej.as/status covering 5 August to 3 October 2026. A blue line for 7 night heart rate variability sinks below a shaded band labeled my normal in mid September while a violet line for 7 night resting heart rate climbs above it. Under the chart, a row of small red squares marks every morning from 12 September to 2 October as a rest day, ending in one tall green bar on 3 October.

The blue line is my [heart rate variability (HRV)](https://my.clevelandclinic.org/health/symptoms/21773-heart-rate-variability-hrv), the tiny differences in time between one heartbeat and the next. The violet line is my resting heart rate. Both are averages of the last 7 nights, drawn against my own normal range (the shaded band). High HRV and a low resting heart rate is the recovered direction. So a hard stretch shows up as the 2 lines pulling apart: blue sinking, violet rising. In mid September they pulled apart like a pair of scissors. (4 conferences, 3 hard runs and a couple of 5 hour nights will do that to you.)

The red squares along the bottom are Heartwood’s call each morning: Rest, 21 mornings in a row, from 12 September to 2 October. I was cooked, like, cooked as fuck. And my watch, on those same mornings, kept giving me 8s and 9s.

Take 2 October. I woke up to an HRV of 54 milliseconds (ms), right at the top of my normal range, after one great night. My 7 night average was still 47.4 ms though, under the floor of my normal range (48.2). And my 7 night resting heart rate was 50.3 beats a minute, over its ceiling (49.2). I was also 4 days into a deload, a planned week where I train about half as much as usual so the fatigue can clear. Heartwood said Rest. On 3 October both averages finally crept back inside the band and Heartwood said I was ready to train.

(Those are my Oura ring’s numbers: that’s where Heartwood reads my nights from. The watch measures its own so Apple saw the same kind of signal in different samples.)

## It’s not just me

To be fair, Readiness works for some people. A post on [r/AppleWatch](https://www.reddit.com/r/AppleWatch/) titled “[Apple Watch S12 readiness score during sickness is super accurate](https://www.reddit.com/r/AppleWatch/comments/1wuvjab/apple_watch_s12_readiness_score_during_sickness/)” has over 500 upvotes. Its author’s score dropped to a 2 the day their wrist temperature and resting heart rate went up with a cold. Great!

In the same thread though, [someone else](https://www.reddit.com/r/AppleWatch/comments/1wuvjab/apple_watch_s12_readiness_score_during_sickness/pd6yscc/) wrote that the watch told them “you’re ready to go!” with a “full blown flu”. A thread asking [what people think of Readiness so far](https://www.reddit.com/r/AppleWatch/comments/1wsewy5/whats_your_opinion_so_far_on_the_new_readiness/) opens with its author calling it “a really easy and cheap algorithm that doesn’t have ANY understanding of my real body AT ALL”. [Another reply](https://www.reddit.com/r/AppleWatch/comments/1wsewy5/whats_your_opinion_so_far_on_the_new_readiness/pcosl0e/) says “I got a 1 the other day, but felt better that day than when I had a 6.” [Eduardo](https://x.com/martiano/status/2105883746641772749) on X got a low score because an extra blanket warmed up his wrist, which he called “completely wrong”.

My favorite is this one from [Sankew](https://x.com/Sankew06), who put Apple’s score next to [Bevel](https://www.bevel.health)’s, both reading the same [Apple Watch Series 12](https://www.apple.com/apple-watch-series-12/):

> Apple’s Readiness score vs Bevel’s Recovery Score

both are getting data from the same watch(Apple Watch Series 12)

(Photos: Apple's Readiness app showing 6, Ready, with "Your activity has been steady over the past week" under Raising Your Score, next to Bevel showing 42% Recovery on the same day.)
> — Sankew (@Sankew06)
> September 25, 2026

Same wrist, same sensors, same morning. Apple says 6 out of 10 and ready, Bevel says 42% recovered. And Apple’s reason for raising that score is “Your activity has been steady over the past week.”

## Why Apple’s score misses

Nobody outside Apple can see how the score is calculated, but Apple’s [support page for Readiness](https://support.apple.com/en-us/128112) says enough to work with. Here are 2 sentences from it:

> Increased activity in general can reduce your score, while steady or reduced activity raises it.

> Higher-than-usual heart rate variability (HRV) can lead to Favorable vitals and a high readiness score.

Now look at my 2 October again. I was in a deload so my activity was reduced: score goes up. I had one great night of HRV: score goes up again. Both of those are the wrong thing to reward 3 weeks into a slide. A deload is reduced activity *because* you’re cooked. One good night in the middle of a bad stretch is noise. Sports scientists figured that second part out a while ago: [Plews and colleagues](https://link.springer.com/article/10.1007/s40279-013-0071-8) made the case back in 2013 that a 7 day rolling average of HRV tells you far more about how an endurance athlete is adapting than any single morning does.

Then there’s the baseline. Readiness needs you to sleep in the watch on at least 7 of the past 49 nights before it gives you a score. It compares you against those nights ([DC Rainmaker](https://www.dcrainmaker.com/2026/09/apple-watch-ultra-4-in-depth-review.html) calls it a 49 day historical span). I made sure it had history to work with: Heartwood wrote every night of my Oura ring’s HRV, back to April 2025, into [Apple Health](https://www.apple.com/health/) as Recovery HRV, the overnight HRV Apple added in iOS 27. But on 2 October those 49 nights reached back to mid August. 21 of them were my slide. Apple doesn’t say whether the week it’s judging sits inside that window. If it does, almost half of my “normal” was me being cooked. Once your bad weeks are in your baseline, bad starts to look normal.

And you only ever get 1 number. Apple does list the parts that raised or lowered it (fitness, vitals, sleep), but not by how much and not against what. So when the number is wrong you can’t tell which part lied to you. [One person on Reddit](https://www.reddit.com/r/AppleWatch/comments/1wsewy5/whats_your_opinion_so_far_on_the_new_readiness/pckuf8r/) who came from a Garmin said it plainly: “Apple doesn’t do a great job at giving you more insight into why the score is what it is.”

### What Apple’s paper does and doesn’t measure

Apple did publish a paper alongside the new watches: the [Apple Watch Heart Rate Accuracy Study](https://www.apple.com/health/pdf/Heart_Rate_Accuracy_Study_2026.pdf) from September 2026. I read all 9 pages and the study itself is really well done. 1,254 people wore an Apple Watch Series 12 on one wrist and a competitor on the other, with a [Polar H10](https://www.polar.com/en/sensors/h10-heart-rate-sensor) chest strap as the reference, through runs, cycling, interval training, lifting and ordinary daily life. Apple Watch had the lower error against all 6 other devices in the study, from Garmin’s watch to Oura’s ring. Heck yeah!

Its overview lists “Recovery HRV and the Readiness app” among the features the new sensors make possible. Then it never measures either of them. There’s no sleep in the study, no HRV and nothing about the score. It even tested Oura’s ring during interval training, where a ring is at its worst (and skipped it for lifting, where Oura tells you to take it off), but never overnight, which is what the ring is built for and where Readiness gets its HRV. [The5krunner](https://the5krunner.com/2026/09/10/apple-watch-series-12-heart-rate-white-paper/) noticed the same gap. Apple’s [press release](https://www.apple.com/newsroom/2026/09/apple-advances-health-and-fitness-capabilities-using-apple-intelligence/) says the score’s algorithm “was developed using data from the Apple Heart and Movement Study”. That’s all we get. The cardiologist [Eric Topol](https://erictopol.substack.com/p/the-big-holes-in-wearable-heart-rate) put it best: “there are no published data on this score, not even on their website.”

## The rings don’t even know

Let’s say Readiness tells you to “Pace Yourself” or “Recover”. Your Move ring doesn’t care. It wants the same number of calories it wanted yesterday.

In watchOS 27 you can [set ring goals by day of the week, pause them for up to 90 days, or take Apple’s suggestion every Monday](https://support.apple.com/guide/watch/adjust-your-activity-ring-goals-apd29b30023c/watchos) “based on your previous performance”. Nothing in there reads your readiness. [One Reddit user](https://www.reddit.com/r/AppleWatch/comments/1wuvjab/apple_watch_s12_readiness_score_during_sickness/pd7lz67/) put it perfectly: “It tells you to pace yourself, but still encourages you to close your rings.” Their fix was as simple as it gets: “get a 2 and rings are reduced to 20% of your goal.”

Other companies already do this! [Oura’s daily activity goal](https://support.ouraring.com/hc/en-us/articles/8945980160659-Edit-Activity-Goal) goes above your baseline when your Readiness is over 85 and below it when Readiness is under 70. [Whoop](https://www.whoop.com) gives you a [Strain Target](https://www.whoop.com/us/en/thelocker/strain-coach/) from your recovery. [Garmin](https://www.garmin.com)’s [Daily Suggested Workouts](https://the5krunner.com/garmin-features/training/daily-suggested-workouts/) lean easier when your recovery is low. Apple makes the score, the rings and even the watch they both run on. The 2 apps still don’t talk to each other. It’s such low hanging fruit.

## Does Apple even care anymore?

I honestly can’t help but feel like it doesn’t. This isn’t the first time this year Apple’s software let me down at the exact moment it mattered. In July, Apple’s on-device model [refused to summarize a voice note](/blog/note-app-ai-benchmark-apple-intelligence-sucks) of a completely normal conversation with my wife. Heartwood’s first version used the same model to tag my daily diary entries. On 29 September it refused one of those too: The model refused to answer. My crime was dictating that some spicy sauce had “kinda fucked my sleep”. So I chose another model instead.

I’m not the only one feeling it. [Erik Rasmussen](https://x.com/erikras), who I follow:

> I'm absolutely ASTONISHED that Apple has managed to make Siri WORSE on iOS and watchOS 27. The bar was SO LOW and yet they managed to limbo under it.

My watch now says, "I'm sorry, but I am unable to set a timer on this device." WTAF?!
> — Erik Rasmussen (@erikras)
> September 27, 2026

[Adan](https://x.com/itsdurreadan/status/2103124031054782626) named Readiness itself as one of the 2 biggest fumbles of [John Ternus](https://www.apple.com/newsroom/2026/04/tim-cook-to-become-apple-executive-chairman-john-ternus-to-become-apple-ceo/)’s first weeks as Apple’s CEO: it’s locked to the Series 12 and the Ultra 4 “even tho older watches are completely capable of calculating it”. [John Gruber](https://daringfireball.net/2025/03/something_is_rotten_in_the_state_of_cupertino) wrote “Something Is Rotten in the State of Cupertino” back in March 2025, about Apple advertising Siri features it couldn’t ship. In January, [Macworld](https://www.macworld.com)’s [David Price](https://www.macworld.com/author/david.price) wrote that [“Apple’s software failures have become the rule, not the exception”](https://www.macworld.com/article/3022985/ios-26s-failure-shows-what-happens-when-you-take-customers-for-granted.html). And on [Six Colors’ report card for 2025](https://sixcolors.com/post/2026/02/2025reportcard/), 56 panelists gave Apple’s operating system quality a D+, with scores down in 11 of 14 categories.

The hardware is still incredible, to be fair. The watch on my wrist has the best heart rate sensor in Apple’s own study. iOS 27 finally added Recovery HRV to [HealthKit](https://developer.apple.com/documentation/healthkit): HRV as RMSSD (the root mean square of successive differences between heartbeats), the measure sports science actually uses, where Apple used to only store SDNN (the standard deviation of those intervals). My September tweet was right about all of that. The software on top of it is where it feels like nobody’s checking anymore.

## So I built Heartwood

This isn’t my first readiness app. In February I gave a talk at [React Universe Meetup Berlin](/talks/react-universe-meetup-berlin-2026) about a little traffic light I’d built with [React Native](https://reactnative.dev) that compared my last 7 days of HRV against my last 60 and turned green, amber or red. My parents were using it by then. On that stage I said “I have an Apple watch and an aura ring. The Aura ring is way better for HRV”, and about how the app works: “It’s just statistics with an integration into Apple’s device.”

That’s still the point. Readiness is statistics on top of a sensor. Apple has the best sensor in the business and it picked the wrong statistics.

So on the evening of 28 September I started over. By 2 October it had 12 commits. With the watch app it’s now 18,461 lines of TypeScript and Swift across 573 files (the house rule is one function per file, which is why there are so many). It’s an [Expo](https://expo.dev) app with a native Swift module that syncs my Oura nights into [HealthKit](https://developer.apple.com/documentation/healthkit) and reads my Apple Watch workouts back out, [App Intents](https://developer.apple.com/documentation/appintents) so Siri and Shortcuts can import last night automatically after I close the Oura app, and Apple’s [Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/liquid-glass) on every card (I love how it looks, I’m not a monster).

### One call (and the check that decided it)

Every morning Heartwood makes 1 call: Grow (a hard session is fine), Ease (easy only) or Rest. Under it, it tells me exactly which check decided it and the numbers that failed so I never have to guess why. This was 29 September, the morning I felt worst:

![Heartwood’s Today screen for Tuesday 29 September. A tree ring illustration with a thick red outer ring sits next to the word Rest. Below it, a box reads Decided by HRV and RHR out of band together, 44.0 ms, 51.6 bpm, band 48.3 to 54.2, RHR baseline 47.8, plus 3.7.](/img/blog/apple-watch-readiness-score-wrong/heartwood-rest.webp)
Heartwood’s Today screen for Tuesday 29 September. A tree ring illustration with a thick red outer ring sits next to the word Rest. Below it, a box reads Decided by HRV and RHR out of band together, 44.0 ms, 51.6 bpm, band 48.3 to 54.2, RHR baseline 47.8, plus 3.7.

There are 7 checks, and green needs all of them:

![Heartwood’s list of 7 checks on 29 September with 3 of 7 open. Passing: no illness flag, at least 7 hours asleep (7 h 35), and 48 hours since the last hard session (168 hours). Failing in red: the morning check-in (energy low, motivation low), last night’s HRV at 45 ms against a lower edge of 48.3, 7 day HRV at 44.0 ms against a band of 48.3 to 54.2, and 7 day resting heart rate at 51.6 bpm against a baseline of 47.8.](/img/blog/apple-watch-readiness-score-wrong/heartwood-gates.webp)
Heartwood’s list of 7 checks on 29 September with 3 of 7 open. Passing: no illness flag, at least 7 hours asleep (7 h 35), and 48 hours since the last hard session (168 hours). Failing in red: the morning check-in (energy low, motivation low), last night’s HRV at 45 ms against a lower edge of 48.3, 7 day HRV at 44.0 ms against a band of 48.3 to 54.2, and 7 day resting heart rate at 51.6 bpm against a baseline of 47.8.

Any failed check means easy only. Rest takes something bigger: signs I’m getting sick, 3 failed checks, a bad check-in on top of a failed body check, or the one that decided 29 September: HRV below its band and resting heart rate above it *at the same time*. Over a year of my own nights, those 2 averages move against each other with a correlation of −0.87. So when both of them break the wrong way together, it isn’t noise.

### A week can’t lower its own bar

The rules are just a TypeScript object. The app shows every one of them as it’s written here (trimmed):

```
export const RULES = {
  baselineNights: 60,
  /** The band ends 7 nights back, so the week being judged can't lower its own bar. */
  baselineLagNights: 7,
  bandSd: 0.5,
  /**
   * RHR limit = baseline mean + 0.5 SD, the smallest worthwhile change for resting HR as for HRV
   * (Buchheit 2014). The SD is floored at 1 bpm, so a very steady baseline can't put the limit
   * within half a beat of the mean (Oura reports whole beats).
   */
  rhrSdFloor: 1,
  sleepMinH: 7,
  recoveryHours: 48,
  hardCapPerWeek: 3,
  /** A deload lasts at least a week, then ends itself the day 7-day HRV is back in its frozen band. */
  deloadMinDays: 7,
  deloadMaxDays: 28,
} as const;
```
My normal range is the 60 nights that end 7 nights ago. So the week being judged is never part of the bar it’s judged against. That’s the baseline problem from earlier, fixed in 1 line. Apple Health has the same year of my nights so the only difference is which of them count as normal. The band is my average plus or minus half a standard deviation (SD), which is the smallest worthwhile change in [Martin Buchheit’s review](https://www.frontiersin.org/articles/10.3389/fphys.2014.00073/full) of heart rate monitoring.

I got this wrong at first too. My first version flagged resting heart rate at a fixed 3 beats over my baseline, which on my data is about 1.2 SD. Running both rules over my own nights showed that the half SD limit would have caught the September slide on 30 August. The fixed one caught it on 14 September: 15 days late! I changed it on 1 October.

The deload works the same way. It ends itself on the first day the 7 night HRV is back inside the band as it stood on the deload’s first day, after at least 7 days and at most 28, which is roughly how HRV guided training works in the studies by [Javaloyes and colleagues](https://doi.org/10.1123/ijspp.2018-0122) in cyclists and [Vesterinen and colleagues](https://pubmed.ncbi.nlm.nih.gov/26909534/) in recreational runners.

It has an Apple Watch app too, for the long easy runs I’m allowed while I recover. It connects to a Polar H10 chest strap and a [Stryd](https://www.stryd.com) foot pod over Bluetooth and shows my aerobic decoupling big in the middle (how far my heart rate drifts up at the same pace or power), with a live estimate from my heartbeats called detrended fluctuation analysis (DFA) alpha 1, which [Rogers and colleagues](https://doi.org/10.3389/fphys.2020.596567) showed drops through about 0.75 at the aerobic threshold. My own threshold is 134 beats a minute, from a lab test I did in Berlin on 9 July.

Is Heartwood validated? Nope. Topol’s point about readiness scores applies to mine as much as Apple’s: it’s n=1 and nobody has run a trial on it. The difference is that I can read every rule, every number on the screen shows where it came from, and when a rule is wrong I change it the same day.

## It’s not on the App Store (and probably never will be)

On 3 October, [Juri Strumpflohner](https://x.com/juristr) saw /status and decided to rebuild his own health page:

> Inspired by [tej.as/status](https://tej.as/status) health page to revamp my own again. I had created one back in April ([juri.dev/health](https://juri.dev/health)) but then my apple watch died and didn't track since then. just got a new one, so time to update the design and get some goals on the page 💪
> — Juri Strumpflohner (@juristr)
> October 3, 2026

He [asked](https://x.com/juristr/status/2106378556192252064) what I use so [I told him](https://x.com/TejasKumar_/status/2106379605250543740): my own app, with access to HealthKit, called Heartwood. Can he download it? No. Heartwood isn’t published and it probably never will be.

In February a good chunk of my talk was about shipping: [TestFlight](https://developer.apple.com/testflight/), [App Review](https://developer.apple.com/app-store/review/) and where the health data is stored (we’re in Germany). Heartwood skips all of it. The thresholds are mine. There’s no onboarding, sign-up or support inbox. There’s exactly one user (me) and I know where the code is.

A lot of people I follow are doing the same thing right now. [Ado](https://x.com/adocomplete) built almost exactly this:

> Building personal apps is too much fun. I've been dogfooding my own diet/training app for a few weeks now and it's honestly been so amazing.

- iOS/Apple Watch app deeply integrated into Apple Health / Fitness
- Web version synced to real data
- AI Coach for everything else
> — Ado (@adocomplete)
> September 20, 2026

[Guillermo Rauch](https://x.com/rauchg/status/2100698591417499972) wrote that it’s likely “more software will be produced next year than in all of the history of computing.” In his words, “Some of this will be tiny, personal and even disposable software.” And then there’s the other side, which [Andy Coenen](https://x.com/_coenen) put best:

> everybody’s going to build their own software just like everyone builds their own houses and cars
> — Andy Coenen (@_coenen)
> September 6, 2026

It’s a good joke. For a house it’s even right: a house takes years and a mortgage. Heartwood took 5 days. You shouldn’t have to build your own readiness app, to be clear (Apple could ship a lagged baseline and smarter rings in an update tomorrow). But the bar for “I’ll just build my own” has dropped so far that the company with the best sensor on my wrist now competes with an app I wrote in a week, for an audience of me. Wild.

I talk about this stuff on stage: building your own software, from the health app on my wrist to the site you’re reading. If you’re putting together an event and want that talk, [/speaking](/speaking) has everything you need to book me.

## Questions

### Is the Apple Watch readiness score accurate?

Not for me: on mornings when my 7 night heart rate variability was below my normal range and my resting heart rate was above it, my Apple Watch Ultra 4 gave me 8s and 9s and told me to Go For It. Apple hasn't published a validation study for the score (its September 2026 paper only measures heart rate during workouts and daily life). Some owners find it accurate when they're sick, while others get a high score with the flu.

### How is the Apple Watch readiness score calculated?

Apple says the 0 to 10 score combines recent activity (active calories, workout effort ratings and training load), daytime and overnight vitals (heart rate, respiratory rate, wrist temperature, heart rate variability and blood oxygen) and your sleep score, against a baseline from at least 7 of your past 49 nights. Apple hasn't published how those parts are weighted. By its own support page, both steady or reduced activity and higher than usual heart rate variability raise the score.

### Do Apple Watch activity rings change with your readiness score?

No. In watchOS 27 you can set ring goals by day of the week, pause the rings for up to 90 days or take Apple's weekly suggestions, but nothing reads your readiness score. Oura already does this: its daily activity goal goes above your baseline when Readiness is over 85 and below it when Readiness is under 70.

### What is Heartwood?

Heartwood is the readiness app I built for my own iPhone and Apple Watch with Expo, React Native and Swift. Every morning it makes 1 call (Grow, Ease or Rest) and shows the check that decided it, from my Oura ring's nights and my Apple Watch workouts. It isn't on the App Store and probably never will be.

Written by me, Tejas Kumar, an AI Engineer at IBM based in Berlin. Read [everything else I have written](/blog), or go to [Fluent React, my O'Reilly book on how React works inside](/react), [the talks I give at conferences](/speaking), and [ConTejas Code, my podcast](/podcast).
