import { describe, expect, it } from 'vitest';
import { sortTeam, initials, type TeamMemberLike } from './team';

const make = (name: string, order: number): TeamMemberLike => ({ data: { name, order } });

describe('sortTeam', () => {
  it('sorts by order ascending regardless of input order', () => {
    const members = [make('Sofia', 3), make('Lena', 1), make('Amir', 2)];
    expect(sortTeam(members).map(m => m.data.name)).toEqual(['Lena', 'Amir', 'Sofia']);
  });

  it('breaks ties on equal order by name A→Z', () => {
    const members = [make('Bruno', 1), make('Anna', 1)];
    expect(sortTeam(members).map(m => m.data.name)).toEqual(['Anna', 'Bruno']);
  });

  it('does not mutate the input array', () => {
    const members = [make('Sofia', 3), make('Lena', 1)];
    sortTeam(members);
    expect(members.map(m => m.data.name)).toEqual(['Sofia', 'Lena']);
  });

  it('handles an empty list', () => {
    expect(sortTeam([])).toEqual([]);
  });
});

describe('initials', () => {
  it('takes first + last initial for multi-word names', () => {
    expect(initials('Lena Hofmann')).toBe('LH');
  });

  it('preserves accented capitals', () => {
    expect(initials('Mateo Álvarez')).toBe('MÁ');
  });

  it('returns one letter for a single-word name', () => {
    expect(initials('Cher')).toBe('C');
  });

  it('ignores extra whitespace and uses first + last word', () => {
    expect(initials('  Anna  Maria  Weber ')).toBe('AW');
  });

  it('returns empty string for empty/whitespace input', () => {
    expect(initials('   ')).toBe('');
  });
});
