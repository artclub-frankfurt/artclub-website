import { describe, expect, it } from 'vitest';
import { partitionEvents, type EventLike } from './events';

const make = (slug: string, date: string): EventLike => ({
  slug,
  data: { date: new Date(date) },
});

describe('partitionEvents', () => {
  const today = new Date('2026-05-02T12:00:00Z');

  it('puts events on or after today into upcoming, sorted ascending', () => {
    const events: EventLike[] = [
      make('c', '2026-09-01'),
      make('a', '2026-06-15'),
      make('b', '2026-07-20'),
    ];
    const { upcoming } = partitionEvents(events, today);
    expect(upcoming.map(e => e.slug)).toEqual(['a', 'b', 'c']);
  });

  it('puts events before today into past, sorted descending (most recent first)', () => {
    const events: EventLike[] = [
      make('x', '2026-01-10'),
      make('y', '2026-03-15'),
      make('z', '2025-11-01'),
    ];
    const { past } = partitionEvents(events, today);
    expect(past.map(e => e.slug)).toEqual(['y', 'x', 'z']);
  });

  it('treats events on the same day as today as upcoming', () => {
    const events: EventLike[] = [make('today', '2026-05-02')];
    const { upcoming, past } = partitionEvents(events, today);
    expect(upcoming.map(e => e.slug)).toEqual(['today']);
    expect(past).toEqual([]);
  });

  it('handles an empty list', () => {
    const { upcoming, past } = partitionEvents([], today);
    expect(upcoming).toEqual([]);
    expect(past).toEqual([]);
  });

  it('correctly partitions a mix of upcoming and past', () => {
    const events: EventLike[] = [
      make('past1', '2026-01-10'),
      make('future1', '2026-08-15'),
      make('past2', '2026-04-20'),
      make('future2', '2026-06-05'),
    ];
    const { upcoming, past } = partitionEvents(events, today);
    expect(upcoming.map(e => e.slug)).toEqual(['future2', 'future1']);
    expect(past.map(e => e.slug)).toEqual(['past2', 'past1']);
  });
});
