// Shared UTC day-window + calendar-date helpers, keyed on a user's IANA timezone.
// A "day" here means the [00:00, 24:00) window of a given calendar date *in that
// timezone*, expressed as a UTC range — so filtering matches by kickoff_utc lands
// them on the calendar day the user actually experiences, not the server's UTC day.
// No server-only imports here — safe to use from both server and client components.

/** Calendar date ("YYYY-MM-DD") that `date` falls on, as observed in `tz`. */
export function dateStrInTz(date: Date, tz: string): string {
  return date.toLocaleDateString("sv-SE", { timeZone: tz });
}

/** Today's calendar date string in `tz`. */
export function todayInTz(tz: string, now: Date = new Date()): string {
  return dateStrInTz(now, tz);
}

/**
 * UTC [start, end) window covering one calendar day (`dateStr`, "YYYY-MM-DD") in `tz`.
 * The tz offset is derived from `now` — safe as long as `tz` doesn't cross a DST
 * transition between `now` and `dateStr`, which holds for a single-tournament window.
 */
export function getUtcDayWindow(
  dateStr: string,
  tz: string,
  now: Date = new Date()
): { startUTC: Date; endUTC: Date } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const p = (type: string) => parseInt(parts.find((x) => x.type === type)!.value);
  const localAsUTC = Date.UTC(p("year"), p("month") - 1, p("day"), p("hour") % 24, p("minute"), p("second"));
  const offsetMs = now.getTime() - localAsUTC;

  const startUTC = new Date(new Date(dateStr + "T00:00:00Z").getTime() + offsetMs);
  const endUTC = new Date(startUTC.getTime() + 86_400_000);
  return { startUTC, endUTC };
}

/** Shift a "YYYY-MM-DD" calendar date string by `days` (may be negative). */
export function shiftDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Human label for a calendar date string, e.g. "Monday, June 15". `dateStr` is
 * already a plain calendar date, so we format at noon UTC to avoid any chance of
 * the formatting timezone shifting it onto the adjacent day.
 */
export function formatDayLabel(dateStr: string): string {
  return new Date(dateStr + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}
