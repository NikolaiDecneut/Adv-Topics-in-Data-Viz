# The Quiet Coup: AMD's Climb in Gaming PCs

A narrative-focused D3 (v7) visualization built for the Week 8 extra-credit
assignment in *Advanced Topics in Data Visualization*.

![Diverging area chart of Intel vs AMD CPU share among Steam gamers, 2014–2026](/interaction.gif)

## Visual & brief description

This is a **diverging stacked area chart** ("battle for market share"). The
plot is split top-to-bottom into the share of surveyed gaming PCs running an
**Intel** CPU (blue, filling from the top) versus an **AMD** CPU (red, filling
from the bottom). Because the two shares are re-normalized to sum to 100%, the
white dividing line between the two areas *is* the data: as it slides downward,
AMD is taking ground from Intel.

The story it tells: in 2014 roughly four out of five gaming PCs ran Intel.
AMD's share then collapsed to a low of about **8% in late 2017** — right as the
first Ryzen processors shipped — before climbing steadily to **~44% by 2026**,
leaving Intel barely above half. It's a clean "change over time" + "intersection"
narrative with a clear protagonist (AMD) and a visible turning point.

Following the Week 8 *"A chart vs. a piece of communication"* idea, the graphic
is built as a finished piece of communication rather than a bare plot:

- a **headline** that states the takeaway ("For a decade, gamers quietly
  switched teams") and a **subhead** that frames the "so what";
- **direct brand labels** with current values on the right edge instead of a
  legend;
- a **turning-point annotation** marking AMD's 2017 low and the Ryzen launch,
  so the audience sees the *why* behind the shape;
- a short **"How to read this"** + **data/methods** note for authority and
  credibility.

## Interaction

Hovering anywhere on the chart reveals a dashed vertical guideline, a dot on the
Intel/AMD boundary, and a tooltip with the exact Intel and AMD share for the
nearest month. This supports a "near view" reading of precise monthly numbers on
top of the "far view" story told by the overall shape.


## Files

| File | Purpose |
|------|---------|
| `index.html` | Page scaffold: D3 v7 from CDN, headline/subhead/dek, methods + source, mount point for the chart. |
| `main.js` | Loads the CSV, builds scales, draws the two `d3.area()` paths and the dividing line, axes, direct labels, the annotation, and the hover interaction. |
| `style.css` | Editorial "data journalism" styling (Source Sans 3), brand colors, tooltip, annotation, responsive layout. |
| `cpu_market_share.csv` | Cleaned dataset used by the chart (see below). |
| `img/` | Static screenshots, chart crop, and the interaction GIF. |

## Data

**Source.** Valve Corporation. "Steam Hardware & Software Survey." Steam, 2026.
Accessed June 2026. https://store.steampowered.com/hwsurvey/.

The Steam Hardware Survey is a monthly, opt-in census of the hardware inside
participating players' PCs. This visualization uses the **CPU vendor share**
(Intel vs. AMD) from January 2014 through April 2026.

## References & assistance

- **D3 v7 API** — Observable, *D3 by Observable*, https://d3js.org/. Used for
  `d3.scaleTime`, `d3.scaleLinear`, `d3.area`, `d3.line`, axes, and `d3.bisector`.
- **D3 Graph Gallery** (v6 examples only, adapted to v7) — Yan Holtz,
  https://d3-graph-gallery.com/. Stacked-area and "connected scatter / line with
  hover" examples were used as structural baselines, then rewritten for v7 and
  for this diverging two-area layout and its annotations.
- **D3 Force overview** — reviewed per the assignment
  (https://d3js.org/d3-force) but not used in this chart.

All code is my own: comments throughout `main.js` document my understanding of
each step, and the layout, narrative text, colors, annotation, and interaction
were tailored specifically to this dataset and story.

## Running locally

The chart loads the CSV with `fetch`, so it must be served over HTTP (opening
`index.html` directly with `file://` will be blocked by the browser):

```bash
cd d3_cpu_battle
python3 -m http.server 8000
# then open http://localhost:8000
```

When published via GitHub Pages, it works without any extra setup.
