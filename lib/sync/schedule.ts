// Determines whether the sync engine should make API calls in the current time window.
// Free-tier API limit is ~100 req/day; we only poll during live match windows.

const PRE_MATCH_MS  = 30 * 60 * 1000;     // start window 30 min before kickoff
const POST_MATCH_MS = 3 * 60 * 60 * 1000; // end window 3 h after kickoff (covers 90min + ET/PK + buffer)

interface MatchWindow {
  kickoff_utc: string;
  status: string;
}

export function isInLiveWindow(matches: MatchWindow[]): boolean {
  const now = Date.now();
  return matches.some((m) => {
    if (m.status === "live") return true;
    const kickoff = new Date(m.kickoff_utc).getTime();
    return now >= kickoff - PRE_MATCH_MS && now <= kickoff + POST_MATCH_MS;
  });
}

/** Returns today's and yesterday's date in YYYY-MM-DD (UTC) for fixture queries. */
export function recentDates(): string[] {
  const d = new Date();
  const today     = d.toISOString().slice(0, 10);
  d.setUTCDate(d.getUTCDate() - 1);
  const yesterday = d.toISOString().slice(0, 10);
  return [today, yesterday];
}
