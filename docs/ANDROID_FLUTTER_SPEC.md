# Readiness Coach: Android (Flutter) build specification

Version 1.0, 23 September 2026. Written from the iOS app at version 1.0.2 (build 41), which is live on the App Store as "Readiness Coach: HRV Score". Owner: Boban Ilik. Website: https://thereadiness.app. Support: support@readinessapp.com.

This document is the complete contract for building the Android app in Flutter. It reuses the existing backend (Supabase, Edge Functions, RevenueCat, Strava) without changes to the server other than adding Android to RevenueCat. Anything the Android developer needs that is not in this document should be treated as a gap in the document, not as a free design choice.

Everything in this document was read from the source code on 23 September 2026 unless marked UNVERIFIED. Section 19 lists what was verified and what was not.

---

## 1. What the app is

Readiness Coach reads overnight heart rate variability (HRV), resting heart rate (RHR) and sleep from the phone's health store, computes a 0 to 100 readiness score on the device every morning, and uses an AI coach (Anthropic Claude, called through Supabase Edge Functions) to explain the score and answer questions. Target user: a recreational athlete who already owns a Garmin, Apple Watch or similar wearable.

Positioning line: "Know before you go."

Tiers:

| Tier | How it is decided | What it gets |
|---|---|---|
| Trial | 7 days from the Supabase account creation time | Everything in Pro |
| Pro | RevenueCat entitlement `pro` is active | Daily briefing, coach chat, per-component breakdown with AI insight, 28-day history and calendar, weekly AI report, 3-day forecast, nutrition card, weekly trend, correlations, CSV export, custom notifications |
| Free | Neither of the above | Score, today's recommendation, streak, 7-day score chart and stats, life-event tags, one AI briefing per week, Strava last workout and load bars, overtraining warning, cycle phase card |

Prices on iOS: $9.99 a month, $69.99 a year with a 14-day introductory free trial on the annual plan. Family Sharing is on for both. Google Play products must be created to match (section 12).

---

## 2. Decisions to make before writing code

These change the amount of work or the product, so they are listed first. Recommendations are mine; the decision is Boban's.

### 2.1 Where does HRV come from on Android? (blocking)

On iOS every metric comes from Apple Health, which Garmin Connect, Apple Watch and most other wearables write to. On Android the equivalent is Health Connect, and the situation is worse:

- Health Connect has one HRV record type, `HeartRateVariabilityRmssdRecord`. It is RMSSD. Apple Health gives SDNN. They are different statistics of the same beat intervals and are not interchangeable. The score model's defaults (baseline 55 ms, spread 15 ms) were chosen for SDNN. See https://developer.android.com/reference/android/health/connect/datatypes/HeartRateVariabilityRmssdRecord
- Garmin Connect started writing to Health Connect in mid 2025, one way only. Press coverage of Garmin's support page (I could not fetch the Garmin page itself, it returned 403) says Garmin shares activity data, heart rate, sleep, steps, calories, floors, weight and body fat, and explicitly does not share "HRV status", Body Battery, training load, training effect, intensity minutes or VO2 max. Sources: https://www.androidcentral.com/wearables/garmin/heres-everything-garmin-will-and-wont-share-with-google-health-connect and https://tech.yahoo.com/wearables/articles/garmin-wont-share-data-google-173520201.html
- Whether Garmin's nightly HRV value lands in Health Connect as an RMSSD record despite "HRV status" being excluded is UNVERIFIED. It has to be tested on a real Garmin watch and Android phone before anything else is built, because the product does not work without HRV.
- Garmin's own Health API exposes HRV, sleep, stress and RHR, but a September 2026 developer report says the Garmin Connect Developer Program is not accepting new applications: https://github.com/edpft/fitness-tracker/issues/161. Garmin's page only says "Stay tuned for more updates on the program": https://developer.garmin.com/gc-developer-program/health-api/

Recommendation: day one of the project is a spike, not a screen. Install Garmin Connect and Health Connect on a test phone, sleep one night with a Garmin, and read back every record type for the last 48 hours. If an RMSSD record exists, proceed with Health Connect and the RMSSD note below. If not, the Android app needs either a different primary data source (Samsung Health and Fitbit write to Health Connect; their HRV support is UNVERIFIED) or manual HRV entry as a first-class path, and the product promise changes. Decide this before the rest of the estimate.

RMSSD note: if RMSSD is what arrives, keep the score formulas identical (section 7) but expect the fixed 15 ms spread and 55 ms default to be miscalibrated until the personal baseline kicks in after 7 days of data. Do not "correct" RMSSD into SDNN with a conversion factor; there is no reliable one.

### 2.2 Android application id

`app.json` already declares `com.readiness.app` for Android, while iOS uses `com.bobanilikj.readiness`. The Play application id cannot be changed after the first upload. Recommendation: `app.readiness.coach` or keep `com.readiness.app`; either is fine, but pick it now because the deep-link intent filters, RevenueCat Play app and Strava callback all reference it.

### 2.3 Parity with known iOS bugs

Section 17 lists things the iOS app gets wrong. The Flutter app should implement the corrected behaviour where marked "fix", and the iOS app will be fixed in 1.0.3 to match. Where marked "keep", replicate the iOS behaviour exactly so both platforms produce the same score from the same data.

### 2.4 Home screen widget

The iOS app ships a home-screen widget (section 15). Recommendation: leave it out of Android 1.0 and add it in the first update. It is listed so the data write is designed in from the start.

---

## 3. Architecture

```
Flutter app (Android)
  |-- Health Connect (read only)         HRV, RHR, sleep, heart rate, steps, calories, exercise sessions
  |-- Supabase Auth (email + password)   session JWT
  |-- Supabase Postgres via PostgREST    readiness_scores, life_events, user_profiles, app_events (RLS)
  |-- Supabase Edge Functions            daily-briefing, coach-chat, weekly-report, ai-insight,
  |                                      delete-account, strava-token-exchange
  |-- RevenueCat (purchases_flutter)     entitlement "pro", offering "default"
  |-- Strava OAuth + REST (from device)  activities for the last 28 days
  |-- Local storage                      SharedPreferences (or equivalent), same key names as iOS
  |-- Local notifications                digest and alerts, no push server
```

Supabase project: `vgvrmhqkcqdimgwzbbhc`, URL `https://vgvrmhqkcqdimgwzbbhc.supabase.co`, region eu-west-1. The anon (publishable) key is safe to ship in the app; Boban supplies it. Nothing else secret goes in the app.

The score is computed on the device. The server never computes a score; it stores the result and feeds it to the AI functions.

Suggested Flutter packages (I believe these exist and cover the need; the developer should confirm current versions): `supabase_flutter`, `health` (Health Connect support), `purchases_flutter`, `flutter_local_notifications`, `app_links`, `shared_preferences`, `url_launcher`, `share_plus`, `screenshot` or `RepaintBoundary`, `image_picker`, `in_app_review`, `fl_chart`, `home_widget` (later).

---

## 4. Navigation and routing

Routes and the redirect rules that sit above them. The iOS app uses a flat router with no native headers; every screen draws its own back or close control.

| Route | Reached by |
|---|---|
| `/login`, `/signup`, `/confirm-email?email=`, `/forgot-password`, `/reset-password?email=`, `/callback` | auth flow |
| `/onboarding` | redirect after first sign-in |
| Tabs: Today, Coach, History, Profile | main app |
| `/paywall` | pushed from many places |
| `/coach-chat` | pushed from the daily briefing (the Coach tab embeds the same screen) |
| `/sources` | pushed from Profile |
| `/strava-callback?code=` | deep link from Strava |

Tab bar: Today (flash icon), Coach (chat bubbles), History (bar chart), Profile (person circle). Height 64, background `bg.secondary`, top border 1 px `border.subtle`, active tint amber 400, inactive `text.tertiary`, labels 11 px weight 500.

Redirect rules, evaluated on app start and on every auth change:

1. No session: go to `/login`.
2. Session but local flag `onboarding_complete` is not `"true"`: go to `/onboarding`.
3. Otherwise: tabs.

A full-screen spinner (amber on `bg.primary`) shows while the session or the flag is loading. A 6 second fallback stops the spinner if auth never answers.

On every auth state change the app runs two steps in order: `syncDataOwner(userId)` (section 13, wipes local data if a different account signs in) then `pullProfile()` (section 9.3, restores the profile from the server and sets the onboarding flag if the server says the user is onboarded).

Deep links. Scheme `readiness`. Two links exist:

- `readiness://callback?token_hash=...&type=signup|magiclink|recovery|invite|email|email_change` or `?error=...&error_description=...`. Also accept the same parameters in the URL fragment and nested inside a `confirmation_url` or `redirect_to` parameter. If `token_hash` and a valid `type` are present, call Supabase `verifyOtp({token_hash, type})` then go to the root. Never accept `access_token` or `refresh_token` from a URL. UI: spinner with "Confirming Account" and "Confirming your email..." or "Finishing sign-in..."; on error "Authentication Failed", the error text, and a "Back to Login" button.
- `readiness://strava-callback?code=...` or `?error=...`, section 10.

There are no universal links or App Links. Android needs intent filters for the `readiness` scheme with both hosts.

---

## 5. Screens

Copy is quoted where it matters. Strings in quotes are the exact user-facing text; reuse them.

### 5.1 Auth screens

Shared look: "READINESS" wordmark in amber, 24 px bold, letter spacing 6. Tagline "Know before you go." where present. Uppercase field labels 11 px, letter spacing 1.5, `text.tertiary`. Inputs on `bg.tertiary` with a `border.default` border, radius 12, border turns amber on focus. Primary button amber with `text.inverse` label. Password fields start masked with an eye toggle, accessibility labels "Show password" and "Hide password", autocorrect and auto-capitalisation off.

Login. Fields EMAIL (placeholder "you@example.com") and PASSWORD. "Forgot password?" goes to forgot-password. "Sign In": both fields required, else dialog "Missing fields" / "Please enter your email and password." Calls `signInWithPassword` with the email trimmed and lower-cased. On error, dialog "Sign in failed" with the server message. Footer: "Don't have an account? Sign up".

Sign up. Fields EMAIL, PASSWORD ("Min. 8 characters"), CONFIRM PASSWORD ("Re-enter password"). Plain text note: "By creating an account you agree to our Terms of Service and Privacy Policy." Validation dialogs: "Missing fields" / "Please fill in all fields."; "Weak password" under 8 characters; "Passwords don't match". Calls `signUp({email, password, emailRedirectTo: 'readiness://callback'})`. On success dialog "Check your inbox" / "We sent a 6-digit confirmation code..." with button "Enter code" that replaces the route with confirm-email carrying the email. Error dialog "Sign up failed". Footer: "Already have an account? Sign in".

