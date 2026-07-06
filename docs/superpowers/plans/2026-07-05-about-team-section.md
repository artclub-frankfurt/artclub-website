# About → Team Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a CMS-editable team section to `/about` — a heading, a blurb, and a grid of committee-member cards (round photo, name, role) with a discreet burgundy glow on hover.

**Architecture:** A new `team` content collection (one markdown file per member, photo beside the `.md`) mirrors the existing `events` collection. A pure `sortTeam` helper (unit-tested) orders members by a required `order` field. A single `TeamSection.astro` component renders the grid and is placed on `/about` between the prose and the CTA band. Heading/blurb are optional fields on the existing About-page file. Pages CMS gets a `team` collection + media entry so the editor manages everything with no code.

**Tech Stack:** Astro 6.2.1, Tailwind 4 (`@theme` tokens in `src/styles/global.css`), `astro:assets` `<Image>`, `astro:content` glob collections + Zod, vitest, pnpm. CMS: Pages CMS via `.pages.yml`.

## Global Constraints

- Node `>= 22.12.0`; use **pnpm** (`pnpm test`, `pnpm build`, `pnpm dev`).
- **Design system (do not invent styles):** white canvas; burgundy `#690000` is the *only* accent; Times serif (`var(--font-serif)`) for content, sans (`var(--font-sans)`) for chrome/labels; hairline `#e2e2e0`; warm canvas `#fafaf6`. The site uses **no shadows or cards** anywhere — the single discreet hover glow is the only exception introduced here. Compose from existing tokens in `src/styles/global.css`; add no new global tokens.
- `order` is **required** and the **sole sort key** (name is only a deterministic tiebreak for equal values). `photo` is **optional** → monogram fallback. Empty collection → the section renders nothing.
- Mirror the `events` collection conventions exactly (glob loader with `!**/_*.md`, image beside the `.md` as a bare filename, `z.coerce.*` for CMS-sourced scalars).
- Conventional-commit messages. **Every commit message ends with the trailer:**
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- Work on branch `feat/about-team-section` (already created off `origin/main`).

### Pages CMS facts verified for this plan (2026-07-05)

- `filename: "{fields.name}.md"` is valid; Pages CMS auto-slugifies field values. **No pipe/filter syntax** (that was the root cause of the historical `-.md` collapse — do not use it).
- `type: number` supports options `min` / `max` only (confirmed). **Do not** add unconfirmed keys like `step` — invalid config keys have broken this repo's CMS before (PR #30). We use `options: { min: 1 }`.
- Number serialization (YAML number vs quoted string) is **not documented** → we defend with `z.coerce.number()` (same idiom the repo already uses via `z.coerce.date()`), so the schema is correct either way.
- `view` keys confirmed: `fields`, `primary`, `sort`, `default: { sort, order }` with `order: asc|desc`.
- The `lint-content.yml` CI job globs **only** `src/content/events/*.md`; `team` files are out of its scope — no CI conflict.

---

### Task 1: Team ordering + initials helpers (`src/lib/team.ts`)

Pure logic, TDD. Mirrors `src/lib/events.ts` (minimal `*Like` interface, unit-tested with vitest).

**Files:**
- Create: `src/lib/team.ts`
- Test: `src/lib/team.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface TeamMemberLike { data: { name: string; order: number } }`
  - `sortTeam<T extends TeamMemberLike>(members: T[]): T[]` — new array, ascending by `data.order`, ties broken by `data.name` (A→Z via `localeCompare`).
  - `initials(name: string): string` — uppercase first letter of the first and last whitespace-separated words (single word → one letter; empty/whitespace → `''`).

- [ ] **Step 1: Write the failing tests**

Create `src/lib/team.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test`
Expected: FAIL — `team.ts` does not exist / exports undefined.

- [ ] **Step 3: Write the implementation**

