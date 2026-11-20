# QA: whoop-vs-apple-watch (2026-11-20)

## 1. Final status

**Pass.**

Route: writer a5315c810dad3b9a6, editor a777011d0007b88f0, both native claude-fable-5-2, distinct subagents. Guided run: the user chose the target query, approved the angle and competitor set (Checkpoint A) and the outline and title (Checkpoint B) on 2026-11-20. Source presentation automatic: sparse inline links, each used once. Doctrine: bundled snapshot. The prose pass changed three sentences (an ambiguous "one", a "do not, not" stumble, one passive made active). No fact, number, link, heading, quote or table cell changed.

## 2. Claim, route and citation exceptions

- **Supplementary evidence S1** (Whoop "Canceling Your Membership", captured by the orchestrator in the user's Chrome after research was locked) supports what ends with a membership, the 30-day return window, the 12-month commitment and the $110 trial restocking fee.
- **Corrected at edit:** Athlytic's trial changed from Unknown to "1 week free" per its listing capture, a departure from the brief. "Not applicable" is attributed to Apple's SE 3 product page; it may be assistive text behind a dash. Table A's score row narrowed to "recovery or readiness" because the SE 3 lists a sleep score.
- **Accuracy section:** Miller 2022 and Schyvens 2025 point in opposite directions; Apple's September 2026 heart-rate study is vendor-run and stated without magnitudes. The kappa gloss and "not peer reviewed" are the ledger's wording, not capture quotes. The WHOOP 5 one-second logging interval comes from a page-image reading of Apple's methods table.
- **Out of every verdict, and named as unsettled:** which daily score is better, sleep-stage, heart-rate and HRV accuracy, Strain against training load, AI coaching quality, Apple's trial and return terms.
- **Publisher's app:** one section, disclosed in its first sentence, real prices, stated as not the low-cost pick, and not suggested for Whoop wearers.
- **Cost table:** every figure recomputed by the editor and the orchestrator.
- **Benchmark:** no material exception. Adds the model split, like-for-like buying fields, shown cost arithmetic, what ends with the membership, and primary accuracy studies, none of which the three ranking pages provide.

## 3. Mechanical result

`runtime.py qa edited-before-humanize.md article.md --site-url https://thereadiness.app/blog/whoop-vs-apple-watch/`: passed, no reasons. Zero em or en dashes. Frontmatter exactly title, description, pubDate: 2026-11-20. No H1. 21 links, none repeated. On 2026-11-20, 17 return HTTP 200; whoop.com/us/en/membership returns 403 to curl and loads in a browser; the two DOI links redirect to the right papers at academic.oup.com and mdpi.com, which refuse curl; the sibling article link goes live in the same deploy.

## 4. Reader-visible limitations

- Nothing was tested hands-on; the ranking pages are all hands-on reviews.
- Prices and offers were read on 2026-11-20 and will move: Whoop's limited-time prices show no end date and Apple's gift card offer runs 27 to 30 November 2026. Captures were made from a non-US network on US-path pages.
- Whoop's 24-month price, Apple's return terms and cellular prices, and the free scope of Athlytic and Bevel are Unknown. Bevel's listing mentions weekly or yearly billing while its purchase list shows monthly and annual.
- Reddit results, including the megathread at position 3, and the video results were not read.
- Length is about 3,230 words including tables, roughly 125 over the brief's ceiling; the remainder is required coverage and five tables.
