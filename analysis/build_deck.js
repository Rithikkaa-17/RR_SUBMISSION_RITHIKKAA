const pptxgen = require("pptxgenjs");
const sharp = require("sharp");
const React = require("react");
const RDS = require("react-dom/server");
const md = require("react-icons/md");
const gi = require("react-icons/gi");
const fs = require("fs");
const { applyTheme } = require(process.argv[2] + "/scripts/apply_theme.js");
const T = JSON.parse(fs.readFileSync("top.json"));
const S = JSON.parse(fs.readFileSync("summary.json"));

const HEX = { navy: "0A1F44", navy2: "13306A", pink: "EA1A85", gold: "F2B705", red: "C8102E", green: "2E7D32", ink: "1B2333", grey: "5B6577", light: "EEF2F8", white: "FFFFFF" };
const THEME = {
  name: "Royal Night", headFontFace: "Arial", bodyFontFace: "Calibri",
  colors: { dk1: HEX.ink, lt1: HEX.white, dk2: HEX.navy, lt2: HEX.light, accent1: HEX.pink, accent2: HEX.gold,
            accent3: HEX.red, accent4: HEX.green, accent5: HEX.navy2, accent6: "7A8BB0", hlink: HEX.pink, folHlink: "8E44AD" }
};
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "SupeRR Selector S2 - Round 1 - Most Reliable Players Under Pressure";
const C = pres.SchemeColor;
const NAVY = C.text2, PINK = C.accent1, GOLD = C.accent2, RED = C.accent3, GREEN = C.accent4, INK = C.text1, WHITE = C.background1, LIGHT = C.background2, MUTED = C.accent6;

const f1 = (x) => Number(x).toFixed(1), f0 = (x) => Math.round(Number(x)).toString(), f2 = (x) => Number(x).toFixed(2);
const short = (n) => n.replace("Namboori ", "");

