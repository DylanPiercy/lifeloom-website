# LifeLoom Website

**Slogan:** Built for life beyond the screen.

Public static website for **LifeLoom**, designed for Firebase Hosting.

## Stack

- HTML
- CSS
- Minimal vanilla JavaScript
- Firebase Hosting

The website itself has no client-side framework. Small build scripts generate static HTML from structured JSON content. LifeLoom logo assets are tracked as normal public website assets, while environment-specific configuration and optional app brand assets remain local.

## Repository-safe configuration

The public repository should contain only templates and source code.

Ignored local files:

- `.firebaserc` — generated from your local Firebase project ID.
- `config/site.local.json` — support email, Firebase references and store links.
- `brand-assets/*` — optional app-specific logos/brand files kept local until supplied.
- `public/runtime/` — generated deployment copies of local configuration/assets.

Page copy is stored in tracked `content/*.json` files and rendered into reusable HTML templates. App detail pages use `templates/app-page.html` + `content/apps/*.json`; legal documents use `templates/legal-document.html` + `content/legal/*.json`. Shared site chrome and document assets are extracted under `templates/partials/`. Shared site values, including logo, favicon, social-image and placeholder asset references, live in `content/site.json` and are exposed to every template through one build context.

Tracked examples/placeholders:

- `config/site.example.json`
- `.firebaserc.example`
- `public/assets/img/brand-placeholder.svg`

> Client-facing values such as a support email or app-store URL are visible once the website is deployed. This separation prevents them being committed to Git; it does not make public website data secret.

## First-time setup

```bash
cp config/site.example.json config/site.local.json
```

Edit `config/site.local.json` with your local values:

```json
{
  "firebaseProjectId": "YOUR_FIREBASE_PROJECT_ID",
  "firebaseHostingUrl": "https://YOUR_FIREBASE_PROJECT_ID.web.app",
  "supportEmail": "YOUR_SUPPORT_EMAIL",
  "brandAssets": {
    "rivalry": "rivalry-mark.svg",
    "peakLedger": "peak-ledger-mark.svg",
    "fugitives": "fugitives-mark.svg"
  },
  "storeLinks": {
    "rivalryGooglePlay": "",
    "rivalryAppStore": ""
  }
}
```

Place the LifeLoom logo variants in `assets/lifeloom/`. Their filenames and public paths are configured centrally under `assets` in `content/site.json`; the current configuration uses all five LifeLoom PNG files documented below. Optional app-specific assets continue to use `brand-assets/` and the filenames configured above.

Then run:

```bash
npm run prepare
```

This generates the ignored runtime files used by Firebase Hosting and creates `.firebaserc` when a real Firebase project ID is configured.

## Local preview

Simple preview:

```bash
npm run prepare
python3 -m http.server 8080 --directory public
```

Or with Firebase Hosting emulation:

```bash
npm install -g firebase-tools
firebase login
npm run serve
```

## Deploy

After installing/logging into the Firebase CLI:

```bash
npm run deploy
```

This prepares the local-only configuration/assets and then runs:

```bash
firebase deploy --only hosting
```

## Structure

```text
assets/
└── lifeloom/                  # tracked LifeLoom PNG logo variants
brand-assets/                 # optional app assets; ignored
config/
├── site.example.json         # tracked template
└── site.local.json           # local values; ignored
content/
├── site.json                 # shared brand/navigation/footer strings + site asset tokens
├── home.json                 # homepage content
├── support.json              # support page content
├── 404.json                  # error-page content
├── apps/
│   ├── index.json            # apps catalogue copy
│   ├── rivalry.json          # app content/theme data
│   ├── peak-ledger.json      # coming-soon app data
│   └── fugitives.json        # coming-soon app data
└── legal/
    ├── index.json            # legal hub copy/link list
    ├── privacy.json          # LifeLoom privacy policy
    ├── rivalry-privacy.json  # Rivalry privacy policy
    └── terms.json            # unpublished terms placeholder
templates/
├── home.html
├── support.html
├── apps-index.html
├── app-page.html
├── legal-index.html
├── legal-document.html
├── 404.html
└── partials/
    ├── site-head.html         # shared favicon, theme bootstrap and head assets
    ├── site-header.html       # shared site navigation
    ├── site-footer.html       # shared site footer
    ├── app-card.html          # reusable apps catalogue card
    └── site-scripts.html      # shared page JavaScript include
scripts/
├── build.mjs                 # single full-build coordinator
├── build-brand-assets.mjs
├── build-canonical-domain.mjs
├── build-content-pages.mjs
├── build-app-pages.mjs
├── prepare-site.mjs
└── lib/
    ├── build-context.mjs     # loads shared site/app data and tokens once
    ├── page-renderer.mjs     # shared template/output renderer
    ├── build-version.mjs
    ├── module.mjs
    └── render.mjs
public/                        # generated/deployable static HTML + assets
├── index.html
├── 404.html
├── apps/
├── support/
├── legal/
├── runtime/                  # generated; ignored
└── assets/
```

### Editing page copy

Edit the matching JSON file under `content/`, then run:

```bash
npm run build
```

Do not edit generated `public/*.html` files directly. `npm run prepare`, `npm run serve` and `npm run deploy` all rebuild the static pages automatically. Keeping legal copy in `content/legal/` also provides a clean migration path to Firestore or another content source later without coupling policy text to page layout.


## LifeLoom logo assets

The site uses five LifeLoom PNG variants from `assets/lifeloom/`:

