# LifeLoom Website

Public website for **LifeLoom**, built as a lightweight static site and deployed with Firebase Hosting.

The site is generated from structured JSON content and reusable HTML templates. `public/` is build output only and is not tracked in Git.

## Architecture

The repository is split into four main areas:

```text
assets/                         Public-facing source images/media
├── img/
├── lifeloom/
├── rivalry/
└── peakledger/

src/                            Website source
├── content/                    Structured site/app/legal content
├── templates/                  Page templates and reusable partials
├── css/                        Website styles
├── js/                         Browser JavaScript
└── static/                     Root files copied as-is (for example robots.txt)

scripts/                        Node build tooling
config/                         Local/environment configuration
public/                         Generated Firebase Hosting output (ignored)
```

### Build flow

`scripts/build.mjs` coordinates a full build:

1. Creates a new asset version for cache busting.
2. Deletes and recreates `public/`.
3. Copies CSS, JavaScript, static files and shared media.
4. Copies configured LifeLoom and app assets.
5. Validates every configured local brand/app asset exists in the generated output.
6. Generates canonical-domain JavaScript.
7. Generates HTML from the JSON content and reusable templates.
8. Generates `sitemap.xml` from the current apps and published legal documents.

Shared rendering logic lives under `scripts/lib/`. Site-wide HTML is extracted into partials such as:

```text
src/templates/partials/site-head.html
src/templates/partials/site-header.html
src/templates/partials/site-footer.html
src/templates/partials/site-scripts.html
src/templates/partials/app-card.html
src/templates/partials/app-feature.html
src/templates/partials/app-availability.html
```

Do not edit files in `public/`; change the source and rebuild instead.

## Setup

### Prerequisites

Install:

- Node.js and npm
- Firebase CLI

If the Firebase CLI is not already installed:

```bash
npm install -g firebase-tools
firebase login
```

### 1. Create the local configuration

Do this **before `npm install`**, because npm automatically runs the project's `prepare` script after installation.

```bash
cp config/site.example.json config/site.local.json
```

Edit `config/site.local.json` and replace the example values:

| Field | Replace with |
| --- | --- |
| `firebaseProjectId` | Firebase project ID used for Hosting |
| `supportEmail` | Public LifeLoom support email address |
| `storeLinks.*` | App Store / Google Play URLs when available; leave blank until needed |

Example:

```json
{
  "firebaseProjectId": "YOUR_FIREBASE_PROJECT_ID",
  "supportEmail": "support@example.com",
  "storeLinks": {
    "rivalryGooglePlay": "",
    "rivalryAppStore": "",
    "peakLedgerGooglePlay": "",
    "peakLedgerAppStore": "",
    "fugitivesGooglePlay": "",
    "fugitivesAppStore": ""
  }
}
```

`config/site.local.json` is ignored by Git. `prepare-site.mjs` uses it to generate:

- `.firebaserc` with the selected Firebase project
- `public/runtime/site-config.json` with the support email and app store links

Do not put private keys, service-account credentials or other secrets in this file.

### 2. Install dependencies

```bash
npm install
```

`npm install` automatically runs `npm run prepare`, so the site will also be built and the local runtime configuration generated.

### 3. Run locally

```bash
npm run serve
```

