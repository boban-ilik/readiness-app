# QA: apple-watch-readiness-older-watches (2026-11-20)

## 1. Final status

**Pass.**

Route: writer a5cfabf4dacf3404e, editor ad9b95c27c84b194c, both native claude-fable-5-2, distinct subagents. Guided run: the user approved the angle and competitor set (Checkpoint A) and the outline and title (Checkpoint B) on 2026-11-20. Source presentation automatic: sparse inline links, each used once. Doctrine: bundled snapshot. The prose pass changed two sentences (a doubled word and a vague reference). No fact, number, link, heading, quote or table cell changed. One table cell keeps the spelling "personalized" where the site otherwise uses British spelling; tables are locked after editing, so it stays.

## 2. Claim, route and citation exceptions

- **Table 1 (per-model matrix).** Parsed from the static HTML of Apple's compare page. The orchestrator viewed the rendered page for Series 12, SE 3, Series 11, Series 9, Series 8, Series 7, Series 6 and the first-generation Ultra: every viewed cell matches. SE 2 and first-generation SE rows rest on the parsed capture only (the compare URL did not load those two models by slug).
- **First row, Vitals cell.** Follows Apple's Vitals article (HRV replaces sleep duration); Apple's compare cell lists both. The article says so under the table.
- **Table 2 departs from research section 7 in two cells**, both verified against captures by the editor: Body Insights' free tier adds Fitness Age and Biological Age; Bevel's logos add "among others".
- **Narrowed at edit:** absence claims are scoped to "the pages read"; "each reduce" became "can each reduce"; "typical range" is no longer glossed as "normal".
- **HRV one-line definition** has no capture behind it (general knowledge), left in.
- **Scope held:** no forum HRV counts, no "24x" figure, no claim that older watches cannot run the score, no ranking of apps, no hands-on language. Readiness Coach is named as the site's own app each time, at its real price.
- **Benchmark:** no material exception. The article keeps the shared coverage (models, inputs, bands, updating, setup checks) and adds the per-model matrix, Apple's reason in its own words with what it has not said, three routes, and a symmetric app table.

## 3. Mechanical result

`runtime.py qa edited-before-humanize.md article.md --site-url https://thereadiness.app/blog/apple-watch-readiness-older-watches/`: passed, no reasons. Zero em or en dashes. Frontmatter exactly title, description, pubDate: 2026-11-20. No H1. 23 links, none repeated; 22 return HTTP 200 on 2026-11-20. The 23rd, https://thereadiness.app/blog/whoop-vs-apple-watch/, is the sibling article and goes live in the same deploy.

## 4. Reader-visible limitations

- Demand is small: primary query 150 US searches a month, Ahrefs traffic potential 10. Written for buyer fit.
- Watch prices are Apple's launch prices of 2026-09-09; the article says current store prices were not checked.
- App prices and free tiers are US App Store listings read 2026-11-20 and will drift. Athlytic's and Bevel's free scope is Unknown; Body Insights' is unresolved between its listing and its blog.
- Apple's guide page was captured from a non-US network; the text was identical across three locales.
- stuff.tv, Reddit and YouTube results were not read.
- Nothing was tested hands-on.
- Prose length is about 1,620 words plus two tables, inside the brief's range.