Confirm email. Title "Confirm your email". Subtitle "Enter the confirmation code from the email we sent to {email}". CONFIRMATION CODE input, digits only, max 12, autofocus. "Confirm email": under 6 characters shows "Invalid code"; otherwise `verifyOtp({email, token, type: 'email'})`, then dialog "Email confirmed" / "Your account is ready. You can sign in now." with Continue going to login. Error "Confirmation failed". "Resend code" (shows "Sending..." while busy) calls `auth.resend({type: 'signup', email, emailRedirectTo: 'readiness://callback'})`; dialogs "Code sent" or "Could not resend". "Back to login". Note: `verifyOtp` creates a session, so the redirect rules may take the user to onboarding before they tap Continue. That is acceptable.

Forgot password. Title "Reset your password". Subtitle "Enter your email and we'll send you a 6-digit code...". EMAIL field; must be non-empty and contain "@", else "Enter your email". "Send reset code" calls `resetPasswordForEmail(email)` with no redirect, then always navigates to reset-password with the email whether or not the account exists (no account enumeration). Error "Could not send code". "Back to login".

Reset password. Title "Choose a new password". Fields RESET CODE (digits, max 12) and NEW PASSWORD ("At least 6 characters"; minimum is 6 here, 8 at sign-up; keep for parity). "Update password" calls `verifyOtp({email, token, type: 'recovery'})` then `updateUser({password})`. Success dialog "Password updated" with Continue to login; failure "Reset failed". Other dialogs: "Missing email", "Invalid code" / "Enter the 6-digit code from your email.", "Password too short". "Resend code" and "Back to login".

Supabase email templates send a 6-digit code (the `{{ .Token }}` variable), not a link. OTP length and expiry are dashboard settings, UNVERIFIED from the repo.

### 5.2 Onboarding (5 steps plus an automated setup step)

Five progress dots. Defaults: name empty, device Garmin, frequency moderate, goal general_health, sex unset, digest on.

Step 0, Welcome. Demo score ring at 74 (size 180, stroke 10) with the number and "Good to Go". Texts "Readiness", "Know before you go.", and one line about reading wearable data from the health store (iOS says Apple Health; Android says Health Connect). Input "What should we call you?" placeholder "Your first name", max 30, optional. Button "Get Started".

Step 1, How it works. Title "How your score is built". Subtitle "Three weighted components, recalculated every morning." Three cards with a coloured left border: Recovery 45% (error colour), Sleep 40% (info colour), Stress 15% (warning colour), each with a one-line description. Buttons "Back" and "Next".

Step 2, Device. Title "What do you train with?". Subtitle on iOS: "Readiness syncs all data through Apple Health, no direct device connection needed." Android: same sentence with Health Connect. Choices: Garmin, Apple Watch (on Android replace with the wearables that actually write HRV to Health Connect once 2.1 is answered), Both. Button "Continue".

Step 3, Training profile. Title "Your training profile". "How often do you train?" with three options: "2–3 days / week" ("I exercise occasionally"), "4–5 days / week" ("I train consistently"), "6+ days / week" ("I'm a high-volume athlete"), stored as light, moderate, high. "What's your primary goal?" 2 by 2 grid: Peak Performance (performance), Optimise Recovery (recovery), Lose Weight (weight_loss), General Health (general_health). "About you (optional)" chips Female, Male, Prefer not to say; tapping the selected chip deselects. Hint: "Female unlocks cycle-aware coaching. Age, height and weight can be added later in Profile." Switch "Morning briefing notification" with sublabel "Daily at 8:00 AM once your watch has synced. Change the time in Profile." On "Continue", if the switch is on, request notification permission (Android 13+ runtime permission); ignore errors.

Step 4, Connect health store. Rows: Heart Rate Variability, Resting Heart Rate, Sleep Analysis. Privacy banner with a lock icon: "Your score is calculated on your device. Your metrics sync to your account, and the AI features send them to Anthropic's Claude to write your briefing. Never sold, never shared with advertisers." Button "Continue" (Apple forbids naming the permission on the button; Google does not, but keep the copy). No skip. Tapping requests the Health Connect read permissions (section 6.1). If Health Connect is not installed or unavailable, continue anyway with granted = false and show "Could not open Health Connect. Make sure the app is installed and try again." as the error text. Then go to the setup step.

Step 5, Automated setup. Title "Setting up, {firstName}…", subtitle "Just a moment". Three rows that turn from spinner to green check: "Health Connect connected" or "Skipped Health Connect"; "Computing your personal baseline…" which becomes "Resting heart rate baseline: {n} bpm"; "All set, loading your score". Timing: 700 ms, then compute the RHR baseline with an 8 s timeout (fallback 60), 900 ms, persist, 400 ms, complete. Persist in one write: `onboarding_complete = "true"`, `device_type`, `user_name`, `training_frequency`, `joined_at` (ISO timestamp, now), `profile_goal`, `profile_sex` (only if set), and if the digest is on `notif_digest_enabled = "true"`, `notif_digest_hour = "8"`, `notif_digest_minute = "0"`. Then call `pushProfile()` (section 9.3) without waiting. Show the banner "Your first readiness score will appear tomorrow morning after your wearable syncs overnight data…". Track `onboarding_complete` (section 14) and replace the route with the tabs. Onboarding does not schedule the digest; Today does, the first time it has a usable score.

### 5.3 Today tab

Data loaded on this screen: health data and readiness (section 6 and 7), subscription state, calibration status, Strava activities for 28 days, yesterday's workouts from the health store, cycle state, overtraining signals, the first word of `user_name`, `profile_sex`, today's activity so far, life events for 7 days, workload analysis, pattern analysis (section 8.7), yesterday's score from `readiness_scores`, and the forecast.

Derived: `hasUsableScore = score > 0 && !isInsufficient`. `scoreColor = getScoreColor(score)` or `text.tertiary` when not usable. Label "Not enough data" when not usable.

Loading: full-screen "Loading..." with a spinner. Pull-to-refresh reloads everything. When loading or refreshing finishes with a usable score: track `score_shown` once per day, then run the notification checks (section 11): threshold alert, digest reschedule with the score, trend check, and HRV and RHR checks when the baselines are above 0. When the app returns to the foreground and the last fetch was more than 5 minutes ago, reload silently.

Sections in order, top to bottom:

1. Header. Greeting "Good morning" before 12:00, "Good afternoon" before 17:00, else "Good evening", followed by ", {firstName}" and a waving hand emoji. Date line like "Tuesday, 23 September". Right side: a share button (only with a usable score) and a "FREE" badge when not Pro.
2. Score ring. Size 240, stroke 14, arc animates over 800 ms, colour interpolated through the score bands, track `bg.elevated`. Centre: rounded score, or an em dash character (U+2014) as placeholder, and the label. Under it, when the absolute change vs yesterday is at least 2: "▲ {n} vs yesterday" in `#4ADE80` or "▼ {n} vs yesterday" in `#F87171`. Hint "Tap for briefing"; for Pro users whose score dropped more than 7 points: "Tap to understand today's drop". Tap with a usable score: Pro opens the daily briefing; Free checks `free_briefing_last_used` (allowed if empty or at least 7 × 24 h old), and if allowed marks it used now and opens the briefing, else opens the paywall. Track `briefing_opened {pro}`.
3. "TODAY'S RECOMMENDATION": Training load card (section 8.2). Free. Usable score only.
4. Streak banner (section 8.9). Usable score only.
5. Workout context banner: shown when yesterday's workout load tier is not none. "Yesterday's Training", a summary label, a tier pill Light / Moderate / Heavy / Peak in success / info / warning / error, or an "HRV impact" pill when HR suppression is detected (section 8.3).
6. Last Strava workout card: Strava connected and at least one activity in 28 days. "LAST STRAVA WORKOUT" with a "via Strava" badge in `#FC4C02`. Sport icon, name, time ago (Today, Yesterday, Nd, Nw, or date), duration · km · avg bpm, suffer-score pill "{n} · Easy/Solid/Hard/Epic".
7. Strava training load card: same condition. "TRAINING LOAD TREND", trend badge, 4 weekly bars (current week in the trend colour, older weeks amber at 75%), unit "Load in pts" or "eff.min". Pro adds the acute:chronic gauge (Deload / Easy / Steady / Build / warning), an insight line, this week vs the 4-week average, and "SPORT MIX · 4 weeks". Free sees "🔒 Pro: A:C ratio, coaching insights & sport breakdown".
8. Cycle phase card (section 8.11): sex female, tracking on, at least one entry.
9. Overtraining warning card (section 8.4): risk level not none. Free.
10. Data confidence banner: usable score, confidence not high, and a warning message exists. Shows a watch emoji and the message. Tappable with a chevron only when HRV is missing; the tap opens manual HRV entry. Messages, chosen in this order:
    - No HRV, no RHR, no sleep: (score hidden instead, see 12)
    - Low confidence: "No overnight data from your watch yet, so this is an estimate. Open your watch's app to sync, then pull down here to refresh."
    - No HRV and no RHR: "Sleep is tracked. Wear your watch snugly overnight to add heart rate, or tap to enter HRV yourself."
    - No sleep: "Heart rate is tracked. Wear your watch to bed to add sleep, the largest part of your score."
    - No HRV: "Add your overnight HRV to sharpen this score. It's the strongest recovery signal we read. Tap to enter it."
11. Error banner with the health-data error, for example "Health access denied. Go to Settings → Apps → Health Connect → Readiness to grant access." (adapt the path for Android).
12. Insufficient data card: not loading, no error, and (insufficient or score 0). "WAITING FOR YOUR FIRST SYNC", "Not enough data for a score", a body line, and a "Check again" button that refreshes.
13. Calibration banner (section 8.10).
14. "BREAKDOWN": four cards that fade in with 0 / 80 / 160 / 240 ms delays. Recovery 45%, Sleep 40%, Stress 15%, Activity (weight label "Context"). Bar colour: poor up to 40, fair up to 60, good up to 80, else optimal. Detail lines: Recovery "Last night · {date} · HRV {n}ms[ (manual)] · RHR {n}bpm (+Δ vs your {b} avg)"; Sleep hours and stages; Stress uses the three tiers of section 7.4 in words; Activity shows yesterday's steps / minutes / kcal plus "Today so far". Pro: tap opens the breakdown modal. Free: cards are locked, show only the first part of the detail line plus " · Tap for full analysis →", and tapping opens the paywall.
15. Pro summary card, free users with a usable score: "PRO" badge, "Go beyond the score", body "Unlock deeper recovery, nutrition guidance, weekly trends, the 3-day forecast, coach chat and full activity context in one place.", CTA "See what's included · $9.99/mo →" (use the live Play price once available) opening the paywall.
16. "NUTRITION TODAY": nutrition card (section 8.8). Pro, usable score.
17. "WEEKLY TREND": trend insight card (section 8.6). Pro.
18. "3-DAY FORECAST": forecast strip (section 8.5). Pro, forecast exists, usable score.
19. "WHAT'S AFFECTING YOU": life event tagger (section 8.12). Free, usable score.

