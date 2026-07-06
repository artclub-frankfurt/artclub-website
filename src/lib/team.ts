export interface TeamMemberLike {
  data: { name: string; order: number };
}

/**
 * Order committee members for display. Ascending by the editor-set `order`
 * field; equal orders fall back to name (A→Z) purely for a deterministic,
 * stable render — `order` is required and normally unique, so this tiebreak
 * is a safety net, not a visible auto-sort.
 */
export function sortTeam<T extends TeamMemberLike>(members: T[]): T[] {
  return [...members].sort(
    (a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name)
  );
}

/**
 * Initials for the photo-less monogram fallback: first + last word's first
 * letter, uppercased. Single word → one letter; blank → ''.
 */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