Create `src/lib/team.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS — all `sortTeam` and `initials` cases green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/team.ts src/lib/team.test.ts
git commit -m "$(cat <<'EOF'
feat(team): add sortTeam + initials helpers with tests

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `team` content collection + seed data + About copy fields

Register the collection and the two About-page copy fields in Astro's content config, add seed members so the section renders in dev, and add the copy to `about.md`.

**Files:**
- Modify: `src/content.config.ts`
- Create: `src/content/team/lena-hofmann.md`, `src/content/team/amir-haddad.md`, `src/content/team/sofia-ricci.md`
- Modify: `src/content/site/about.md`

**Interfaces:**
- Consumes: nothing from earlier tasks (the component in Task 3 consumes this).
- Produces:
  - `team` collection with entry shape `{ name: string; role: string; order: number; photo?: ImageMetadata; photoAlt?: string }`.
  - `site` schema gains optional `teamHeading?: string`, `teamBlurb?: string`.

- [ ] **Step 1: Add the `team` collection and extend the `site` schema**

Edit `src/content.config.ts`. Add the `team` collection (place it after `events`):

```ts
const team = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/_*.md'], base: './src/content/team' }),
  schema: ({ image }) => z.object({
    name: z.string(),
    role: z.string(),
    // Required, sole sort key. z.coerce.number() so it parses whether Pages
    // CMS writes `order: 1` or `order: "1"` (mirrors z.coerce.date() below).
    order: z.coerce.number(),
    photo: image().optional(),
    photoAlt: z.string().optional(),
  }),
});
```

Add two optional fields to the existing `site` collection schema:

```ts
const site = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/site' }),
  schema: z.object({
    title: z.string().optional(),
    heroTitle: z.string().optional(),
    heroSubtitle: z.string().optional(),
    teamHeading: z.string().optional(),
    teamBlurb: z.string().optional(),
  }),
});
```

Register `team` in the exported collections:

```ts
export const collections = { events, site, team };
```

- [ ] **Step 2: Create three seed members (no photos → monogram fallback)**

`src/content/team/lena-hofmann.md`:

```md
---
name: Lena Hofmann
role: President
order: 1
---
```

`src/content/team/amir-haddad.md`:

```md
---
name: Amir Haddad
role: Vice President
order: 2
---
```

`src/content/team/sofia-ricci.md`:

```md
---
name: Sofia Ricci
role: Treasurer
order: 3
---
```

- [ ] **Step 3: Add the team copy to `about.md`**

Edit `src/content/site/about.md` frontmatter to add the two fields (leave the body untouched):

```md
---
title: About
teamHeading: The committee
teamBlurb: Art Club Frankfurt is run by students, for students. Meet the committee behind the gallery visits, talks, and member nights.
---
```

- [ ] **Step 4: Verify the schema syncs and the build still passes**

Run: `pnpm astro sync`
Expected: no errors; generated content types include `team`.

Run: `pnpm build`
Expected: build succeeds (collection is defined; seed frontmatter satisfies the schema).

Run: `pnpm test`
Expected: still PASS (Task 1 tests unaffected).

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts src/content/team src/content/site/about.md
git commit -m "$(cat <<'EOF'
feat(team): add team content collection, seed members, about copy fields

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `TeamSection.astro` component + placement on `/about`

Render the section (gallery-bare cards, monogram fallback, discreet glow, empty-state guard) and wire it into the About page between the prose and the CTA band.

**Files:**
- Create: `src/components/TeamSection.astro`
- Modify: `src/pages/about.astro`

**Interfaces:**
- Consumes: `sortTeam`, `initials` from `src/lib/team.ts`; the `team` collection and `site`/`about` entry from Task 2.
- Produces: `<TeamSection />` (no props).

- [ ] **Step 1: Create the component**

Create `src/components/TeamSection.astro`:

```astro
---
import { Image } from 'astro:assets';
import { getCollection, getEntry } from 'astro:content';
import { sortTeam, initials } from '../lib/team';

const members = sortTeam(await getCollection('team'));