Manual HRV entry. iOS uses a native text prompt; Android needs a dialog. Title "Enter HRV" or "Update HRV", body explaining where to find HRV in the wearable's app, numeric input valid from 10 to 250 ms, otherwise "Invalid value" / "Please enter a number between 10 and 250 ms." Stored at `manual_hrv_YYYY-MM-DD`, then a silent re-score. Clearing: "Clear Manual HRV" / "Remove today's manually entered HRV? Your Recovery score will revert to RHR-only." with a destructive Clear button.

Share. Render the share card (section 5.9) to a PNG and open the system share sheet with the text "My readiness score today: {score}/100, {label} 💪". Cancelling does nothing.

Day-7 calibration report and rating prompt. When `daysComplete >= 7`, `daysSinceJoined` is between 7 and 9 and `calibration_report_seen` is not set, open the calibration report modal and track `calibration_report_shown`. Outside that window, mark it seen silently and arm the rating prompt. "Keep Pro" tracks `calibration_keep_pro`, closes, and opens the paywall. Dismissing arms the rating prompt, which asks for an in-app review once per device (`rating_prompted`) when `daysComplete >= 7`. Fix on Android: a missing `joined_at` must not arm the rating on first launch (section 17).

### 5.4 Coach tab and coach chat

Coach tab: render nothing until the subscription state has resolved. Pro: the embedded chat screen. Free: title "Coach chat", subtitle "Grounded in your real readiness, recovery, and training context.", then a Pro gate (section 5.8) for "Coach Chat" with description "Ask anything about today's numbers…" over a dimmed two-bubble preview.

Chat screen. Context comes from an in-memory session object; if empty, build it from the current readiness, patterns, workload and 7 days of life events. States: loading "Loading your coach" / "Pulling in today's readiness and training context."; no session "Your coach is waiting for a score" (if the health load errored) or "No score context yet", body "Open Today after your wearable syncs overnight data…", button "Open Today". Header: "Back" only when pushed, title "Coach", "Clear" wipes the transcript. Empty history card: label "COACH", text "Ask anything about today's score, whether to push or back off, or what trend matters most right now.", and three chips that fill the input without sending: "Why is my score low today?", "Can I train hard today?", "What should I prioritize tonight?". Messages: user bubbles plain; coach bubbles labelled "COACH", rendering paragraphs on newlines, `**bold**` and `*italic*` only. A "Thinking…" bubble while sending. Auto-scroll to end. Composer: multiline, max 500 characters, placeholder "Ask anything about your data...", "Send" disabled when empty or sending.

Send flow: append the user message with today's local date and persist; call the coach-chat function (section 9.5) with the last 10 of today's messages as history; append the answer and persist; on any error show "Couldn't fetch the Coach. Try again." inline and keep the unanswered message. Fix on Android: surface the 402 and 429 messages from section 9.5 instead of the generic text.

Persistence: key `coach_chat_v1`, list of `{role, content, date}`, capped at 40 messages. Only today's messages, at most 10, are sent as context.

### 5.5 History tab

Data: for each of the last N days (7, or 28 for Pro 28D and calendar), read per-day RHR, sleep and HRV from the health store, compute the score with the current baselines (stress and daytime HR set to null), then let `readiness_scores` rows from the server replace the score, components and metrics for the dates they cover. Days with no data get a null score. Refetch every time the tab is focused.

Chart: SVG-style line chart, height 164, dashed grid lines with labels, gradient area from 25% to 0% opacity, 2.5 px line, dots (radius 6 for today, 3 to 4 otherwise, score-coloured on the Score metric), today's value labelled, x labels are 3-letter day names.

| Metric | Colour | Y range | Grid |
|---|---|---|---|
| Score | #F5A623 | 0 to 100 | 25 / 50 / 75 |
| HRV (ms) | #4ADE80 | 0 to 120 | |
| Sleep (hrs) | #60A5FA | 3 to 10 | |
| RHR (bpm) | #F87171 | 40 to 100 | |

Stats: "{N}-DAY AVG", "BEST", "TODAY" with "+x vs avg" in green or red, and "STREAK {n}d" for Pro.

Day row: day name (plus "  ·  Today"), short date, three small bars Rec / Slp / Str in error / info / warning colours, the score, then sleep, RHR and HRV values with emoji, or "No data".

Pro layout: header "History" with the date range; range toggle 7D / 28D / CAL; "↑ CSV" export (header row `Date,Day,Score,Recovery,Sleep,Stress,Resting Heart Rate (bpm),Sleep (min),Sleep Efficiency (%)`, file `readiness_YYYY-MM-DD.csv`, opened in the share sheet as text/csv, error dialog "Export failed"); chart card labelled "{METRIC} · {days} DAYS" or "READINESS · THIS MONTH" in CAL mode with a metric toggle Score / HRV / Sleep / RHR (options with no data are disabled at 35% opacity), empty state "No data yet"; calendar heatmap (Monday first, month navigation bounded by the earliest data month and the current month, cell background is the score colour at 16% alpha, today has an amber border, selected cell a `text.secondary` border, legend Peak / Good `#84cc16` / Moderate / Low, tapping a cell shows a detail card or "No data for this day"); stats row; "WEEKLY REPORT ✨ AI" entry card in 7D mode only ("Score trends, component breakdown & actionable tip") opening the weekly report modal; "INSIGHTS" correlations card (section 8.13); error banner; "DAILY LOG" with caption "Scores based on HRV, sleep and resting heart rate · coloured bars show recovery / sleep / stress", rows newest first.

Free layout: header "History"; a Today card ("TODAY", label or "No data yet", date, sleep and RHR pills, score "/100"); "READINESS · 7 DAYS" chart; stats 7-DAY AVG / BEST / TODAY; then a Pro gate for "Daily Log & Deep History" with description "Per-day breakdowns, 28-day trends, patterns and CSV export of your own data." over the dimmed daily log.

### 5.6 Profile tab

Loads on open: name, frequency, joined_at, photo path, age, sex, height, weight, goal. A photo path whose file no longer exists is dropped. Any change to name, frequency, age, sex, height, weight or goal calls `pushProfile()` after a 1.5 s debounce.

Title "Profile". Sections:

1. Hero card. Avatar: the photo, or the initial of the name (email prefix, or "Athlete"), with a camera badge. Tapping opens an action sheet "Profile photo" / "Choose a source": Camera, Photo library, "Remove photo" (only if a photo exists), Cancel. Permission is requested at tap time; denial shows "Permission needed" with a sentence pointing to system settings. Crop 1:1, quality 0.8, copied into app storage as `profile_photo_{timestamp}.{ext}`, the old file deleted, path stored in `profile_photo_uri`. Name edit pencil: dialog "Edit name" / "How should we call you?", saved to `user_name`. Badges: frequency label (for example "4–5 days/week" with a runner emoji) and "Since {Month YYYY}" from `joined_at`.
2. ACCOUNT. Email row. Plan pill: "PRO TRIAL · {n}d left", "PRO ♛", or "Free". "Manage subscription" row only for paid Pro (not trial), sublabel "Cancel, upgrade, request refund, or contact support", opens the RevenueCat Customer Center or, as fallback, the Play subscriptions page `https://play.google.com/store/account/subscriptions`. Upgrade button when not Pro or on trial: "Keep Pro after your calibration week" during the trial, else "Upgrade to Pro · $9.99/mo" (live price), opens the paywall.
3. CONNECTIONS: Strava (section 10). Not connected: sublabel "Import workouts, Suffer Score, and training load" and a "Connect" pill. Connected: "Connected as {athleteName}" and a "✓ Connected" pill; tapping asks "Disconnect Strava" / "Remove Strava connection? You can reconnect any time."
4. PERSONAL DETAILS. Steppers: Age 13 to 100 (first tap sets 30), Height 100 to 250 cm (default 175), Weight 30 to 250 kg (default 75); while unset the sublabel is "Optional · tap + to set". Biological sex picker with hint "Used to personalise your baselines". Keys `profile_age`, `profile_height_cm`, `profile_weight_kg`, `profile_sex`.
5. TRAINING PROFILE. Frequency picker and "Primary goal" picker ("What are you optimising for?"). Hint "Used to personalise your coach recommendations and readiness context."
6. CYCLE TRACKING, only when sex is female. Toggle "Track menstrual cycle". When on: Cycle length 21 to 40 (default 28), Period length 2 to 8 (default 5), "Log period start" / "Log today" which confirms "Logged ✓". Privacy hint: "🔒 Your period dates stay on this device. While tracking is on, your current cycle phase (not the dates) is sent with briefing and coach requests…". Keys `cycle_enabled`, `cycle_length`, `cycle_period_length`, `cycle_entries` (JSON array of YYYY-MM-DD).
7. Notifications, inside a Pro gate for "Custom Thresholds & Notifications", headline "Unlock Custom Notifications", description "Set a score target and get a morning digest…". Contents in section 11.
8. SUPPORT. "Sources" opens the sources screen. "Report a bug" opens a mailto to support@readinessapp.com prefilled with app version, platform and a partial user id; if no mail app: "No email app found".
9. Sign out: confirm dialog, then Supabase sign out. Local data is not wiped (a different account signing in wipes it, section 13).
10. Delete account: dialog "Delete account" with Continue, then "Are you absolutely sure?" / "…Your Strava connection will also be disconnected." with "Delete everything". Then POST to the delete-account function (section 9.6), clear all local storage, sign out. Error "Could not delete account".

There is no export entry in Profile; CSV export is in Pro History.

### 5.7 Paywall

Reached from: any Pro gate, locked breakdown cards, the ring for free users with no briefing left, the calibration report "Keep Pro", the briefing's coach button for free users, the Profile upgrade button. Track `paywall_shown` on open.

Close "✕". Hero: crown, "Readiness Pro", "Train smarter every day, guided by your body." Features:

- Daily Briefing & Coach: "A morning briefing written from your own numbers, and a coach you can ask why."
- 28-Day History & Forecast: "Four weeks of trend, correlations, nutrition guidance and a 3-day readiness forecast."
- Smart Alerts: "Morning digest with your score preview and alerts when you dip below your target."
- Export & Insights: "CSV export, pattern correlations, and a shareable weekly summary card."

Offerings: RevenueCat current offering (`default`), packages `$rc_monthly` and `$rc_annual`. Match annual by package type ANNUAL, id `$rc_annual`, or product id containing "yearly" or "annual"; monthly likewise. Prices from the store's price string; annual per-month is price / 12. States: "Loading prices from Google Play…"; unavailable "We couldn't load prices from Google Play. Check your connection and try again." with "Try again".

Loaded: Monthly / Annual toggle defaulting to annual with a savings badge; price line plus "Just {perMonth}/mo, billed annually" on annual; annual shows "🎁 14-day free trial included" (only if the Play product actually has that offer; otherwise drop the badge); monthly shows "Go annual for a 14-day free trial and save {x}%" computed from live prices. CTA "Start Free Trial" (annual) or "Subscribe Monthly". Note "No charge for 14 days · Cancel anytime in Google Play" or "Billed monthly · Cancel anytime in Google Play".

