# Jess & Ara Wedding — Invitation & RSVP • 12.19.2026

Code entry: **only invitation codes can RSVP** (case-insensitive, dashes ignored).
Guests type their code → the whole site unlocks → they confirm seats.

## Pages
- `index.html` — envelope welcome → code gate → invitation (countdown, entourage, finer details, events, gift guide) + RSVP form
- `admin.html` — guest list dashboard (password `admin123`): search/filter, headcount, **add/edit/delete**, CSV export, code generator (Initials+Pax+Random3)
- `apps-script/Code.gs` — Google Sheets backend (tab `GuestList`). Paste into Extensions → Apps Script, deploy as web app, put URL in `window.GAS_URL` (top of `data.js`).

## Guest list format
Sheet tab `GuestList`: `CODE | NAME | PAX | SIDE | TABLE | STATUS | COMPANIONS | CONTACT | MESSAGE`
- CODE is the key (unique, e.g. `CF4-K7P`). STATUS accepts Attending/Confirmed/Declined/Pending (any case). COMPANIONS joined with `"; "`.
- Until `GAS_URL` is set, the site runs on `localStorage` demo data (`data.js` → `SEED_GUESTS`).

## Run locally
```powershell
cd "C:\Users\johnf\Documents\wedding-rsvp"
npx serve .
# or
python -m http.server 3000
```
Open http://localhost:3000 — try code `CF4-K7P` (any casing, dash optional).

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