- `lifeloom.png` — symbol-only logo.
- `lifeloom_dark.png` — dark standalone logo variant.
- `lifeloom_light.png` — light standalone logo variant.
- `lifeloom_inline_dark.png` — inline logo used in dark mode.
- `lifeloom_inline_light.png` — inline logo used in light mode.

All site-wide asset references are configured once in `content/site.json`:

```json
"assets": {
  "brand": {
    "sourceDirectory": "assets/lifeloom",
    "publicDirectory": "/assets/lifeloom",
    "symbol": "lifeloom.png",
    "light": "lifeloom_light.png",
    "dark": "lifeloom_dark.png",
    "inlineLight": "lifeloom_inline_light.png",
    "inlineDark": "lifeloom_inline_dark.png"
  },
  "favicon": "lifeloom.png",
  "socialImage": "lifeloom.png",
  "appPlaceholder": "/assets/img/brand-placeholder.svg"
}
```

The build converts these values into shared template tokens such as `{{FAVICON_ASSET}}`, `{{BRAND_INLINE_DARK_ASSET}}`, `{{BRAND_INLINE_LIGHT_ASSET}}`, `{{BRAND_SYMBOL_ASSET}}`, `{{SOCIAL_IMAGE_ASSET}}` and `{{APP_PLACEHOLDER_ASSET}}`. This means a future favicon or LifeLoom logo filename/path change is made in `content/site.json`, not across individual pages.

`npm run build` copies the configured LifeLoom brand files into the configured public asset directory for Firebase Hosting.


## Build architecture

`npm run build` executes `scripts/build.mjs`. It creates one deployment asset version, creates one shared build context, then runs brand-asset preparation, canonical-domain generation, content-page generation and app-page generation in sequence.

`scripts/lib/build-context.mjs` loads `content/site.json`, app definitions, shared partials and site-wide tokens once. `scripts/lib/page-renderer.mjs` is the single page-writing path used by both content and app builders, so header/footer/head/script rendering and generated-file handling are no longer duplicated between build scripts.


## Adding another app

App pages use a shared detail template and the apps catalogue uses the extracted `templates/partials/app-card.html` card template. To add an app:

1. Copy `content/apps/rivalry.json` to a new slug, for example `content/apps/new-app.json`.
2. Replace the app-specific content, theme, brand key and store-link keys.
3. Configure the catalogue card through the app's `card` object:

```json
"card": {
  "colour": "#d946ef",
  "logo": null,
  "comingSoon": true,
  "order": 1
}
```

`colour` controls the card accent, `logo` can point at a public app-logo asset (or remain `null` to use the shared placeholder), `comingSoon` optionally shows the status badge, and `order` controls catalogue ordering. The shared template receives these values as render arguments, so app-card markup is not duplicated per app.

4. Add the matching app brand asset/config entry when available.
5. Run `npm run build:apps` (or `npm run prepare`).

The build regenerates the app catalogue and each `/apps/<slug>/` static page. The generated HTML remains deployable as a normal lightweight static Firebase site. `npm run build` is the single full-build entry point; the narrower `build:apps`, `build:content`, `build:brand`, and `build:canonical` commands remain available for focused development work.

## Connect lifeloom.co.uk

In Firebase Console:

1. Open **Hosting** → **Add custom domain**.
2. Add `lifeloom.co.uk`.
3. Add the exact DNS records Firebase provides in GoDaddy.
4. Repeat for `www.lifeloom.co.uk` if required.
5. Firebase provisions HTTPS automatically after verification.

## Before launch

- Confirm the five LifeLoom PNG variants are present under `assets/lifeloom/`.
- Add app-specific logos under `brand-assets/` when they are ready.
- Set the actual Firebase project ID in `config/site.local.json`.
- Confirm the configured support email.
- Add Google Play/App Store links when available.
- Review privacy policies against the final production services and data practices.

## GitHub

Because local config and optional app-specific assets are ignored, normal Git commands are safe. The LifeLoom logo PNGs under `assets/lifeloom/` are public website assets and can be committed:

```bash
git init
git add .
git commit -m "feat: initial LifeLoom website"
git branch -M main
git remote add origin <your-repository-url>
git push -u origin main
```

Before committing, you can verify ignored files with:

```bash
git status --ignored
```

## Canonical domain

The public canonical domain is `https://lifeloom.co.uk`. During `npm run build`, `content/site.json` generates a small hostname-aware redirect script. Requests opened on `www.lifeloom.co.uk`, `lifeloom-website.web.app`, or `lifeloom-website.firebaseapp.com` are redirected in the browser to the same path on `lifeloom.co.uk`, preserving the query string and fragment.

Canonical `<link>` tags also point to `lifeloom.co.uk`. The redirect is implemented client-side because the same Firebase Hosting configuration serves both the Firebase default domains and the custom domain, so a path-only Hosting redirect would also match the canonical domain.

## Deployment cache behaviour

Each build generates a deployment-specific asset version. HTML and runtime JSON are revalidated, while versioned CSS, JavaScript and image assets can be cached for up to seven days. A new deployment changes the asset URLs automatically, so browsers fetch the new files without sacrificing long-lived caching.

## Colour theme

LifeLoom uses dark mode by default. Visitors can switch to light mode using the theme control in the site header; the preference is stored locally in the browser and reused on later visits.

Header and footer branding uses the `assets.brand.inlineDark` and `assets.brand.inlineLight` values from `content/site.json`. With the current configuration these resolve to `assets/lifeloom/lifeloom_inline_dark.png` in dark mode and `assets/lifeloom/lifeloom_inline_light.png` in light mode.
