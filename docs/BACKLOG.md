# Backlog

Prioritized follow-ups for the Art Club Frankfurt website. Pick from the top down.

## Next session

### 🟢 Wire the real Google Form URL
- When the membership form exists, paste its URL into `src/data/site.json` → `googleFormUrl`
- "Become a member" + "Join us" buttons become functional immediately

## Later

### 🟠 Visual design pass — in progress
- Brief: `docs/superpowers/specs/2026-05-03-design-brief.md`
- Milestone 1 (design tokens + BaseLayout chrome) — ✅ shipped via PR #5
- Milestone 2 (home page: manifesto hero + featured event + modular Instagram dispatcher) — in flight
- Remaining: events index, event detail, about + contact, polish + responsive refinement

### 🟠 Real event content
- Replace `2026-06-15-spring-gala.md` and `2026-03-10-welcome-night.md` in `src/content/events/` with actual events
- Editor template + workflow: README §6 ("Add a new event")

### 🟠 Real content writing
- `src/content/site/home.md` — hero paragraph
- `src/content/site/about.md` — mission, team, what the club does
- `src/content/site/contact.md` — location, additional contact channels

### 🟢 JSON-LD `Event` structured data on event detail pages
- Inline `<script type="application/ld+json">` per `/events/<slug>`
- Schema.org/Event with `name`, `startDate`, `location`, `url` (Luma), `image`
- Lets Google show event rich results (date pill, "near you" cards, Google Calendar quick-add)
- ~20 lines per page; pure addition, no UI change

### 🟢 Sitemap + RSS
- `@astrojs/sitemap` — auto-generates `/sitemap-index.xml` at build time, zero runtime
- `@astrojs/rss` — exposes `/events.xml` so enthusiasts can subscribe to upcoming events in their feed reader
- Both first-party Astro integrations, exact-pinned, build-time only — fits the strict-deps posture

### 🟢 Per-page Open Graph images
- Default OG image is `public/images/logo-banner.jpg` (set in BaseLayout). Good enough for the home page and the static pages.
- Per-event OG could be the event's `coverImage` if one is added to the schema, or a build-time generated card with the event title in TNR on burgundy. Defer until events have cover images.

### 🟢 Higher-resolution hero photo
- Current `src/assets/hero-campus.jpg` is 1240×827 px. Astro now optimizes it (srcset + AVIF/WebP) but cannot upscale, so the hero is soft on retina laptops/desktops.
- Source the original (anything ≥2400 px wide, JPG, same composition) and replace the file in `src/assets/`.

### 🟢 Analytics (optional, later)
- Vercel Web Analytics is privacy-friendly + free tier + one-line addition (`@vercel/analytics` in the BaseLayout). Or Plausible / Cloudflare Web Analytics as alternatives.
- No cookie banner needed (no PII).

### 🟢 Add PR preview deployments (optional)
- Currently only `main` deploys; PR branches don't get preview URLs
- Easy to add: a second workflow file (`preview.yml`) triggering on `pull_request`, running `vercel deploy` (no `--prod`), commenting the URL on the PR
- Skip until a designer or non-dev reviewer actually needs visual previews

## Routine maintenance

These aren't projects, just things to glance at periodically.

- **Rotate `VERCEL_TOKEN` annually** (or sooner if the Vercel team owner changes). At <https://vercel.com/account/tokens>, revoke the old token, create a new one, update the GitHub repo secret. ~2 min. The deploy workflow continues working without redeploying.
- **Glance at GitHub Actions usage** every few months: GitHub repo → Actions → top right "Usage". Public repos get unlimited minutes, but worth a sanity check that nothing's looping.
- **Bump dependencies** every 1-3 months: `pnpm update --latest` on a feature branch, run `pnpm test && pnpm build`, open a PR. Astro and Tailwind major bumps may require config tweaks — read their migration guides first.
- **Review the `Done so far` list** below when handing the project to a new tech contact: confirms everything that's currently true so they know what they're inheriting.

## Done so far

- ✅ Astro 6 + Tailwind v4 scaffold, all deps strictly pinned, `.npmrc` enforces save-exact
- ✅ Content collections (events + site pages) with Zod-validated schemas
- ✅ All 5 page routes (Home, Events index, Event detail, About, Contact)
- ✅ Responsive nav with hamburger menu on mobile (< 768px)
- ✅ "Become a member" CTA in nav, linking to Google Form (placeholder URL)
- ✅ Per-event Instagram photo grid component
- ✅ Site config wired with real values: name "Art Club Frankfurt", tagline, email, IG handle, custom domain
- ✅ Pushed to <https://github.com/Tseringw/artclub-website>
- ✅ Comprehensive README + spec + implementation plan in `docs/`
- ✅ behold.so Instagram carousel live on home page (widget ID `0NpO39PsREMoYX8tp042`)
- ✅ Live on `https://artclub-frankfurt.de` via Vercel; DNS records `A @ → 216.198.79.1` and `CNAME www → cname.vercel-dns.com` at Strato; Zoho email untouched
- ✅ Branch protection on `main`; PR-based code workflow documented in README §4.1
- ✅ Deploy via GitHub Actions (`.github/workflows/deploy.yml`) using a Vercel token; Vercel git integration disconnected. Architectural choice for sovereignty + portability + test-gating (see README §5).
- ✅ Repo made public — git history scanned clean of secrets; unlocks free unlimited Actions minutes; aligns with student-association open ethos.
