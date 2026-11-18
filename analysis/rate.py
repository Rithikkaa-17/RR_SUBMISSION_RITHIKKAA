"""Step 3: player ratings (Clutch Score) for batters and bowlers + bootstrap rank stability."""
import sys, json, numpy as np, pandas as pd
b = pd.read_pickle(sys.argv[1]); OUT = sys.argv[2]
b["season"] = pd.to_datetime(b.match_date).dt.year
rng = np.random.default_rng(7)
REC = {2022: 0.6, 2023: 0.7, 2024: 0.8, 2025: 0.9, 2026: 1.0}
b["w"] = b.season.map(REC).fillna(0.6) * b.quality_w
b["wkb"] = pd.cut(b.wkts_before, [-1, 2, 5, 10], labels=["0-2", "3-5", "6+"])
WV = 8.0  # run value of a wicket in T20
L = b[b.legal].copy()
key = ["innings", "phase", "wkb", "is_ipl", "pressure"]
exp = L.groupby(key, observed=True).agg(e_bat=("bat_runs", "mean"), e_out=("striker_out", "mean"),
                                         e_bowl=("bowl_runs", "mean"), e_bw=("bowler_wkt", "mean")).reset_index()
b = b.merge(exp, on=key, how="left")
# bowler: illegal balls are a pure cost (runs conceded, no ball used)
for c_ in ["e_bat", "e_out", "e_bowl", "e_bw"]:
    b[c_] = np.where(b.legal, b[c_], 0)
b["wpa_bowl"] = -b.wpa_bat
b["active"] = b.season >= 2026

def build(role):
    if role == "bat":
        d = b[b.legal | b.is_nb].copy()
        d["pid"], d["pname"] = d.striker_id, d.striker_name
        d["balls"] = d.legal.astype(int)
        d["r"], d["o"], d["er"], d["eo"] = d.bat_runs, d.striker_out.astype(int), d.e_bat, d.e_out
        d["net"] = (d.r - d.er) - WV * (d.o - d.eo)
        d["wpa"] = d.wpa_bat
    else:
        d = b.copy()
        d["pid"], d["pname"] = d.bowler_id, d.bowler_name
        d["balls"] = d.legal.astype(int)
        d["r"], d["o"], d["er"], d["eo"] = d.bowl_runs, d.bowler_wkt.astype(int), d.e_bowl, d.e_bw
        d["net"] = (d.er - d.r) + WV * (d.o - d.eo)
        d["wpa"] = d.wpa_bowl
    d["bnd"] = (d.is_four | d.is_six).astype(int) if role == "bat" else ((d.is_four | d.is_six) & d.legal).astype(int)
    d["dot"] = ((d.total_runs == 0) & d.legal).astype(int) if role == "bowl" else ((d.bat_runs == 0) & d.legal).astype(int)
    d["P"] = d.pressure
    agg = {}
    for tag, mask in [("p", d.P), ("n", ~d.P)]:
        x = d[mask]
        for col in ["balls", "r", "o", "er", "eo", "net", "wpa", "bnd", "dot"]:
            x = x.assign(**{f"w_{col}": x[col] * x.w})
        a = x.groupby(["pid", "match_id"]).agg(**{f"{tag}_{col}": (f"w_{col}", "sum") for col in
                                                   ["balls", "r", "o", "er", "eo", "net", "wpa", "bnd", "dot"]},
                                                **{f"{tag}_raw_balls": ("balls", "sum"), f"{tag}_raw_r": ("r", "sum"),
                                                   f"{tag}_raw_o": ("o", "sum")})
        agg[tag] = a
    pm = agg["p"].join(agg["n"], how="outer").fillna(0).reset_index()
    names = d.groupby("pid").pname.agg(lambda s: s.mode().iat[0])
    act = d.groupby("pid").active.any()
    ipl = d[d.is_ipl == 1].groupby("pid").balls.sum()
    t20i = d[d.is_ipl == 0].groupby("pid").balls.sum()
    team = d.groupby("pid").apply(lambda z: z.batting_team_id.mode().iat[0] if role == "bat" else z.bowling_team_id.mode().iat[0])
    return pm, names, act, ipl, t20i

