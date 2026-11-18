# Nerves of Steel: Most Reliable Players Under Pressure

SupeRR Selector Season 2, Round 1 (Rajasthan Royals × Unstop).

An interactive dashboard ranking the **10 most reliable batters and 10 most reliable bowlers under pressure**, built on a Pressure Index that blends win-probability leverage with scoreboard stress.

**Live dashboard:** https://rithikkaa-17.github.io/RR_SUBMISSION_RITHIKKAA/ (once GitHub Pages is enabled)

To view locally, just open `index.html` in a browser; it works offline.

## What's here

| Path | What it is |
|---|---|
| `index.html` | The dashboard (static, no build step) |
| `data/results.js` | Aggregated player ratings and summary stats (no raw ball-by-ball data) |
| `data/chart.umd.js` | Chart.js 4.4.1, bundled so the page works offline |
| `analysis/` | Python pipeline that produces the ratings |
| `report/` | Methodology report (PDF) |

## Method in one paragraph

Each delivery gets a **Pressure Index = (0.5 × Leverage + 0.5 × Scoreboard Stress) × Stakes**. Leverage is the expected swing in win probability from the next ball (gradient-boosted win-probability models, cross-validated by match). Scoreboard Stress mixes stage of innings, required-rate squeeze, collapse in progress and closeness of contest. Knockouts count 1.25×. The top 25% of balls are "pressure balls". Players are rated with a **Clutch Score**: 35% pressure impact (WPA/100 balls), 25% runs above expected, 15% lift vs own baseline, 15% consistency, 10% volume. Small samples are shrunk toward the pool mean, recent seasons weigh more, and associate/A-team games count 0.6. Rank stability is checked with 200 bootstrap resamples.

## Reproduce

The competition data pack is **not** included (competition rules). Place it in a folder and run:

```bash
pip install pandas numpy scikit-learn
python analysis/prep.py "path/to/Data Pack" balls.pkl
python analysis/pressure.py balls.pkl balls2.pkl
python analysis/rate.py balls2.pkl ratings.pkl
python analysis/extras.py balls2.pkl ratings.pkl summary.json
```

## Publish with GitHub Pages

1. Create a new **public** repository on GitHub and upload these files (or `git push`).
2. Repo **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder `/ (root)`. Save.
3. After a minute the dashboard is live at `https://<your-username>.github.io/<repo-name>/`.
