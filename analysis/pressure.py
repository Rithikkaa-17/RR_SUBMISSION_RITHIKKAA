"""Step 2: blend WP Leverage with a Scoreboard Stress Index -> final Pressure Index."""
import sys, numpy as np, pandas as pd
b = pd.read_pickle(sys.argv[1])
g = b.groupby(["match_id", "innings"])
# wickets in previous 18 legal-ish deliveries (rolling over rows, excluding current)
b["wk_last18"] = g.is_wicket.transform(lambda s: s.astype(int).shift(1).rolling(18, min_periods=1).sum()).fillna(0)
collapse = (b.wk_last18 / 3).clip(0, 1)
stage = np.select([b.legal_before >= 90, b.legal_before >= 36], [1.0, 0.3], 0.2)
squeeze = np.where((b.innings == 2) & (b.runs_needed > 0),
                   ((b.rrr - b.crr.where(b.legal_before >= 12, 8)) / 6).clip(0, 1), 0)
squeeze = np.where(b.innings == 2, np.maximum(squeeze, ((b.rrr - 7) / 7).clip(0, 1)) * (b.wp_now > 0.03), 0)
close = 1 - np.abs(2 * b.wp_now - 1)
b["c_collapse"], b["c_stage"], b["c_squeeze"], b["c_close"] = collapse, stage, squeeze, close
ssi = (collapse + stage + squeeze + close) / 4
b["SSI"] = ssi / ssi[b.legal].mean()
b["PI"] = (0.5 * b.LI + 0.5 * b.SSI) * b.importance
thr = b.loc[b.legal, "PI"].quantile(0.75)
b["pressure"] = b.PI >= thr
print("threshold", round(thr, 3))
print(b.groupby(["innings", "phase"], observed=True).pressure.mean().round(3))
L = b[b.legal]
print("League SR pressure vs normal:", round(L[L.pressure].bat_runs.mean()*100, 1), round(L[~L.pressure].bat_runs.mean()*100, 1))
print("League wkt% pressure vs normal:", round(L[L.pressure].is_wicket.mean()*100, 2), round(L[~L.pressure].is_wicket.mean()*100, 2))
print("Mean |WPA| pressure vs normal:", round(L[L.pressure].wpa_bat.abs().mean(), 4), round(L[~L.pressure].wpa_bat.abs().mean(), 4))
b.to_pickle(sys.argv[2])
