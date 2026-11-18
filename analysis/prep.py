"""Step 1: clean ball-by-ball data, build match state per delivery, fit win-probability models,
compute Leverage Index (pressure) per ball. Output: balls.parquet"""
import sys, numpy as np, pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import GroupKFold
from sklearn.metrics import roc_auc_score, brier_score_loss

D = sys.argv[1]
OUT = sys.argv[2]
b = pd.read_csv(f"{D}/ball_by_ball.csv")
m = pd.read_csv(f"{D}/matches.csv")
c = pd.read_csv(f"{D}/competitions.csv")
t = pd.read_csv(f"{D}/teams.csv")

m = m.merge(c[["comp_id", "comp_name", "match_format", "season"]], on="comp_id", how="left")
m["is_ipl"] = m.comp_name.str.startswith("IPL").astype(int)
bad = m.result.str.contains("No Result|Abandon|Tie|Super|Draw", case=False, na=True) | m.win_team_id.isna() | (m.win_team_id == 0)
m["valid_result"] = ~bad

# ---- team tiers for opposition-quality weighting
full = {"India", "Australia", "England", "South Africa", "New Zealand", "Pakistan", "Sri Lanka",
        "West Indies", "Bangladesh", "Afghanistan", "Ireland", "Zimbabwe"}
tname = t.drop_duplicates("team_id").set_index("team_id").team_name

b = b[b.innings.isin([1, 2])].copy()
b = b.merge(m[["match_id", "comp_name", "is_ipl", "season", "valid_result", "win_team_id", "knock_out", "stage",
               "first_inn_revised_overs", "second_inn_revised_overs", "revised_target", "match_date"]],
            on="match_id", how="left")
b = b[b.comp_name.notna()]
b = b.sort_values(["match_id", "innings", "innings_ball_num"]).reset_index(drop=True)

et = b.extras_type.fillna("None")
b["is_wide"] = et.eq("wide")
b["is_nb"] = et.isin(["Overstep", "other"])
b["legal"] = ~(b.is_wide | b.is_nb)
b["total_runs"] = b.runs + b.extras1_runs + b.extras_2_runs
b["bat_runs"] = b.runs
b["bowl_runs"] = b.runs + np.where(b.is_wide | b.is_nb, b.extras1_runs + b.extras_2_runs, 0)
b["is_wicket"] = b.is_wicket.astype(str).str.lower().eq("true")
b["is_four"] = b.is_four.astype(str).str.lower().eq("true")
b["is_six"] = b.is_six.astype(str).str.lower().eq("true")
nonbowl = {"RunOut", "Retire Out", "Obstracting the field", "Obstructing the field"}
b["bowler_wkt"] = b.is_wicket & ~b.dismissal_type.isin(nonbowl)
b["striker_out"] = b.is_wicket & (b.dismissed_player_id == b.striker_id) & ~b.dismissal_type.isin({"Retire Out"})

# ---- state BEFORE each delivery
g = b.groupby(["match_id", "innings"])
b["runs_before"] = g.total_runs.cumsum() - b.total_runs
b["wkts_before"] = g.is_wicket.cumsum() - b.is_wicket.astype(int)
b["legal_before"] = g.legal.cumsum() - b.legal.astype(int)

