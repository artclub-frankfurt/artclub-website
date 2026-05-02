export interface EventLike {
  slug: string;
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
