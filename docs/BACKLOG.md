# Backlog

Prioritized follow-ups for the Art Club Frankfurt website. Pick from the top down.

## Next session

### 🟡 Wire the Instagram carousel via behold.so
- Sign up at <https://app.behold.so/signup> (free, any email)
- Add Instagram → log in as `@artclub_frankfurt` and authorize behold
- Optional but recommended: switch the IG account to **Creator** type first (free, in IG → Settings → Account → "Switch to Professional Account") for a more robust API connection
- Create a widget (Basic Carousel style is fine to start) → copy the widget ID (UUID-shaped, also visible in the embed snippet's `data-behold-id="..."` attribute)
- Paste into `src/data/site.json` → `beholdWidgetId`
- Commit, push → home page goes from "not configured yet" placeholder to live carousel
- Time: ~5-10 min interactive setup, then 30 sec to wire

### 🟡 Deploy to Cloudflare Pages
- CF dashboard → Workers & Pages → Create → Pages → Connect to Git → select `Tseringw/artclub-website`
- Build settings:
  - Framework preset: **Astro**
  - Build command: `pnpm build`
  - Build output directory: `dist`
  - Env var: `NODE_VERSION=22`
- After first deploy succeeds: project → Custom domains → add `artclub-frankfurt.de` → follow DNS instructions
- Time: ~15 min total
- Effect: live URL she can open on her phone, plus auto-deploy on every push

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
- Cloudflare Web Analytics is privacy-friendly + free + one-line addition
- No cookie banner needed (no PII)

## Done so far

- ✅ Astro 6 + Tailwind v4 scaffold, all deps strictly pinned, `.npmrc` enforces save-exact
- ✅ Content collections (events + site pages) with Zod-validated schemas
- ✅ All 5 page routes (Home, Events index, Event detail, About, Contact)
- ✅ Responsive nav with hamburger menu on mobile (< 768px)
- ✅ "Become a member" CTA in nav, linking to Google Form (placeholder URL)
- ✅ behold.so widget hooked up in code (waiting on widget ID)
- ✅ Per-event Instagram photo grid component
- ✅ Site config wired with real values: name "Art Club Frankfurt", tagline, email, IG handle, custom domain
- ✅ Pushed to <https://github.com/Tseringw/artclub-website>
- ✅ Comprehensive README + spec + implementation plan in `docs/`
