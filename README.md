# Wedding RSVP Demo — inspired by @maartistersvp TikTok

MaArtiste-style: **only invited codes can RSVP**, so the guest list stays clean.

## Pages
- `index.html` — public invitation + invite-code RSVP (with plus-one / family pax)
- `admin.html` — guest list dashboard (password `admin123`, search/filter, headcount, CSV export)

## Run locally
```powershell
cd "C:\Users\johnf\Documents\wedding-rsvp"
npx serve .
# or
python -m http.server 3000
```
Open http://localhost:3000

## Demo codes
- `MA-ART-001` — Dela Cruz Family (pax 4)
- `MA-ART-002` — Juan Santos + Guest (pax 2)
- `MA-ART-003` — Maria Reyes (pax 1)
- `MA-ART-007` — Aquino Family (pax 3)

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

Data is in browser `localStorage` for demo. For production, replace `loadGuests/saveGuests` with a real API (Vercel KV / Postgres / Supabase).