const about = await getEntry('site', 'about');
const heading = about?.data.teamHeading ?? 'The committee';
const blurb =
  about?.data.teamBlurb ??
  'Art Club Frankfurt is run by students, for students. Meet the committee behind the gallery visits, talks, and member nights.';
---
{members.length > 0 && (
  <section class="team">
    <div class="team__head">
      <h2 class="team__title">{heading}</h2>
      <p class="team__blurb">{blurb}</p>
    </div>
    <ul class="team__grid" role="list">
      {members.map((m) => (
        <li class="team-card">
          <div class="team-card__photo">
            {m.data.photo ? (
              <Image
                src={m.data.photo}
                alt={m.data.photoAlt ?? `Portrait of ${m.data.name}`}
                widths={[140, 280]}
                sizes="140px"
                formats={['avif', 'webp']}
                quality={82}
                class="team-card__img"
              />
            ) : (
              <span class="team-card__monogram" aria-hidden="true">{initials(m.data.name)}</span>
            )}
          </div>
          <p class="team-card__name">{m.data.name}</p>
          <p class="team-card__role">{m.data.role}</p>
        </li>
      ))}
    </ul>
  </section>
)}

<style>
  .team {
    max-width: 940px;
    margin: 0 auto;
    padding: 0 1.5rem 5rem;
  }

  .team__head {
    text-align: center;
    max-width: 640px;
    margin: 0 auto 3.5rem;
  }

  .team__title {
    font-family: var(--font-serif);
    font-size: 1.75rem;
    font-weight: 400;
    line-height: 1.15;
    color: var(--color-ink);
    margin: 0 0 1rem;
    text-wrap: balance;
  }

  .team__blurb {
    font-family: var(--font-serif);
    font-size: 1.0625rem;
    line-height: 1.7;
    color: var(--color-ink-2);
    margin: 0;
    text-wrap: pretty;
  }

  .team__grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2.75rem 2rem;
  }

  @media (min-width: 720px) {
    .team__grid { grid-template-columns: repeat(3, 1fr); }
  }

  .team-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .team-card__photo {
    width: 132px;
    height: 132px;
    border-radius: 50%;
    overflow: hidden;
    margin-bottom: 1.15rem;
    background: var(--color-canvas-warm);
    display: grid;
    place-items: center;
    /* Neutral resting state so the hover glow transitions smoothly */
    box-shadow: 0 0 0 0 rgba(105, 0, 0, 0);
    transition: box-shadow 280ms ease;
  }

  .team-card__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .team-card__monogram {
    font-family: var(--font-serif);
    font-size: 2.25rem;
    font-weight: 400;
    letter-spacing: 0.02em;
    color: var(--color-ink-2);
  }

  .team-card__name {
    font-family: var(--font-serif);
    font-size: 1.1875rem;
    font-weight: 400;
    line-height: 1.25;
    color: var(--color-ink);
    margin: 0 0 0.4rem;
  }

  .team-card__role {
    font-family: var(--font-sans);
    font-size: var(--text-eyebrow);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: var(--tracking-eyebrow);
    color: var(--color-ink-3);
    margin: 0;
  }

  /* Discreet burgundy glow — the one shadow the site allows. Tunable (see plan §Task 3 Step 3). */
  .team-card:hover .team-card__photo {
    box-shadow: 0 0 0 1px rgba(105, 0, 0, 0.18), 0 0 22px 2px rgba(105, 0, 0, 0.16);
  }

  @media (prefers-reduced-motion: reduce) {
    .team-card__photo { transition: none; }
  }

  @media (max-width: 640px) {
    .team-card__photo { width: 112px; height: 112px; }
    .team__grid { gap: 2.25rem 1.25rem; }
  }
</style>
```

- [ ] **Step 2: Place it on the About page**

Edit `src/pages/about.astro`. Add the import at the end of the frontmatter import block (after the `siteConfig` import):

```astro
import TeamSection from '../components/TeamSection.astro';
```

Insert the component between the closing `</article>` and the `<section class="cta-band">`:

```astro
    </div>
  </article>

  <TeamSection />

  <section class="cta-band">
