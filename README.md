# Tsering — Student Association Website

A simple static site for a student association. Wraps Instagram, Luma, and a Google Form into a small set of editable pages.

## 1. What this is

- **Home** — short intro, latest Instagram posts (carousel), upcoming events, "Join us" form button.
- **Events** — index page plus a detail page per event, with a registration button to Luma and a photo grid (Instagram embeds) added after the event.
- **About** — free-form prose page.
- **Contact** — email and social links.

The site is fully static. There is no login, no database, no backend.

## 2. Tech stack & why

| Area | Choice | Why |
|---|---|---|
| Framework | Astro 6.x | Best SSG for content-heavy sites; great markdown support; ships almost zero JS. |
| Styling | Tailwind CSS v4 | Utility-first; fast iteration; well-audited; no design-system overhead. |
| Hosting | Cloudflare Pages | Free, generous bandwidth, deploys on `git push`, easy custom domain. |
| Repo | GitHub | The github.com web editor is the editor's primary content tool. |
| Package manager | pnpm | Default standard; works on CF Pages. |
| Site config | JSON + Zod | Native TS JSON import (no parser dep); validated at build time. |

Alternatives considered: Next.js (heavier, app-oriented), Hugo (less ergonomic for embeds), Vercel (equivalent to CF Pages — pick if preferred), Decap CMS (rejected — adds maintenance surface for marginal UX gain on a mostly-read-only site), YAML for site config (rejected — would add `js-yaml` for marginal editor UX gain on an "almost-never-edited" file).

## 2.1 Security & dependency policy

This site follows a strict-by-default dependency posture:

- **Exact pinning.** No `^` or `~` in `package.json`. `.npmrc` enforces `save-exact=true` so `pnpm add` always writes pinned versions.
- **Locked transitive deps.** `pnpm-lock.yaml` is committed.
- **Minimal direct deps.** Total: `astro`, `@tailwindcss/vite`, `tailwindcss` (runtime); `vitest` (dev only). Nothing exotic.
- **No runtime third-party JS via npm.** External JS comes from two `<script>` tags loaded by URL: behold.so on the home page, Instagram `embed.js` on event detail pages with photos. Both render gracefully if the script fails (carousel hidden / "View on Instagram" link fallback).
- **Upgrades are explicit.** To bump a dep, run `pnpm update <name> --latest`, review the changelog, run `pnpm test && pnpm build`, then commit with the version change in the message.

## 3. Repo layout

```
src/
├── content.config.ts          # collection schemas
├── content/
│   ├── events/                # one .md per event
│   └── site/                  # home.md, about.md, contact.md
├── data/
│   └── site.json              # site-wide config
├── lib/
│   ├── siteConfig.ts          # loads + validates site.json
│   └── events.ts              # event sorting/filtering
├── layouts/
│   └── BaseLayout.astro
├── components/                # presentational Astro components
├── pages/                     # routes
└── styles/global.css
```

## 4. Local dev

