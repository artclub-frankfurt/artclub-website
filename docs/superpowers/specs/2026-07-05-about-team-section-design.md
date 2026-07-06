# About → Team Section (Design Spec)

**Date:** 2026-07-05
**Status:** Approved by user; ready for implementation planning
**Branch:** `feat/about-team-section`

## 1. Summary

Add a "team" section to the `/about` page: a short blurb followed by a grid of
committee members, one card per member. Each card shows a **round photo**, the
member's **name**, and their **role/title**.

The member list must be editable by the non-developer editor through Pages CMS
with no code changes — add, remove, and manually reorder members via a
tightly-typed form, mirroring the existing `events` collection workflow.

Visual direction (chosen via an interactive companion): **Gallery (bare)**
layout — round portraits on whitespace, no card chrome — with a **discreet
burgundy glow** on hover. This is the most native treatment for the site's
restrained editorial/gallery system (white canvas, burgundy as the only accent,
Times serif body, hairline rules, no shadows or cards elsewhere).

## 2. Goals & Non-goals

### Goals

- Team section lives on `/about`, between the prose body and the "Become a
  member" CTA band.
- Editor manages members entirely through Pages CMS: add / remove / manually
  order, upload a photo, set name + role.
- Manual ordering via an explicit, required `order` number — the grid renders
  strictly in that sequence; nothing auto-sorts behind the editor's back.
- Section heading + blurb are editable (not hardcoded).
- Faithful to the existing design system; no new colors, fonts, or shadow
  language beyond the single discreet hover glow.
- Graceful when data is partial (missing photo) or absent (empty collection).

### Non-goals

- No per-member detail pages, bios, or social links (YAGNI — cards are terminal).
- No drag-and-drop reordering (deliberately rejected: it would require a single
  nested-list model, which trades away the clean per-member files and easy photo
  uploads the editor preferred).
- No new global design tokens; the section composes from existing ones.
- The team section is not added to any page other than `/about`.

## 3. Data Model — new `team` content collection

Mirrors the existing `events` collection: one markdown file per member, photo
stored beside the `.md` as a bare filename (exactly as `events` does with
`coverImage`).

Location: `src/content/team/*.md`

Schema (add to `src/content.config.ts`):

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `z.string()` | yes | Display name, e.g. "Lena Hofmann". |
| `role` | `z.string()` | yes | Title, e.g. "President", "Events Lead". |
| `order` | `z.number()` | **yes** | Sole sort key, ascending. Editor-controlled. |
| `photo` | `image()` | optional | Bare filename beside the `.md`. |
| `photoAlt` | `z.string()` | optional | Defaults at render to `Portrait of {name}`. |

```ts
const team = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/_*.md'], base: './src/content/team' }),
  schema: ({ image }) => z.object({
    name: z.string(),
    role: z.string(),
    order: z.number(),
    photo: image().optional(),
    photoAlt: z.string().optional(),
  }),
});
```

Registered in `collections` alongside `events` and `site`.