This prepares the site and starts the Firebase Hosting emulator.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run build` | Rebuilds generated site files from tracked source. Does **not** generate local runtime config. |
| `npm run prepare` | Runs a full build and generates `.firebaserc` plus `public/runtime/site-config.json`. |
| `npm run serve` | Prepares the site and starts the Firebase Hosting emulator. |
| `npm run deploy` | Prepares the site and deploys Firebase Hosting. |

Focused build commands are also available:

```bash
npm run build:static
npm run build:brand
npm run build:app-assets
npm run build:validate-assets
npm run build:canonical
npm run build:content
npm run build:apps
npm run build:sitemap
```

For normal content/style work, `npm run build` is sufficient. Use `npm run prepare` when you need the local support/store configuration regenerated.

## Deploy

Deploy the current source with:

```bash
npm run deploy
```

This performs a fresh build, prepares the runtime configuration and then runs:

```bash
firebase deploy --only hosting
```

The production canonical domain is configured as:

```text
https://lifeloom.co.uk
```

Canonical redirect settings are controlled by `src/content/site.json`.

## Content and configuration

### Site-wide configuration

`src/content/site.json` is the central source for:

- brand name and slogan
- navigation/footer labels
- shared app UI labels
- legal navigation labels
- LifeLoom asset filenames and public paths
- favicon and social image
- canonical-domain redirects

LifeLoom asset files themselves live under:

```text
assets/lifeloom/
```

The templates use generated tokens such as `{{FAVICON_ASSET}}` and `{{BRAND_INLINE_DARK_ASSET}}`; asset filenames should not be hard-coded into individual page templates.

### Page content

Editable page copy lives under:

```text
src/content/
```

Key files/directories:

```text
src/content/home.json
src/content/support.json
src/content/apps/
src/content/legal/
```

### App definitions

Each app has one JSON file under `src/content/apps/`. The same app data is reused by the Apps catalogue, individual app page, homepage/support references and shared availability UI.

Important fields include:

```json
{
  "platforms": {
    "ios": true,
    "android": true,
    "web": false
  },
  "availability": {
    "releaseDate": null,
    "links": {
      "ios": "rivalryAppStore",
      "android": "rivalryGooglePlay",
      "web": null
    }
  },
  "card": {
    "colour": "#d946ef",
    "logo": "rivalry.png",
    "order": 1
  },
  "assets": {
    "sourceDirectory": "assets/rivalry",
    "publicDirectory": "/assets/rivalry"
  }
}
```

- `card.order` controls catalogue order.
- `card.colour` controls the app accent colour.
- `card.logo` selects the app icon from its source directory.
- `platforms` controls which platforms are shown.
- `availability.releaseDate: null` means **Coming Soon**.
- A future ISO date shows **Coming on ...**.
- A current/past ISO date shows the app as **Released**.
- Release state is evaluated in the browser and rechecked hourly, so a scheduled release automatically changes state without a rebuild/deploy when the date passes.
- Store/web buttons remain hidden until the app is released and a configured link exists.
- `availability.links` can reference keys from `config/site.local.json` or use direct public URLs.

App media is copied from the app's configured `assets.sourceDirectory` into its configured public directory during the build. Configured local assets are strict: if a referenced logo, brand image, favicon, social image or other configured app asset is missing, the build fails instead of generating a broken image reference.

## Adding an app

1. Add a new JSON file under `src/content/apps/` using the existing apps as the schema reference.
2. Add the app's images under `assets/<app-name>/`.
3. Configure `card.logo`, `assets.sourceDirectory`, `assets.publicDirectory`, platforms and availability in the app JSON.
4. Add any required store-link keys to `config/site.example.json` and your local `config/site.local.json`.
5. Run `npm run build` and verify the catalogue/detail page locally.

The catalogue and detail pages are generated automatically; app-specific HTML pages should not be created manually. The app route is also added to the generated sitemap automatically.


## Sitemap and indexing

`public/sitemap.xml` is generated during every full build. Do not maintain a static sitemap by hand.

The generator includes:

- the homepage
- the Apps catalogue
- every app defined in `src/content/apps/`
- Support
- the Legal index
- every legal document with `published: true`

Published legal documents use `seo.canonicalPath` for their sitemap URL. `src/static/robots.txt` points search engines to the generated sitemap.

## Styling and browser behaviour

- Global styles: `src/css/style.css`
- Browser behaviour: `src/js/main.js`
- Dark mode is the default; the user's selected theme is stored locally in the browser.
- Release-date state is calculated client-side and does not require Firebase Functions or database reads.

## Generated output and caching

`public/` is disposable and ignored by Git. A full build recreates it from tracked source.

To test that the generated output is reproducible:

```bash
rm -rf public
npm run prepare
```

Each full build creates a new asset version used in generated URLs. Firebase caches versioned CSS, JavaScript and image assets for seven days, while HTML is configured to revalidate. A new build therefore receives new asset URLs without waiting for the previous asset cache to expire.

## Git and sensitive files

The following are intentionally ignored:

```text
public/
config/site.local.json
.firebaserc
.build-version
node_modules/
.env
.env.*
```

Public website images under `assets/` are expected to be committed. Do not commit service-account files, private keys, credentials or other secrets.