Purchase: `purchasePackage`. If entitlement `pro` is active afterwards: track `purchase_success {cycle}`, refresh entitlements, close. If not: "Purchase Issue" / "Payment completed but Pro entitlement was not activated…". User cancel shows nothing; other errors "Purchase Failed". Restore: `restorePurchases`; outcomes "Restored!" / "Your Pro subscription has been restored." then close, "No Previous Purchase" / "…linked to your Google account.", "Restore unavailable", "Restore Failed". Track `restore_success`. Footer: "Restore Purchases · Privacy · Terms"; Privacy https://thereadiness.app/privacy/ ; Terms: on iOS the Apple EULA, on Android a terms page is needed; https://thereadiness.app/terms/ returns 404 today (checked 23 September 2026), so Boban creates it before release.

### 5.8 Pro gate component

Renders nothing until the subscription state has resolved. Pro users see the children. Free users see the children at 12% opacity behind a panel with a crown, "Unlock {feature}", the optional description, and bullet lists per feature name ("7-Day History & Trends", "Training Load Recommendations", "Custom Thresholds & Notifications", "Export & Correlations", "Coach Chat" have their own bullets; anything else gets "Advanced analytics & insights", "Personalised recommendations", "Full history & data export"), a price pill "Readiness Pro · $9.99 / month" (live price), an "Upgrade to Pro" button opening the paywall, and the footer "14-day free trial on the annual plan · Cancel anytime".

### 5.9 Share card

270 by 480 card on `#0D0D10` with `#1A1A2E` and `#12121A` layers. "READINESS", date like "MON, 10 MAR", the score ring, uppercase label, "Today's readiness score", three component bars, and "readiness.app" at the bottom. Rendered off-screen and captured on share.

### 5.10 Sources screen

Header with a back control and "Sources". Intro disclaimer (general wellness app, not medical advice). Three cited sections with external links: HRV and recovery (two PMC papers), the 7-hour sleep target (JCSM 2015), alcohol and overnight RHR (Nutrients 2025). "What we present as rules of thumb": hydration ml/kg, deep and REM ranges, nutrition. "Your own numbers". Footer: "…speak to a doctor rather than to an app." Copy the exact links from `app/sources.tsx`.

### 5.11 Modals

Breakdown modal (Pro). Bottom sheet at 74% height, backdrop tap closes. Header: icon, name, status badge, "{w} of readiness score", date context, score circle. Animated bar. "30-DAY TREND" sparkline from 30 days of `readiness_scores` component values (needs 3 or more points, else "Not enough history yet"; area, dashed "avg N" line, highlighted "Today" point). "METRICS" rows. On Recovery, an HRV row "✏️ Enter heart rate variability" when HRV is missing, or Update and "✕ Clear manual entry" when manual. "WHAT THIS MEANS" and "TODAY'S RECOMMENDATION" from the ai-insight function with a "✨ AI" badge and a pulsing skeleton, static copy from section 8.1 as fallback. "Done".

Daily briefing modal. Full screen. Header: score, label, "Today's readiness", regenerate (Pro only, forces a refetch) and close. Component pills. Skeleton while loading. Error "⚠️ {msg}" with "Try again"; 402 shows "This needs Readiness Pro."; 429 shows "You have reached today's limit for this. Try again tomorrow." Content: "✦ AI" badge and headline; "WHAT'S HAPPENING" overview; "DO TODAY" bullets; disclaimer "AI-generated · Based on your biometrics and personal baselines"; "🫶 Recovery Protocol" when the score is below 55 with three rule-based items chosen by the lowest component; "Was this helpful? 👍 👎" saved to `briefing_feedback_v1_{date}` as helpful or unhelpful; "Ask your coach" card with "Open coach chat" (free: paywall; Pro: seed the coach session and push the chat). Cached per day at `daily_briefing_v1_YYYY-MM-DD` together with a fingerprint (section 9.5).

Calibration report modal. "CALIBRATION COMPLETE", "Your scores are personal now 🎉". "Your baselines": HRV, RHR, typical sleep (mean of positive sleep minutes over the last 7 days). "Your week" with average, strongest and hardest weekday when 3 or more scored days exist. "Cycle context" when tracking is on. On trial or free: CTA copy, "Keep Pro" and "Continue with the free score"; otherwise "Continue".

Weekly report modal (Pro, from History 7D). Sheet titled "Weekly Report" with the range, refresh and close. Loading "Analysing your week…". Error card with "Try again". Sections: "WEEK AVERAGE" big score and label; trend badge Improving / Declining / Stable; BEST / LOWEST day chips; "READINESS · N DAYS" bars; "COMPONENT AVERAGES" with TOP / FOCUS tags; "THIS WEEK ✨ AI" summary; "THIS WEEK'S FOCUS" tip; footer "Generated {date} · Updates each Monday". Cached at `weekly_report_v1_{YYYY-Www}` with the local ISO week. Fetched once per session unless refreshed.

---

## 6. Health data layer

### 6.1 Health Connect permissions

Read only. Request: `HeartRateVariabilityRmssdRecord`, `RestingHeartRateRecord`, `SleepSessionRecord`, `HeartRateRecord`, `StepsRecord`, `ActiveCaloriesBurnedRecord`, `ExerciseSessionRecord`. Nothing is written. I believe Health Connect limits reads to 30 days before the first permission grant unless the history read permission is also granted; the 30-day baseline (6.4) sits exactly at that edge, so request the history permission as well. I believe Google Play requires a declaration form for Health Connect data types before release. Both are UNVERIFIED and the developer should confirm against https://developer.android.com/health-and-fitness/guides/health-connect

### 6.2 Local date and "today"

`localDateStr(d)` = `YYYY-MM-DD` from the device-local year, month and day. Today is `localDateStr(now)` at fetch time. All windows below are device-local.

### 6.3 Today's fetch

Seven queries run in parallel; a failed query yields null for its field.

| Field | Window | Aggregation |
|---|---|---|
| hrv (ms) | now minus 36 h to now | section 6.4 rules |
| restingHeartRate (bpm) | now minus 48 h to now | round of the newest sample; keep (no per-day dedupe, no staleness check) |
| sleepDuration, deepSleep, remSleep (min), sleepEfficiency (%) | from 18:00 two days ago to now | last session, section 6.5 |
| daytimeAvgHR (bpm) | today 06:00 to now, ascending, first 500 samples | drop samples at or above 100 bpm; fewer than 5 left gives null; else round(mean); null before 06:00 |
| steps | yesterday 00:00 to today 00:00 | sum per source; prefer a source whose name contains "garmin" or "connect", else the largest source; if the platform aggregate total is higher, use that |
| activeCalories (kcal) | yesterday | round(sum) |
| exerciseMinutes | yesterday | Apple exercise minutes; no Health Connect equivalent, display only, may be null |
| stressScore | always null | reserved for a device stress index |

Steps, calories and exercise minutes are display only. A separate "today so far" activity fetch (midnight to now) feeds the Activity card.

### 6.4 HRV sample rules

Units: Health Connect RMSSD is already in milliseconds; do not scale. (Apple returns seconds, hence the iOS `toMs` step. Skip it.)

Overnight window: from yesterday 20:00 to today 12:00, samples at or before now.

Today's value: if any overnight samples exist, `round(mean)` and flag daytime = false; else the newest sample within the last 24 h, flag daytime = true; else null.

Per-day history (`dailyOvernightHRV`): a sample is overnight if its local hour is 20 or later, or before 12. Overnight samples at or after 20:00 are keyed to the next day. Daytime samples (12:00 to 19:59) are keyed to their own day. Per day: `round(mean(overnight))` if any overnight samples, else `round(mean(daytime))`.

Test vectors (now = 4 Sep 09:30):

- Samples 3 Sep 15:00 = 40, 4 Sep 02:00 = 60, 4 Sep 05:00 = 70 gives 65, count 2, daytime false.
- A 23:00 sample of 50 on 3 Sep counts toward 4 Sep: 50.
- At 16:00 with only 13:00 = 45 and 15:00 = 55: 55, daytime true.
- A 6-day-old sample: null. A sample timestamped after now: null.
- Daily: 2 Sep 22:00 = 50 and 3 Sep 04:00 = 70 gives 2026-09-03 = 60; a 3 Sep 14:00 sample is ignored for that day. 4 Sep 15:00 = 40 alone gives 2026-09-04 = 40.

### 6.5 Sleep parsing

Today: sort sessions or stage samples by start; start a new session when the gap is more than 4 hours; use the last session. Map Health Connect stages: LIGHT to core, DEEP to deep, REM to rem, SLEEPING (unstaged) to asleep, AWAKE, AWAKE_IN_BED, OUT_OF_BED and UNKNOWN ignored. `hasStages` is true if any core, deep or rem exists. Unstaged asleep time counts only when there are no stages. Core, deep and rem all count toward asleep. If asleep is 0, sleep is null. Efficiency = `round(asleep / inBed * 100)` when an in-bed duration exists, else 85. Deep and REM are 0, not null, when the device reports no stages (this matters for the sleep formula in 7.3; keep). Naps are not excluded; keep for parity, but see section 17.

History (`fetchSleepByDay`): window from 18:00 on day (today minus days minus 1) to now; group by the local date of each sample's end; a day needs at least 60 asleep minutes. Fix on Android: do not drop samples whose end hour is 14 or later before grouping; iOS does, and loses the pre-midnight part of the night (section 17).

### 6.6 History fetchers

- RHR history for the baseline: all RHR samples for 30 days, grouped by the local date of the sample start, `round(mean)` per day.
- RHR per day for History: most recent sample per day (keep the inconsistency for parity).
- HRV per day: window from 20:00 `days` ago, then `dailyOvernightHRV`.
- Yesterday's workouts: exercise sessions from yesterday 00:00 to today 00:00, at most 20, duration = end minus start in seconds, calories rounded or null, plus a type name string for the keyword classifiers (section 8.3). Health Connect gives an exercise type enum; map it to the same English words Apple uses (Running, Cycling, Traditional Strength Training, High Intensity Interval Training, Walking, Yoga, and so on) so the classifiers match.

### 6.7 When data is fetched

- On Today mount: permissions (10 s timeout), then in parallel today's data (12 s timeout, null on timeout), RHR baseline (8 s, fallback 60), HRV baseline (8 s, fallback 55). A hard 20 s fallback ends the loading state.
- Pull-to-refresh.
- App returns to the foreground and at least 5 minutes have passed since the last fetch: silent reload.
- After manual HRV entry: silent reload.
- History refetches on every tab focus.
- There is no background fetch on iOS. None is required on Android for 1.0.

### 6.8 Baselines

HRV baseline: 30 days of per-day HRV values including today. Fewer than 7 values gives 55. Otherwise sort ascending, drop the lowest `floor(0.2 n)`, take the median of the rest. RHR baseline: 30 days of per-day means. Fewer than 7 gives 60. Otherwise sort ascending, keep the lowest `ceil(0.8 n)`, take the median. Median: odd count gives the middle value unrounded; even count gives `round((a + b) / 2)`; empty gives 0. Cached for 24 h at `hrv_baseline` and `rhr_baseline`.

