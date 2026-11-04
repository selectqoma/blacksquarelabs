# Blacksquare Labs

Static, multi-page Blacksquare Labs website for end-to-end AI integration: an agentic core, natural language interaction and connections to business tools. Includes a public MCP endpoint for preparing consultation briefs.

## Editing the website

Run `npm run build:site` after changing the shared layout, page copy or launch settings. The source is `scripts/build-site.mjs`; it writes the homepage, service pages, Work, Writing, scorecard, About and Contact as crawlable HTML. `site.css` is the shared stylesheet; `site.js` handles mobile navigation, legacy fragment redirects and optional analytics events. No framework or new dependency is required. The command is named `build:site` so Vercel continues deploying the pre-generated static files without attempting to run the excluded local build scripts.

The builder preserves the existing main content of Privacy, Terms, Cookies and the interactive quote demo while applying the shared layout. Edit those four HTML pages directly. All other generated page content belongs in the builder.

`site.config.js` holds the company contact and launch settings:

- Public contact: **hello@blacksquarelabs.dev**. Personal names, personal profiles and published prices have been removed from the public pages, social image and structured data.
- Calendar URL: empty until supplied. “Request a 30-minute call” opens the contact form, which explicitly says a time will be arranged by email and no meeting is booked by submitting.
- Analytics: inactive until an account-specific `plausibleScript` is configured. Update Privacy and Cookies when enabling it. `technical_review_viewed`, `form_submitted`, `scorecard_completed`, and `call_booking_clicked` hooks are ready. Do Not Track and Global Privacy Control suppress these events. A booking click is not a completed booking; connect the calendar provider’s confirmed-booking callback/webhook before reporting calls booked.

The scorecard uses 20 yes/no questions across six areas. Missing answers are not treated as failures; security gaps are shown first. It stores no answers and sends no form content to analytics. Results can be printed/saved as PDF without email.

The sitemap and robots.txt are generated. Submit the deployed sitemap through the owner’s Google Search Console and Bing Webmaster accounts. Search-engine submission, calendar setup, analytics activation and deployment are external launch tasks, not performed by the build.

## Browser checks

Use the existing `vercel dev` command to preview clean URLs and the contact API. With Playwright available in your tooling environment:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs npm run check:site -- http://127.0.0.1:3000
```

This checks routes at desktop and mobile sizes, navigation, scorecard scoring/reset, failed and accepted form submissions (mocked; no emails), legacy redirects and demo video controls.


## Local checks

Requires Node.js 20 or newer.

```sh
npm install
npm test
vercel dev
```

In another terminal, check the local endpoint:

```sh
npm run check:mcp -- http://127.0.0.1:3000/mcp
```

## Public endpoints

- Website: `https://blacksquarelabs.dev`
- MCP: `https://blacksquarelabs.dev/mcp`
- Privacy: `https://blacksquarelabs.dev/privacy`
- Terms: `https://blacksquarelabs.dev/terms`
- Support: `https://blacksquarelabs.dev/contact`
- Domain verification: `https://blacksquarelabs.dev/.well-known/openai-apps-challenge`

Set the Vercel environment variable `OPENAI_APPS_CHALLENGE` to the exact token supplied by the OpenAI submission portal. Until configured, the verification endpoint intentionally returns 404.

## Plugin submission

The distributable scaffold is in `plugins/blacksquare-labs`. Review materials and test cases are in `submission`.

## Product lifecycle film

The homepage resources section and `/work/demo-vs-production` show one 40-second, illustrative animation of a support product: a user need becomes a working proof of concept, tests reveal an access failure, a fix is verified, real systems are connected, traffic is released in stages, and production feedback improves the next release. Playback is user initiated, with captions and a transcript generated from the same VTT file.

The editable animation is `assets/demo/production-demo.html`. Re-render the MP4 and poster with:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node scripts/render-production-demo.mjs
```

Rendering uses Chrome and FFmpeg. The retired shopping assets remain as local source material but are excluded from deployment and no longer linked by public pages.

## Connectivity visuals and copy

The homepage leads with “Intelligence at work.” Its editorial layout is defined in `home.css`, loaded only on the homepage: a bright black-and-white operations-room cover, a compact dark green introduction followed by an illustrative weekly-update workflow, a two-column service index and a larger photograph paired with a dark green introduction to the practice. The lower sections include a visible support-assistant film, a warm tan checklist preview, concise FAQs and a sage contact section. Copy uses direct descriptions of the work and deliverables. Contact remains available in the navigation and enquiry form. The cover uses `assets/operations-room-bright.webp`; the practice section uses `assets/in-motion.webp`. Both have 1942 × 809 originals and responsive 960-pixel-wide versions, encoded at WebP quality 84 without upscaling. These fictional photographic studies were created with the built-in image-generation tool. Originals and prompts are retained in `output/imagegen/`, including `operations-room-bright-original.png` and its edit prompt. The previous architectural cover remains available in `assets/connected-architecture*.webp`.

The weekly-update diagram uses `assets/workflow.svg` on desktop and a vertical `assets/workflow-mobile.svg` on narrow screens. Both show CRM, documents and email feeding context, planning and action, followed by a sourced draft and human review. They are illustrative workflows, not representations of deployed client infrastructure.

Inner pages retain the shared `site.css` theme: white and graphite surfaces, selective translucent glass, silver borders and a restrained cobalt-blue accent, with opaque fallbacks and a reduced-transparency preference. Their static grain overlay uses `assets/film-grain.svg`; `home.css` disables that overlay and uses warm neutral surfaces and serif accents. The support film remains in grayscale. The shared display accents use locally hosted Geist Pixel Square from `assets/fonts/`, with its SIL Open Font License included alongside the font.

The previous `assets/connected-business.svg` architecture illustration remains available but is no longer the homepage hero. `assets/og-connected-business.png` remains the shared social card; its editable source is `scripts/social-card.html`. The terminology and sources behind the October 2026 positioning are recorded in `scripts/copy-research.md`.

## Brand asset

The homepage's “Integrations with your existing tools” band follows the cover and shows eight example platforms with locally hosted SVG marks. Their brand colors and vectors come from pinned Simple Icons metadata; exact provenance is recorded in `assets/integrations/SOURCES.md`. The logo list reflows on narrow screens.

`assets/brand-lockup.svg` is the shared logo for the original brand assets and product film. It uses the existing terminal-in-a-square mark and the Blacksquare Labs wordmark. If it changes, re-render the video and poster with the script above.

## Enquiries

The homepage and contact page share `contact-form.js` and `api/contact.js`. Three required fields submit through Resend. Browser assistant tools only prepare the visible form; they never send it. Native form submissions remain supported when JavaScript is unavailable.

Configure `RESEND_API_KEY` in the existing Vercel environment, verify the `hello@blacksquarelabs.dev` sender and inbox, before launch. Website forms continue delivering to `hello@blacksquarelabs.dev`; the public email link uses the company address from `site.config.js`. The API returns success only after provider acceptance; this is not a guarantee of inbox delivery. No automatic reply, payment, booking, or advertising tracker is enabled.

Source and optional `utm_campaign` are included in the enquiry email. Retries of an unchanged form reuse a request ID, allowing Resend to deduplicate within its 24-hour idempotency window. Tests use a mocked email provider and never send real mail.

Internal audits, submission material, tests, scripts and plugin bundles are excluded from website deployment by `.vercelignore`.
