# QA: how to increase HRV (run 2026-09-25-how-to-improve-hrv)

## 1. Final status

**Pass.** A reader can tell whether a low number is low for them, size the likely dip, choose one or two baseline changes with an honest time frame, tell in-session effects from baseline change, and run a four-week check with three failure branches. All ten brief acceptance checks (section 7) hold in `article.md`, and it still beats the three frozen captures on sizes, source checks and verification.

Route: native editor subagent (claude-opus-5-5), fresh context, separate from the writer; the orchestrator records identities. Doctrine snapshot `8a473bcf…`, bundled profile, source presentation automatic (sparse inline links to primary sources).

## 2. Claim, link and citation exceptions (fixed in edit)

- **Duplicate internal links.** The draft linked `/blog/what-is-a-good-hrv/` three times and `/blog/hrv-training/` twice. The gate fails duplicates, and the extra links repeated jobs the first one already did. Each is now linked once (good-HRV guide in Step 1, training guide in the close); later mentions point back in words.
- **E7 scope.** "Significantly smaller responses in older people" was about RR interval (heart rate), not HRV. Now: heart rate responded significantly less, with a similar trend for HRV.
- **Prevalence and superlatives removed or narrowed:** "Most low weeks have an ordinary cause"; "the part the internet oversells on speed"; "the step most plans skip" (competitors do cover tracking); "more than most pages do" (Polar); "several authors" (E5 gives no count). "Best-supported" training is limited to "of the levers covered here". A noise claim widened beyond E10's athlete scope was rescoped.
- **In-session versus baseline.** "Neither has been shown to raise your baseline" clashed with E14's post-programme lab effects; it now refers to the overnight or waking number. The Apple Breathe line says "may be". Breathing's benefit is sourced to E15's mood finding.
- **Labels.** "Weeks to months" is marked as a reading of trial lengths; the table cell now says "over weeks". The training rule is labelled a judgment, not a trial result.
- **Sibling duplication.** The worked example and CTA nearly repeated `/blog/what-is-a-good-hrv/`. The example now keeps only what the four-week check needs; the CTA is rewritten.
- RMSSD and vagal HRV are explained on first use.

No material claim was removed for lack of evidence. The 40 ms / 34 ms scoring illustration was cut as sibling duplication. Every number traces to E1 to E41, including the orchestrator-verified NIAAA 14 g figure (E40).

## 3. Mechanical result

`runtime.py qa` with `--site-url https://thereadiness.app/blog/how-to-increase-hrv/`: passed (19 links, 19 unique, no self-links; headings, tables, URLs, numbers and entities preserved). No em or en dashes; ranges use "to".

## 4. Reader-visible limitations and human review

- **Title.** The owner chose "How to increase HRV: what raises it, what lowers it, and by how much". It now matches the body, which gives sizes for what lowers HRV and says no millisecond figure exists for raising it.
- The 12% wobble figure is from short morning recordings in athletes (E10); overnight wobble is unknown, and the article says so.
- E14 effect sizes and abstract-only sources (E7, E11, E18, E20, E22) are used for direction and headline figures only.
- Before publishing, verify that 1.0.3 is still unreleased (cycle-phase baselines are omitted), that E36's 30-day window is current (not re-verified line by line), and the pubDate.
- Product flag, not in the article: morning Breathe sessions may feed the app's overnight HRV mean (E35).
- Owner change: `/blog/hrv-training/` "Raising your baseline HRV" should link here after publication, and it contains an en dash (research §9).
