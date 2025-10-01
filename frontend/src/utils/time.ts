/** Format an ISO timestamp (e.g. 2025-10-01T16:00:00Z) in the user's local TZ */
export function formatLocalTimestamp(iso: string | number | Date, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return "—";
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const d = new Date(iso); // ok for ISO or epoch
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
    ...opts,
  }).format(d);
}

/** Format a plain time-of-day "HH:MM" (NO timezone math) for display */
export function formatLocalHHMM(hhmm: string, opts?: Intl.DateTimeFormatOptions) {
  if (!hhmm) return "—";
  const [hh, mm] = hhmm.split(":").map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return hhmm;

  // Make a dummy Date in the browser and set the wall clock time.
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  now.setHours(hh, mm, 0, 0);

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
    ...opts,
  }).format(now);
}

/** Format a DATE coming from the API as "YYYY-MM-DD" (no timezone) */
export function formatDateYYYYMMDD(dateStr: string, opts?: Intl.DateTimeFormatOptions) {
  if (!dateStr) return "—";
  // Treat as a date-only value; don't convert with timezone
  // Create a Date from the parts to show nice locale text without TZ shift
  const [y, m, d] = dateStr.split("-").map(Number);
  const local = new Date(y, (m ?? 1) - 1, d ?? 1);
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric", ...opts }).format(local);
}