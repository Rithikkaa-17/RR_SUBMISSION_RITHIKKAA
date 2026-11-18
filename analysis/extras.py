"""Step 4: summary numbers + chart data + split-half reliability."""
import sys, json, numpy as np, pandas as pd
sys.argv_ = sys.argv
b = pd.read_pickle(sys.argv[1]); r = pd.read_pickle(sys.argv[2]); OUT = sys.argv[3]
L = b[b.legal]
out = {}
out["n_matches"] = int(b.match_id.nunique()); out["n_balls"] = int(len(b)); out["n_legal"] = int(len(L))
out["n_ipl_matches"] = int(b[b.is_ipl == 1].match_id.nunique())
out["threshold"] = float(L.PI.quantile(0.75))
P, N = L[L.pressure], L[~L.pressure]
out["league"] = {"SR_p": P.bat_runs.mean()*100, "SR_n": N.bat_runs.mean()*100,
                 "wkt_p": P.is_wicket.mean()*100, "wkt_n": N.is_wicket.mean()*100,
                 "dot_p": (P.total_runs == 0).mean()*100, "dot_n": (N.total_runs == 0).mean()*100,
                 "bnd_p": (P.is_four | P.is_six).mean()*100, "bnd_n": (N.is_four | N.is_six).mean()*100,
                 "wpa_p": P.wpa_bat.abs().mean(), "wpa_n": N.wpa_bat.abs().mean()}
out["share_by_over"] = {f"inn{i}": [float(L[(L.innings == i) & (L.over_no == o)].pressure.mean()*100) for o in range(1, 21)] for i in [1, 2]}
# share of total |WPA| captured by pressure balls
out["wpa_share_pressure"] = float(P.wpa_bat.abs().sum() / L.wpa_bat.abs().sum() * 100)
json.dump(out, open(OUT, "w"), default=float)
print(json.dumps(out, indent=1, default=float)[:1500])
