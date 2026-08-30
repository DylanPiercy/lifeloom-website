# LifeLoom Website

Public static website for **LifeLoom**, designed for Firebase Hosting.

## Stack

- HTML
- CSS
- Minimal vanilla JavaScript
- Firebase Hosting

The website itself has no framework or application build step. A small preparation script keeps local configuration and real brand assets out of Git.

## Repository-safe configuration

The public repository should contain only templates and source code.

Ignored local files:

- `.firebaserc` — generated from your local Firebase project ID.
- `config/site.local.json` — support email, Firebase references and store links.
- `brand-assets/*` — real LifeLoom/app logos and brand files.
- `public/runtime/` — generated deployment copies of local configuration/assets.

App detail pages are generated from reusable tracked source files: `templates/app-page.html` + `data/apps/*.json`.

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
    "rivalry": "rivalry-mark.svg"
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
data/
└── apps/
    └── rivalry.json           # app content/theme data
templates/
├── app-page.html             # reusable app detail template
└── apps-index.html           # reusable app catalogue template
scripts/
├── build-app-pages.mjs
└── prepare-site.mjs
public/
├── index.html
├── 404.html
├── apps/
│   ├── index.html             # generated static output
│   └── rivalry/index.html     # generated static output
├── about/index.html
├── support/index.html
├── legal/
│   ├── index.html
│   ├── privacy/index.html
│   └── apps/rivalry/privacy/index.html
├── runtime/                  # generated; ignored
└── assets/
    ├── css/style.css
    ├── js/main.js
    └── img/brand-placeholder.svg
```


## Adding another app

App pages use a shared template rather than duplicated hand-written HTML. To add an app:

1. Copy `data/apps/rivalry.json` to a new slug, for example `data/apps/peak-ledger.json`.
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
