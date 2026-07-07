/* ============================================================
   WC2026 Fantasy — mock data (window.WC)
   Mirrors the organizer's screenshots & SPEC.
   ============================================================ */
(function () {
  // ---- helpers ----
  const initials = (n) => n.split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();

  // ---- accent palette for monogram fallbacks (host colors only) ----
  const AV = ["#0A3D91", "#008A52", "#E4002B", "#14151A", "#8A6D1E", "#0A3D91", "#008A52", "#E4002B", "#14151A", "#565D6E", "#0A3D91"];

  // ============================================================
  // TEAMS — Round-of-32 sample. flag = stripe spec for <Flag/>.
  // theme = colors derived from flag (stored, per SPEC §8).
  // ============================================================
  const T = {
    MEX: { code: "MEX", name: "Mexico",      grp: "A", flag: { type: "vert",  c: ["#006847", "#fff", "#CE1126"] }, icon: "🦅", theme: { p: "#006847", s: "#CE1126", flag: "mx" } },
    RSA: { code: "RSA", name: "South Africa",grp: "A", flag: { type: "rsa" },                                       icon: null, theme: { p: "#007749", s: "#FFB915" } },
    KOR: { code: "KOR", name: "South Korea", grp: "A", flag: { type: "kor" },                                       icon: "🐯", theme: { p: "#0A3D91", s: "#CD2E3A" } },
    CZE: { code: "CZE", name: "Czechia",     grp: "A", flag: { type: "tri-l", c: ["#fff", "#D7141A", "#11457E"] },  icon: null, theme: { p: "#11457E", s: "#D7141A" } },
    ARG: { code: "ARG", name: "Argentina",   grp: "C", flag: { type: "horz",  c: ["#75AADB", "#fff", "#75AADB"] }, icon: "☀️", theme: { p: "#75AADB", s: "#F2B33D", flag: "ar" } },
    JPN: { code: "JPN", name: "Japan",       grp: "E", flag: { type: "jpn" },                                       icon: "🌸", theme: { p: "#BC002D", s: "#14151A" } },
    DEU: { code: "DEU", name: "Germany",     grp: "F", flag: { type: "horz",  c: ["#1A1A1A", "#D80027", "#FFCE00"] }, icon: "🦅", theme: { p: "#1A1A1A", s: "#D80027", flag: "de" } },
    SEN: { code: "SEN", name: "Senegal",     grp: "G", flag: { type: "vert",  c: ["#00853F", "#FDEF42", "#E31B23"] }, icon: "🦁", theme: { p: "#00853F", s: "#E31B23" } },
    BRA: { code: "BRA", name: "Brazil",      grp: "H", flag: { type: "bra" },                                       icon: "⭐", theme: { p: "#009C3B", s: "#1C3FAA", flag: "br" } },
    CRO: { code: "CRO", name: "Croatia",     grp: "B", flag: { type: "horz",  c: ["#FF0000", "#fff", "#171796"] }, icon: "🔥", theme: { p: "#171796", s: "#FF0000" } },
    FRA: { code: "FRA", name: "France",      grp: "D", flag: { type: "vert",  c: ["#0055A4", "#fff", "#EF4135"] }, icon: "🐓", theme: { p: "#0055A4", s: "#EF4135" } },
    ESP: { code: "ESP", name: "Spain",       grp: "I", flag: { type: "esp" },                                       icon: "🐂", theme: { p: "#AA151B", s: "#F1BF00" } },
    ENG: { code: "ENG", name: "England",     grp: "J", flag: { type: "eng" },                                       icon: "🦁", theme: { p: "#CE1124", s: "#0A3D91" } },
    POR: { code: "POR", name: "Portugal",    grp: "K", flag: { type: "por" },                                       icon: "🐓", theme: { p: "#006600", s: "#FF0000" } },
    NED: { code: "NED", name: "Netherlands", grp: "L", flag: { type: "horz",  c: ["#AE1C28", "#fff", "#21468B"] }, icon: "🦁", theme: { p: "#21468B", s: "#AE1C28" } },
    MAR: { code: "MAR", name: "Morocco",     grp: "B", flag: { type: "solid", c: ["#C1272D"] },                     icon: "⭐", theme: { p: "#C1272D", s: "#006233" } },
    USA: { code: "USA", name: "United States",grp: "B", flag: { type: "horz",  c: ["#B22234", "#fff", "#3C3B6E"] },  icon: null, theme: { p: "#3C3B6E", s: "#B22234" } },
    CAN: { code: "CAN", name: "Canada",       grp: "C", flag: { type: "vert",  c: ["#D52B1E", "#fff", "#D52B1E"] },  icon: null, theme: { p: "#D52B1E", s: "#A8221A" } },
    ITA: { code: "ITA", name: "Italy",        grp: "D", flag: { type: "vert",  c: ["#008C45", "#fff", "#CD212A"] },  icon: null, theme: { p: "#008C45", s: "#CD212A" } },
    BEL: { code: "BEL", name: "Belgium",      grp: "E", flag: { type: "vert",  c: ["#2D2926", "#FDDA24", "#C8102E"] }, icon: null, theme: { p: "#C8102E", s: "#FDDA24" } },
    URU: { code: "URU", name: "Uruguay",      grp: "F", flag: { type: "horz",  c: ["#fff", "#0038A8", "#fff"] },     icon: null, theme: { p: "#0038A8", s: "#FCD116" } },
    COL: { code: "COL", name: "Colombia",     grp: "G", flag: { type: "horz",  c: ["#FCD116", "#1B3A8B", "#CE1126"] }, icon: null, theme: { p: "#1B3A8B", s: "#FCD116" } },
    SUI: { code: "SUI", name: "Switzerland",  grp: "H", flag: { type: "solid", c: ["#D52B1E"] },                     icon: null, theme: { p: "#D52B1E", s: "#9AA0A6" } },
    DEN: { code: "DEN", name: "Denmark",      grp: "I", flag: { type: "solid", c: ["#C60C30"] },                     icon: null, theme: { p: "#C60C30", s: "#A00C24" } },
    POL: { code: "POL", name: "Poland",       grp: "J", flag: { type: "horz",  c: ["#fff", "#DC143C", "#DC143C"] },  icon: null, theme: { p: "#DC143C", s: "#8C8C8C" } },
    SRB: { code: "SRB", name: "Serbia",       grp: "K", flag: { type: "horz",  c: ["#C6363C", "#0C4076", "#fff"] },  icon: null, theme: { p: "#0C4076", s: "#C6363C" } },
    ECU: { code: "ECU", name: "Ecuador",      grp: "L", flag: { type: "horz",  c: ["#FFD100", "#1B3A8B", "#CE1126"] }, icon: null, theme: { p: "#1B3A8B", s: "#FFD100" } },
    GHA: { code: "GHA", name: "Ghana",        grp: "C", flag: { type: "horz",  c: ["#CE1126", "#FCD116", "#006B3F"] }, icon: null, theme: { p: "#006B3F", s: "#FCD116" } },
    AUS: { code: "AUS", name: "Australia",    grp: "D", flag: { type: "solid", c: ["#00843D"] },                     icon: null, theme: { p: "#00843D", s: "#FFCD00" } },
    CRC: { code: "CRC", name: "Costa Rica",   grp: "E", flag: { type: "horz",  c: ["#002B7F", "#fff", "#CE1126"] },  icon: null, theme: { p: "#002B7F", s: "#CE1126" } },
    NOR: { code: "NOR", name: "Norway",       grp: "F", flag: { type: "horz",  c: ["#BA0C2F", "#fff", "#00205B"] },  icon: null, theme: { p: "#00205B", s: "#BA0C2F" } },
    EGY: { code: "EGY", name: "Egypt",        grp: "G", flag: { type: "horz",  c: ["#CE1126", "#fff", "#1A1A1A"] },  icon: null, theme: { p: "#1A1A1A", s: "#CE1126" } },
  };

  // ============================================================
  // PLAYERS — 11 incl. "You". groupPts mirrors screenshots.
  // koPts = knockout points (combined = group + ko).
  // theme = flag-derived persona (which flag drives their accent).
  // ============================================================
  const mkP = (name, groupPts, koPts, opts = {}) => ({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name, initials: initials(name), groupPts, koPts,
    combined: groupPts + koPts,
    avatar: null,
    color: opts.color,
    teams: opts.teams || [],      // drafted KO team codes (first = theme driver)
    flag: opts.flag || null,      // flag key for theming (ar/de/mx/br) if drafted
    eff: opts.eff || null,        // efficiency footballer pick
    predTotalGoals: opts.predTotalGoals,
  });

  const players = [
    mkP("Diana Chen",    70, 12, { color: AV[0], teams: ["ARG", "NED", "JPN"], flag: "ar", eff: { name: "L. Messi",    team: "ARG", g: 4, a: 5, min: 540, icon: null } }),
    mkP("Hannah Park",   59, 7,  { color: AV[1], teams: ["KOR", "ESP", "MAR"], flag: null, eff: { name: "Son Heung-min", team: "KOR", g: 3, a: 2, min: 540, icon: null } }),
    mkP("Alice Martinez",58, 11, { color: AV[2], teams: ["MEX", "FRA", "SEN"], flag: "mx", eff: { name: "K. Mbappé",   team: "FRA", g: 6, a: 1, min: 510, icon: null } }),
    mkP("Bob Thompson",  57, 9,  { color: AV[3], teams: ["DEU", "ENG", "CRO"], flag: "de", eff: { name: "J. Musiala",  team: "DEU", g: 2, a: 4, min: 500, icon: null } }),
    mkP("Ivan Kowalski", 52, 6,  { color: AV[4], teams: ["POR", "CZE", "RSA"], flag: null, eff: { name: "B. Fernandes",team: "POR", g: 1, a: 3, min: 470, icon: null } }),
    mkP("Julia Santos",  46, 8,  { color: AV[5], teams: ["ESP", "BRA", "MAR"], flag: null, eff: { name: "Pedri",       team: "ESP", g: 1, a: 2, min: 520, icon: null } }),
    mkP("Fiona Murphy",  42, 5,  { color: AV[6], teams: ["NED", "JPN", "SEN"], flag: null, eff: { name: "C. Gakpo",    team: "NED", g: 2, a: 1, min: 480, icon: null } }),
    mkP("Eddie Walsh",   41, 4,  { color: AV[7], teams: ["ENG", "CRO", "RSA"], flag: null, eff: { name: "J. Bellingham",team: "ENG", g: 3, a: 1, min: 540, icon: null } }),
    mkP("Carlos Rivera", 38, 14, { color: AV[8], teams: ["BRA", "FRA", "POR"], flag: "br", eff: { name: "E. Haaland",  team: null,  g: 8, a: 2, min: 540, icon: null } }),
    mkP("Gavin Scott",   30, 3,  { color: AV[9], teams: ["CRO", "SEN", "CZE"], flag: null, eff: { name: "L. Modrić",   team: "CRO", g: 0, a: 3, min: 450, icon: null } }),
    mkP("You",            5, 2,  { color: AV[10],teams: ["MEX", "ESP", "JPN"], flag: "mx", eff: { name: "R. Lewandowski", team: "ESP", g: 2, a: 1, min: 430, icon: null }, you: true }),
  ];
  const byId = Object.fromEntries(players.map(p => [p.id, p]));

  // The four themeable demo personas (for the per-user flag-theme switch)
  const personas = [
    { id: "diana-chen",    label: "Diana Chen",    flag: "ar", team: "ARG", note: "mostly-light flag" },
    { id: "bob-thompson",  label: "Bob Thompson",  flag: "de", team: "DEU", note: "dark flag" },
    { id: "alice-martinez",label: "Alice Martinez",flag: "mx", team: "MEX", note: "high-contrast flag" },
    { id: "carlos-rivera", label: "Carlos Rivera", flag: "br", team: "BRA", note: "green + gold flag" },
  ];

  // ============================================================
  // GROUP A predictions (viewer = Alice persona by default).
  // result = actual; pred = viewer's prediction; played bool.
  // pts computed by scoring rule (+2 outcome, +1 exact).
  // ============================================================
  const scorePred = (ph, pa, rh, ra) => {
    if (rh == null) return null;
    const out = (x, y) => x > y ? 1 : x < y ? -1 : 0;
    let p = 0;
    if (out(ph, pa) === out(rh, ra)) p += 2;
    if (ph === rh && pa === ra) p += 1;
    return p;
  };
  const M = (home, away, time, ph, pa, rh, ra) => ({
    home, away, time, pred: { h: ph, a: pa }, result: rh == null ? null : { h: rh, a: ra },
    pts: scorePred(ph, pa, rh, ra),
  });

  const groupAMatches = [
    M("MEX", "RSA", "Thu Jun 11 · 4:00 PM",  2, 0, 2, 0),
    M("KOR", "CZE", "Thu Jun 11 · 11:00 PM", 3, 1, 1, 1),
    M("CZE", "RSA", "Wed Jun 18 · 11:00 AM", 2, 1, 2, 0),
    M("MEX", "KOR", "Wed Jun 18 · 10:00 PM", 2, 2, 3, 1),
    M("RSA", "KOR", "Tue Jun 24 · 6:00 PM",  0, 1, null, null),
    M("MEX", "CZE", "Tue Jun 24 · 6:00 PM",  1, 0, null, null),
  ];

  // short id (used in picks tables) -> full player id
  const shortId = {
    you: "you", alice: "alice-martinez", bob: "bob-thompson", carlos: "carlos-rivera",
    diana: "diana-chen", eddie: "eddie-walsh", fiona: "fiona-murphy", gavin: "gavin-scott",
    hannah: "hannah-park", ivan: "ivan-kowalski", julia: "julia-santos",
  };

  // Everyone's guess for each group-A match (deterministic pseudo-data).
  // For played matches we also compute each player's points.
  const SHORTS = Object.keys(shortId);
  groupAMatches.forEach((m, mi) => {
    const r = m.result;
    m.others = SHORTS.map((sid, pi) => {
      // deterministic small scores seeded by match + player
      const seed = (mi * 7 + pi * 13);
      const h = (seed % 4), a = ((seed >> 1) % 3);
      const pts = r ? scorePred(h, a, r.h, r.a) : null;
      // give "you" the spec'd prediction from the match itself
      if (sid === "you") return { sid, h: m.pred.h, a: m.pred.a, pts: r ? m.pts : null };
      return { sid, h, a, pts };
    });
  });


  const groups = "ABCDEFGHIJKL".split("");

  // ============================================================
  // TODAY (group phase) — actual results + everyone's picks.
  // ============================================================
  const todayGroup = [
    {
      home: "MEX", away: "RSA", grp: "A", status: "Full time", result: { h: 2, a: 0 },
      picks: [
        { id: "you",   h: 2, a: 0, pts: 3 }, { id: "alice", h: 1, a: 0, pts: 2 },
        { id: "bob",   h: 2, a: 2, pts: 0 }, { id: "carlos",h: 1, a: 1, pts: 0 },
        { id: "diana", h: 0, a: 1, pts: 0 }, { id: "eddie", h: 2, a: 2, pts: 0 },
        { id: "fiona", h: 0, a: 1, pts: 0 }, { id: "gavin", h: 3, a: 0, pts: 2 },
        { id: "hannah",h: 1, a: 2, pts: 0 }, { id: "ivan",  h: 0, a: 0, pts: 0 },
        { id: "julia", h: 3, a: 3, pts: 0 },
      ],
    },
    {
      home: "KOR", away: "CZE", grp: "A", status: "Full time", result: { h: 1, a: 1 },
      picks: [
        { id: "you",   h: 3, a: 1, pts: 0 }, { id: "alice", h: 3, a: 3, pts: 2 },
        { id: "bob",   h: 1, a: 1, pts: 3 }, { id: "carlos",h: 0, a: 0, pts: 2 },
        { id: "diana", h: 2, a: 3, pts: 0 }, { id: "eddie", h: 1, a: 1, pts: 3 },
        { id: "fiona", h: 1, a: 0, pts: 0 }, { id: "gavin", h: 2, a: 2, pts: 2 },
        { id: "hannah",h: 1, a: 1, pts: 3 }, { id: "ivan",  h: 0, a: 1, pts: 0 },
        { id: "julia", h: 2, a: 2, pts: 2 },
      ],
    },
  ];

  // ============================================================
  // KNOCKOUT — Round of 32, "today" June 28.
  // drafters = player ids who drafted each team.
  // ============================================================
  const knockoutToday = {
    round: "Round of 32", date: "Sunday, June 28",
    matches: [
      { home: "MEX", away: "CRO", time: "12:00 PM", status: "upcoming" },
      { home: "ARG", away: "JPN", time: "3:00 PM",  status: "upcoming" },
      { home: "DEU", away: "SEN", time: "6:00 PM",  status: "live", result: { h: 1, a: 0 }, minute: "63'" },
      { home: "BRA", away: "KOR", time: "9:00 PM",  status: "upcoming" },
    ],
  };
  // which player drafted which team
  const draftersOf = (code) => players.filter(p => p.teams.includes(code)).map(p => p.id);

  // ============================================================
  // KNOCKOUT DISCIPLINE — 2nd Side Pot ("Worst Discipline").
  // Admin-entered yellow/red cards accrued in the KNOCKOUT stage
  // only. Card points: yellow = 1 · red = 4. The pot pays the
  // player whose 3 drafted teams rack up the MOST card points.
  // ============================================================
  const koCards = {
    BRA: { y: 4, r: 1 }, FRA: { y: 3, r: 0 }, POR: { y: 2, r: 0 },
    ESP: { y: 3, r: 0 }, ARG: { y: 3, r: 0 }, CRO: { y: 4, r: 0 },
    KOR: { y: 0, r: 1 }, MEX: { y: 2, r: 0 }, NED: { y: 2, r: 0 },
    DEU: { y: 2, r: 0 }, SEN: { y: 2, r: 0 }, CZE: { y: 2, r: 0 },
    JPN: { y: 1, r: 0 }, MAR: { y: 1, r: 0 }, ENG: { y: 1, r: 0 },
    RSA: { y: 1, r: 0 },
  };
  const cardPtsOf = (code) => { const c = koCards[code]; return c ? c.y + c.r * 4 : 0; };
  const playerCardPts = (p) => p.teams.reduce((s, code) => s + cardPtsOf(code), 0);

  // ============================================================
  // KNOCKOUT BRACKET — full 32 teams · R32 → R16 → QF → SF → Final.
  // A slot is either a team code (string) or { win: "<matchId>" }
  // ("winner of that match", TBD until that match has a winner).
  // The four R32 matches D1–D4 mirror knockoutToday (still live/
  // upcoming); the other twelve R32 matches are already decided so
  // teams visibly advance into concrete Round-of-16 matchups.
  // ============================================================
  const bracket = {
    rounds: [
      { id: "r32", label: "Round of 32", short: "R32", matches: [
        { id: "D1", home: "MEX", away: "CRO" },                              // today / upcoming
        { id: "D2", home: "ARG", away: "JPN" },                              // today / upcoming
        { id: "D3", home: "DEU", away: "SEN" },                              // today / live
        { id: "D4", home: "BRA", away: "KOR" },                              // today / upcoming
        { id: "M5",  home: "FRA", away: "MAR", result: { h: 2, a: 0 }, winner: "FRA" },
        { id: "M6",  home: "ESP", away: "RSA", result: { h: 3, a: 1 }, winner: "ESP" },
        { id: "M7",  home: "ENG", away: "CZE", result: { h: 2, a: 0 }, winner: "ENG" },
        { id: "M8",  home: "POR", away: "NED", result: { h: 1, a: 2 }, winner: "NED" },
        { id: "M9",  home: "USA", away: "GHA", result: { h: 2, a: 1 }, winner: "USA" },
        { id: "M10", home: "ITA", away: "CAN", result: { h: 1, a: 0 }, winner: "ITA" },
        { id: "M11", home: "BEL", away: "ECU", result: { h: 2, a: 1 }, winner: "BEL" },
        { id: "M12", home: "URU", away: "SUI", result: { h: 1, a: 0 }, winner: "URU" },
        { id: "M13", home: "COL", away: "POL", result: { h: 2, a: 0 }, winner: "COL" },
        { id: "M14", home: "DEN", away: "AUS", result: { h: 1, a: 0 }, winner: "DEN" },
        { id: "M15", home: "SRB", away: "CRC", result: { h: 1, a: 2 }, winner: "CRC" },
        { id: "M16", home: "NOR", away: "EGY", result: { h: 0, a: 1 }, winner: "EGY" },
      ] },
      { id: "r16", label: "Round of 16", short: "R16", matches: [
        { id: "R1", home: { win: "D1" }, away: { win: "D2" } },
        { id: "R2", home: { win: "D3" }, away: { win: "D4" } },
        { id: "R3", home: { win: "M5" }, away: { win: "M6" } },
        { id: "R4", home: { win: "M7" }, away: { win: "M8" } },
        { id: "R5", home: { win: "M9" }, away: { win: "M10" } },
        { id: "R6", home: { win: "M11" }, away: { win: "M12" } },
        { id: "R7", home: { win: "M13" }, away: { win: "M14" } },
        { id: "R8", home: { win: "M15" }, away: { win: "M16" } },
      ] },
      { id: "qf", label: "Quarter-Finals", short: "QF", matches: [
        { id: "Q1", home: { win: "R1" }, away: { win: "R2" } },
        { id: "Q2", home: { win: "R3" }, away: { win: "R4" } },
        { id: "Q3", home: { win: "R5" }, away: { win: "R6" } },
        { id: "Q4", home: { win: "R7" }, away: { win: "R8" } },
      ] },
      { id: "sf", label: "Semi-Finals", short: "SF", matches: [
        { id: "S1", home: { win: "Q1" }, away: { win: "Q2" } },
        { id: "S2", home: { win: "Q3" }, away: { win: "Q4" } },
      ] },
      { id: "final", label: "Final", short: "Final", matches: [
        { id: "F1", home: { win: "S1" }, away: { win: "S2" } },
      ] },
    ],
  };
  // default team-preference order (≈ FIFA ranking) for the Draft Preferences screen
  const fifaOrder = ["FRA", "ARG", "ESP", "ENG", "BRA", "POR", "NED", "DEU", "CRO", "MAR", "JPN", "KOR", "MEX", "SEN", "CZE", "RSA"];

  // ============================================================
  // PAYOUTS
  // ============================================================
  const payouts = {
    pool: 300, buyin: 30, count: 10,
    inProgress: true,
    items: [
      { kind: "overall", label: "Overall Winner", amount: 240, winner: "diana-chen", detail: "72 pts · GD −1", runnerUp: "alice-martinez" },
      { kind: "side", label: "1st Side Pot — Most Efficient Footballer", amount: 30, winner: "carlos-rivera", detail: "E. Haaland · (8G + 2A) / 540min = 0.0185", runnerUp: "alice-martinez" },
      { kind: "side", label: "2nd Side Pot — Worst Discipline", amount: 30, winner: "carlos-rivera", detail: "13 card pts · BRA, FRA, POR", runnerUp: "julia-santos" },
    ],
  };

  // ============================================================
  // PHASES
  // ============================================================
  const phases = [
    { id: "group",    label: "Group Stage", window: "Jun 11 – 27" },
    { id: "predraft", label: "Pre-Draft",   window: "Jun 28 morning" },
    { id: "knockout", label: "Knockout",    window: "Jun 28 – Jul 19" },
  ];

  window.WC = {
    T, players, byId, personas, groups, groupAMatches, todayGroup,
    knockoutToday, draftersOf, koCards, cardPtsOf, playerCardPts, payouts, phases, shortId, bracket, fifaOrder,
    standby: {
      title: "Draft standby",
      body: "Group stage is locked. The Round-of-32 snake draft runs over SMS on the morning of June 28 — watch your phone. The moment the admin records your picks here, this screen unlocks into your knockout dashboard and the app re-skins to your first team's colors.",
    },
  };
})();
