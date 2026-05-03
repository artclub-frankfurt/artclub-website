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
| Hosting | Vercel | Free tier covers our use; deploys on `git push`; supports apex domains via plain DNS records (no nameserver migration needed). |
| Repo | GitHub | The github.com web editor is the editor's primary content tool. |
| Package manager | pnpm | Default standard; supported by Vercel. |
| Site config | JSON + Zod | Native TS JSON import (no parser dep); validated at build time. |

Alternatives considered: Next.js (heavier, app-oriented), Hugo (less ergonomic for embeds), **Cloudflare Pages** (rejected — would have required moving DNS off Strato to Cloudflare for apex-domain support, with risk to the existing Zoho email setup; functionally equivalent for our use case), Decap CMS (rejected — adds maintenance surface for marginal UX gain on a mostly-read-only site), YAML for site config (rejected — would add `js-yaml` for marginal editor UX gain on an "almost-never-edited" file).

## 2.1 Security & dependency policy

This site follows a strict-by-default dependency posture:

- **Exact pinning.** No `^` or `~` in `package.json`. `.npmrc` enforces `save-exact=true` so `pnpm add` always writes pinned versions.
- **Locked transitive deps.** `pnpm-lock.yaml` is committed.
- **Minimal direct deps.** Total: `astro`, `@tailwindcss/vite`, `tailwindcss`, `sharp` (runtime); `vitest` (dev only). Nothing exotic. `sharp` is listed explicitly because Astro uses it at build time to optimize images in `src/assets/` (responsive `srcset`, AVIF/WebP), and modern pnpm (≥10) requires explicit opt-in for any package's install scripts via `pnpm.onlyBuiltDependencies` in `package.json`.
- **No runtime third-party JS via npm.** External JS comes from two `<script>` tags loaded by URL: behold.so on the home page, Instagram `embed.js` on event detail pages with photos. Both render gracefully if the script fails (carousel hidden / "View on Instagram" link fallback).
- **Upgrades are explicit.** To bump a dep, run `pnpm update <name> --latest`, review the changelog, run `pnpm test && pnpm build`, then commit with the version change in the message.
- **Repository is public.** Intentional: nothing sensitive in the code (placeholder content + behold widget ID, the latter visible in deployed HTML anyway); unlocks free unlimited GitHub Actions minutes; fits the open-by-default ethos of a student association. All real credentials (Vercel token, etc.) live in GitHub Actions secrets — never in the repo. Git history was scanned for accidentally-committed secrets before going public.

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

## 4.1 Code contribution workflow (for devs)

The `main` branch is **protected**: direct pushes are rejected. Code changes go through pull requests merged by the repo owner. After merging, GitHub Actions deploys the new `main` to Vercel automatically (see §5).

### Daily workflow

```bash
# 1. Branch off main
git checkout main && git pull
git checkout -b feat/short-description     # or fix/, chore/, docs/

# 2. Work, commit
# ...
git add <files>
git commit -m "type: short imperative summary"

# 3. Push the branch
git push -u origin feat/short-description

# 4. Open a PR
gh pr create --fill                          # uses last commit message as title/body
# OR open the URL printed by `git push` in a browser

# 5. Repo owner reviews and merges
#    The deploy workflow runs ~1-2 min after the merge.

# 6. Pull main, delete local branch
git checkout main && git pull
git branch -d feat/short-description
```

### Merge mode

Any merge mode works (squash, merge commit, rebase) — the deploy is decoupled from commit authorship now that GitHub Actions handles it. **Squash-and-merge is still recommended** for cleaner history: each PR becomes one commit on `main`, easy to read and easy to revert.

### Note for content editors (non-devs)

This PR workflow only applies to **code changes**. Editing markdown content via github.com (Section 6) commits directly to `main` and triggers a deploy without a PR — that's the intended flow for the editor.

## 5. Deploy

Deploys are triggered by **GitHub Actions** (see `.github/workflows/deploy.yml`), not by Vercel's git integration. This was a deliberate architectural choice for three reasons:

1. **Sovereignty.** The build & deploy pipeline lives in the repo, version-controlled, PR-reviewable, easy to audit and roll back. It's not buried in a Vercel dashboard nobody else has access to.
2. **Portability.** Swapping hosts later (Cloudflare Pages, Netlify, S3+CloudFront, …) is a 5-line edit to the workflow file instead of rebuilding a pipeline from scratch. See [How to swap hosts](#how-to-swap-hosts) below.
3. **Test gating.** The workflow runs `pnpm test` before deploying. A failing test aborts the deploy, preventing regressions from reaching production. Vercel's native git auto-deploy doesn't run tests.

The trade-off is ~1-2 min slower deploys (vs ~30 sec for native Vercel) and no automatic per-PR preview URLs. Both are acceptable for the project's update cadence.

### How a deploy happens (current state)

1. PR merged into `main` (or content edit committed via github.com directly to `main`).
2. GitHub Actions runs `Deploy to Vercel` workflow:
   - Checks out the repo.
   - Installs deps with pnpm (frozen lockfile).
   - Runs `pnpm test` — a failure aborts the deploy.
   - Installs Vercel CLI.
   - `vercel pull` — fetches project settings from Vercel using the token.
   - `vercel build --prod` — builds the site exactly the way Vercel would.
   - `vercel deploy --prebuilt --prod` — uploads the build to Vercel.
3. Vercel serves the new build at `artclub-frankfurt.de` within ~1-2 min of merge.

You can also trigger a deploy manually: GitHub repo → Actions → "Deploy to Vercel" → "Run workflow" → Run.

### Required repo secrets

Set in **GitHub repo → Settings → Secrets and variables → Actions**:

| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | <https://vercel.com/account/tokens> → Create Token. Owner of the Vercel team must generate it. Treat as sensitive. |
| `VERCEL_ORG_ID` | Vercel team → Settings → General → Team ID |
| `VERCEL_PROJECT_ID` | Vercel project → Settings → General → Project ID |

If a secret is missing, the workflow run will fail with a clear `Missing required environment variable` error. Add the secret and re-run.

### Custom domain (DNS at Strato; Zoho email untouched)

The custom domain is wired into Vercel separately from the deploy workflow. The setup, done once:

1. Project → **Settings → Domains** → add `artclub-frankfurt.de`.
2. Vercel shows the DNS records to add at Strato (current values; copy what Vercel shows you in case they change):
   - `A` record, name `@`, value `216.198.79.1` (or whatever Vercel currently recommends)
   - `CNAME` record, name `www`, value `cname.vercel-dns.com`
3. At Strato (`strato.de` → Customer Service → Domainverwaltung → DNS-Verwaltung): add **only those two records**. Leave everything else (especially `MX` and `TXT` records for Zoho) exactly as-is.
4. Vercel auto-provisions HTTPS in ~5 min.
5. Smoke-test: `curl -I https://artclub-frankfurt.de` returns 200; send a test email to `info@artclub-frankfurt.de` to confirm Zoho still receives it.

### Why git is disconnected on the Vercel side

Vercel's project has its **Git** integration disconnected (Vercel project → Settings → Git → "Disconnect"). This avoids two parallel deploy pipelines competing — Actions handles every deploy, Vercel just serves the artifacts. The Vercel project itself, custom domain, deploy history, environment variables, and build settings are all preserved — only the auto-deploy webhook is disabled.

To revert (e.g., if you ever decide to give up the test-gating + portability benefits in exchange for ~1 min faster deploys + auto preview URLs): re-connect git in Vercel's settings, delete `.github/workflows/deploy.yml`, and you're back to standard Vercel auto-deploy.

### How to swap hosts

The workflow is structured so the universal "build" portion (`pnpm build` → `./dist`) is host-agnostic; only the bottom block is host-specific. To migrate, replace those steps and add the new host's secrets to the GitHub repo.

**To Cloudflare Pages** *(requires moving DNS to Cloudflare nameservers — incompatible with Strato-managed DNS for the apex domain; reconsider if email is also at Strato/external)*:

```yaml
- name: Build site
  run: pnpm build

- name: Deploy to Cloudflare Pages
  run: npx --yes wrangler@latest pages deploy dist --project-name=artclub-website --branch=main
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**To Netlify** *(DNS stays at Strato; Zoho email untouched — same DNS pattern as the current Vercel setup)*:

```yaml
- name: Build site
  run: pnpm build

- name: Deploy to Netlify
  run: npx --yes netlify-cli@latest deploy --prod --dir=./dist
  env:
    NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
    NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

**To plain S3 + CloudFront** *(maximum sovereignty, full AWS bill, more setup)*:

```yaml
- name: Build site
  run: pnpm build

- name: Deploy to S3
  run: aws s3 sync ./dist s3://artclub-frankfurt-www --delete
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    AWS_REGION: eu-central-1

- name: Invalidate CloudFront
  run: aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

In all cases the migration is:

1. Sign up on the new host, create the project, get its access token + project/site ID (or AWS keys).
2. Add those as GitHub repo secrets (replacing the `VERCEL_*` ones).
3. Update DNS records at Strato (or, for Cloudflare Pages, move nameservers to Cloudflare).
4. Verify HTTPS provisions and the site is reachable.
5. Decommission the old Vercel project once the new one is validated.

### Rollback

Vercel dashboard → project → **Deployments** → click any prior deployment → **Promote to Production**.

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
- `instagram.source` — either `"behold"` (auto-pulled live feed via behold.so) or `"curated"` (a hand-picked list of post URLs). Build will fail with a clear error if the matching field below is empty.
- `instagram.beholdWidgetId` — the widget ID from your behold.so dashboard. Required when `source` is `"behold"`. While set to `"REPLACE_ME"` the home-page section shows a placeholder instead of the carousel.
- `instagram.curatedPosts` — list of full Instagram post URLs (e.g. `"https://www.instagram.com/p/ABCDE/"`). Required when `source` is `"curated"`. Show 4 for a clean grid.
- `socialLinks.instagram` — full URL to the association's Instagram profile.
- `socialLinks.email` — same as `contactEmail` (kept separate so social blocks can reference it as a "social link").

## 7. Integrations reference

| Service | What it does | Where it's configured | How to swap |
|---|---|---|---|
| **behold.so** | Instagram carousel on the home page (when `instagram.source` is `"behold"`) | `instagram.beholdWidgetId` in `src/data/site.json`; widget script in `src/components/InstagramSectionBehold.astro` | Either swap to `instagram.source: "curated"` and supply post URLs, or replace the `<div>` + `<script>` in `InstagramSectionBehold.astro` with another widget vendor's snippet. |
| **Instagram embeds** | Per-event photo grids | `instagramPosts:` array in each event's frontmatter | N/A — Instagram-native |
| **Luma** | Event registration | `lumaUrl` in each event's frontmatter | N/A — just swap the URL |
| **Google Form** | Membership signup | `googleFormUrl` in `src/data/site.json` | Swap the URL |
| **Vercel** | Hosting | Vercel dashboard (project, domain, env vars) | Move to Netlify or Cloudflare Pages: keep `.github/workflows/deploy.yml` as a template, swap CLI commands. (For CF Pages on apex `artclub-frankfurt.de`: requires moving DNS to Cloudflare too.) |
| **GitHub Actions** | Build + deploy CI | `.github/workflows/deploy.yml` + repo secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | If the host changes, rewrite this workflow to use the new host's CLI; secrets stay the same shape. |
| **Strato** | Domain registrar + DNS host | DNS records in Strato Domainverwaltung; `A @ → 76.76.21.21` and `CNAME www → cname.vercel-dns.com` point at Vercel | Move DNS to another provider by exporting/replicating records. |
| **Zoho Mail** | Email at `info@artclub-frankfurt.de` | MX + SPF/DKIM/DMARC TXT records at Strato | N/A — keep DNS records in place; Zoho is independent of the website host. |

## 8. Common maintenance tasks

- **Change contact email:** edit `contactEmail` and `socialLinks.email` in `src/data/site.json`.
- **Swap the Instagram widget service:** edit `src/components/InstagramSectionBehold.astro`. Replace the `<div>` + `<script>` with the new service's snippet. Update `site.json` if the widget ID format changes.
- **Switch the home-page Instagram from auto-pulled to hand-picked:** in `src/data/site.json`, change `instagram.source` from `"behold"` to `"curated"` and populate `instagram.curatedPosts` with 4 Instagram post URLs.
- **Add a new top-level page (e.g. `/sponsors`):**
  1. Create `src/content/site/sponsors.md` with frontmatter + body.
  2. Create `src/pages/sponsors.astro` mirroring `about.astro`.
  3. Add a link to the new page in the nav inside `src/layouts/BaseLayout.astro`.
- **Change the domain:** update `site:` in `astro.config.mjs`, then attach the new domain in Vercel (Settings → Domains) and add the corresponding DNS records at the new domain's registrar.
- **Disable an event temporarily:** delete the event's `.md` file (keep the `.md` somewhere else if you'll restore it).

## 9. Troubleshooting

- **Deploy workflow fails with "Missing token" or auth error:** one of the three repo secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) is missing or wrong. Re-check in GitHub → Settings → Secrets and variables → Actions. Token may have expired — regenerate at <https://vercel.com/account/tokens>.
- **Deploy workflow fails on `pnpm test`:** a unit test failed; the deploy aborted to protect production. Run `pnpm test` locally to reproduce, fix, push.
- **No deploy ran after merging a PR:** check the **Actions** tab on GitHub. Possible causes: workflow file syntax error (visible in the run log), the merge commit didn't land on `main` (some merge modes can fail silently if branch protection rejects them), or the workflow file was edited in a way that disabled the trigger.
- **Manual re-deploy needed:** GitHub repo → Actions → "Deploy to Vercel" → "Run workflow" → pick `main` → Run.
- **Build fails on Vercel but works locally:** check the Node version pinned in `.github/workflows/deploy.yml` matches the local Node version. Currently `node-version: 22`.
- **Custom domain stuck on "Invalid Configuration":** verify in the Strato DNS panel that the apex `A` record and `CNAME www → cname.vercel-dns.com` are present and that no conflicting `A`/`AAAA` records remain on `@` or `www`. DNS changes can take up to 30 min to propagate.
- **Email at `info@artclub-frankfurt.de` not arriving after deploy:** verify Zoho's MX records are still in Strato's DNS panel (typically `mx.zoho.eu`/`mx2.zoho.eu`/`mx3.zoho.eu`, or `mx.zoho.com` for US accounts). The Vercel setup should not have touched these — only added two new records.
- **Instagram embeds show only "View on Instagram" links:** Instagram's `embed.js` failed to load (rate-limited, blocked, or post is private). Refresh; if persistent, the post may be from a private account.
- **behold widget shows nothing:** check `instagram.beholdWidgetId` in `site.json` matches the ID in the behold dashboard, and that the connected Instagram account has at least one public post.
- **Frontmatter validation error in build log:** check that the event's frontmatter matches the schema in `src/content.config.ts` — `date` must be a valid date, `lumaUrl` must be a valid URL.

## 10. Specs and plans

Design and implementation history live in:
- `docs/superpowers/specs/` — design specs
- `docs/superpowers/plans/` — implementation plans
