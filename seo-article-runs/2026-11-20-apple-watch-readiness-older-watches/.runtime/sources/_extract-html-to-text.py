#!/usr/bin/env python3
"""Deterministic HTML -> Markdown-ish text extractor (no model involved).
usage: h2md.py <html> [css-selector-for-root]
Keeps headings, paragraphs, lists, tables, links (as [text](href)) and image refs.
Drops script/style/nav/footer/aside/form/svg/noscript.
"""
import sys, re
from bs4 import BeautifulSoup, NavigableString, Tag

DROP = {"script", "style", "nav", "footer", "aside", "form", "svg", "noscript", "iframe", "button", "template", "header"}


def inline(node):
    out = []
    for c in node.children:
        if isinstance(c, NavigableString):
            out.append(str(c))
        elif isinstance(c, Tag):
            if c.name in DROP and c.name != "header":
                continue
            if c.name == "a":
                t = inline(c).strip()
                h = c.get("href", "")
                if t and h and not h.startswith("javascript"):
                    out.append("[%s](%s)" % (t, h))
                else:
                    out.append(t)
            elif c.name in ("strong", "b"):
                t = inline(c).strip()
                out.append("**%s**" % t if t else "")
            elif c.name in ("em", "i"):
                t = inline(c).strip()
                out.append("*%s*" % t if t else "")
            elif c.name == "br":
                out.append("\n")
            elif c.name == "img":
                out.append("![%s](%s)" % (c.get("alt", ""), c.get("src", c.get("data-src", ""))))
            else:
                out.append(inline(c))
    return re.sub(r"[ \t\r\f\v]+", " ", "".join(out))


BLOCK = {"p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "ul", "ol", "table", "blockquote", "pre", "div", "section", "article", "main", "figure", "figcaption", "dl", "dt", "dd", "tr", "td", "th", "thead", "tbody", "body", "html", "header", "details", "summary", "span", "picture"}


def has_block_child(node):
    for c in node.children:
        if isinstance(c, Tag) and c.name in {"p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "table", "blockquote", "pre", "div", "section", "article", "figure", "dl", "details", "li"}:
            return True
    return False


def walk(node, lines, depth=0):
    for c in node.children:
        if isinstance(c, NavigableString):
            t = str(c).strip()
            if t:
                lines.append(re.sub(r"\s+", " ", t))
            continue
        if not isinstance(c, Tag):
            continue
        n = c.name
        if n in DROP:
            continue
        if re.match(r"h[1-6]$", n):
            t = inline(c).strip()
            if t:
                lines.append("")
                lines.append("#" * int(n[1]) + " " + t)
                lines.append("")
        elif n == "p" or n in ("figcaption", "dt", "dd", "summary"):
            if has_block_child(c):
                walk(c, lines, depth)
            else:
                t = inline(c).strip()
                if t:
                    lines.append(t)
                    lines.append("")
        elif n in ("ul", "ol"):
            i = 0
            for li in c.find_all("li", recursive=False):
                i += 1
                bullet = "%d." % i if n == "ol" else "-"
                if has_block_child(li):
                    sub = []
                    walk(li, sub, depth + 1)
                    sub = [s for s in sub if s.strip()]
                    if sub:
                        lines.append("  " * depth + bullet + " " + sub[0])
                        for s in sub[1:]:
                            lines.append("  " * (depth + 1) + s)
                else:
                    t = inline(li).strip()
                    if t:
                        lines.append("  " * depth + bullet + " " + t)
            lines.append("")
        elif n == "table":
            for tr in c.find_all("tr"):
                cells = [re.sub(r"\s+", " ", inline(td)).strip() for td in tr.find_all(["td", "th"])]
                if any(cells):
                    lines.append("| " + " | ".join(cells) + " |")
            lines.append("")
        elif n == "blockquote":
            sub = []
            walk(c, sub, depth)
            for s in sub:
                if s.strip():
                    lines.append("> " + s)
            lines.append("")
        elif n == "pre":
            lines.append("```")
            lines.append(c.get_text())
            lines.append("```")
        elif n == "img":
            lines.append("![%s](%s)" % (c.get("alt", ""), c.get("src", c.get("data-src", ""))))
        elif n in ("div", "section", "article", "main", "figure", "body", "html", "details", "dl", "span", "picture", "a", "strong", "em", "b", "i", "time", "label", "center", "font", "small", "address"):
            if has_block_child(c) or n in ("section", "article", "main", "figure", "body", "html", "details", "dl", "picture"):
                walk(c, lines, depth)
            else:
                t = inline(c).strip()
                if t:
                    lines.append(t)
                    lines.append("")
        else:
            walk(c, lines, depth)


def main():
    html = open(sys.argv[1], encoding="utf-8", errors="replace").read()
    soup = BeautifulSoup(html, "lxml")
    root = soup
    if len(sys.argv) > 2:
        sel = soup.select(sys.argv[2])
        if not sel:
            sys.stderr.write("selector not found: %s\n" % sys.argv[2])
            sys.exit(2)
        root = sel[0]
    else:
        root = soup.body or soup
    lines = []
    walk(root, lines)
    text = "\n".join(lines)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    print(text)


if __name__ == "__main__":
    main()
