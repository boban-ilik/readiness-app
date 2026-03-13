# Privacy Policy — Readiness: AI Training Coach

**Effective date:** March 2026
**Developer:** Boban Ilikj
**Contact:** boban.ilik08@gmail.com
**App:** Readiness: AI Training Coach
**Bundle ID:** com.bobanilikj.readiness

---

## Overview

Readiness is a health and fitness app that uses data from your Apple Watch and iPhone to compute a daily readiness score and provide personalised coaching. We take your health data seriously. This policy explains exactly what we collect, why, how it's stored, and what rights you have.

---

## 1. What Data We Collect

### 1.1 Health Data (from Apple HealthKit)
With your permission, Readiness reads the following data types from Apple HealthKit:

- Heart rate variability (HRV)
- Resting heart rate
- Sleep analysis (duration, efficiency, sleep stages — deep, REM, core)
- Stress / Heart Rate Variability SDNN
- Daytime average heart rate
- Step count
- Workout sessions (type, duration, calories, heart rate zones)

**This data is read from your device and processed locally and on our servers solely to generate your readiness score and coaching insights. We do not sell this data. We do not share it with advertisers.**

### 1.2 Account Data
When you create an account, we collect:

- Email address
- Display name (optional)
- Profile photo (optional, stored on our servers)

### 1.3 User-Generated Data
Data you create inside the app:

- Life event tags (e.g. alcohol, illness, travel) and optional notes
- Coach chat messages and conversation history
- Briefing feedback ratings (helpful / not helpful)

### 1.4 Usage Data
We collect basic usage analytics:

- App sessions and feature usage (to improve the product)
- Crash reports and error logs (to fix bugs)

We do **not** collect advertising identifiers or use any third-party ad networks.

---

## 2. How We Use Your Data

| Purpose | Data Used |
|---|---|
| Compute your daily readiness score | HealthKit data |
| Generate your AI daily briefing | HealthKit data, life events, feedback |
| Power the AI coach chat | HealthKit data, life events, chat history |
| Store your history and preferences | All account and health data |
| Improve the app | Anonymised usage and crash data |

---

## 3. Third-Party Services

### Supabase
We use Supabase (supabase.com) as our database and authentication provider. Your account data, life events, and chat history are stored in Supabase's cloud infrastructure. Supabase is SOC 2 Type II certified. Data is stored in the EU-West-1 (Ireland) region by default.

Supabase privacy policy: https://supabase.com/privacy

### Anthropic (Claude AI)
Your health data and life events are sent to Anthropic's API (anthropic.com) to generate your daily briefing and coach chat responses. Data sent to Anthropic is used solely to generate your response and is not used to train their models under their standard API terms.

Anthropic privacy policy: https://www.anthropic.com/privacy

### Apple HealthKit
Health data is accessed via Apple HealthKit on your device. We do not share HealthKit data with any third party other than Anthropic (as described above) for the sole purpose of generating your coaching content.

Pursuant to Apple's guidelines: **HealthKit data will not be used for advertising or with data brokers.**

---

## 4. Data Retention

| Data Type | Retention Period |
|---|---|
| Account data | Until account deletion |
| Health data (scores, history) | Until account deletion |
| Life events and notes | Until account deletion or manual deletion in-app |
| Coach chat history | Until account deletion or manual clearing in-app |
| Briefing feedback | Until account deletion |
| Anonymised analytics | Up to 24 months |

---

## 5. Data Security

- All data is transmitted over HTTPS/TLS
- Supabase database access is protected by Row Level Security (RLS) — you can only access your own data
- Passwords are never stored in plain text (handled by Supabase Auth)
- Profile photos are stored in a private Supabase Storage bucket — not publicly accessible

---

## 6. Your Rights

You have the right to:

- **Access** all data we hold about you
- **Export** your data (contact us at the email below)
- **Delete** your account and all associated data at any time — go to Profile → Delete Account, or email us
- **Withdraw** HealthKit permissions at any time via iOS Settings → Privacy & Security → Health → Readiness

Deleting your account permanently removes all your data from our servers within 30 days.

---

## 7. Children's Privacy

Readiness is not directed at children under 13. We do not knowingly collect personal data from children under 13. If you believe a child has provided us with personal data, please contact us and we will delete it.

---

## 8. Changes to This Policy

If we make material changes to this policy, we will notify you via in-app notification and update the effective date at the top of this document. Continued use of the app after changes take effect constitutes acceptance of the updated policy.

---

## 9. Contact

If you have questions about this privacy policy or want to exercise your data rights:

**Email:** boban.ilik08@gmail.com
**App:** Readiness: AI Training Coach
**Response time:** Within 7 business days

---

*This privacy policy applies to the iOS version of Readiness. An Android version, if released, will have its own updated policy.*
