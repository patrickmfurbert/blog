# Visitor Tracking for onthestack.io — Reference Guide

Researched 2026-08-29 against current vendor docs. Not a blog post — internal reference for adding analytics to this site.

## Current state of this repo

- Fully prerendered SvelteKit site (`prerender = true` in `src/routes/+layout.ts`), Svelte 5, `@sveltejs/adapter-netlify`, deployed via Netlify CI on push to `main`.
- No analytics script anywhere today (`src/app.html` is clean).
- `netlify.toml` sets security headers but **no CSP**, so a third-party beacon script loads with no config changes.
- SPA caveat: the site hydrates and routes client-side, so a plain `<script>` in `app.html` counts only the first page load. Client-side navigations need a hook (see Step 2) or the vendor's SPA mode.

## Options compared (verified Aug 2026)

| Option | Cost | Cookie banner? | SPA support | Notes |
|---|---|---|---|---|
| **Netlify Web Analytics** | Free plan: 1-day retention (7d Pro, 30d higher) | Never — server-side log analysis | N/A (no JS at all) | Dashboard toggle only, zero code. Ad blockers can't stop it. Up to 30 days backfilled on enable. Unique visitors = distinct IPs. |
| **Cloudflare Web Analytics** | Free, all plans | Cookieless | `"spa": true` in beacon config | Works with any host (no CF DNS needed). Known gap: no referrer/referral data. Docs current as of Apr 2026. |
| **GoatCounter** | Free hosted (donation-supported; personal use) | Cookieless, no GDPR notice needed | Manual re-count (~5 lines) | ~3.5KB script. Referrers, top pages, location, screen size. Self-hostable. |
| **Umami** | Self-host free forever (MIT); Umami Cloud paid (from ~$5/mo, 14-day trial) | Cookieless | `spa` attr or `track()` hook | Best dashboard of the bunch. Self-host fits the EVO-X2 homelab but needs a publicly reachable ingest endpoint. |
| **Plausible** | Paid (~$9/mo at 10k pv, 30-day trial), EU-hosted | Cookieless | Supported | Excellent product; you'd be paying for what GoatCounter gives free. |
| **Google Analytics 4** | Free | ❌ Consent banner required | Manual | Not recommended: consent banner + heavy script on a retro personal blog. |

## Recommended setup: two free layers

1. **Netlify Web Analytics** — zero-code sanity check that survives ad blockers.
2. **GoatCounter** — the real dashboard: long retention, referrers, per-post stats. (Cloudflare Web Analytics is an equally free swap if you already have a CF account and don't care about referrers.)

### Step 0 — Enable Netlify Web Analytics (no code)

Netlify dashboard → your site → **Logs & Metrics → Analytics → Enable Analytics**. Data collection starts on the next deploy; charts backfill up to 30 days. On the free plan retention is 1 day, so treat it as a live cross-check, not the archive.

### Step 1 — Add the beacon to `src/app.html`

Sign up at goatcounter.com (choose subdomain, e.g. `onthestack`), then:

```html
<body data-sveltekit-preload-data="hover">
	<div style="display: contents">%sveltekit.body%</div>
	<script
		data-goatcounter="https://onthestack.goatcounter.com/count"
		async
		src="//gc.goatcounter.com/count.js"
	></script>
</body>
```

Cloudflare variant instead of GoatCounter (no Step 2 needed — `spa: true` handles pushState):

```html
<script
	defer
	src="https://static.cloudflareinsights.com/beacon.min.js"
	data-cf-beacon='{"token":"YOUR_TOKEN","spa":true}'
></script>
```

### Step 2 — Count client-side navigations (`src/routes/+layout.svelte`)

Without this, only the landing page is counted. With it, every SvelteKit navigation is counted once:

```svelte
<script lang="ts">
	import { afterNavigate } from '$app/navigation';

	afterNavigate(({ action }) => {
		if (action === 'enter') return; // initial load already counted by the script tag
		window.goatcounter?.count({ path: location.pathname, title: document.title });
	});
</script>
```

Typing for `src/app.d.ts`:

```ts
declare global {
	interface Window {
		goatcounter?: { count(o: { path: string; title?: string }): void };
	}
}
```

Plausible equivalent inside the same hook: `window.plausible?.('pageview')` — it reads the current URL at call time.

### Step 3 — Deploy and verify

1. `npm run update` (or push to `main`) → Netlify builds.
2. DevTools → Network tab: `/count` request fires on first load **and** when clicking between posts.
3. Reload with an ad blocker on: Netlify's server-side numbers survive, GoatCounter's don't. That's expected — it's why both layers are on.

## Self-host option (EVO-X2)

Umami via Docker (app + Postgres) on the EVO-X2, ingest endpoint exposed through Tailscale Funnel or a reverse proxy. Free and data-sovereign; trade-offs: home-infra uptime now matters to a public site, and the beacon URL must be reachable from every visitor's browser. Good weekend project, not the default.

## Privacy summary

Everything recommended above is cookieless → no consent banner, no GDPR paperwork. GA4 is the only option considered that would force a cookie banner onto the site.