```

- [ ] **Step 3: Verify in build and dev, then tune the glow live**

Run: `pnpm build`
Expected: build succeeds; `getCollection('team')` validates the seed frontmatter and renders the section (three monogram cards).

Run: `pnpm dev`, open `http://localhost:4321/about`. Confirm:
- Heading + blurb from `about.md` render above the grid.
- Three round monogram discs ("LH", "AH", "SR") in order 1→2→3.
- Hovering a card shows a *discreet* burgundy glow on the disc.
- Grid is 2-up on narrow viewports, 3-up ≥ 720px.
- Section sits between the About prose and the "Become a member" band.

**Exercise the real photo path (temporary):** drop any square `.jpg` into `src/content/team/`, set `photo: yourfile.jpg` in one seed member, reload, confirm the round `<Image>` renders with `object-fit: cover` and the glow works on a photo. Then **revert** that change (remove the file and the `photo:` line) so seed members ship photo-less.

**Tune with the user:** the glow `box-shadow` values are a starting point. Adjust intensity/spread on the two `.team-card:hover .team-card__photo` values with the user watching dev before moving on. If the user prefers the role in italic Times serif instead of the sans label, swap `.team-card__role` to `font-family: var(--font-serif); font-style: italic; font-size: 0.9375rem; text-transform: none; letter-spacing: 0; color: var(--color-ink-2);`.

- [ ] **Step 4: Commit**

```bash
git add src/components/TeamSection.astro src/pages/about.astro
git commit -m "$(cat <<'EOF'
feat(team): render team section on the About page

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Pages CMS configuration (`.pages.yml`)

Add the media entry, the `team` collection, and the two About-page team fields, mirroring the existing `events` patterns and the CMS facts verified above.

**Files:**
- Modify: `.pages.yml`

**Interfaces:**
- Consumes: field names must match Task 2's schema exactly (`name`, `role`, `order`, `photo`, `photoAlt`, plus `teamHeading` / `teamBlurb` on the About file).
- Produces: editor UI only; no code consumes this.

- [ ] **Step 1: Add the `team_media` entry**

Under the top-level `media:` list (after `site_media`):

```yaml
  - name: team_media
    label: Team photos
    input: src/content/team
    output: "."
    rename: safe
```

- [ ] **Step 2: Add the `team` collection**

Under `content:` (place after the `events` collection, before the site-page file entries):

```yaml
  - name: team
    label: Team
    type: collection
    path: src/content/team
    # Plain {fields.name}, auto-slugified by Pages CMS → e.g. lena-hofmann.md.
    # No pipe/filter syntax (that caused the historical '-.md' collapse).
    filename: "{fields.name}.md"
    view:
      fields: [order, name, role]
      primary: name
      sort: [order, name]
      default:
        sort: order
        order: asc
    fields:
      - name: name
        label: Name
        type: string
        required: true

      - name: role
        label: Role / title
        type: string
        required: true
        description: "e.g. 'President', 'Events Lead', 'Treasurer'."

      - name: order
        label: Order
        type: number
        required: true
        # Only min/max are documented number options; do NOT add unconfirmed
        # keys (invalid config keys have broken this CMS before).
        options:
          min: 1
        description: "Position in the grid — 1 shows first. Change these numbers to reorder members."

      - name: photo
        label: Photo
        type: image
        required: false
        description: "Optional. A headshot (square images look best — it's shown as a circle). Leave blank to show the member's initials instead."
        options:
          path: src/content/team
          extensions: [jpg, jpeg, png, webp]

      - name: photoAlt
        label: Photo — alt text
        type: string
        required: false
        description: "Optional. One sentence describing the photo (read by screen readers). Defaults to 'Portrait of {name}'."
