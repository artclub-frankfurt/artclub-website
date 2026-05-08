export interface EventLike {
  id: string;
  data: { date: Date };
}

export interface Partitioned<T extends EventLike> {
  upcoming: T[];
  past: T[];
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function partitionEvents<T extends EventLike>(
  events: T[],
  now: Date = new Date()
): Partitioned<T> {
  const cutoff = startOfDay(now);

  const upcoming = events
    .filter(e => startOfDay(e.data.date) >= cutoff)
    .sort((a, b) => a.data.date.getTime() - b.data.date.getTime());

  const past = events
    .filter(e => startOfDay(e.data.date) < cutoff)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return { upcoming, past };
}

export function isEventPast(date: Date, now: Date = new Date()): boolean {
  return startOfDay(date) < startOfDay(now);
}

export function isRegistrationClosed(
  event: { data: { date: Date; registrationClosed?: boolean } },
  now: Date = new Date()
): boolean {
  return event.data.registrationClosed || isEventPast(event.data.date, now);
}

/**
 * Editorial eyebrow for an event row: "JUNE 15 · 5:30 PM" if a time is given,
 * otherwise "JUNE 15 · 2026". Year is shown only when no time is set, to keep
 * the row uncluttered while still disambiguating multi-year listings.
 */
export function formatEventEyebrow(date: Date, time?: string): string {
  const month = date.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
  const day = date.getDate();
  const detail = time?.trim() || String(date.getFullYear());
  return `${month} ${day} · ${detail}`;
}
