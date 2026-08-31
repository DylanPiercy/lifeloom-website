# LifeLoom Website

**Slogan:** Built for life beyond the screen.

Public static website for **LifeLoom**, designed for Firebase Hosting.

## Stack

- HTML
- CSS
- Minimal vanilla JavaScript
- Firebase Hosting

The website itself has no client-side framework. Small build scripts generate static HTML from structured JSON content, while a preparation script keeps local configuration and real brand assets out of Git.

## Repository-safe configuration

The public repository should contain only templates and source code.

Ignored local files:

- `.firebaserc` — generated from your local Firebase project ID.
- `config/site.local.json` — support email, Firebase references and store links.
- `brand-assets/*` — real LifeLoom/app logos and brand files.
- `public/runtime/` — generated deployment copies of local configuration/assets.

Page copy is stored in tracked `content/*.json` files and rendered into reusable HTML templates. App detail pages use `templates/app-page.html` + `content/apps/*.json`; legal documents use `templates/legal-document.html` + `content/legal/*.json`.

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
    "lifeloom": "lifeloom-mark.svg",
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

Place your real assets in `brand-assets/`, using the filenames configured above.

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
brand-assets/                 # real local assets; ignored
config/
├── site.example.json         # tracked template
└── site.local.json           # local values; ignored
content/
├── site.json                 # shared brand/navigation/footer strings
├── home.json                 # homepage content
├── about.json                # about page content
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
├── about.html
├── support.html
├── apps-index.html
├── app-page.html
├── legal-index.html
├── legal-document.html
└── 404.html
scripts/
├── build-content-pages.mjs
├── build-app-pages.mjs
├── prepare-site.mjs
└── lib/render.mjs
public/                        # generated/deployable static HTML + assets
├── index.html
├── 404.html
├── apps/
├── about/
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


## Adding another app

App pages use a shared template rather than duplicated hand-written HTML. To add an app:

1. Copy `content/apps/rivalry.json` to a new slug, for example `content/apps/new-app.json`.
2. Replace the app-specific content, theme, brand key and store-link keys.
3. Add the matching brand asset/config entries when available.
4. Run `npm run build:apps` (or `npm run prepare`).

The build regenerates the app catalogue and each `/apps/<slug>/` static page. The generated HTML remains deployable as a normal lightweight static Firebase site.

## Connect lifeloom.co.uk

In Firebase Console:

1. Open **Hosting** → **Add custom domain**.
2. Add `lifeloom.co.uk`.
3. Add the exact DNS records Firebase provides in GoDaddy.
4. Repeat for `www.lifeloom.co.uk` if required.
5. Firebase provisions HTTPS automatically after verification.

## Before launch

- Add your real LifeLoom and Rivalry assets under `brand-assets/`.
- Set the actual Firebase project ID in `config/site.local.json`.
- Confirm the configured support email.
- Add Google Play/App Store links when available.
- Review privacy policies against the final production services and data practices.

## GitHub

Because local config and real assets are already ignored, normal Git commands are safe:

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
