// Static per-team color map for per-user brand theming.
// primary  → dominant color (headers, nav, buttons)
// secondary → accent (wave strip, --brand-2 highlights)
// Colors match official kit/flag primary; non-white secondaries for visible accents.
// Edit here if a color needs tweaking — no migration required.

export const TEAM_COLORS: Record<string, [string, string]> = {
  ALG: ["#006233", "#D21034"], // Algeria: green flag / red crescent
  ARG: ["#74ACDF", "#F2B33D"], // Argentina: celeste / sun gold
  AUS: ["#00843D", "#FFD700"], // Australia: Socceroos green / gold
  AUT: ["#ED2939", "#BF0A30"], // Austria: red / deeper red
  BEL: ["#000000", "#F7D117"], // Belgium: black kit / Belgian yellow
  BIH: ["#002395", "#FFCD00"], // Bosnia: blue / yellow diamond
  BRA: ["#009C3B", "#FFDF00"], // Brazil: green / yellow
  CPV: ["#003893", "#CF2027"], // Cabo Verde: navy / red
  CAN: ["#FF0000", "#8B0000"], // Canada: maple red / deep red
  CIV: ["#F77F00", "#009A44"], // Côte d'Ivoire: orange / green
  COD: ["#007FFF", "#CE1020"], // DR Congo: blue / red
  COL: ["#FCD116", "#003087"], // Colombia: yellow / blue
  CRO: ["#FF0000", "#00205B"], // Croatia: red / dark blue crest
  CUR: ["#003F87", "#F7D116"], // Curaçao: deep blue / yellow
  CZE: ["#D7141A", "#11457E"], // Czechia: red / blue
  ECU: ["#FFD100", "#003580"], // Ecuador: yellow / blue
  EGY: ["#CE1126", "#000000"], // Egypt: red / black
  ENG: ["#C8102E", "#012169"], // England: St George red / Union blue
  FRA: ["#002395", "#ED2939"], // France: blue / red tricolore
  GER: ["#1A1A1A", "#FFCE00"], // Germany: black kit / gold flag
  GHA: ["#C90B16", "#FCD116"], // Ghana: red / gold star
  HAI: ["#00209F", "#D21034"], // Haiti: blue / red
  IRN: ["#239F40", "#DA0000"], // IR Iran: green / red
  IRQ: ["#CE1126", "#007A3D"], // Iraq: red / green
  JPN: ["#BC002D", "#6B0013"], // Japan: crimson / deep crimson
  JOR: ["#007A3D", "#CE1126"], // Jordan: green / red
  MEX: ["#006847", "#CE1126"], // Mexico: green / red
  MAR: ["#C1272D", "#006233"], // Morocco: red / green
  NED: ["#FF6600", "#003DA5"], // Netherlands: orange / blue
  NZL: ["#000000", "#CC0000"], // New Zealand: black / red
  NOR: ["#EF2B2D", "#003680"], // Norway: red / blue cross
  PAN: ["#DA121A", "#1C3F94"], // Panama: red / blue
  PAR: ["#D52B1E", "#003DA5"], // Paraguay: red / blue
  POR: ["#C8102E", "#006600"], // Portugal: red kit / green flag
  QAT: ["#8D1B3D", "#5C1130"], // Qatar: maroon / deep maroon
  KSA: ["#006C35", "#004A23"], // Saudi Arabia: green / deep green
  SCO: ["#003366", "#FFD700"], // Scotland: dark blue / gold lion
  SEN: ["#00853F", "#FDEF42"], // Senegal: green / yellow
  RSA: ["#007A4D", "#FFB81C"], // South Africa: green / gold
  KOR: ["#CD2E3A", "#0047A0"], // South Korea: red / blue taeguk
  ESP: ["#AA151B", "#F1BF00"], // Spain: red / yellow
  SWE: ["#006AA7", "#FECC02"], // Sweden: blue / yellow
  SUI: ["#FF0000", "#A30000"], // Switzerland: red / deep red
  TUN: ["#E70013", "#A30000"], // Tunisia: red / deep red
  TUR: ["#E30A17", "#A00010"], // Turkiye: red / deep red
  URU: ["#5AADF7", "#F2C94C"], // Uruguay: sky blue / sun gold
  USA: ["#B22234", "#3C3B6E"], // USA: Old Glory red / navy
  UZB: ["#0055A5", "#1EB53A"], // Uzbekistan: blue / green
};

// Fallback for any team not in the map (shouldn't happen for WC26).
export const DEFAULT_PRIMARY   = "#0A3D91";
export const DEFAULT_SECONDARY = "#E4002B";

// FIFA code → ISO 3166-1 alpha-2 (lowercase) for flag CDN lookups.
// Subdivision codes (gb-eng, gb-sct) are supported by flagcdn.com.
const FIFA_TO_ISO2: Record<string, string> = {
  ALG: "dz", ARG: "ar", AUS: "au", AUT: "at", BEL: "be",
  BIH: "ba", BRA: "br", CPV: "cv", CAN: "ca", CIV: "ci",
  COD: "cd", COL: "co", CRO: "hr", CUR: "cw", CZE: "cz",
  ECU: "ec", EGY: "eg", ENG: "gb-eng", FRA: "fr", GER: "de",
  GHA: "gh", HAI: "ht", IRN: "ir", IRQ: "iq", JPN: "jp",
  JOR: "jo", MEX: "mx", MAR: "ma", NED: "nl", NZL: "nz",
  NOR: "no", PAN: "pa", PAR: "py", POR: "pt", QAT: "qa",
  KSA: "sa", SCO: "gb-sct", SEN: "sn", RSA: "za", KOR: "kr",
  ESP: "es", SWE: "se", SUI: "ch", TUN: "tn", TUR: "tr",
  URU: "uy", USA: "us", UZB: "uz",
};

// Returns a 1280-px-wide flag PNG URL for the given FIFA code, or null if unknown.
// Prefers a locally stored flag_url (DB column) when provided; falls back to CDN.
export function getFlagUrl(code: string, dbFlagUrl?: string | null): string | null {
  if (dbFlagUrl) return dbFlagUrl;
  const iso2 = FIFA_TO_ISO2[code];
  return iso2 ? `https://flagcdn.com/w1280/${iso2}.png` : null;
}
