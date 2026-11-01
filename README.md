# arguelabs.in

Personal blog. Hugo static site, deployed to GitHub Pages on every push to `main`.

- New post: add `content/blog/<section>/<slug>/index.md` (front matter: title, date, description, cover). URL becomes `arguelabs.in/blog/<section>/<slug>/`.
- Preview locally: `hugo server -D` then open http://localhost:1313, or `python3 scripts/preview.py` and open `preview/index.html`.
- Drafts: set `draft: true` in front matter (not published). Note the repo is public, so committed drafts are visible on GitHub.

## The "Margin" layout

Every page uses the same three columns: **the number · the text · the source**.

- Each `##` section of a post gets a label in the left margin (section number, title, minutes). No markup needed.
- Chart sources (`{{< chart ... source="..." >}}`) sit in the right margin on wide screens.
- `lastmod:` in front matter shows "updated <date>" on the post and in lists.

### Claims (optional)

Long finance posts can open with their claims. Each claim leads with the one number that carries it, then 2–3 sentences, then evidence (charts from the post's folder) and sources. The full analysis follows below as usual. Posts without `claims` render as plain articles.

```yaml
hide_sections: ["the-answer-in-one-minute"]   # optional: h2 ids the claims replace
claims:
  - figure: "₹3.08 lakh cr"                    # short; the last word won't wrap on its own
    figure_note: "sold by foreign investors in 2026 so far"
    title: "Foreigners are selling and Indian funds are buying."
    text: "Two or three sentences. Markdown is fine."
    evidence: ["a01-fpi-monthly.svg"]           # files in this post's folder (.svg charts or images)
    sources: ["NSDL depositories data via PTI"]
    section: "the-flow-picture"                 # id of the matching ## heading (lowercase, hyphens)
```

Fonts: Atkinson Hyperlegible Next and Mono, self-hosted in `static/fonts` (SIL OFL 1.1).
