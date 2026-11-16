# Plan: app redesign (ships as 1.3)

**Decided:** 10 November 2026, after the /clarify interview and the approved mock.
**Mock:** https://claude.ai/artifact/6b8JugoBTnn7NT8io65Z6t (Today, score detail, paywall).
**Goal:** Pro conversion. Day-7 retention is the leading indicator from the Today redesign (plans/today-redesign.md); this release is about making the app feel worth paying for and putting the lock where users are most curious.
**Direction:** Oura structure, Whoop numbers. Our palette stays; the type, surfaces and hierarchy change.

## Decisions

1. Type: Archivo for numerals and headings (condensed for the big numerals), the system font for body text. Loaded with expo-font at app start; if the font fails to load the app renders in the system font rather than blocking.
2. Surfaces: one background (#0D0F14). Sections are flat, separated by spacing and 11 pt uppercase labels. Cards (#151820, radius 16, 1 pt #1F2438 border) only where something is tappable or needs attention: the alert, the plan rows, the paywall options, the locked insight.
3. Score: ring with stroke 8 and an 84 pt condensed numeral; the label ("Good to Go") under the number. Breakdown rows get a thin 34 to 36 pt arc per component instead of a bar, with a 28 pt Archivo number on the right.
4. Screens in scope: Today, score detail (the per-component sheet), paywall. History, Profile, onboarding and settings keep today's components but inherit the new tokens where they already use them.
5. Score detail opens for every user (free users used to be sent straight to the paywall from the breakdown rows) and ends with a locked "why it moved" block for free users: an amber "Read the full insight" button that opens the paywall. The intended teaser is the first line and a half of the real AI insight, the rest blurred; it must never be a canned sentence. Until the server allows free users one real insight, the block carries honest copy about what is behind the lock and no sample text.
6. Paywall: headline "Know why the number moved, not just that it did.", the existing four feature rows, three plan cards with Annual selected and a "14 days free" badge, trial button, footer links. Prices and copy unchanged from app/paywall.tsx.
7. Colours unchanged: amber accent, score greens and oranges, text greys. No em dashes anywhere in copy.

## Order of work

1. Tokens (this step): expo-font loading in app/_layout.tsx; `fontFamily` in src/constants/theme.ts points at the loaded Archivo faces; add the sizes the mock needs (11 and 84) and `typography` presets (label, display numeral, row numeral, heading) plus a `surface` preset (card background, border, radius) that screens consume in step 2. Nothing visible changes yet except where a preset is adopted.
2. Today: ring and numeral, breakdown arcs, flat sections with labels, plan card and This Week row restyled. Logic and ordering from the 1.2.1 redesign stay.
3. Score detail: new layout per the mock, locked insight block (honest copy until the backend allowance exists).
4. Paywall: restyle per the mock.
5. tsc, eslint, jest green; TestFlight build; Boban checks free and Pro on a device; submit as 1.3 on his word.

## Out of scope

New features beyond the locked insight; changes to the score model or copy of the briefing; Profile and Coach layouts; Android.

History was added to scope on 2026-11-16 at Boban's request, after build 84. It follows decisions 1, 2 and 7: flat chart, stats and daily log, Archivo numerals, no emoji, cards only for the weekly report entry, the calendar day detail and the upgrade gate. The upgrade gate (ProGate) is shared with Profile, so the notifications gate there changed with it. No mock was made for History; it was built straight from the locked rules.

Profile and Coach got a light pass the same day, after build 85: Archivo titles, icons and words in place of emoji, the card token on Profile, and no fixed price on the Profile upgrade button. Their layouts are unchanged.

## Open

- Archivo widths: the mock uses the variable font at 75 to 85 percent width. React Native needs static faces, so the condensed numeral uses Archivo Narrow Bold and headings use Archivo Bold or SemiBold. Confirm on device that the pairing reads as one family.
- The real teaser (decision 5) needs a backend change: supabase/functions/ai-insight gates with `dailyCap: 40` and no `freeWeeklyAllowance`, so a free call returns 402. Add an allowance (one call per component per week, or a teaser mode that returns the first sentence only), measure the Claude cost per free user, then swap the block's copy for the blurred teaser. Not done in 1.3 step 3; shipping without it is fine.
- The Today ring colours its arc by interpolating along the score, while the numeral and label use the stepped score colour. At 58 the arc reads green and the number orange. Decide whether the ring should use the stepped colour too.