```

- [ ] **Step 3: Add team copy fields to the existing About-page entry**

In the `about_page` file entry's `fields:` list (after the existing `body` field):

```yaml
      - name: teamHeading
        label: Team section — heading
        type: string
        required: false
        description: "Optional. Heading above the team grid. Defaults to 'The committee'."

      - name: teamBlurb
        label: Team section — blurb
        type: string
        required: false
        description: "Optional. One or two sentences introducing the team, shown below the heading."
```

- [ ] **Step 4: Validate the YAML**

Run: `node -e "const y=require('fs').readFileSync('.pages.yml','utf8'); require('yaml')?.parse?.(y); console.log('parsed ok, length', y.length)"` — if `yaml` isn't installed, instead run:
`pnpm dlx js-yaml .pages.yml > /dev/null && echo "YAML OK"`
Expected: parses without error.

Cross-check every field `name` against `src/content.config.ts` (`name`, `role`, `order`, `photo`, `photoAlt`; `teamHeading`, `teamBlurb`) — they must match exactly.

- [ ] **Step 5: Commit**

```bash
git add .pages.yml
git commit -m "$(cat <<'EOF'
feat(cms): add team collection + about team fields to Pages CMS

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6: Post-merge CMS smoke test (manual, after the PR merges)**

In the Pages CMS UI on the `content-edits` branch: open **Team → add a member**, fill name/role/order, upload a photo, save. Confirm the committed file is `src/content/team/<slugified-name>.md`, that `order:` is written as a bare number, and that the photo landed beside it with a slugified name. Delete the test member. (This can only be verified against the live service; note the result in the PR.)

---

### Task 5: Quality + security gate (`/simplify`, `/security-review`)

Run the two review passes the user requested over the whole branch diff, address findings, and confirm the suite is green.

**Files:** whatever the reviews flag (expected: `src/lib/team.ts`, `src/components/TeamSection.astro`, `.pages.yml`).

- [ ] **Step 1: Simplify pass**

Invoke `/simplify` on the branch diff. Apply the quality/reuse/altitude fixes it proposes (e.g. dedupe, tighter CSS, clearer names). Keep behavior identical.

- [ ] **Step 2: Security review**

Invoke `/security-review` on the pending changes on this branch. Focus areas for this feature: user-supplied content rendering (member `name`/`role`/`photoAlt` and `teamHeading`/`teamBlurb` come from CMS markdown — confirm Astro's default escaping covers them and no `set:html` is introduced), image handling, and the CMS config surface. Address any real findings; note any accepted non-issues.

- [ ] **Step 3: Final verification**

Run: `pnpm test` → PASS.
Run: `pnpm build` → succeeds.
Run: `pnpm dev` → `/about` still renders correctly after any fixes.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor(team): apply simplify + security-review findings

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

(If neither review produced changes, skip this commit and note "no findings" in the PR.)

---

## Self-Review

**Spec coverage:**
- §3 data model → Task 2 (collection schema, `z.coerce.number()`).
- §4 ordering logic + tests → Task 1.
- §5 component (gallery-bare, monogram fallback, discreet glow, empty-state, reduced-motion) → Task 3.
- §6 editable heading/blurb → Task 2 (schema + `about.md`) and Task 3 (render).
- §7 placement → Task 3 Step 2.
- §8 CMS config → Task 4.
- §9 seed data → Task 2 Step 2.
- §10 verification → Steps across Tasks 2–5 (`pnpm test`/`build`/`dev`).
- §11 file manifest → matches Tasks 1–4 file lists.
- §12 tunables (glow, role type) → Task 3 Step 3.
- User-added requirement: `/simplify` + `/security-review` → Task 5.

**Placeholder scan:** No TBD/TODO; every code and CSS step is complete; commands have expected output.

**Type consistency:** `sortTeam` / `initials` / `TeamMemberLike` names identical across Tasks 1 and 3. Field names (`name`, `role`, `order`, `photo`, `photoAlt`, `teamHeading`, `teamBlurb`) identical across `content.config.ts` (Task 2), the component (Task 3), and `.pages.yml` (Task 4). `order` typed as `z.coerce.number()` and rendered/sorted as a number throughout.
