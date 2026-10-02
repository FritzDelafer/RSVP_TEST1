# Jess & Ara Wedding — Invitation & RSVP • 12.19.2026

Name-list entry: **only names on the guest list can RSVP** (case-insensitive).
Guests type their name → the whole site unlocks → they confirm seats.

## Pages
- `index.html` — envelope welcome → name gate → invitation (countdown, entourage, finer details, events, gift guide) + RSVP form
- `admin.html` — guest list dashboard (password `admin123`): search/filter, headcount, **add/edit/delete**, CSV export
- `apps-script/Code.gs` — Google Sheets backend (tab `GuestList`). Paste into Extensions → Apps Script, deploy as web app, put URL in `window.GAS_URL` (top of `data.js`).

## Guest list format
Sheet tab `GuestList`: `NAME | PAX | SIDE | TABLE | STATUS | ATTENDING | COMPANIONS | CONTACT | MESSAGE | UpdatedAt`
- No codes — NAME is the key. STATUS accepts Attending/Confirmed/Declined/Pending (any case). COMPANIONS joined with `"; "`.
- Until `GAS_URL` is set, the site runs on `localStorage` demo data (`data.js` → `SEED_GUESTS`).

## Run locally
```powershell
cd "C:\Users\johnf\Documents\wedding-rsvp"
npx serve .
# or
python -m http.server 3000
```
Open http://localhost:3000 — try name `Canto Family` (any casing).

## Deploy to Vercel
Static site, no build needed.

Option A — Vercel CLI:
```powershell
npm i -g vercel
vercel
```

Option B — Dashboard:
1. Push this folder to GitHub
2. vercel.com → Add New Project → Import repo → Deploy (framework: Other)

Data is in browser `localStorage` until `window.GAS_URL` is set — then all devices share the Google Sheet.