async function icon(Comp, color, size = 256) {
  const svg = RDS.renderToStaticMarkup(React.createElement(Comp, { color: "#" + color, size: String(size) }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}
async function bg(kind) {
  // night-stadium background: deep navy, floodlight glows, pitch strip
  const W = 1920, H = 1080;
  const pitch = kind === "title"
    ? `<rect x="1330" y="140" width="210" height="800" rx="8" fill="#C9B27C" opacity="0.18"/>
       <rect x="1330" y="250" width="210" height="4" fill="#fff" opacity="0.35"/><rect x="1330" y="830" width="210" height="4" fill="#fff" opacity="0.35"/>`
    : `<rect x="1500" y="0" width="160" height="1080" fill="#C9B27C" opacity="0.10"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
   <radialGradient id="g1" cx="0.85" cy="0.05" r="0.6"><stop offset="0" stop-color="#3D5FA8" stop-opacity="0.9"/><stop offset="1" stop-color="#0A1F44" stop-opacity="0"/></radialGradient>
   <radialGradient id="g2" cx="0.05" cy="1.0" r="0.55"><stop offset="0" stop-color="#EA1A85" stop-opacity="0.35"/><stop offset="1" stop-color="#0A1F44" stop-opacity="0"/></radialGradient>
   <radialGradient id="oval" cx="0.75" cy="0.55" r="0.55"><stop offset="0" stop-color="#1F5E3A" stop-opacity="0.55"/><stop offset="1" stop-color="#0A1F44" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#0A1F44"/>
  <rect width="${W}" height="${H}" fill="url(#oval)"/>
  <rect width="${W}" height="${H}" fill="url(#g1)"/>
  <rect width="${W}" height="${H}" fill="url(#g2)"/>
  <ellipse cx="1435" cy="540" rx="560" ry="470" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="3" stroke-dasharray="14 12"/>
  ${pitch}
  </svg>`;
  return "image/png;base64," + (await sharp(Buffer.from(svg)).png().toBuffer()).toString("base64");
}

(async () => {
  const BG_T = await bg("title"), BG_S = await bg("section");
  const IC = {
    cricket: await icon(md.MdSportsCricket, HEX.white), stadium: await icon(md.MdStadium, HEX.white),
    speed: await icon(md.MdSpeed, HEX.white), timer: await icon(md.MdTimer, HEX.white), insights: await icon(md.MdInsights, HEX.white),
    balance: await icon(md.MdBalance, HEX.white), verified: await icon(md.MdVerified, HEX.white), trophy: await icon(gi.GiTrophyCup, HEX.white),
    target: await icon(gi.GiTargetArrows, HEX.white), stop: await icon(gi.GiStopwatch, HEX.white), cricketPink: await icon(md.MdSportsCricket, HEX.pink),
    shield: await icon(gi.GiWingedShield, HEX.white), ball: await icon(gi.GiThrowingBall, HEX.white),
  };

  // ---------- layouts
  pres.defineSlideMaster({ title: "TITLE", background: { data: BG_T },
    objects: [{ placeholder: { options: { name: "title", type: "title", x: 0.6, y: 2.0, w: 7.6, h: 2.0, fontSize: 40, bold: true, color: WHITE, valign: "top", align: "left", margin: 0 }, text: "" } },
              { placeholder: { options: { name: "body", type: "body", x: 0.6, y: 4.15, w: 7.4, h: 1.0, fontSize: 18, color: LIGHT, valign: "top", margin: 0 }, text: "" } }] });
  pres.defineSlideMaster({ title: "SECTION", background: { data: BG_S },
    objects: [{ placeholder: { options: { name: "title", type: "title", x: 0.6, y: 2.7, w: 8.5, h: 1.2, fontSize: 40, bold: true, color: WHITE, valign: "middle", align: "left", margin: 0 }, text: "" } },
              { placeholder: { options: { name: "body", type: "body", x: 0.6, y: 3.95, w: 8.5, h: 1.0, fontSize: 18, color: LIGHT, valign: "top", margin: 0 }, text: "" } }],
    slideNumber: { x: 12.3, y: 6.95, w: 0.6, h: 0.3, fontSize: 10, color: LIGHT, align: "right" } });
  pres.defineSlideMaster({ title: "CONTENT", background: { color: WHITE },
    objects: [{ placeholder: { options: { name: "title", type: "title", x: 0.55, y: 0.28, w: 12.2, h: 0.95, fontSize: 28, bold: true, color: NAVY, valign: "middle", align: "left", margin: 0 }, text: "" } },
              { text: { text: "SupeRR Selector S2  ·  Round 1  ·  Most reliable players under pressure", options: { x: 0.55, y: 6.98, w: 8, h: 0.3, fontSize: 10, color: MUTED, margin: 0 } } }],
    slideNumber: { x: 12.3, y: 6.98, w: 0.5, h: 0.3, fontSize: 10, color: MUTED, align: "right" } });

  const content = (title, section) => { const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: section }); s.addText(title, { placeholder: "title" }); return s; };
  const kicker = (s, txt, y = 1.3) => s.addText(txt, { x: 0.55, y, w: 12.2, h: 0.4, fontSize: 15, color: C.accent5, italic: true, margin: 0, isTextBox: true });
  const circleIcon = (s, data, x, y, d, fill, name) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill }, objectName: name + " circle" });
    s.addImage({ data, x: x + d * 0.2, y: y + d * 0.2, w: d * 0.6, h: d * 0.6, objectName: name + " icon" });
  };
  const ball = (s, n, x, y, d = 0.5, fill = PINK) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: WHITE, width: 1.5 }, objectName: "rank ball " + n });
    s.addText(String(n), { x, y, w: d, h: d, fontSize: d > 0.45 ? 16 : 13, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0, isTextBox: true });
  };
  const card = (s, x, y, w, h, fill = LIGHT, name = "card") => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: { color: fill }, objectName: name });
  const chartBase = { catAxisLabelColor: HEX.grey, valAxisLabelColor: HEX.grey, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt",
    catAxisLabelFontSize: 11, valAxisLabelFontSize: 10, valGridLine: { color: "DDE3EE", size: 0.5 }, catGridLine: { style: "none" },
    dataLabelFontFace: "+mn-lt", dataLabelFontSize: 10, dataLabelColor: HEX.ink, titleFontFace: "+mn-lt", titleColor: HEX.ink, titleFontSize: 13,
    legendFontFace: "+mn-lt", legendFontSize: 11, legendColor: HEX.ink };

  const B = T.bat, W = T.bowl, Lg = S.league;

  // ============ 1. Title
  pres.addSection({ title: "Opening" });
  let s = pres.addSlide({ masterName: "TITLE", sectionTitle: "Opening" });
  s.addText("SUPERR SELECTOR  ·  SEASON 2  ·  ROUND 1", { x: 0.6, y: 1.35, w: 7.5, h: 0.4, fontSize: 14, bold: true, color: GOLD, charSpacing: 3, margin: 0, isTextBox: true });
  s.addText("Nerves of Steel: the 20 players who deliver when the game is on the line", { placeholder: "title" });
  s.addText("A Pressure Index built on win probability and scoreboard stress, applied to 867 IPL and T20I matches (2022–2026)", { placeholder: "body" });
  s.addText("[Your name]  ·  Submission for Rajasthan Royals × Unstop", { x: 0.6, y: 6.3, w: 7.5, h: 0.4, fontSize: 14, color: LIGHT, margin: 0, isTextBox: true });
  circleIcon(s, IC.cricket, 10.0, 2.55, 1.9, PINK, "title cricket");

  // ============ 2. Executive summary
  s = content("The answer: back finishers who score faster and spinners who squeeze harder under pressure", "Opening");
  const colX = [0.55, 6.85];
  [["TOP 10 BATTERS", B], ["TOP 10 BOWLERS", W]].forEach(([hdr, list], ci) => {
    const x = colX[ci];
    card(s, x, 1.3, 5.95, 5.45, LIGHT, hdr + " card");
    s.addText(hdr, { x: x + 0.3, y: 1.45, w: 5.3, h: 0.4, fontSize: 16, bold: true, color: NAVY, margin: 0, isTextBox: true });
    list.forEach((p, i) => {
      const col = i < 5 ? 0 : 1, row = i % 5;
      const px = x + 0.3 + col * 2.85, py = 2.0 + row * 0.9;
      ball(s, i + 1, px, py, 0.46, i < 3 ? PINK : NAVY);
      s.addText(short(p.name), { x: px + 0.56, y: py - 0.04, w: 2.25, h: 0.32, fontSize: 14, bold: true, color: INK, margin: 0, isTextBox: true });
      const sub = ci === 0 ? `SR ${f0(p.SR_p)} under pressure` : `Econ ${f1(p.Econ_p)} under pressure`;
      s.addText(sub, { x: px + 0.56, y: py + 0.27, w: 2.25, h: 0.26, fontSize: 11, color: C.accent5, margin: 0, isTextBox: true });
    });
  });
  s.addNotes("Two ranked lists, matching the Unstop dropdowns. Ranks come from the Clutch Score: impact on win probability under pressure, runs above expectation, lift versus own baseline, consistency and volume.");

  // ============ 3. Defining pressure
  pres.addSection({ title: "Method" });
  s = content("Pressure = how much the next ball can swing the result, plus how tight the scoreboard feels", "Method");
  // left: formula
  card(s, 0.55, 1.4, 5.6, 5.3, NAVY, "formula card");
  s.addText("PRESSURE INDEX (per ball)", { x: 0.85, y: 1.6, w: 5.0, h: 0.4, fontSize: 14, bold: true, color: GOLD, charSpacing: 2, margin: 0, isTextBox: true });
  s.addText([
    { text: "PI = ( 0.5 × LI  +  0.5 × SSI ) × M", options: { fontSize: 22, bold: true, color: WHITE, breakLine: true } },
    { text: " ", options: { fontSize: 8, breakLine: true } },
    { text: "LI  Leverage Index: ", options: { bold: true, color: GOLD, fontSize: 14 } },
    { text: "expected swing in win probability from the next ball, averaged over the realistic outcomes (dot, 1, 2, 4, 6, wicket).", options: { color: WHITE, fontSize: 14, breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: "SSI  Scoreboard Stress: ", options: { bold: true, color: GOLD, fontSize: 14 } },
    { text: "what the player feels: collapse, death overs, required-rate squeeze, closeness of contest.", options: { color: WHITE, fontSize: 14, breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: "M  Match stakes: ", options: { bold: true, color: GOLD, fontSize: 14 } },
    { text: "×1.25 for knockouts and finals.", options: { color: WHITE, fontSize: 14, breakLine: true } },
    { text: " ", options: { fontSize: 6, breakLine: true } },
    { text: `A pressure ball = top 25% of PI (PI ≥ ${f2(S.threshold)}).`, options: { color: PINK, bold: true, fontSize: 15, breakLine: true } },
    { text: " ", options: { fontSize: 10, breakLine: true } },
    { text: "Why blend? ", options: { bold: true, color: GOLD, fontSize: 14 } },
    { text: "Leverage alone over-flags calm early overs where WP is still 50:50; stress alone ignores what is at stake. Together they find the balls where the game, and the player, are both on edge.", options: { color: LIGHT, fontSize: 14, italic: true } },
  ], { x: 0.85, y: 2.1, w: 5.05, h: 4.45, valign: "top", margin: 0, isTextBox: true });
  // right: 4 SSI components
  const comps = [
    [IC.timer, "Stage of innings", "Death overs (16–20) weighted highest; middle overs 0.3; powerplay 0.2."],
    [IC.target, "Required-rate squeeze", "In chases: how far the asking rate sits above the current rate (or above 7 an over)."],
    [IC.stop, "Collapse in progress", "Wickets lost in the previous 18 deliveries (3+ = full stress)."],
    [IC.balance, "Closeness of contest", "1 − |2·WP − 1|: peaks when the win-probability model says 50:50."],
  ];
  s.addText("SCOREBOARD STRESS: 4 SIGNALS, EQUAL WEIGHT", { x: 6.6, y: 1.45, w: 6.2, h: 0.35, fontSize: 13, bold: true, color: NAVY, charSpacing: 1, margin: 0, isTextBox: true });
  comps.forEach(([ic, h, d], i) => {
    const y = 2.0 + i * 1.2;
    circleIcon(s, ic, 6.6, y, 0.75, i % 2 ? NAVY : PINK, h);
    s.addText(h, { x: 7.55, y: y - 0.02, w: 5.2, h: 0.35, fontSize: 16, bold: true, color: INK, margin: 0, isTextBox: true });
    s.addText(d, { x: 7.55, y: y + 0.33, w: 5.2, h: 0.6, fontSize: 14, color: C.accent5, margin: 0, isTextBox: true, valign: "top" });
  });
  s.addNotes("Win-probability models: gradient-boosted classifiers with monotonic constraints. 1st innings uses runs, wickets, balls, IPL flag. 2nd innings uses runs needed, balls left, wickets left, required rate, IPL flag. Out-of-fold AUC 0.69 (1st innings) and 0.90 (2nd innings), cross-validated by match.");

  // ============ 4. Validation of the definition
  s = content("The definition works: pressure balls are 25% of deliveries but carry 53% of all win-probability swing", "Method");
  s.addChart(pres.charts.LINE, [
    { name: "1st innings", labels: Array.from({ length: 20 }, (_, i) => String(i + 1)), values: S.share_by_over.inn1.map((v) => +v.toFixed(1)) },
    { name: "2nd innings (chase)", labels: Array.from({ length: 20 }, (_, i) => String(i + 1)), values: S.share_by_over.inn2.map((v) => +v.toFixed(1)) },
  ], { x: 0.45, y: 1.35, w: 7.6, h: 5.4, ...chartBase, chartColors: [HEX.navy, HEX.pink], lineSize: 3, lineDataSymbol: "circle", lineDataSymbolSize: 6,
       showTitle: true, title: "Share of balls flagged as pressure, by over (%)", showLegend: true, legendPos: "b",
       valAxisMinVal: 0, valAxisMaxVal: 50, showCatAxisTitle: true, catAxisTitle: "Over", catAxisTitleColor: HEX.grey, catAxisTitleFontSize: 11, valAxisLabelFormatCode: "0" , objectName: "pressure share by over chart"});
  const stats = [
    [`${f0(S.wpa_share_pressure)}%`, "of all win-probability swing happens on the 25% of balls we flag"],
    [`${f1(Lg.wpa_p / Lg.wpa_n)}×`, `bigger average swing per ball (${f2(Lg.wpa_p * 100)} vs ${f2(Lg.wpa_n * 100)} WP points)`],
    [`${f1(Lg.wkt_p)}%`, `wicket rate under pressure vs ${f1(Lg.wkt_n)}% otherwise: the game bites back`],
  ];
  stats.forEach(([big, lab], i) => {
    const y = 1.45 + i * 1.8;
    card(s, 8.4, y, 4.4, 1.6, i === 0 ? NAVY : LIGHT, "stat card " + i);
    s.addText(big, { x: 8.65, y: y + 0.15, w: 3.9, h: 0.75, fontSize: 40, bold: true, color: i === 0 ? GOLD : PINK, margin: 0, isTextBox: true });
    s.addText(lab, { x: 8.65, y: y + 0.9, w: 3.95, h: 0.6, fontSize: 13, color: i === 0 ? WHITE : INK, margin: 0, isTextBox: true, valign: "top" });
  });
  s.addNotes("Death overs are pressure-heavy in both innings; chases stay pressured through the middle overs because the asking rate keeps biting. 1st-innings middle overs are the calmest phase.");

  // ============ 5. Clutch Score
  s = content("The Clutch Score rewards impact, efficiency, rising to the moment, consistency and trust", "Method");
  s.addChart(pres.charts.DOUGHNUT, [{ name: "Weight", labels: ["Pressure impact (WPA/100 balls)", "Runs above expected", "Lift vs own baseline", "Consistency", "Volume"], values: [35, 25, 15, 15, 10] }],
    { x: 0.4, y: 1.3, w: 4.6, h: 4.6, holeSize: 58, chartColors: [HEX.pink, HEX.navy, HEX.gold, HEX.green, "7A8BB0"], showLegend: false,
      showPercent: true, showValue: false, dataLabelColor: HEX.white, dataLabelFontSize: 12, dataLabelFontFace: "+mn-lt", dataLabelFontBold: true, objectName: "clutch weights doughnut" });
  s.addText("CLUTCH\nSCORE", { x: 1.85, y: 3.15, w: 1.7, h: 0.9, fontSize: 18, bold: true, color: NAVY, align: "center", valign: "middle", margin: 0, isTextBox: true });
  const comp = [
    [PINK, "35%  Pressure impact", "Win-probability added per 100 pressure balls: did the team's chances go up while you were in?"],
    [NAVY, "25%  Runs above expected", "Runs vs league average for the same innings, phase, wickets and format; a wicket costs 8 runs."],
    [GOLD, "15%  Lift vs own baseline", "Pressure output minus the player's own non-pressure output: who rises, who shrinks."],
    [GREEN, "15%  Consistency", "Share of innings/spells (6+ pressure balls) with positive impact, shrunk to 50% over 3 games."],
    [MUTED, "10%  Volume", "Log of pressure balls: a long record of delivering earns trust."],
  ];
  comp.forEach(([col, h, d], i) => {
    const y = 1.35 + i * 1.08;
    s.addShape(pres.shapes.OVAL, { x: 5.4, y: y + 0.08, w: 0.28, h: 0.28, fill: { color: col }, line: { color: col }, objectName: "legend dot " + i });
    s.addText(h, { x: 5.85, y, w: 6.9, h: 0.4, fontSize: 16, bold: true, color: INK, margin: 0, isTextBox: true });
    s.addText(d, { x: 5.85, y: y + 0.38, w: 6.9, h: 0.6, fontSize: 14, color: C.accent5, margin: 0, isTextBox: true, valign: "top" });
  });
  s.addText("Each component is z-scored across the eligible pool, then weighted and summed.", { x: 0.55, y: 6.35, w: 4.6, h: 0.5, fontSize: 12, italic: true, color: MUTED, margin: 0, isTextBox: true });

  // ============ 6. Fair comparisons
  s = content("Fair comparisons: every player judged against the same situation, not the same scoreboard", "Method");
  const fair = [
    [IC.verified, "Eligibility", `150+ legal pressure balls, and played in 2026. Pool: ${T.bat_pool} batters, ${T.bowl_pool} bowlers.`],
    [IC.balance, "Small-sample shrinkage", "Rates are pulled toward the pool average by 60 balls, so a hot 2-match streak cannot top the list."],
    [IC.insights, "Context-matched baselines", "Expected runs and wickets per ball by innings × phase × wickets lost × IPL/T20I × pressure."],
    [IC.timer, "Recency weighting", "2026 = 1.0, 2025 = 0.9, 2024 = 0.8, 2023 = 0.7, 2022 = 0.6. Auctions buy the future."],
    [IC.stadium, "Opposition quality", "IPL and full-member T20Is count fully; games involving associates or A-teams count 0.6."],
    [IC.shield, "Clean data", "Super overs, ties, no-results excluded from model fitting; DLS targets and reduced overs respected."],
  ];
  fair.forEach(([ic, h, d], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.55 + col * 6.2, y = 1.4 + row * 1.8;
    card(s, x, y, 5.95, 1.6, LIGHT, h + " card");
    circleIcon(s, ic, x + 0.25, y + 0.4, 0.8, row === 1 ? PINK : NAVY, h);
    s.addText(h, { x: x + 1.3, y: y + 0.2, w: 4.45, h: 0.4, fontSize: 16, bold: true, color: INK, margin: 0, isTextBox: true });
    s.addText(d, { x: x + 1.3, y: y + 0.6, w: 4.45, h: 0.85, fontSize: 14, color: C.accent5, margin: 0, isTextBox: true, valign: "top" });
  });

  // ============ 7. Batters section
  pres.addSection({ title: "Batters" });
  s = pres.addSlide({ masterName: "SECTION", sectionTitle: "Batters" });
  s.addText("Top 10 batters under pressure", { placeholder: "title" });
  s.addText("Finishers and middle-order anchors who score faster, and get out less, when the game tightens", { placeholder: "body" });
  circleIcon(s, IC.cricket, 10.3, 2.6, 1.6, PINK, "batters section");

  // ============ 8. Batters table
  s = content("Batting top 10: nine of ten score faster under pressure than in normal play", "Batters");
  const hdr = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: HEX.navy }, fontSize: 12, align: "center", valign: "middle" } });
  const rowsB = [[hdr("#"), hdr("Batter"), hdr("Pressure balls"), hdr("Pressure runs"), hdr("SR pressure"), hdr("SR normal"), hdr("Avg pressure"), hdr("WPA /100"), hdr("Consistency"), hdr("Clutch Score")]];
  B.forEach((p, i) => {
    const fill = { color: i % 2 ? "FFFFFF" : HEX.light };
    const o = (t, extra = {}) => ({ text: t, options: { fill, fontSize: 13, align: "center", valign: "middle", color: HEX.ink, ...extra } });
    rowsB.push([o(String(i + 1), { bold: true, color: HEX.pink }), o(short(p.name), { align: "left", bold: true }), o(f0(p.pballs)), o(f0(p.runs_p)),
      o(f0(p.SR_p), { bold: true, color: p.SR_p > p.SR_n ? HEX.green : HEX.red }), o(f0(p.SR_n)), o(f1(p.Avg_p)), o(f2(p.wpa100)), o(f0(p.cons) + "%"), o(f2(p.score), { bold: true })]);
  });
  s.addTable(rowsB, { x: 0.55, y: 1.35, w: 12.2, colW: [0.5, 2.6, 1.15, 1.15, 1.15, 1.1, 1.2, 1.05, 1.15, 1.15], rowH: 0.45, border: { type: "solid", pt: 0.5, color: "D5DCE8" }, fontFace: "Calibri", objectName: "batters table" });
  s.addText("SR in green = faster under pressure than normal. WPA/100 = win-probability points added per 100 pressure balls (shrunk). Consistency = share of pressure innings with positive impact.", { x: 0.55, y: 6.4, w: 12.2, h: 0.45, fontSize: 11, color: MUTED, margin: 0, isTextBox: true });

  // ============ 9. Batters chart
  s = content("They accelerate when it matters: strike rate under pressure vs in normal play", "Batters");
  s.addChart(pres.charts.BAR, [
    { name: "Under pressure", labels: B.map((p) => short(p.name)), values: B.map((p) => +p.SR_p.toFixed(0)) },
    { name: "Normal play", labels: B.map((p) => short(p.name)), values: B.map((p) => +p.SR_n.toFixed(0)) },
  ], { x: 0.45, y: 1.3, w: 8.2, h: 5.5, barDir: "bar", barGrouping: "clustered", ...chartBase, chartColors: [HEX.pink, "AAB6CC"], showValue: true, dataLabelPosition: "outEnd",
       catAxisOrientation: "maxMin", valAxisMinVal: 0, valAxisMaxVal: 250, showLegend: true, legendPos: "b", barGapWidthPct: 60, showTitle: true, title: "Strike rate", objectName: "batters SR chart" });
  const insB = [
    ["Biggest risers", `Dockrell (+${f0(B[4].SR_p - B[4].SR_n)} SR), Atal (+${f0(B[6].SR_p - B[6].SR_n)}), Shashank (+${f0(B[3].SR_p - B[3].SR_n)}): clear evidence of a pressure gear.`],
    ["Elite without lift", `Abhishek (${f0(B[7].SR_p)}) and Salt (${f0(B[8].SR_p)}) already play at max tempo; their value is impact, not acceleration.`],
    ["Survival matters too", `Shashank averages ${f1(B[3].Avg_p)} under pressure vs ${f1(B[3].Avg_n)} in normal play.`],
  ];
  insB.forEach(([h, d], i) => {
    const y = 1.4 + i * 1.8;
    card(s, 8.95, y, 3.85, 1.6, i === 0 ? NAVY : LIGHT, "insight " + i);
    s.addText(h, { x: 9.15, y: y + 0.15, w: 3.5, h: 0.35, fontSize: 15, bold: true, color: i === 0 ? GOLD : NAVY, margin: 0, isTextBox: true });
    s.addText(d, { x: 9.15, y: y + 0.5, w: 3.5, h: 1.0, fontSize: 13, color: i === 0 ? WHITE : INK, margin: 0, isTextBox: true, valign: "top" });
  });

  // ============ 10-11. Batter profiles
  const batWhy = [
    `Best impact in the pool (${f2(B[0].wpa100)} WPA/100). ${f0(B[0].death)}% of his pressure balls come at the death; SR ${f0(B[0].SR_p)}.`,
    `SR ${f0(B[1].SR_p)} vs ${f0(B[1].SR_n)} normal, avg ${f1(B[1].Avg_p)}. Highest consistency in the top 10 (${f0(B[1].cons)}%).`,
    `${f0(B[2].runs_p)} pressure runs at ${f1(B[2].Avg_p)}; ${f0(B[2].chase)}% of them in chases. Gets better as the target gets harder.`,
    `Only ${B[3].outs_p} dismissals in ${f0(B[3].pballs)} pressure balls; SR ${f0(B[3].SR_p)}. Indian finisher who wins chases.`,
    `Largest lift in the pool: SR ${f0(B[4].SR_p)} vs ${f0(B[4].SR_n)}. T20I-only sample, so a value watch-list pick.`,
    `Biggest pressure volume (${f0(B[5].pballs)} balls, ${f0(B[5].runs_p)} runs at ${f1(B[5].Avg_p)}). The most proven left-hander.`,
    `Pressure average ${f1(B[6].Avg_p)} vs ${f1(B[6].Avg_n)} normal. Young Afghan left-hander, mostly T20I evidence.`,
    `${f0(B[7].runs_p)} pressure runs at SR ${f0(B[7].SR_p)}. Already maximum tempo; dips slightly vs his own normal.`,
    `SR ${f0(B[8].SR_p)} and ${f0(B[8].cons)}% consistency. Powerplay pressure-breaker at the top.`,
    `Avg ${f1(B[9].Avg_p)} under pressure vs ${f1(B[9].Avg_n)} otherwise. Keeper-batter who steadies a wobbling chase.`,
  ];
  const batRole = ["Death finisher", "Spin-hitting No.4/5", "Chase anchor / leader", "Indian finisher", "Overseas value pick", "LHB middle-order anchor", "Emerging top order", "Powerplay aggressor", "Overseas opener", "Keeper-bat stabiliser"];
  const profileSlide = (title, list, why, role, start, section, isBat) => {
    const sl = content(title, section);
    for (let k = 0; k < 5; k++) {
      const i = start + k, p = list[i], y = 1.35 + k * 1.1;
      card(sl, 0.55, y, 12.2, 0.95, k % 2 ? "FFFFFF" : HEX.light, "profile " + i);
      ball(sl, i + 1, 0.75, y + 0.2, 0.55, i < 3 ? PINK : NAVY);
      sl.addText(short(p.name), { x: 1.5, y: y + 0.12, w: 3.0, h: 0.4, fontSize: 17, bold: true, color: INK, margin: 0, isTextBox: true });
      sl.addText(`${p.style}  ·  ${f0(p.ipl)}% IPL`, { x: 1.5, y: y + 0.52, w: 3.0, h: 0.3, fontSize: 11, color: MUTED, margin: 0, isTextBox: true });
      sl.addText(why[i], { x: 4.6, y: y + 0.08, w: 5.6, h: 0.8, fontSize: 14, color: INK, margin: 0, valign: "middle", isTextBox: true });
      sl.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 10.4, y: y + 0.22, w: 2.2, h: 0.5, rectRadius: 0.25, fill: { color: k % 2 ? HEX.light : "FFFFFF" }, line: { color: PINK, width: 1.25 }, objectName: "role pill " + i });
      sl.addText(role[i], { x: 10.4, y: y + 0.22, w: 2.2, h: 0.5, fontSize: 11, bold: true, color: PINK, align: "center", valign: "middle", margin: 0, isTextBox: true });
    }
    return sl;
  };
  profileSlide("Why each batter, and the job he would do for RR (1–5)", B, batWhy, batRole, 0, "Batters", true);
  profileSlide("Why each batter, and the job he would do for RR (6–10)", B, batWhy, batRole, 5, "Batters", true);

  // ============ 12. Bowlers section
  pres.addSection({ title: "Bowlers" });
  s = pres.addSlide({ masterName: "SECTION", sectionTitle: "Bowlers" });
  s.addText("Top 10 bowlers under pressure", { placeholder: "title" });
  s.addText("Spin dominates: nine of the ten most reliable pressure bowlers turn the ball", { placeholder: "body" });
  circleIcon(s, IC.ball, 10.3, 2.6, 1.6, PINK, "bowlers section");

  // ============ 13. Bowlers table
  s = content("Bowling top 10: control and wickets when batters need runs most", "Bowlers");
  const rowsW = [[hdr("#"), hdr("Bowler"), hdr("Type"), hdr("Pressure balls"), hdr("Wkts"), hdr("Econ pressure"), hdr("Econ normal"), hdr("Balls / wkt"), hdr("WPA /100"), hdr("Clutch Score")]];
  W.forEach((p, i) => {
    const fill = { color: i % 2 ? "FFFFFF" : HEX.light };
    const o = (t, extra = {}) => ({ text: t, options: { fill, fontSize: 13, align: "center", valign: "middle", color: HEX.ink, ...extra } });
    const typ = /fast|medium/i.test(p.style) ? "Pace" : "Spin";
    rowsW.push([o(String(i + 1), { bold: true, color: HEX.pink }), o(p.name, { align: "left", bold: true }), o(typ), o(f0(p.pballs)), o(String(p.wk_p)),
      o(f2(p.Econ_p), { bold: true, color: p.Econ_p < p.Econ_n ? HEX.green : HEX.red }), o(f2(p.Econ_n)), o(f1(p.SRb_p)), o(f2(p.wpa100)), o(f2(p.score), { bold: true })]);
  });
  s.addTable(rowsW, { x: 0.55, y: 1.35, w: 12.2, colW: [0.5, 2.6, 0.9, 1.2, 0.8, 1.3, 1.25, 1.15, 1.2, 1.3], rowH: 0.45, border: { type: "solid", pt: 0.5, color: "D5DCE8" }, fontFace: "Calibri", objectName: "bowlers table" });
  s.addText("Econ in green = cheaper under pressure than normal. Balls/wkt = strike rate under pressure. WPA/100 = win-probability points saved per 100 pressure balls (shrunk).", { x: 0.55, y: 6.4, w: 12.2, h: 0.45, fontSize: 11, color: MUTED, margin: 0, isTextBox: true });

  // ============ 14. Bowlers chart
  s = content("They get tighter when it matters: economy under pressure vs in normal play", "Bowlers");
  s.addChart(pres.charts.BAR, [
    { name: "Under pressure", labels: W.map((p) => p.name), values: W.map((p) => +p.Econ_p.toFixed(2)) },
    { name: "Normal play", labels: W.map((p) => p.name), values: W.map((p) => +p.Econ_n.toFixed(2)) },
  ], { x: 0.45, y: 1.3, w: 8.2, h: 5.5, barDir: "bar", barGrouping: "clustered", ...chartBase, chartColors: [HEX.pink, "AAB6CC"], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0",
       catAxisOrientation: "maxMin", valAxisMinVal: 0, valAxisMaxVal: 10, showLegend: true, legendPos: "b", barGapWidthPct: 60, showTitle: true, title: "Economy (runs per over)", objectName: "bowlers econ chart" });
  const insW = [
    ["The squeeze specialists", `Zampa concedes ${f1(W[4].Econ_n - W[4].Econ_p)} fewer runs an over under pressure than in normal play.`],
    ["Wicket-takers", `Hazlewood strikes every ${f1(W[1].SRb_p)} balls under pressure (vs ${f1(W[1].SRb_n)} normally): the only pacer in the top 10.`],
    ["Why spin wins", "In tight chases batters must attack spin through the middle overs; the best spinners turn that into dots and wickets."],
  ];
  insW.forEach(([h, d], i) => {
    const y = 1.4 + i * 1.8;
    card(s, 8.95, y, 3.85, 1.6, i === 0 ? NAVY : LIGHT, "insight w" + i);
    s.addText(h, { x: 9.15, y: y + 0.15, w: 3.5, h: 0.35, fontSize: 15, bold: true, color: i === 0 ? GOLD : NAVY, margin: 0, isTextBox: true });
    s.addText(d, { x: 9.15, y: y + 0.5, w: 3.5, h: 1.0, fontSize: 13, color: i === 0 ? WHITE : INK, margin: 0, isTextBox: true, valign: "top" });
  });

  const bowlWhy = [
    `Econ ${f2(W[0].Econ_p)} under pressure, best impact in the pool (${f2(W[0].wpa100)} WPA/100). Top 10 in ${f0(W[0].top10)}% of resamples.`,
    `${W[1].wk_p} pressure wickets, one every ${f1(W[1].SRb_p)} balls. Bowls a third of his pressure overs at the death.`,
    `Econ ${f2(W[2].Econ_p)} vs ${f2(W[2].Econ_n)} normal; highest consistency of the top 10 (${f0(W[2].cons)}%). ${f0(W[2].chase)}% in chases.`,
    `Econ ${f2(W[3].Econ_p)} vs ${f2(W[3].Econ_n)}. Left-arm control who also bats: two jobs in one slot.`,
    `Largest lift in the pool: econ ${f2(W[4].Econ_p)} vs ${f2(W[4].Econ_n)}, ${W[4].wk_p} wickets, a wicket every ${f1(W[4].SRb_p)} balls.`,
    `${W[5].wk_p} pressure wickets at a ball-per-wicket of ${f1(W[5].SRb_p)}. Wickets, not economy, drive his impact.`,
    `Econ ${f2(W[6].Econ_p)} with ${f0(W[6].dot_p)}% dots; ${f0(W[6].chase)}% of his pressure balls defend totals in chases.`,
    `Highest pressure workload in the pool (${f0(W[7].pballs)} balls, ${W[7].wk_p} wickets). The banker.`,
    `${W[8].wk_p} pressure wickets; bowls ${f0(W[8].death)}% of pressure balls at the death, rare for a wrist-spinner.`,
    `Econ ${f2(W[9].Econ_p)} and ${f0(W[9].cons)}% consistency. Left-arm all-rounder with T20I-only evidence.`,
  ];
  const bowlRole = ["Middle-overs controller", "New-ball + death pace", "Left-arm spin squeeze", "Spin all-rounder", "Overseas leg-spin", "Wicket-taking leggie", "Powerplay off-spin", "Banker in any phase", "Death-over wrist spin", "Overseas value pick"];
  profileSlide("Why each bowler, and the job he would do for RR (1–5)", W, bowlWhy, bowlRole, 0, "Bowlers", false);
  profileSlide("Why each bowler, and the job he would do for RR (6–10)", W, bowlWhy, bowlRole, 5, "Bowlers", false);

  // ============ RR fit
  pres.addSection({ title: "RR strategy" });
  s = content("Auction plan for RR: buy the pressure skills the 2026 squad is thinnest in", "RR strategy");
  kicker(s, "Gaps = where RR's 2026 players rank in the same model. Availability depends on each franchise's retentions and releases.");
  const plan = [
    [IC.cricket, "Death-overs finisher", "Hetmyer ranks 74th of 88 pressure batters in this model.", "Tim David · Shashank Singh", PINK],
    [IC.insights, "Chase anchor at 3–5", "Parag 64th, Jurel 58th; Jaiswal (23rd) is RR's best.", "Shreyas Iyer · Tilak Varma · Klaasen", NAVY],
    [IC.target, "Middle-overs spin squeeze", "Bishnoi ranks 63rd of 90; Jadeja (22nd) is the only top-25 RR spinner.", "Narine · Krunal · Harpreet Brar · Zampa", PINK],
    [IC.speed, "Pressure pace partner for Archer", "Archer ranks 75th and Sandeep 81st of 90 pressure bowlers.", "Josh Hazlewood", NAVY],
  ];
  plan.forEach(([ic, need, gap, picks, col], i) => {
    const y = 1.75 + i * 1.25;
    card(s, 0.55, y, 12.2, 1.1, i % 2 ? "FFFFFF" : HEX.light, "plan " + i);
    circleIcon(s, ic, 0.75, y + 0.18, 0.75, col, need);
    s.addText(need, { x: 1.7, y: y + 0.12, w: 3.6, h: 0.4, fontSize: 16, bold: true, color: INK, margin: 0, isTextBox: true });
    s.addText(gap, { x: 1.7, y: y + 0.5, w: 4.6, h: 0.5, fontSize: 13, color: C.accent5, margin: 0, isTextBox: true, valign: "top" });
    s.addText("TARGET", { x: 6.6, y: y + 0.15, w: 1.2, h: 0.3, fontSize: 11, bold: true, color: PINK, charSpacing: 2, margin: 0, isTextBox: true });
    s.addText(picks, { x: 6.6, y: y + 0.45, w: 6.0, h: 0.45, fontSize: 16, bold: true, color: NAVY, margin: 0, isTextBox: true });
  });
  s.addText("Already at RR and worth retaining on this evidence: Vaibhav Sooryavanshi (12th batter, SR 222 under pressure) and Sam Curran (17th batter).", { x: 0.55, y: 6.5, w: 12.2, h: 0.4, fontSize: 12, italic: true, color: MUTED, margin: 0, isTextBox: true });

  // ============ Reliability
  pres.addSection({ title: "Reliability" });
  s = content("How sure are we? Rank stability across 200 bootstrap resamples of matches", "Reliability");
  s.addChart(pres.charts.BAR, [{ name: "% of resamples in top 10", labels: B.map((p) => short(p.name)), values: B.map((p) => +p.top10.toFixed(0)) }],
    { x: 0.45, y: 1.3, w: 4.3, h: 5.4, barDir: "bar", ...chartBase, chartColors: [HEX.navy], showValue: true, dataLabelPosition: "outEnd", catAxisOrientation: "maxMin",
      valAxisMinVal: 0, valAxisMaxVal: 100, showLegend: false, showTitle: true, title: "Batters: % of resamples in top 10", barGapWidthPct: 50, objectName: "bat bootstrap chart" });
  s.addChart(pres.charts.BAR, [{ name: "% of resamples in top 10", labels: W.map((p) => p.name), values: W.map((p) => +p.top10.toFixed(0)) }],
    { x: 4.85, y: 1.3, w: 4.3, h: 5.4, barDir: "bar", ...chartBase, chartColors: [HEX.pink], showValue: true, dataLabelPosition: "outEnd", catAxisOrientation: "maxMin",
      valAxisMinVal: 0, valAxisMaxVal: 100, showLegend: false, showTitle: true, title: "Bowlers: % of resamples in top 10", barGapWidthPct: 50, objectName: "bowl bootstrap chart" });
  const rel = [
    ["Most certain", `Tim David (${f0(B[0].top10)}%) and Narine (${f0(W[0].top10)}%) stay top 10 in almost any resample.`],
    ["Least certain", `Dockrell (${f0(B[4].top10)}%) and Kusal Mendis (${f0(B[9].top10)}%): smaller samples, mostly T20I. Treat as scouting leads.`],
    ["Signal is real but noisy", `Split-half check (odd vs even matches): r = ${f2(T.bat_split.split_r)} batting, ${f2(T.bowl_split.split_r)} bowling. Hence shrinkage and volume weight.`],
  ];
  rel.forEach(([h, d], i) => {
    const y = 1.4 + i * 1.8;
    card(s, 9.4, y, 3.4, 1.6, i === 0 ? NAVY : LIGHT, "rel " + i);
    s.addText(h, { x: 9.6, y: y + 0.15, w: 3.05, h: 0.35, fontSize: 15, bold: true, color: i === 0 ? GOLD : NAVY, margin: 0, isTextBox: true });
    s.addText(d, { x: 9.6, y: y + 0.5, w: 3.05, h: 1.05, fontSize: 12, color: i === 0 ? WHITE : INK, margin: 0, isTextBox: true, valign: "top" });
  });

  s = content("Limitations, and what we would add in the Mumbai round", "Reliability");
  const lim = [
    ["First-innings win probability is soft", "Without venue and pitch data the 1st-innings model is only moderately sharp (AUC 0.69 vs 0.90 when chasing). Par scores by venue would sharpen it."],
    ["Batting position shapes opportunity", "Openers rarely face death-over pressure; finishers rarely face powerplay pressure. A role-adjusted baseline is the next step."],
    ["Fielding and captaincy are invisible", "Catches, run-outs and field settings shape pressure outcomes but are not in ball-by-ball data."],
    ["T20I mixes very different oppositions", "Associate games are down-weighted to 0.6, but a full opponent-strength rating would be fairer."],
    ["Matchups not yet used", "Bowler-type vs batter-hand matchups (e.g. left-arm spin to left-handers) would refine RR-specific picks."],
  ];
  lim.forEach(([h, d], i) => {
    const y = 1.35 + i * 1.08;
    ball(s, i + 1, 0.6, y + 0.12, 0.5, i % 2 ? NAVY : PINK);
    s.addText(h, { x: 1.35, y, w: 11.4, h: 0.4, fontSize: 16, bold: true, color: INK, margin: 0, isTextBox: true });
    s.addText(d, { x: 1.35, y: y + 0.38, w: 11.4, h: 0.6, fontSize: 14, color: C.accent5, margin: 0, isTextBox: true, valign: "top" });
  });

  // ============ Close
  pres.addSection({ title: "Close" });
  s = pres.addSlide({ masterName: "TITLE", sectionTitle: "Close" });
  s.addText("THE CALL", { x: 0.6, y: 1.35, w: 7.5, h: 0.4, fontSize: 14, bold: true, color: GOLD, charSpacing: 3, margin: 0, isTextBox: true });
  s.addText("When it's tight, back Tim David with the bat and Sunil Narine with the ball", { placeholder: "title" });
  s.addText("Then build around them: a chase anchor (Shreyas Iyer or Tilak Varma), a spin squeeze (Krunal, Harpreet Brar, Zampa) and Hazlewood beside Archer.", { placeholder: "body" });
  s.addText("Method fully reproducible: Python (pandas, scikit-learn) on the supplied data pack only.", { x: 0.6, y: 6.3, w: 7.5, h: 0.4, fontSize: 13, color: LIGHT, margin: 0, isTextBox: true });
  circleIcon(s, IC.trophy, 10.0, 2.55, 1.9, PINK, "trophy");

  await pres.writeFile({ fileName: "RR_SupeRR_Selector_Round1.pptx" });
  await applyTheme("RR_SupeRR_Selector_Round1.pptx", THEME);
  console.log("done");
})();
