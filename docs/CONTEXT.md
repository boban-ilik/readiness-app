# Readiness App — Project Context

## What We're Building
A mobile app called **Readiness** — tagline "Know before you go."
Daily AI-powered readiness score (0-100) for general fitness 
enthusiasts using Apple Watch and/or Garmin.

## Key Decisions Made
- Name: Readiness
- Tagline: "Know before you go."
- Target user: General fitness enthusiasts
- Personality: Smart & witty — like a brilliant friend with a 
  sports science PhD
- Design: Dark mode, amber/gold accent (#F5A623), near-black bg (#0D0F14)
- Platform: React Native (Expo), iOS first
- Backend: Supabase (schema in supabase_schema.sql)
- Payments: RevenueCat
- AI: Anthropic Claude API (prompt engine in claude_prompt_engine.js)
- Score algorithm: See readiness_algorithm.js

## Monetization
- Free: Score number only, no explanation
- Pro: $4.99/month or $49.99/year — full AI explanation + tip + 
  weekly report + history

## Tech Stack
React Native (Expo) + TypeScript
Supabase (auth + database)
HealthKit (Apple Watch)
Garmin Health API
RevenueCat (subscriptions)
Claude API (AI insights)
Victory Native (charts)

## Score Algorithm
45% Recovery (HRV vs baseline + resting HR)
40% Sleep (duration + deep + REM + efficiency)
15% Stress (inverted stress score)
+ lifestyle modifiers from journal tags

## Current Status
✅ Market research done
✅ Brand identity defined
✅ Supabase schema designed
✅ Readiness algorithm written
✅ Claude prompt engine written
⬜ Expo project initialized
⬜ Folder structure created
⬜ Design tokens (theme.ts) created
⬜ Auth flow built
⬜ Home screen built
⬜ HealthKit integration
⬜ Garmin API integration
```

---

### Step 4 — Point Cowork at Your Folder

Start by downloading the desktop app and selecting Cowork mode. Then describe your task and grant access to relevant folders. Before taking action, Claude generates a step-by-step plan showing how it intends to complete the work — you can approve the plan, adjust it, or cancel it entirely. 

When you open Cowork, your first message should be something like:

> *"I'm building a React Native app called Readiness. Read the CONTEXT.md file in this folder to understand the full project. We're ready to initialize the Expo project and build the first screens. Start by setting up the folder structure and creating the theme.ts design tokens file."*

---

### Step 5 — One Important Limitation to Know

Cowork stores conversation history locally on your computer, so it is not subject to Anthropic's data retention timeframe.  This means our chat history here won't automatically carry over — which is exactly why the `CONTEXT.md` file is so critical. It's your project's memory that persists across every Cowork session.

---

## ✅ Your Transition Checklist
```
□ Download Claude Desktop app
□ Verify you're on a paid plan (Pro or above)
□ Enable Cowork in Settings → Features
□ Create readiness-app/ folder on your machine
□ Copy the 3 files we built today into docs/
□ Create CONTEXT.md with the content above
□ Open Cowork, point it at readiness-app/
□ First prompt: "Read CONTEXT.md and let's build"