Example: values `[50, 52, 55, 60, 62, 48, 70]` give HRV baseline 58 and RHR baseline 54.

There is no sleep baseline; sleep uses a fixed 420-minute target.

### 6.9 Manual HRV

Used only when the health store gives no HRV. Stored at `manual_hrv_YYYY-MM-DD`, accepted range 10 to 250, sets `hrvSource = "manual"`. It feeds both Recovery and Stress tier 2.

### 6.10 Data shapes

HealthData: `date, hrv, hrvSource?, restingHeartRate, sleepDuration, deepSleep, remSleep, sleepEfficiency, stressScore, daytimeAvgHR, steps, activeCalories, exerciseMinutes`. Every value is a number or null; units are minutes, bpm, ms, percent.

ReadinessResult: `score, components {recovery, sleep, stress} (rounded), healthData, dataQuality {confidence, isInsufficient, warningMessage}`.

---

## 7. Score engine (must match iOS exactly)

Porting rules that change output if ignored:

- Rounding: JavaScript `Math.round(x)` is `floor(x + 0.5)`. Dart's `round()` rounds half away from zero, which differs for negative halves. Use `(x + 0.5).floor()` wherever iOS rounds a value that can be negative (trend deltas, copy deltas).
- Keep the operation order as written: `z = (hrv - base) / 15` then `50 + z * 20`.
- JavaScript sorts are stable; Dart's are not guaranteed to be. Add an index tie-break wherever a sort decides which item wins (weakest component: recovery beats sleep beats stress on a tie).
- `clamp(v, lo, hi) = min(max(v, lo), hi)`. Where no bounds are given, they are 0 and 100.

### 7.1 Inputs

`hrv`, `rhr`, `sleepDuration`, `deepSleep`, `remSleep`, `sleepEfficiency`, `stressScore`, `daytimeAvgHR`, plus `hrvBase` (default 55) and `rhrBase` (default 60).

### 7.2 Recovery

```
hrvS = clamp(50 + ((hrv - hrvBase) / 15) * 20)     if hrv != null
rhrS = clamp(50 + (rhrBase - rhr) * 3)             if rhr != null
recovery = both present ? clamp(hrvS * 0.6 + rhrS * 0.4)
         : one present  ? that one
         : 50
```

### 7.3 Sleep

```
if sleepDuration == null: sleep = 50
parts (score, weight):
  duration: (duration >= 420 ? 100 : clamp(duration / 420 * 100)), 0.5
  deep:     if deep != null and duration > 0: clamp((deep / duration) / 0.20 * 80), 0.2
  rem:      if rem  != null and duration > 0: clamp((rem  / duration) / 0.25 * 80), 0.2
  eff:      if eff  != null:                  clamp((eff / 85) * 80),               0.1
sleep = clamp(sum(score * weight) / sum(weight))
```

Because the parser returns deep = 0, rem = 0 and eff = 85 for a device without stages, a 420-minute unstaged night scores `(50 + 0 + 0 + 8) / 1.0 = 58`, not 100. Keep this.

### 7.4 Stress, three tiers in order

```
if stressScore != null:              stress = clamp(100 - stressScore)
else if hrv != null:                 stress = clamp(50 + ((hrv - hrvBase) / 15) * 15)
else if daytimeAvgHR != null and rhrBase > 0:
    elevation = daytimeAvgHR - rhrBase
    stress = clamp(75 - (elevation - 15) * 2.5, 20, 90)
else:                                stress = 50
```

Constants: typical elevation 15, low 12, high 22 (12 and 22 are used only in copy).

### 7.5 Final score and data quality

```
score = round(clamp(recovery * 0.45 + sleep * 0.40 + stress * 0.15, 0, 100))
```

Components are rounded separately for display; the total uses the unrounded components.

Confidence: high when HRV and sleep are both present; medium when any of HRV, RHR or sleep is present; low when none. `isInsufficient` = no HRV, no RHR and no sleep; the score is then hidden and not saved. Warning messages are in section 5.3 item 10.

Journal or life-event tags do not modify the score.

### 7.6 Test vectors

Default baselines unless stated. Sleep written as duration / deep / rem, efficiency separate.

| Input | Recovery | Sleep | Stress | Score |
|---|---|---|---|---|
| All null | 50 | 50 | 50 | 50 |
| HRV 55, RHR 60, sleep 480/96/120, eff 95 | 50 | 90.94 | 50 | 66 |
| HRV 90, RHR 50, sleep 500/110/130, eff 95 | 90 | 93.18 | 85 | 91 |
| HRV 25, RHR 75, sleep 240/20/30, eff 60 | 8 | 48.89 | 20 | 26 |
| HRV 40, RHR 65, sleep 480 only | 32 | 100 | 35 | 60 |
| Same, baselines HRV 40 / RHR 65 | 50 | 100 | 50 | 70 |
| Sleep 480/96/120, eff 85, nothing else | 50 | 90 | 50 | 66 |
| Sleep 420 only | 50 | 100 | 50 | 70 |
| Sleep 210 only | 50 | 50 | 50 | 50 |
| Sleep 210/42/52.5, eff 85 | 50 | 65 | 50 | 56 |
| Device stress 10 only / 90 only | 50 | 50 | 90 / 10 | 56 / 44 |
| Tier 3, rhrBase 54, daytime HR 59 / 69 / 79 / 94 | 50 | 50 | 90 / 75 / 50 / 20 | 56 / 54 / 50 / 46 |
| HRV 58, RHR 52, sleep 427/82/98, eff 88, baselines 62 / 54 | 49.2 | 88.33 | 46 | 64 |

Monotonic checks: HRV 30 / 45 / 55 / 70 / 90 with RHR 60 and sleep 480 gives 57 / 65 / 70 / 78 / 88. Sleep 240 / 330 / 420 / 480 / 540 alone gives 53 / 61 / 70 / 70 / 70.

### 7.7 Score bands

Home ring label and colour:

| Score | Label | Colour |
|---|---|---|
| 0 to 20 | Rest Up | #E53935 |
| 21 to 40 | Take It Easy | #F4511E |
| 41 to 60 | Moderate | #FB8C00 |
| 61 to 80 | Good to Go | #7CB342 |
| 81 to 100 | Peak Ready | #43A047 |

The coach-chat `scoreLabel` uses a different scale: 80 or more Optimal, 60 or more Good, 40 or more Moderate, else Low. Breakdown status: 80 Optimal, 65 Good, 50 Moderate, 35 Reduced, else Low.

---

## 8. Derived features

### 8.1 Breakdown copy (per-component modal, static fallback)

Sleep target 420 minutes. Thresholds:

| Metric | Copy branches | Status |
|---|---|---|
| RHR delta vs baseline | at most minus 3 / at most plus 2 / above | at most minus 2 good, at most 3 ok, else poor |
| HRV delta vs baseline | at least 5 / at least minus 5 / below | at least 3 good, at least minus 5 ok, else poor |
| Sleep shortfall (min) | 0 / up to 60 / more | same |
| Total sleep vs 420 | 0 / up to 60 / up to 120 / more | diff at least 0 good, at least minus 60 ok, else poor |
| Deep % of sleep | 20 / 14 | 18 / 12 |
| REM % of sleep | 22 / 15 | same |
| Efficiency % | 85 / 75 | same |
| Device stress | 25 / 50 / 75 | 25 good, 50 ok, else poor |
| Stress HRV delta | plus or minus 5 | same |
| Daytime elevation | up to 12 / up to 22 | same |

Recovery overall row: "good signals" when RHR delta is at most 2 and HRV minus the personal baseline is at least minus 5 (fix: iOS compares with a hard-coded 55). Status 65 good, 45 ok. Sleep quality row: deep at least 18% and REM at least 22%. Stress overall: count of elevated signals (device stress above 50, HRV delta below minus 5, elevation above 22), status 65 / 45. Interpretation and advice paragraphs use bands 80 / 65 / 50 / 35. Activity score (display only) = `round(min(75, steps / 10000 * 75) + min(25, exerciseMinutes / 60 * 25))`.

### 8.2 Training recommendation (Today card)

| Score at least | Tier | Headline | Zone | Minutes | RPE |
|---|---|---|---|---|---|
| 86 | peak | Push Hard Today | 5 | 60 to 90 | 8 to 9 |
| 71 | quality | Strong Workout Day | 4 | 60 to 75 | 6 to 7 |
| 56 | moderate | Steady Training Day | 3 | 50 to 70 | 4 to 5 |
| 41 | easy | Easy Day | 2 | 40 to 60 | 3 to 4 |
| 26 | recovery | Light Movement Only | 1 | 20 to 35 | 2 to 3 |
| 0 | rest | Rest Today | 0 | 0 | 1 |

Card: zone badge (REST or Z{n}), headline, zone name, duration pill, "Effort {rpe}/10 ›" pill that expands to "What does X/10 feel like?", "🏃 WHAT TO DO", "WHY TODAY?", and "Based on today's readiness score · {score}". The rationale picks the weakest component (recovery beats sleep beats stress on ties) with thresholds below 40 (rest wording), below 65 (moderate wording), and stress above 80 (quality wording).

### 8.3 Yesterday's workout load (health store)

Categories by keyword on the workout type name, checked in order: strength, hiit, cardio, sport, low, other. Multiplier 1.4 for strength and hiit, 1.0 for cardio and sport, 0.5 otherwise. `eff = minutes * multiplier`, `kcal = calories or 0`. Tier: light if eff below 18 and kcal below 150; moderate if eff below 36 and kcal below 280; heavy if eff below 70 and kcal below 550; else peak. Workouts under 300 s are dropped. Overall tier is the maximum; primary category is the one with the most effective minutes. `hrSuppression` = today's HRV below 0.9 times the baseline and tier heavy or peak.

Workload analysis (feeds the AI and the forecast): intensity 1.4 for hard keywords, 0.45 for easy keywords, else 1.0. Per workout load = `min(100, round(minutes * factor / 126 * 100))`. `dailyLoad` = the same formula on the summed product. `isHighLoad` = dailyLoad above 65. Examples: 45-minute run 50; 60-minute run 67 (high); 30-minute moderate 24; 60-minute walk 21. Copy the keyword lists from `src/utils/workoutLoad.ts` and `src/services/workloadAnalysis.ts`.

### 8.4 Overtraining warning

