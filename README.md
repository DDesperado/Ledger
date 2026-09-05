# AUREN

No signups outside GitHub. Deploys automatically on every push. Installable to a
phone home screen like a real app (PWA).

## How this version works
- All data lives in **this browser's local storage only** — nothing syncs between
  devices or people. Each friend who installs it gets their own private ledger.
- The **Assistant** tab is optional — add your own Anthropic API key in the in-app
  settings panel (stored only in that browser).
- **Settings → Download/Restore backup** exports everything to a JSON file, in case
  a phone gets wiped or someone wants to move devices.
- A GitHub Actions workflow builds and publishes to GitHub Pages automatically on
  every push to `main`.

## One-time setup
1. Repo → **Settings** → **Pages** → set **Source** to **GitHub Actions**.
2. Push to `main` (or just wait if you just pushed) — check the **Actions** tab,
   should go green in under a minute.
3. Live at: **https://ddesperado.github.io/AUREN/**

## Getting your friends onto it
Send them the link above. On iPhone: open in Safari → Share → **Add to Home Screen**.
On Android: open in Chrome → menu (⋮) → **Add to Home screen** (or Chrome will
prompt automatically). From then on it opens full-screen with its own icon, like
any other app — no App Store needed.

## AI assistant (optional)
console.anthropic.com → API Keys → create one → set a small spend cap under
Settings → Billing → paste it into the app's settings panel.