def score(pm, role, min_p=150, k=60):
    g = pm.groupby("pid").sum(numeric_only=True)
    g = g.drop(columns=["match_id"])
    # consistency: share of matches with >=6 pressure balls where player had positive pressure WPA
    big = pm[pm.p_raw_balls >= 6]
    cons = big.groupby("pid").apply(lambda z: ((z.p_wpa > 0).sum() + 0.5 * 3) / (len(z) + 3))  # Bayesian (prior 50%, 3 games)
    ninn = big.groupby("pid").size()
    g["cons"] = cons; g["p_inns"] = ninn
    g = g[g.p_raw_balls >= min_p].copy()
    # league means per weighted pressure ball (among eligible pool) for shrinkage
    lg_wpa = g.p_wpa.sum() / g.p_balls.sum(); lg_net = g.p_net.sum() / g.p_balls.sum()
    g["wpa100"] = (g.p_wpa + k * lg_wpa) / (g.p_balls + k) * 100
    g["net100"] = (g.p_net + k * lg_net) / (g.p_balls + k) * 100
    g["n_net100"] = (g.n_net) / g.n_balls.clip(lower=1) * 100
    g["lift"] = g.net100 - g.n_net100
    g["vol"] = np.log(g.p_raw_balls)
    g["cons"] = g.cons.fillna(0.5)
    z = lambda s: (s - s.mean()) / s.std()
    g["score"] = (0.35 * z(g.wpa100) + 0.25 * z(g.net100) + 0.15 * z(g.lift.clip(-60, 60)) +
                  0.15 * z(g.cons) + 0.10 * z(g.vol))
    return g

res = {}
for role in ["bat", "bowl"]:
    pm, names, act, ipl, t20i = build(role)
    g = score(pm, role)
    g["name"] = names.reindex(g.index); g["active"] = act.reindex(g.index)
    g["ipl_balls"] = ipl.reindex(g.index).fillna(0); g["t20i_balls"] = t20i.reindex(g.index).fillna(0)
    elig = g[g.active].copy()
    elig["rank"] = elig.score.rank(ascending=False).astype(int)
    elig = elig.sort_values("rank")
    # bootstrap: resample matches, recompute, record top-10 frequency
    matches = pm.match_id.unique(); top = {}
    for i in range(200):
        samp = rng.choice(matches, len(matches), replace=True)
        cnt = pd.Series(samp).value_counts()
        pmb = pm[pm.match_id.isin(cnt.index)].copy()
        mult = pmb.match_id.map(cnt)
        num = [c for c in pmb.columns if c not in ("pid", "match_id")]
        pmb = pmb.loc[pmb.index.repeat(mult)]
        gb = score(pmb, role)
        gb = gb[gb.index.isin(elig.index)]
        for p in gb.score.nlargest(10).index: top[p] = top.get(p, 0) + 1
    elig["top10_pct"] = elig.index.map(lambda p: top.get(p, 0) / 200 * 100)
    # raw readable stats
    if role == "bat":
        elig["SR_p"] = elig.p_raw_r / elig.p_raw_balls * 100
        elig["SR_n"] = elig.n_raw_r / elig.n_raw_balls.clip(lower=1) * 100
        elig["Avg_p"] = elig.p_raw_r / elig.p_raw_o.clip(lower=1)
        elig["Avg_n"] = elig.n_raw_r / elig.n_raw_o.clip(lower=1)
        elig["BPD_p"] = elig.p_raw_balls / elig.p_raw_o.clip(lower=1)
    else:
        elig["Econ_p"] = elig.p_raw_r / elig.p_raw_balls * 6
        elig["Econ_n"] = elig.n_raw_r / elig.n_raw_balls.clip(lower=1) * 6
        elig["SRb_p"] = elig.p_raw_balls / elig.p_raw_o.clip(lower=1)
        elig["SRb_n"] = elig.n_raw_balls / elig.n_raw_o.clip(lower=1)
        elig["Wk_p"] = elig.p_raw_o
    elig["dot_p"] = elig.p_dot / elig.p_balls * 100
    elig["bnd_p"] = elig.p_bnd / elig.p_balls * 100
    # split-half reliability: score on odd vs even matches
    odd = score(pm[pm.match_id % 2 == 1], role, min_p=75); even = score(pm[pm.match_id % 2 == 0], role, min_p=75)
    both = odd.index.intersection(even.index)
    elig.attrs["split_r"] = float(np.corrcoef(odd.loc[both, "score"], even.loc[both, "score"])[0, 1])
    elig.attrs["split_n"] = int(len(both))
    print("split-half r", elig.attrs["split_r"], len(both))
    res[role] = elig
    print(f"\n==== {role}: eligible {len(elig)} (of {len(g)} meeting volume)")
    cols = (["name", "score", "wpa100", "net100", "lift", "cons", "p_raw_balls", "SR_p", "SR_n", "Avg_p", "top10_pct"] if role == "bat"
            else ["name", "score", "wpa100", "net100", "lift", "cons", "p_raw_balls", "Econ_p", "Econ_n", "SRb_p", "Wk_p", "top10_pct"])
    print(elig[cols].head(25).round(2).to_string())
pd.to_pickle({k:(v, v.attrs) for k,v in res.items()}, OUT)
