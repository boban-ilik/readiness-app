# QA: whoop-vs-apple-watch, revision r1 (2026-11-20)

## 1. Final status

**Pass.** This revision supersedes run 2026-11-20-whoop-vs-apple-watch and is the published text.

Route: writer a5315c810dad3b9a6 (inherited draft), editor af45b6e999fa8207f (fresh subagent for this revision), both native claude-fable-5-2. Research, brief and draft are inherited unchanged from the parent run. The base text is the parent run's accepted article, already through the prose pass.

## 2. What changed, and why

One correction in three places (opening paragraph, the decision-table row for the SE 3 and older watches, and the SE 3 section). The parent article quoted Apple's SE 3 product page as marking the Readiness app "not applicable". On the live page, viewed by the orchestrator on 2026-11-20, the visible cell is a dash; "Readiness app not applicable" is visually hidden text for screen readers. The capture `apple-product-se.md` shows the same pattern. The three passages now say the SE 3 page shows a dash for the app. Every other line is byte-identical to the parent article (diff: three changed lines).

The prose pass made no further change: the three replacement sentences are plain and short, and the rest had already passed it.

All other claim, route and citation notes in the parent run's qa.md still apply: supplementary evidence S1; Athlytic's trial corrected to "1 week free"; accuracy studies stated with their limits and kept out of every verdict; the publisher's app in one disclosed section at its real price; cost table recomputed.

## 3. Mechanical result

`runtime.py qa edited-before-humanize.md article.md --site-url https://thereadiness.app/blog/whoop-vs-apple-watch/`: passed, no reasons. Zero em or en dashes. Frontmatter exactly title, description, pubDate: 2026-11-20. No H1. 21 links, none repeated, unchanged from the parent run's link check.

## 4. Reader-visible limitations

Unchanged from the parent run: nothing tested hands-on; prices and offers read on 2026-11-20 and will move (Apple's gift card offer ends 30 November 2026); Whoop's 24-month price, Apple's return terms and the free scope of Athlytic and Bevel are Unknown; Reddit and video results unread; length about 3,230 words including tables.