**Photo is optional (design decision).** A newly-elected member can be listed
before their photoshoot; a missing photo renders a tasteful **serif monogram
disc** (the member's initials on the warm canvas ground) rather than breaking
the build or leaving a hole. The CMS field is also marked not-required so the
editor is never blocked.

## 4. Ordering Logic — `src/lib/team.ts` (+ `team.test.ts`)

Mirrors `src/lib/events.ts`: a pure, unit-tested sort function with a minimal
`*Like` interface for testability.

```ts
export interface TeamMemberLike {
  data: { name: string; order: number };
}

// Ascending by `order`. Equal orders fall back to name (A→Z) purely for a
// deterministic, stable render — not a visible auto-sort, since `order` is
// required and normally unique.
export function sortTeam<T extends TeamMemberLike>(members: T[]): T[] { … }
```

Tests (`src/lib/team.test.ts`, vitest, same style as `events.test.ts`):

- sorts by `order` ascending regardless of input order;
- breaks ties on equal `order` by name A→Z (deterministic);
- returns `[]` for an empty list.

**TDD:** write `team.test.ts` first, then implement `sortTeam` to pass.

## 5. Component — `src/components/TeamSection.astro`

Responsibilities:

1. `getCollection('team')` → `sortTeam(...)`.
2. If the list is empty, render **nothing** (no orphan heading — the section
   simply does not appear).
3. Read heading + blurb from the About page entry (§6) and render them.
4. Render the grid of member cards.

Per-card markup (gallery-bare):

- **Photo:** Astro `<Image>` in a fixed 1:1 circular frame
  (`border-radius: 50%`, `overflow: hidden`, `object-fit: cover`), responsive
  `widths={[140, 280]}`, `formats={['avif','webp']}`, `quality={82}`,
  `sizes="140px"`. Alt = `photoAlt ?? \`Portrait of ${name}\``.
- **Monogram fallback** when `photo` is absent: a same-size disc on
  `--color-canvas-warm` with the member's initials in Times serif, `--color-ink-2`.
- **Name:** Times serif, ~`1.1875rem`, weight 400, `--color-ink`.
- **Role:** sans uppercase micro-label (the site's eyebrow style —
  `--font-sans`, ~`0.625rem`, letter-spacing `0.16em`, `--color-ink-3`).

Layout:

- CSS grid, 2 columns on mobile, 3 columns ≥ 720px, generous `gap`
  (~`2.75rem 2rem`), cards center-aligned.

Hover — **discreet glow** (scoped styles):

- On card hover, the portrait gains a soft burgundy halo, e.g.
  `box-shadow: 0 0 0 1px rgba(105,0,0,0.18), 0 0 22px 2px rgba(105,0,0,0.18);`
  with a ~260–300ms ease. **Exact intensity is a tunable** — dialed in on local
  `pnpm dev` staging before merge (see §10).
- Respect `prefers-reduced-motion`: drop the transition timing (the glow may
  still appear on hover — it is not motion).

Section chrome matches `about.astro` / `FeaturedEvent.astro`: an `eyebrow`
label is **not** required here; heading is a Times serif `<h2>`, blurb is serif
body (`--color-ink-2`), centered, constrained width, consistent vertical rhythm
with the surrounding sections.

## 6. Heading + Blurb — editable via the About page

Rather than a hardcoded heading/blurb, add two optional fields to the existing
About page file so the editor controls the copy in the same form they already
use:

- Add to the `site` collection schema (`content.config.ts`): `teamHeading`
  (string, optional) and `teamBlurb` (string, optional).
- `src/content/site/about.md` frontmatter gains `teamHeading` / `teamBlurb`.
- `TeamSection.astro` reads the About entry and uses
  `teamHeading ?? 'The committee'` and `teamBlurb ?? <sensible default>`.

## 7. Placement — `src/pages/about.astro`

Insert `<TeamSection />` between the `.about-page` article and the `.cta-band`
section. Resulting page flow: **prose body → Team section → "Become a member"
CTA band** (learn about us → meet the team → join).

## 8. CMS — `.pages.yml`

Mirror the `events` patterns already in the file.

1. **Media entry** `team_media`:
   - `input: src/content/team`, `output: "."`, `rename: safe` (slugifies
     uploaded filenames, as `events_media` does).

2. **Collection** `team`:
   - `type: collection`, `path: src/content/team`.
   - `filename: "{fields.name}.md"` → e.g. `lena-hofmann.md` (Pages CMS
     slugifies the value; no pipe/filter syntax — same caveat documented for
     events).
   - `view: { fields: [order, name, role], primary: name, sort: [order],
     default: { order: asc } }` — editor sees members in display order.
   - Fields (all with helpful `description`s):
     - `name` — string, **required**.
     - `role` — string, **required**.
     - `order` — number, **required**. Description: "Position in the grid.
       1 shows first. Change these numbers to reorder members."
     - `photo` — image, not required, `options.path: src/content/team`,
       `extensions: [jpg, jpeg, png, webp]`.
     - `photoAlt` — string, not required.

3. **About page fields:** add `teamHeading` and `teamBlurb` (both string,
   not required) to the existing `about_page` file entry.

## 9. Seed data

Commit 2–3 placeholder members (e.g. President / Vice President / Treasurer)
**without photos** so the monogram fallback and the grid render in local dev and
the glow can be tuned. These are obvious placeholders for the editor to replace
via the CMS. Also set `teamHeading` / `teamBlurb` in `about.md` so the section
renders end-to-end.

## 10. Verification

- `pnpm test` — `sortTeam` unit tests pass.
- `pnpm build` — content collection + images build cleanly.
- `pnpm dev` — eyeball on `/about`: grid layout, round photos, monogram
  fallback, reflow at mobile/desktop widths, and **tune the discreet glow live**
  with the user before merge. Confirm the empty-collection case hides the
  section (temporarily emptying seed data).

## 11. File manifest

**Add**

- `src/content/team/` — 2–3 seed `*.md` members.
- `src/lib/team.ts` — `sortTeam` + `TeamMemberLike`.
- `src/lib/team.test.ts` — vitest cases.
- `src/components/TeamSection.astro`.

**Change**

- `src/content.config.ts` — add `team` collection; add `teamHeading` /
  `teamBlurb` to `site` schema; register `team`.
- `src/content/site/about.md` — add `teamHeading` / `teamBlurb` frontmatter.
- `src/pages/about.astro` — import + place `<TeamSection />`.
- `.pages.yml` — add `team_media`, `team` collection, About-page team fields.

## 12. Tunables / open items

- **Glow intensity** — the exact `box-shadow` values in §5 are a starting point;
  finalize on local staging with the user.
- **Role typography** — rendered as the sans uppercase micro-label by default;
  trivially switchable to italic Times serif (matching event meta) if preferred
  when viewing live.