Prerequisites: Node 22+, pnpm 9+.

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # production build into ./dist
pnpm test         # run unit tests (vitest)
```

## 5. Deploy

### One-time setup (Cloudflare Pages)

1. Push the repo to GitHub.
2. In the Cloudflare dashboard → Workers & Pages → Create application → Pages → Connect to Git.
3. Select the repo. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `pnpm build`
   - **Build output directory:** `dist`
   - **Environment variable:** `NODE_VERSION = 22` (or higher)
4. Save and deploy. The first deploy gives you a `<project>.pages.dev` URL.
5. Add your custom domain: project → Custom domains → Set up. Update DNS as instructed.

### Updates

Push to `main` → CF Pages rebuilds in ~30 seconds. Branches and PRs get preview deploys automatically.

### Rollback

CF Pages dashboard → Deployments → click any prior deploy → "Rollback to this deployment".

## 6. Content editing guide (for non-devs)

All content is edited on github.com. You don't need to install anything.

### Edit an existing page

1. Go to the repo on github.com.
2. Click into `src/content/site/` → click the file you want to edit (e.g. `about.md`).
3. Click the pencil icon.
4. Edit the text. Anything between `---` lines at the top is structured data (don't change the field names). Below that, use [markdown](https://www.markdownguide.org/basic-syntax/) for headings, lists, links, etc.
5. Scroll to the bottom → "Commit changes…" → write a short message → "Commit changes".
6. Wait ~30 seconds, then refresh the live site.

### Add a new event

1. Go to `src/content/events/` on github.com → "Add file" → "Create new file".
2. Name it like `2026-09-15-autumn-mixer.md` (date prefix keeps the folder organized; the URL slug comes from the full filename minus `.md`).
3. Paste this template and fill it in:

   ```markdown
   ---
   title: "Your Event Title"
   date: 2026-09-15
   lumaUrl: "https://lu.ma/your-luma-event-id"
   ---

   The full description of your event goes here. You can use multiple
   paragraphs, **bold**, *italic*, [links](https://example.com), and lists:

   - one
   - two
   ```

4. Commit. The event appears on the site within ~30 seconds.

### Add post-event photos

1. After the event, post the photos to Instagram as usual.
2. For each photo (or carousel), copy its Instagram URL (e.g. `https://www.instagram.com/p/ABCDE/`).
3. On github.com, open the event's `.md` file → click the pencil icon.
4. Add an `instagramPosts:` list in the frontmatter (between the `---` lines):
   ```yaml
   instagramPosts:
     - "https://www.instagram.com/p/ABCDE/"
     - "https://www.instagram.com/p/FGHIJ/"
   ```
5. Commit. Photos appear on the event detail page within ~30 seconds.

### Change site config

`src/data/site.json` holds site-wide settings: email, social links, Google Form URL, behold widget ID. Edit on github.com the same way.

**JSON syntax rules (different from markdown):**
- Every key must be in `"double quotes"`.
- Strings must be in `"double quotes"`.
- No comments (lines starting with `//` or `#`) — JSON does not allow them.
- No trailing commas after the last item in an object or array.
- If you break these rules, the next deploy will fail with a clear error message naming the field and the problem. Just fix and re-commit.

**Field reference:**
- `siteName` — site name shown in the header and tab title.
- `tagline` — short phrase used near the hero (optional in design).
- `contactEmail` — primary email; appears in footer and contact page.
- `googleFormUrl` — full URL of the Google Form for membership signup.
- `beholdWidgetId` — the widget ID from your behold.so dashboard. While set to `"REPLACE_ME"`, the home page shows a placeholder instead of the carousel.
- `socialLinks.instagram` — full URL to the association's Instagram profile.
- `socialLinks.email` — same as `contactEmail` (kept separate so social blocks can reference it as a "social link").

## 7. Integrations reference

| Service | What it does | Where it's configured | How to swap |
|---|---|---|---|
| **behold.so** | Instagram carousel on the home page | `beholdWidgetId` in `src/data/site.json`; widget script in `src/components/InstagramCarousel.astro` | Replace the script + data attribute with snapwidget.com (or similar) markup. One file. |
| **Instagram embeds** | Per-event photo grids | `instagramPosts:` array in each event's frontmatter | N/A — Instagram-native |
| **Luma** | Event registration | `lumaUrl` in each event's frontmatter | N/A — just swap the URL |
| **Google Form** | Membership signup | `googleFormUrl` in `src/data/site.json` | Swap the URL |
| **Cloudflare Pages** | Hosting + CI/CD | CF dashboard | Move to Vercel: import the repo, set build command `pnpm build`, output dir `dist` |

## 8. Common maintenance tasks

- **Change contact email:** edit `contactEmail` and `socialLinks.email` in `src/data/site.json`.
- **Swap the Instagram widget service:** edit `src/components/InstagramCarousel.astro`. Replace the `<div>` + `<script>` with the new service's snippet. Update `site.json` if the widget ID format changes.
- **Add a new top-level page (e.g. `/sponsors`):**
  1. Create `src/content/site/sponsors.md` with frontmatter + body.
  2. Create `src/pages/sponsors.astro` mirroring `about.astro`.
  3. Add a link to the new page in the nav inside `src/layouts/BaseLayout.astro`.
- **Change the domain:** update `site:` in `astro.config.mjs`, then attach the new domain in CF Pages.
- **Disable an event temporarily:** delete the event's `.md` file (keep the `.md` somewhere else if you'll restore it).

## 9. Troubleshooting

- **Build fails on CF Pages but works locally:** check the Node version env var (set `NODE_VERSION = 22` or higher in the CF dashboard).
- **Deploy stuck "in progress":** trigger a new deploy from the dashboard, or push an empty commit (`git commit --allow-empty -m "trigger deploy"`).
- **Instagram embeds show only "View on Instagram" links:** Instagram's `embed.js` failed to load (rate-limited, blocked, or post is private). Refresh; if persistent, the post may be from a private account.
- **behold widget shows nothing:** check `beholdWidgetId` in `site.json` matches the ID in the behold dashboard, and that the connected Instagram account has at least one public post.
- **Frontmatter validation error in build log:** check that the event's frontmatter matches the schema in `src/content.config.ts` — `date` must be a valid date, `lumaUrl` must be a valid URL.

## 10. Specs and plans

Design and implementation history live in:
- `docs/superpowers/specs/` — design specs
- `docs/superpowers/plans/` — implementation plans