Signals: pattern types `consecutive_hrv_drop`, `persistent_low`, `consecutive_score_decline`, `sleep_debt`, `stress_accumulation` with severity warning or alert, plus a "Training load spike" alert when the Strava trend is overreaching. Alerts first, top 4 kept. Risk: high if 2 or more alerts, or 1 alert and 2 or more warnings; moderate if 1 alert or 2 or more warnings; low if 1 warning; else none. Card: "OVERTRAINING ALERT", badge "Watch Closely" (amber) / "Overtraining Risk" (#FB8C00) / "High Overtraining Risk" (error), summary, signal pills, "See what's triggering this ▼" expanding to SIGNALS DETECTED and WHAT TO DO (three steps per level, copy in `src/hooks/useOvertrainingWarning.ts`), and a disclaimer.

### 8.5 3-day forecast

Input: today's live score, or the latest stored score if the live score is 0 or less; hidden when data is insufficient. Each active pattern contributes a per-day delta (table in `src/services/readinessForecast.ts`). Training load adds `[-12, -5, +3]` for high load or `[-6, -2, +2]` for moderate; moderate applies to any workout of 5 minutes or more. `score_d = clamp(round(today + sum(deltas_d)), 15, 98)`. Trend vs the previous day: rising above plus 3, dropping below minus 3, else stable. Range plus or minus 5 / 9 / 13 for days 1 / 2 / 3, clamped to 10 to 99. Key-factor zones 80 / 65 / 48. Summary "Best window: {Day} looks strongest at {n}" when the spread is 5 or more, else "Steady ahead: No standout day…". Note "Directional estimate based on recent patterns and load". Three cards: date, relative label, confidence badge, score, "Projected readiness", trend badge, change pill, training pill (61 or more "Ready to push", 41 or more "Take it easier", else "Prioritise rest"), "Main driver", "Likely range a–b". Example: today 70 with sleep_debt and high load gives 53 / 60 / 70.

### 8.6 Weekly trend (Pro card)

Read the last 7 dates from `readiness_scores` ascending; needs at least 2 rows. Overall: prior = first `max(1, n - 3)` rows, recent = last 3; `delta = round((mean(recent) - mean(prior)) * 10) / 10`; above 5 improving, below minus 5 declining, else stable. Components use rows 0 to 3 vs the last 3 (keep). Weak link = the most negative component delta if below minus 5. Cache `trend_v1` for 30 minutes. Card: "RECOVERY TREND · 7 DAYS", badge like "↑ +8.2", sparkline bars, day labels 7d to Today, Recovery / Sleep / Stress pills, insight sentence. No data: "Trend analysis unlocks after a few days of data. Keep checking in daily." Example `[60, 62, 58, 61, 70, 72, 74]` gives 11.8, improving. Fix on Android: refetch after today's score upsert completes and on pull-to-refresh (section 17).

### 8.7 Pattern analysis

Rows for the last 30 dates from `readiness_scores`, ascending; needs at least 3. "Consecutive" means consecutive rows, not calendar days. Cached at `patterns_v1_{date}` for 6 hours. Rules: HRV drop = last 3 non-null HRV strictly decreasing with a drop of at least 5 (alert at 12); score decline = last 3 strictly decreasing with a drop of at least 8 (alert at 20); HRV improving = rise of at least 5; sleep debt = last 5 rows with at least 3 sleep values, at least 7 sleep rows overall, baseline = rows minus 19 to minus 5 with at least 3 values, debt at least 25 minutes (alert at 60); stress accumulation = 4 strictly decreasing stress components with a drop of at least 10; rebound = min of rows minus 5 to minus 3 vs mean of the last 2, gain at least 10; persistent low = last 7 rows (at least 5) with mean below 50, alert. Each pattern has a type, severity (info / warning / alert) and message; copy from `src/services/patternAnalysis.ts`.

### 8.8 Nutrition card (Pro)

Flags: inflammation when HRV is below 0.85 times the baseline or recovery below 45; sleep debt when sleep is under 6.5 h or deep under 45 min; high stress when the stress component is below 45. Tier by score: 75 or more A (green), 50 or more B (amber), else C (red). With a body weight: water litres = `round(kg * ml / 100) / 10` using 40 / 33 / 36 ml per kg for A / B / C; protein rounded to the nearest 5 g using 1.8 to 2.2 / 1.6 to 1.8 / 1.8 to 2.0 g per kg. Card: headline, context, hydration, protein (only with a weight), weight row "Hydration and protein scaled to X kg" or "Add your weight…" (navigates to Profile), "✅ PRIORITISE TODAY", "⚠️ MODERATE", "⏰ MEAL TIMING", rationale, footer.

### 8.9 Streak

Rows from `readiness_scores` for the last 90 days with score above 0. Current streak walks back from today, or from yesterday if today has no row. Best = longest run of consecutive calendar days, persisted as `max(best, stored, current)` at `best_streak`. Banner: 0 days "🌱 Check in daily to build your streak"; otherwise "🔥 {n}-day streak", with a party emoji and "{n} days in a row, keep it going!" at multiples of 7, and a BEST badge when best is above 1.

### 8.10 Calibration

`joined_at` is written at onboarding (or restored from the server profile). `daysSinceJoined` = calendar days since then; `daysComplete = min(days, 7)`; `isCalibrating = daysComplete < 7`. No `joined_at` means not calibrating. Calibration changes nothing in the maths; baselines go personal as soon as the store holds 7 days of data. Banner: "CALIBRATING" badge with a close control, day-specific headline and body indexed by `daysComplete` 0 to 6 (from "First reading: Day 1 of 7 🔬" to "Final calibration day: Day 7 of 7 ✓"; copy in `src/components/score/CalibrationBanner.tsx`), 7 dots, "{n} nights collected", progress bar. Dismissible per session.

### 8.11 Cycle tracking

Local only. `dayOfCycle = (daysSinceLatestStart mod cycleLength) + 1`. Phase: day at most periodLength is menstrual; at most 13 follicular; at most 16 ovulatory; at least cycleLength minus 5 late luteal; else luteal. For 28 / 5: 1 to 5, 6 to 13, 14 to 16, 17 to 22, 23 to 28. `daysUntilNext = cycleLength - day`. No effect on the score; phases change copy only (PHASE_INFO in `src/services/cycleTracking.ts`). Card: "CYCLE PHASE", "🔒 dates on device · phase shared with AI coach", phase badge, "Day N", 28 progress dots, readiness note, expandable sections, next-period label, "+ Log period start". Only `{phase, dayOfCycle, cycleLengthDays}` goes to the AI functions.

### 8.12 Life events

Types and labels: alcohol "🍷 Alcohol / Late night", illness "🤒 Sick / Illness", travel "✈️ Travel / Jet lag", stress "😤 High stress", poor_sleep "😴 Poor sleep", intense_workout "💪 Intense workout", medication "💊 Medication", other "📌 Other". "+ Tag my day" opens a sheet "What's affecting you today?" with the types, an optional note up to 120 characters, and Save, which inserts into `life_events`. Today's chips are shown; long-press deletes. Hint "✦ Your coach will factor these in · long-press a tag to remove it". If the insert fails the sheet closes silently (fix: show an error).

### 8.13 Correlations (History, Pro)

Needs at least 3 scored days, else "⏳ More data needed". Sleep insight: at least 4 days with both groups (420 min or more vs less) and an absolute difference of at least 3, worded "{n} pts higher on 7h+ sleep nights". RHR insight: at least 3 days, at or below the median vs above, positive difference of at least 4. Trend insight: at least 4 days, halves split at `floor(n / 2)`, plus or minus 5, else "Stable". Fallback "Patterns coming into focus". Footer "Patterns strengthen as you log more days".

---

## 9. Backend contracts

### 9.1 Auth

Email and password only. Calls used: `signUp`, `signInWithPassword`, `verifyOtp` (types email, recovery, and the token_hash types from the deep link), `resend`, `resetPasswordForEmail`, `updateUser`, `signOut`, `getSession`, `refreshSession`, `onAuthStateChange`. The session is persisted on the device. The Supabase dashboard must list `readiness://callback` in the redirect allow-list (it does for iOS; UNVERIFIED that no Android-specific change is needed).

The user's `created_at` from the auth user drives the 7-day trial on both the client and the server.

### 9.2 Tables (final schema)

All tables have row-level security. The anon role has no access. The app connects as `authenticated` with the user's JWT.

readiness_scores. `id uuid PK default gen_random_uuid()`, `user_id uuid not null` (FK auth.users, cascade), `date date not null`, `score smallint not null 0..100`, `recovery_score`, `sleep_score`, `stress_score smallint not null 0..100`, `hrv real null` (ms), `rhr smallint null` (bpm), `sleep_duration smallint null` (min), `sleep_efficiency real null` (0..100), `created_at`, `updated_at timestamptz not null default now()`. Unique `(user_id, date)`. Index `(user_id, date desc)`. Trigger sets `updated_at` on update. Policies: select, insert, update where `auth.uid() = user_id`. No delete policy; clients cannot delete rows.

life_events. `id uuid PK`, `user_id uuid not null` (FK cascade), `date date not null`, `event_type text not null` in (alcohol, illness, travel, stress, poor_sleep, medication, intense_workout, other), `notes text null`, `created_at timestamptz default now()`. Index `(user_id, date desc)`. Policy: all operations for the owner.

user_profiles. `user_id uuid PK` (FK cascade), `name text`, `age int` 1..129, `sex text` in (male, female, prefer_not_to_say), `height_cm numeric` in (0, 300), `weight_kg numeric` in (0, 500), `training_frequency text` in (light, moderate, high), `primary_goal text` in (performance, recovery, weight_loss, general_health), `device_type text`, `onboarded_at timestamptz`, `updated_at timestamptz default now()` (the client sets it). Policy: all operations for the owner.

app_events. `id bigint identity PK`, `user_id uuid not null` (FK cascade), `event text not null` 1..64 chars, `props jsonb not null default '{}'` at most 1024 bytes, `created_at`. The authenticated role may only insert its own rows; it cannot read.

ai_calls. `id`, `user_id`, `fn text` in (daily-briefing, coach-chat, weekly-report, ai-insight), `created_at`. Service role only; the app never touches it.

Six older tables exist with all grants revoked (health_snapshots, journal_entries, notification_log, profiles, user_streaks, weekly_reports). Ignore them.

### 9.3 Client database calls

- Upsert today's score after every successful compute unless insufficient: `readiness_scores` upsert of `{user_id, date, score, recovery_score, sleep_score, stress_score, hrv, rhr, sleep_duration, sleep_efficiency}` with `onConflict: user_id,date`. Fire and forget on iOS; on Android await it before refreshing the trend card.
- History: select the 9 columns where `date >= today - (days - 1)` ordered by date ascending. Metric history (breakdown sparkline): same for 30 days.
- Today: yesterday's `score` for the delta; if today has no row, the latest `score` ordered by date descending, limit 1.
- Streak: `date, score` for the last 90 days.
- Trend: `date, score, recovery_score, sleep_score, stress_score` for the last 7 dates ascending, limit 7.
- Patterns: the 9 columns for the last 30 dates ascending.
- `pushProfile()`: upsert `user_profiles` with `{user_id, name, age, sex, height_cm, weight_kg, training_frequency, primary_goal, device_type, onboarded_at (= joined_at), updated_at (now, ISO)}` on conflict `user_id`. Errors are swallowed.
- `pullProfile()`: select `*` where `user_id = uid`, maybe single. If `onboarded_at` is set, write only the local keys that are currently empty, restore `joined_at` from `onboarded_at`, and set `onboarding_complete = "true"`.
- Life events: select `*` where `date >= today - 7` descending; insert `{user_id, date (local today), event_type, notes}` returning the row; delete by `id`.
- Analytics: insert `{user_id, event, props}` into `app_events`.

### 9.4 Edge functions: common rules

Base URL `https://vgvrmhqkcqdimgwzbbhc.supabase.co/functions/v1/{name}`. Method POST. Headers: `Authorization: Bearer {session access token}`, `apikey: {anon key}`, `Content-Type: application/json`. Gateway JWT verification is off; each function verifies the token itself.

Gate for the four AI functions, in this order:

1. Invalid or missing token: `401 {"error":"Unauthorized"}`.
2. Tier: trial if now is before `created_at + 7 days`; else RevenueCat is asked for the `pro` entitlement (pro if active, free if not); if RevenueCat is unreachable the call is allowed and logged.
3. Free tier: `402 {"error":"pro_required"}`, except daily-briefing, which allows one call per ISO week (Monday 00:00 UTC). The second free briefing in a week is also 402.
4. Daily cap per function since UTC midnight: `429 {"error":"daily_limit"}`. Caps: daily-briefing 12, coach-chat 60, weekly-report 6, ai-insight 40.
5. The usage row is written before the model call, so validation failures and retries count against the caps.
6. Bodies over 16,384 characters: `413 {"error":"Request too large"}` (not enforced on ai-insight).

Common errors: `400 {"error":"Invalid JSON"}`, `400 {"error":"Invalid input"}`, `405`, `500 Server configuration error`, `502 {"error":"Upstream error: {status}"}`, `500 {"error":"{message}"}`.

Client messages for the gate errors: 402 "This needs Readiness Pro." (weekly report: "The weekly report needs Readiness Pro."), 429 "You have reached today's limit for this. Try again tomorrow." No session: "Not signed in".

The model on all four is `claude-haiku-4-5-20251001`. Briefing and coach replies have em and en dashes removed on the server; the client should still render whatever text arrives.

### 9.5 Edge functions: request and response shapes

daily-briefing. Timeout 25 s. Body:

```json
{
  "score": 72, "scoreLabel": "Good to Go",
  "components": {"recovery": 70, "sleep": 78, "stress": 60},
  "healthData": {"date": "2026-09-23", "hrv": 61, "restingHeartRate": 52,
                 "sleepDuration": 431, "deepSleep": 80, "remSleep": 95,
                 "sleepEfficiency": 91, "stressScore": null, "daytimeAvgHR": 66, "steps": 8400},
  "rhrBaseline": 54, "hrvBaseline": 58,
  "patterns": [{"type": "sleep_debt", "severity": "warning", "message": "..."}],
  "workload": {"workouts": [{"type": "Running", "durationMins": 45, "calories": 420,
                             "intensityTier": "moderate", "load": 50}],
               "dailyLoad": 50, "isHighLoad": false},
  "lifeEvents": [{"id": "...", "date": "2026-09-22", "event_type": "alcohol", "notes": null}],
  "cycle": {"phase": "luteal", "dayOfCycle": 19, "cycleLengthDays": 28},
  "yesterdayFeedback": {"date": "2026-09-22", "rating": "helpful"}
}
```

`score`, `components` and `healthData` are required; `healthData` values are numbers or null; `workload`, `cycle`, `yesterdayFeedback` may be null. Response `200 {"headline": "...", "overview": "...", "doToday": ["...", "..."]}` with 2 or 3 items. Cache per day at `daily_briefing_v1_{YYYY-MM-DD}` as `{briefing, fingerprint}` where fingerprint joins score, the three components, hrv, rhr, sleepDuration, deepSleep, remSleep and sleepEfficiency with `|`; a mismatch triggers a refetch; the regenerate button forces one. Note: the server currently prints `sleepEfficiency * 100` in its prompt while the client sends 0 to 100; this is a server bug (section 17), send 0 to 100 anyway.

coach-chat. Timeout 20 s. Body: `question` (required, the server truncates to 500), `score` (required), `scoreLabel` (Optimal / Good / Moderate / Low scale), `components`, `healthData` with `{hrv, restingHeartRate, sleepDuration, deepSleep, remSleep, sleepEfficiency, stressScore, steps}`, `rhrBaseline`, `hrvBaseline`, `patterns`, `workload` as `{dailyLoad, isHighLoad, workouts: [{type, durationMins, intensityTier}]}` or null, `lifeEvents` as `[{date, event_type, notes}]`, `history` as `[{role: "user"|"assistant", content}]` (send today's messages, at most 10; the server keeps the last 6 and truncates each to 2,000 characters), `cycle`, and `profile` as `{name, age, sex, heightCm, weightKg, bmi, trainingFrequency, primaryGoal}` with BMI computed on the device. Response `200 {"answer": "..."}`. No response cache.

weekly-report. Timeout 25 s. POST with no body. The server reads the caller's last 7 days of `readiness_scores` (UTC dates). Fewer than 3 rows: `422 {"error":"Not enough data yet (need at least 3 tracked days)"}`. Response:

```json
{"summary": "...", "tip": "...", "trend": "improving|declining|stable", "avgScore": 68,
 "bestDay": {"date": "2026-09-20", "score": 81, "dayLabel": "Sat"},
 "worstDay": {"date": "2026-09-18", "score": 52, "dayLabel": "Thu"},
 "topComponent": "sleep", "weakComponent": "stress",
 "scores": [{"date": "...", "score": 70, "dayLabel": "Mon",
             "components": {"recovery": 70, "sleep": 75, "stress": 60}}],
 "weekOf": "2026-09-17"}
```

`weakComponent` may be null. Any failure: `500 {"error":"Failed to generate weekly report"}`. Cache at `weekly_report_v1_{YYYY-Www}` (local ISO week).

ai-insight. Timeout 20 s. Body `{component: "recovery"|"sleep"|"stress", score, statusLabel, healthData (the whole HealthData object), rhrBaseline, hrvBaseline}`. Response `200 {"interpretation": "...", "advice": "..."}`. Errors `400 Invalid JSON body`, `400 Invalid component`. Called only for Pro and never for the Activity card. Cache at `ai_v1_{component}_{date}_{roundedScore}`, valid only on the same local day. Any error falls back silently to the static copy.

### 9.6 delete-account

POST, no body, `Authorization: Bearer {token}` (the iOS client omits `apikey`; sending it is harmless). Responses: `200 {"success": true}`, `401 {"error":"Missing Authorization header"}` or `Unauthorized`, `405`, `500 {"error": "..."}`. The server deletes the user's `readiness_scores` then the auth user; cascades remove life_events, user_profiles, app_events and ai_calls. RevenueCat and Strava are not touched: the user cancels a subscription through Google Play, and the app only forgets the Strava tokens.

### 9.7 strava-token-exchange

See section 10.

---

## 10. Strava

Client id `211386` (public). Redirect URI `readiness://strava-callback`. Scope `read,activity:read`. The Strava application's "Authorization Callback Domain" is `strava-callback`; no change needed for Android.

Connect: open in the external browser `https://www.strava.com/oauth/mobile/authorize?client_id=211386&redirect_uri=readiness://strava-callback&response_type=code&approval_prompt=auto&scope=read,activity:read`. The callback screen shows a spinner, "Connecting Strava", "Finishing the secure callback...". If `error` is present or `code` is missing: dialog "Strava connection failed" / "Missing or invalid callback from Strava.", OK goes to Profile. Otherwise call the exchange:

POST `strava-token-exchange` with the user's Bearer token and body `{"grant_type": "authorization_code", "code": "...", "redirect_uri": "readiness://strava-callback"}`. For refresh: `{"grant_type": "refresh_token", "refresh_token": "..."}`. Response `200 {"access_token", "refresh_token", "expires_at" (unix seconds), "athlete": {"firstname", "lastname", "id"}}`. Errors `401`, `400 Invalid JSON body` or bad grant_type or missing code / refresh_token, `500 Server configuration error` or `Failed to reach Strava`, or Strava's own status with `{"error": "..."}`. Client behaviour: retry network errors after 0, 350 and 1000 ms; on 401 refresh the Supabase session and retry once. On success store `strava_access_token`, `strava_refresh_token`, `strava_expires_at` (seconds), `strava_athlete_name` (first plus last name) and go to Profile. On failure: dialog "…We could not complete the Strava token exchange. Please try again."

Refresh the Strava token when fewer than 60 s remain. If the error text contains invalid_grant, authorization error, invalid refresh or token expired, clear the four keys.

Calls from the device with the Strava access token: `GET https://www.strava.com/api/v3/athlete/activities?after={unixNow - days * 86400}&per_page=30` (Today uses 28 days) and `GET /api/v3/activities/{id}`. Not cached.

Load model: per activity load = `suffer_score` if above 0, else `round(moving_minutes * sport multiplier)` (table in `src/utils/stravaLoad.ts`, default 0.9). Bucket by ISO week of `start_date_local` into this week and the 3 before. ATL = this week's total; CTL = sum of the 4 weeks / 4; ratio = `round2(ATL / CTL)` or null when CTL is 0. Classes: ATL 0 or null "No activity"; above 1.30 overreaching; at least 1.11 building; at least 0.90 maintaining; at least 0.70 easy week; else deloading. Example loads 300 / 280 / 320 / 450 give CTL 337.5, ratio 1.33, overreaching, "33% above".

Disconnect removes the four local keys only; it does not revoke the Strava grant.

---

## 11. Notifications (local only, no push server)

Android channel `readiness`: default importance, vibration pattern 0 / 250 / 250 / 250, light colour `#F5A623`. Foreground notifications show an alert without sound or badge. Request the Android 13 runtime permission the first time any toggle is turned on; if denied show "Notifications blocked" with a sentence pointing to system settings, and a warning banner in the settings section.

Preferences (defaults: all off, digest 08:00, threshold 60), stored under the keys in section 13:

- MORNING DIGEST: "Daily morning reminder" / "Tap to check your score for the day". When on, "Reminder time" stepper for the hour only, 4 to 12, shown as HH:MM. Scheduling: cancel scheduled notifications whose payload type is `digest`, then schedule a repeating daily notification at hour:minute. Copy depends on the last score tier (80 peak, 65 good, 50 moderate, else low, or noData when there is no score) with several variants per tier chosen by `dayOfMonth mod variantCount`; text in `src/hooks/useNotifications.ts`. Reschedule on a preference change and whenever Today gets a usable score (also store `notif_last_score`).
- SCORE THRESHOLD: "Low readiness alert" / "Notified when your score opens below your target", "Alert below" stepper 30 to 90 step 5. Fires when the score is below the threshold, permission granted, not yet fired this session and `notif_threshold_last_date` is not today; schedules a one-off notification 2 s later with payload type `threshold`.
- SMART ALERTS (Pro label): "HRV drop alert" fires when HRV is at least 15% below the baseline, once a day, after 3 s. "Elevated RHR alert" fires when RHR is at least 10% above the baseline, once a day, after 4 s. "3-day decline alert" keeps the last 7 `{date, score}` entries in `notif_score_history` and fires on 3 strictly declining entries, once a day, after 5 s.

The checks run for any user with the toggle on regardless of tier (keep). Tapping a notification just opens the app.

---

## 12. Subscriptions (RevenueCat)

Setup needed by Boban in RevenueCat before the Android app can sell anything: add a Google Play app to the existing project, create the Play subscriptions (monthly and annual, ideally the same base plan ids `monthly` and `yearly`, with a 14-day free trial offer on the annual plan to match iOS), attach them to the `pro` entitlement and to the `$rc_monthly` and `$rc_annual` packages of the `default` offering, and give the developer the Android public SDK key (starts with `goog_`). The Play service-account credentials go into RevenueCat, never into the app.

Client rules:

- Configure RevenueCat once at start with the Android key, anonymous. Listen for customer-info updates.
- When a Supabase user is present, `logIn(supabaseUserId)`; on sign-out `logOut()`. The app user id must be the Supabase user id, because the server checks RevenueCat by that id.
- `isPro = entitlement "pro" active OR trial active`, where trial = now before `created_at + 7 days`. `trialDaysLeft = ceil(remaining / 1 day)`. `tier` is `pro` or `free`. Expose an `identityReady` flag so gated screens do not flash the paywall before RevenueCat has answered.
- The entitlement is not cached on disk; it is re-read on each launch.
- Purchases and restore as in section 5.7. Manage subscription: RevenueCat Customer Center if available, else the Play subscriptions URL.
- Family Sharing is on for the iOS products; RevenueCat treats shared subscriptions as entitled. There is no Play equivalent to configure.

---

## 13. Local storage keys

All keys are prefixed `@readiness/`. Keep the exact names so a future shared debugging path stays sane. Values are strings.

User-scoped keys (wiped when a different account signs in): `onboarding_complete`, `joined_at`, `user_name`, `device_type`, `training_frequency`, `profile_age`, `profile_sex`, `profile_goal`, `profile_height_cm`, `profile_weight_kg`, `profile_photo_uri`, `hrv_baseline`, `rhr_baseline`, `cycle_enabled`, `cycle_entries`, `cycle_length`, `cycle_period_length`, `best_streak`, `strava_access_token`, `strava_refresh_token`, `strava_expires_at`, `strava_athlete_name`, `notif_digest_enabled`, `notif_digest_hour`, `notif_digest_minute`, `notif_threshold_enabled`, `notif_threshold_value`, `notif_threshold_last_date`, `notif_hrv_drop_enabled`, `notif_hrv_drop_last_date`, `notif_rhr_spike_enabled`, `notif_rhr_spike_last_date`, `notif_trend_decline_enabled`, `notif_trend_decline_last_date`, `notif_last_score`, `notif_score_history`, `coach_chat_v1`, `calibration_report_seen`, `free_briefing_last_used`, `trend_v1`.

User-scoped prefixes: `manual_hrv_{date}`, `daily_briefing_v1_{date}`, `briefing_feedback_v1_{date}`, `weekly_report_v1_{week}`, `patterns_v1_{date}`, `ai_v1_`.

Device-global keys: `analytics_daily`, `rating_prompted`, `data_owner_id`.

`syncDataOwner(userId)`: null user does nothing; same owner does nothing; no owner recorded adopts the user without wiping; a different owner removes every user-scoped key and prefix match, clears the in-memory coach session, then records the new owner.

Sign-out does not wipe local data. Delete account wipes everything. Strava tokens and the Supabase session should go in encrypted storage on Android (iOS keeps them in plain AsyncStorage; improve this).

---

## 14. Analytics events

Insert into `app_events` as `{user_id, event, props}`. Needs a session; failures are ignored. `trackDaily` sends at most once per local day per device using `analytics_daily` (a JSON map of event name to date). Props are strings, numbers, booleans or null. Never send raw health values.

| Event | Props | When |
|---|---|---|
| app_open | none, daily | Today mounts |
| onboarding_complete | device, freq, digest (bool), sex or "unset" | end of onboarding |
| score_shown | score (rounded), confidence, pro (bool), daily | usable score shown |
| insufficient_data | none, daily | insufficient card shown |
| briefing_opened | pro (bool) | ring tapped and briefing opened |
| coach_opened | none | chat screen opened |
| paywall_shown | none | paywall opened |
| purchase_success | cycle: "monthly" or "annual" | after purchase |
| restore_success | none | after restore |
| calibration_report_shown | none | modal shown |
| calibration_keep_pro | none | Keep Pro tapped |

Add a `platform: "android"` prop to every event on Android so the dashboard can split the two clients. This is the one intentional deviation from iOS in this document.

---

## 15. Home screen widget (Android, later)

iOS writes `{score, label, recovery, sleep, stress, updatedAt}` to an app group after every score computation and the widget refreshes every 30 minutes. Sizes small (ring, score, uppercase label) and medium (ring left; "READINESS" and three component bars right). Empty state: dash and "Open Readiness". The widget uses its own bands: 80 or more `#4AD97B`, 60 or more amber, 40 or more `#F27D38`, else `#E5484D`, on `#0D0F14`. On Android write the same fields to a shared preferences file the app widget provider reads, and force a widget update after each write.

---

## 16. Theme

Backgrounds: primary `#0D0F14`, secondary `#151820`, tertiary `#1C2030`, elevated `#222840`. Dark theme only; status bar light content; splash background `#0D0F14`.

Amber scale: 50 `#FFF8E7`, 100 `#FDEFC4`, 200 `#FBE099`, 300 `#F8CC60`, 400 `#F5A623` (the accent), 500 `#E08B00`, 600 `#B86E00`, 700 `#8A5000`, 800 `#5C3500`, 900 `#2E1A00`.

Semantic: success `#43A047`, warning `#F5A623`, error `#E53935`, info `#1E88E5`. Score band colours in section 7.7.

Text: primary `#F0F2F8`, secondary `#9BA3B8`, tertiary `#5A6180`, inverse `#0D0F14`, accent `#F5A623`. Borders: subtle `#1F2438`, default `#2A3050`, strong `#404870`.

Type: the system font (iOS declares Inter but never loads it). Sizes xs 11, sm 13, base 15, md 17, lg 20, xl 24, 2xl 30, 3xl 38, 4xl 48, 5xl 64, 6xl 80. Weights 400 / 500 / 600 / 700. Line heights 1.15 / 1.3 / 1.5 / 1.7. Uppercase section labels use letter spacing 2.

Spacing on a 4 pt grid: 0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 36, 40, 48, 56, 64, 80, 96, 128. Radius xs 4, sm 8, md 12, lg 16, xl 24, 2xl 32, full. Screen padding 20 horizontal, 24 vertical. Card gap 12. Amber glow shadow `#F5A623` at 0.35 opacity, radius 20. Durations 100 / 200 / 300 / 500 / 800 ms.

Recurring non-token colours: `#4ADE80` up, `#F87171` down, `#60A5FA` sleep, `#FC4C02` Strava, `#84cc16` calendar "Good".

No haptics are used on iOS.

---

## 17. Known iOS issues: keep or fix

| Issue | Decision for Android |
|---|---|
| Sleep formula gives 58 for an unstaged 7-hour night because deep and REM come back as 0 | Keep (score parity). Fixing it means changing both clients together later. |
| Recovery breakdown row compares HRV with a hard-coded 55 instead of the personal baseline | Fix. Copy only, no score change. |
| History sleep drops stage samples ending at or after 14:00, losing the pre-midnight part of the night | Fix. |
| Today's sleep can pick up an afternoon nap or a stale night | Keep for now; note it. |
| RHR is averaged per day for the baseline but takes the most recent per day in History | Keep. |
| Weekly trend card reads the server before today's score upsert lands, then caches for 30 min | Fix: await the upsert, refresh on pull-to-refresh. |
| Coach screen hides the 402 / 429 messages behind a generic error | Fix. |
| Life-event save failure closes the sheet silently | Fix: show an error. |
| Rating prompt can fire on first launch when `joined_at` is missing | Fix: never arm the rating without a `joined_at`. |
| Briefing function prints sleep efficiency times 100 | Server bug; Boban fixes it. Send 0 to 100. |
| Client free-briefing window is a rolling 7 days, server is an ISO week in UTC | Keep; the server wins and the client shows the 402 message. |
| Trial computed on both sides from `created_at` | Keep; it is intentional. |
| Any workout of 5 minutes or more triggers the moderate forecast penalty | Keep. |
| Strava fetch caps at 30 activities per 28 days | Keep. |
| Strava tokens and session in plain storage | Improve: encrypted storage on Android. |

---

## 18. Acceptance checklist

The Android app is done when all of the following hold:

1. The HRV spike in 2.1 is documented with the record types actually found, and the chosen data source is stated in the README.
2. Every test vector in 6.4, 6.8 and 7.6 passes in a Dart unit test suite committed with the app.
3. A brand-new account goes through sign-up, code confirmation, onboarding, and sees the insufficient-data card, then a score the next morning with a real wearable.
4. The same account signed in on iOS and Android shows the same profile, the same 7-day history from `readiness_scores`, and the same streak.
5. All four AI functions return content on Android during the trial, return the 402 message after the trial without a subscription, and return content again after a sandbox Play purchase; the server logs show tier `pro` for that user.
6. Restore purchases works on a second device with the same Google account.
7. Deep links `readiness://callback` and `readiness://strava-callback` open the app from a cold start and from the background.
8. Strava connect, activity display, load bars and disconnect work.
9. Notifications: digest fires at the chosen time; threshold, HRV, RHR and trend alerts fire once a day at most.
10. Delete account removes the server rows (verified in the Supabase dashboard) and returns the app to the login screen with empty local storage.
11. No em dashes in any user-facing string.
12. Privacy policy at https://thereadiness.app/privacy/ is updated by Boban to mention Health Connect and Google Play before release.

---

## 19. What was verified and what was not

Verified by reading the source on 23 September 2026: sections 4 to 9, 10, 11, 13, 14, 16 and 17 come from the iOS code and the Supabase migrations and functions in the repository, cross-checked against the unit tests for the HRV and score modules.

Verified from the web: Android's HRV record type is RMSSD (Android developer reference); Garmin's Health Connect sharing excludes "HRV status" (Android Central and Yahoo Tech coverage of Garmin's support page, June 2025); a September 2026 report that Garmin's developer program is not taking applications (GitHub issue).

Not verified: whether a Garmin nightly HRV value appears in Health Connect as an RMSSD record (the single most important open question); Health Connect's 30-day history read limit and Play's data-type declaration requirement (from memory, check the Android docs); the Supabase dashboard settings (OTP length, redirect allow-list); whether the 14-day introductory offer exists as configured on the App Store products; the Flutter package names suggested in section 3.