inn_tot = b.groupby(["match_id", "innings"]).total_runs.sum().unstack()
b["first_total"] = b.match_id.map(inn_tot[1])
rev_t = pd.to_numeric(b.revised_target, errors="coerce")
b["target"] = np.where(rev_t > 0, rev_t, b.first_total + 1)
o1 = pd.to_numeric(b.first_inn_revised_overs, errors="coerce")
o2 = pd.to_numeric(b.second_inn_revised_overs, errors="coerce")
ov = np.where(b.innings == 1, o1, o2)
b["max_balls"] = np.where((ov > 0) & (ov < 20), np.floor(ov) * 6, 120)
b["balls_left"] = (b.max_balls - b.legal_before).clip(lower=1)
b["wkts_left"] = 10 - b.wkts_before
b["runs_needed"] = b.target - b.runs_before
b["rrr"] = b.runs_needed / b.balls_left * 6
b["crr"] = np.where(b.legal_before > 0, b.runs_before / b.legal_before.clip(lower=1) * 6, 0)
b["over_no"] = (b.legal_before // 6) + 1
b["phase"] = pd.cut(b.legal_before, [-1, 35, 89, 200], labels=["Powerplay", "Middle", "Death"])
b["bat_won"] = (b.batting_team_id == b.win_team_id).astype(int)

# quality weight: 1.0 for IPL or full-member v full-member, 0.6 if associate / A-team involved
def tier(tid):
    n = tname.get(tid, "")
    return n in full
q = [1.0 if ipl else (1.0 if tier(a) and tier(o) else 0.6)
     for ipl, a, o in zip(b.is_ipl, b.batting_team_id, b.bowling_team_id)]
b["quality_w"] = q

# ---- Win probability models (fit only on decided matches)
F1 = ["runs_before", "wkts_before", "legal_before", "is_ipl"]
F2 = ["runs_needed", "balls_left", "wkts_left", "rrr", "is_ipl"]
mono1 = [1, -1, -1, 0]
mono2 = [-1, 1, 1, -1, 0]
models = {}
for inn, F, mono in [(1, F1, mono1), (2, F2, mono2)]:
    d = b[(b.innings == inn) & b.valid_result]
    X, y, grp = d[F].values, d.bat_won.values, d.match_id.values
    oof = np.zeros(len(d))
    for tr, te in GroupKFold(5).split(X, y, grp):
        mdl = HistGradientBoostingClassifier(max_iter=300, learning_rate=0.05, max_depth=5,
                                             monotonic_cst=mono, random_state=0)
        mdl.fit(X[tr], y[tr]); oof[te] = mdl.predict_proba(X[te])[:, 1]
    print(f"Innings {inn} WP model: AUC={roc_auc_score(y, oof):.3f} Brier={brier_score_loss(y, oof):.3f} n={len(d)}")
    mdl = HistGradientBoostingClassifier(max_iter=300, learning_rate=0.05, max_depth=5,
                                         monotonic_cst=mono, random_state=0).fit(X, y)
    models[inn] = (mdl, F)

def wp(df, inn):
    mdl, F = models[inn]
    return mdl.predict_proba(df[F].values)[:, 1]

def apply_outcome(df, runs, wkt, inn):
    s = df.copy()
    s["runs_before"] = s.runs_before + runs
    s["wkts_before"] = (s.wkts_before + wkt).clip(upper=10)
    s["legal_before"] = s.legal_before + 1
    s["balls_left"] = (s.max_balls - s.legal_before).clip(lower=1)
    s["wkts_left"] = 10 - s.wkts_before
    s["runs_needed"] = s.target - s.runs_before
    s["rrr"] = s.runs_needed / s.balls_left * 6
    s["crr"] = s.runs_before / s.legal_before.clip(lower=1) * 6
    p = wp(s, inn)
    if inn == 2:
        p = np.where(s.runs_needed <= 0, 1.0, p)
        p = np.where((s.wkts_before >= 10) | ((s.balls_left <= 0) & (s.runs_needed > 0)), 0.0, p)
    else:
        p = np.where(s.wkts_before >= 10, wp(s.assign(legal_before=s.max_balls), 1), p)
    return p

# outcome distribution per phase (league-wide, legal balls)
outs = {0: "dot", 1: "one", 2: "two", 4: "four", 6: "six"}
b["wp_now"] = np.nan; b["wp_after"] = np.nan; b["LI_raw"] = np.nan
for inn in [1, 2]:
    idx = b.innings == inn
    d = b[idx]
    now = wp(d, inn)
    if inn == 2:
        now = np.where(d.runs_needed <= 0, 1.0, now)
    b.loc[idx, "wp_now"] = now
    # actual after-ball WP (legal balls advance; illegal balls only add runs)
    after_legal = apply_outcome(d, d.total_runs.values, d.is_wicket.astype(int).values, inn)
    s = d.copy(); s["runs_before"] += d.total_runs; s["wkts_before"] += d.is_wicket.astype(int)
    s["wkts_left"] = 10 - s.wkts_before; s["runs_needed"] = s.target - s.runs_before
    s["rrr"] = s.runs_needed / s.balls_left * 6
    s["crr"] = np.where(s.legal_before > 0, s.runs_before / s.legal_before.clip(lower=1) * 6, 0)
    after_ill = wp(s, inn)
    if inn == 2: after_ill = np.where(s.runs_needed <= 0, 1.0, after_ill)
    b.loc[idx, "wp_after"] = np.where(d.legal, after_legal, after_ill)
    # leverage: expected absolute WP swing over typical outcomes for this phase
    li = np.zeros(len(d))
    for ph in ["Powerplay", "Middle", "Death"]:
        pm = (d.phase == ph).values
        ref = b[(b.phase == ph) & b.legal]
        probs = {"W": ref.is_wicket.mean()}
        for r in [0, 1, 2, 4, 6]:
            probs[r] = ((ref.total_runs == r) & ~ref.is_wicket).mean()
        tot = sum(probs.values()); probs = {k: v / tot for k, v in probs.items()}
        sub = d[pm]
        acc = np.zeros(pm.sum())
        for k, p in probs.items():
            after = apply_outcome(sub, 0 if k == "W" else k, 1 if k == "W" else 0, inn)
            acc += p * np.abs(after - now[pm])
        li[pm] = acc
    b.loc[idx, "LI_raw"] = li

b["wpa_bat"] = b.wp_after - b.wp_now  # batting-side WP added on the ball
# completed / dead-rubber states: once the chase is over nothing matters
mean_li = b.loc[b.legal, "LI_raw"].mean()
b["LI"] = b.LI_raw / mean_li
# match-importance multiplier: knockouts / finals carry extra pressure
b["importance"] = np.where(b.knock_out == 1, 1.25, 1.0)
b["PI"] = b.LI * b.importance
thr = b.loc[b.legal, "PI"].quantile(0.75)
b["pressure"] = b.PI >= thr
print("Pressure threshold (PI, top 25% legal balls):", round(thr, 3))
print(b.groupby("phase", observed=True).pressure.mean().round(3))
print(b.groupby("innings").pressure.mean().round(3))
b.to_pickle(OUT)
