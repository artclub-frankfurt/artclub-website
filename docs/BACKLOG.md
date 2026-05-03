# Backlog

Prioritized follow-ups for the Art Club Frankfurt website. Pick from the top down.

## Next session

### 🟢 Wire the real Google Form URL
- When the membership form exists, paste its URL into `src/data/site.json` → `googleFormUrl`
- "Become a member" + "Join us" buttons become functional immediately

## Later

### 🔴 Visual design pass
- Invoke the `frontend-design` skill (mentioned in spec §3)
- Brand identity, typography, color, hero treatment, spacing
- All structural code is already in place — this is presentation-only

### 🟠 Real event content
- Replace `2026-06-15-spring-gala.md` and `2026-03-10-welcome-night.md` in `src/content/events/` with actual events
- Editor template + workflow: README §6 ("Add a new event")

### 🟠 Real content writing
- `src/content/site/home.md` — hero paragraph
- `src/content/site/about.md` — mission, team, what the club does
- `src/content/site/contact.md` — location, additional contact channels

### 🟢 SEO + Open Graph
- Add `description` to each page via `BaseLayout` props
- Generate per-page Open Graph images (better preview cards in WhatsApp/IG DMs)
- Tools: `@astrojs/sitemap` (sitemap.xml), build-time OG image generation

### 🟢 Analytics (optional, later)
- Vercel Web Analytics is privacy-friendly + free tier + one-line addition (`@vercel/analytics` in the BaseLayout). Or Plausible / Cloudflare Web Analytics as alternatives.
- No cookie banner needed (no PII).

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
- ✅ Deploy via GitHub Actions (`.github/workflows/deploy.yml`) using a Vercel token, bypassing Hobby's commit-author check; Vercel git integration disconnected
