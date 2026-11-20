# Revision r1: one correction (orchestrator, 2026-11-20)

Finding: the completed article quotes Apple's SE 3 product page as marking the Readiness app "not applicable" (opening paragraph, decision table row "Apple Watch SE 3 or older", and the SE 3 section). On the live page https://www.apple.com/apple-watch-se-3/ (viewed in the user's Chrome, 2026-11-20) the visible cell is a dash. The words "Readiness app not applicable" sit in a `span.visuallyhidden` (1 by 1 pixel, clipped) for screen readers. The capture `apple-product-se.md` in the parent run shows the same pattern: a line with a dash, then "Readiness app not applicable". A reader who opens Apple's page will not see the quoted words.

Required change: in all three places, stop presenting "not applicable" as visible, quoted text. Say what the evidence supports: Apple lists its Readiness app for the Series 12 and Ultra 4 (E12), and its SE 3 product page shows a dash for the Readiness app (capture `apple-product-se.md`; live page as above). Do not add a link. Do not change anything else.

Base text: the parent run's accepted final article, `seo-article-runs/2026-11-20-whoop-vs-apple-watch/article.md` (already through the prose pass and QA). Everything outside the three passages stays byte-identical.
