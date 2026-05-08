import { describe, expect, it } from 'vitest';
import {
  partitionEvents,
  formatEventEyebrow,
  isEventPast,
  isRegistrationClosed,
  type EventLike,
} from './events';

const make = (id: string, date: string): EventLike => ({
  id,
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
    expect(upcoming.map(e => e.id)).toEqual(['a', 'b', 'c']);
  });

  it('puts events before today into past, sorted descending (most recent first)', () => {
    const events: EventLike[] = [
      make('x', '2026-01-10'),
      make('y', '2026-03-15'),
      make('z', '2025-11-01'),
    ];
    const { past } = partitionEvents(events, today);
    expect(past.map(e => e.id)).toEqual(['y', 'x', 'z']);
  });

  it('treats events on the same day as today as upcoming', () => {
    const events: EventLike[] = [make('today', '2026-05-02')];
    const { upcoming, past } = partitionEvents(events, today);
    expect(upcoming.map(e => e.id)).toEqual(['today']);
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
    expect(upcoming.map(e => e.id)).toEqual(['future2', 'future1']);
    expect(past.map(e => e.id)).toEqual(['past2', 'past1']);
  });
});

describe('isEventPast', () => {
  const today = new Date('2026-05-02T12:00:00Z');

  it('returns false for an event later today', () => {
    expect(isEventPast(new Date('2026-05-02T20:00:00Z'), today)).toBe(false);
  });

  it('returns true for an event yesterday', () => {
    expect(isEventPast(new Date('2026-05-01'), today)).toBe(true);
  });

  it('returns false for a future event', () => {
    expect(isEventPast(new Date('2026-06-01'), today)).toBe(false);
  });
});

describe('isRegistrationClosed', () => {
  const today = new Date('2026-05-02T12:00:00Z');

  it('returns true when the event date is past', () => {
    const event = { data: { date: new Date('2026-04-01') } };
    expect(isRegistrationClosed(event, today)).toBe(true);
  });

  it('returns false when upcoming and registrationClosed is unset', () => {
    const event = { data: { date: new Date('2026-06-01') } };
    expect(isRegistrationClosed(event, today)).toBe(false);
  });

  it('returns false when upcoming and registrationClosed is false', () => {
    const event = { data: { date: new Date('2026-06-01'), registrationClosed: false } };
    expect(isRegistrationClosed(event, today)).toBe(false);
  });

  it('returns true when registrationClosed is true even if upcoming', () => {
    const event = { data: { date: new Date('2026-06-01'), registrationClosed: true } };
    expect(isRegistrationClosed(event, today)).toBe(true);
  });
});

describe('formatEventEyebrow', () => {
  it('renders MONTH DAY · YEAR when no time is given', () => {
    expect(formatEventEyebrow(new Date('2026-06-15T00:00:00Z'))).toBe('JUNE 15 · 2026');
  });

  it('renders MONTH DAY · TIME when a time string is given', () => {
    expect(formatEventEyebrow(new Date('2026-05-06T00:00:00Z'), '5:30 PM')).toBe('MAY 6 · 5:30 PM');
  });

  it('treats whitespace-only time as missing', () => {
    expect(formatEventEyebrow(new Date('2026-05-06T00:00:00Z'), '   ')).toBe('MAY 6 · 2026');
  });
});
