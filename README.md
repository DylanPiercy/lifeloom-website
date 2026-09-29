# LifeLoom Website

**Slogan:** Built for life beyond the screen.

Public static website for **LifeLoom**, designed for Firebase Hosting.

## Stack

- HTML
- CSS
- Minimal vanilla JavaScript
- Firebase Hosting
- Node build scripts

The website has no client-side framework. Tracked source files are compiled into a disposable `public/` directory for Firebase Hosting.

## Project structure

```text
assets/                        # tracked media/source assets
├── img/
│   └── brand-placeholder.svg
├── lifeloom/
├── rivalry/
└── peakledger/

src/                           # tracked website source
├── content/
│   ├── site.json
│   ├── home.json
│   ├── support.json
│   ├── 404.json
│   ├── apps/
│   └── legal/
├── templates/
│   ├── partials/
│   └── ...
├── css/
│   └── style.css
├── js/
│   └── main.js
└── static/
    ├── robots.txt
    └── sitemap.xml

scripts/                       # Node build tooling
├── build.mjs
├── build-static-assets.mjs
├── build-brand-assets.mjs
├── build-app-assets.mjs
├── build-canonical-domain.mjs
├── build-content-pages.mjs
├── build-app-pages.mjs
├── prepare-site.mjs
└── lib/

config/                        # local/environment configuration
├── site.example.json
└── site.local.json            # ignored

public/                        # fully generated Firebase Hosting output; ignored
```

The separation is intentional:

- `assets/` contains tracked images and other media used by the website.
- `src/` contains tracked website content, templates, CSS, JavaScript and static files.
- `scripts/` contains build tooling and is not deployed directly.
- `config/` contains environment/local configuration.
- `public/` is generated output and can be deleted at any time.

## First-time setup

Create your local configuration:

```bash
cp config/site.example.json config/site.local.json
```

Edit `config/site.local.json` with the correct Firebase project, support email and store links.

Then install dependencies and prepare the site:

```bash
npm install
npm run prepare
```

`.firebaserc` and `config/site.local.json` are intentionally ignored by Git.

## Build

```bash
npm run build
```

A full build:

1. Creates a new deployment asset version.
2. Deletes any existing `public/` directory.
3. Copies tracked CSS, JavaScript and static files from `src/`.
4. Copies shared source media from `assets/`.
5. Copies configured LifeLoom and app assets.
6. Generates the canonical-domain JavaScript.
7. Generates all HTML pages from JSON content and reusable templates.

This means the following is safe:

```bash
rm -rf public
npm run build
```

The complete deployable website, including styling and JavaScript, will be recreated.

Focused build commands are also available:

```bash
npm run build:static
npm run build:brand
npm run build:app-assets
npm run build:canonical
npm run build:content
npm run build:apps
```

## Local preview

With Firebase Hosting emulation:

```bash
npm run serve
```

Or after building/preparing:

```bash
python3 -m http.server 8080 --directory public
```

## Deploy

After installing and logging into the Firebase CLI:

```bash
npm run deploy
```

This rebuilds/prepares the site and then runs Firebase Hosting deployment.

## Content and templates

Editable page copy lives under:

```text
src/content/
```

Reusable page structure lives under:

```text
src/templates/
```

Shared site partials include:

```text
src/templates/partials/site-head.html
src/templates/partials/site-header.html
src/templates/partials/site-footer.html
src/templates/partials/site-scripts.html
src/templates/partials/app-card.html
```

Do not edit generated HTML under `public/`. Change the source JSON/templates and rebuild instead.

## Site-wide assets

LifeLoom image assets live under:

```text
assets/lifeloom/
```

Their filenames and public references are configured centrally in:

```text
src/content/site.json
```

Current configuration:

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

The build converts these into shared template tokens such as:

```text
{{FAVICON_ASSET}}
{{BRAND_SYMBOL_ASSET}}
{{BRAND_INLINE_LIGHT_ASSET}}
{{BRAND_INLINE_DARK_ASSET}}
{{SOCIAL_IMAGE_ASSET}}
{{APP_PLACEHOLDER_ASSET}}
```

So a LifeLoom logo or favicon change should normally be made once in `src/content/site.json` and then rebuilt.

## App assets and app pages

Each app is defined by a JSON file under:

```text
src/content/apps/
```

The catalogue card and detail page both use the same app configuration. Example:

```json
"card": {
  "colour": "#d946ef",
  "logo": "rivalry.png",
  "comingSoon": true,
  "order": 1
},
"assets": {
  "sourceDirectory": "assets/rivalry",
  "publicDirectory": "/assets/rivalry"
}
```

- `colour` controls the app accent colour.
- `logo` sets the app icon.
- `comingSoon` optionally displays the status badge.
- `order` controls catalogue ordering.
- `assets.sourceDirectory` identifies the tracked asset source folder.
- `assets.publicDirectory` identifies the deployed URL directory.

App logos are resolved from these app JSON files at build time. Local runtime configuration no longer overrides app image paths, so catalogue cards, detail pages, the homepage featured app and app-specific support cards all use the same configured logo source.

The app catalogue card itself is extracted to:

```text
src/templates/partials/app-card.html
```

The shared app detail template is:

```text
src/templates/app-page.html
```

## LifeLoom assets currently expected

```text
assets/lifeloom/lifeloom.png
assets/lifeloom/lifeloom_light.png
assets/lifeloom/lifeloom_dark.png
assets/lifeloom/lifeloom_inline_light.png
assets/lifeloom/lifeloom_inline_dark.png
```

Rivalry currently uses:

```text
assets/rivalry/rivalry.png
assets/rivalry/rivalry_r_light.png
assets/rivalry/rivalry_r_dark.png
```

The two `rivalry_r_*.png` marks are copied for future use but are not currently displayed.

PeakLedger currently uses:

```text
assets/peakledger/peakledger.png
```

## Build architecture

`scripts/build.mjs` is the full-build coordinator.

`scripts/lib/build-context.mjs` loads `src/content/site.json`, all app definitions, shared partials and site-wide tokens once.

`scripts/lib/page-renderer.mjs` provides the common rendering/output path used by content pages and app pages.

The static build step copies tracked source files into `public/`, while generated steps add dynamic build output such as page HTML and canonical-domain JavaScript.

## Canonical domain

The public canonical domain is:

```text
https://lifeloom.co.uk
```

`src/content/site.json` controls the canonical redirect configuration. Firebase default Hosting domains and `www.lifeloom.co.uk` redirect to the canonical host while preserving path, query string and fragment.

## Cache behaviour

Each full build creates a deployment-specific asset version. Generated HTML references versioned CSS, JavaScript and image URLs.

Firebase caches versioned assets for up to seven days, while HTML/runtime JSON is revalidated. New builds receive new asset URLs, so updated files are fetched immediately after deployment.

## Colour theme

LifeLoom uses dark mode by default. Visitors can switch to light mode using the shared theme control in the site header, and the preference is stored locally in the browser.

Header and footer branding use the configured `inlineDark` and `inlineLight` LifeLoom assets from `src/content/site.json`.

## Git

Generated and local files are ignored, including:

```text
public/
config/site.local.json
.firebaserc
.build-version
node_modules/
```

Tracked website assets under `assets/` are public-facing source media and are safe to commit provided they contain no secrets.
