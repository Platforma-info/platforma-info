# PyInfo

Platformă de probleme de programare cu evaluare automată a soluțiilor.
Utilizatorii se înregistrează, rezolvă probleme de programare în Python și
primesc verdict instant (Acceptat / Răspuns greșit / Eroare / Timeout),
rulat izolat într-un [Vercel Sandbox](https://vercel.com/docs/vercel-sandbox).

## Stack

- **Next.js 16** (App Router, Server Actions, Turbopack) + TypeScript
- **Tailwind CSS 4** + **shadcn/ui**
- **Neon Postgres** (via Vercel Marketplace) + **Drizzle ORM**
- **Vercel Sandbox** pentru evaluarea sigură a codului trimis de utilizatori
- Autentificare proprie (sesiune semnată cu `jose`, parole cu `bcryptjs`)

## Funcționalități

- Autentificare și înregistrare cu sesiune persistentă
- Listă de probleme cu căutare, filtrare după dificultate și status rezolvat
- Editor de cod (Monaco) cu evaluare automată împotriva unor teste ascunse
- Istoric de trimiteri per problemă și per utilizator
- Pagină de profil cu statistici (rată de reușită, probleme rezolvate) și bio editabilă
- Temă light/dark

## Dezvoltare locală

```bash
npm install
vercel link          # dacă nu e deja legat de un proiect Vercel
vercel env pull       # aduce DATABASE_URL, AUTH_SECRET etc. în .env.local
npm run db:push       # aplică schema în baza de date
npm run db:seed       # populează problemele inițiale
npm run dev
```

## Teorie (`/theory`)

Secțiune publică cu articole de teorie: Python de la zero, Python pentru concursuri și algoritmi
(teoria numerelor, structuri de date, DP, stringuri, grafuri, combinatorică), fiecare cu cod Python testat.

- Conținutul este în `content/theory/<track>/<articol>.md` (Markdown + front-matter, matematică KaTeX, cod Shiki).
- Track-urile și secțiunile lor sunt declarate în `src/lib/theory/tracks.ts`; loader-ul (`src/lib/theory/content.ts`)
  validează front-matter-ul, secțiunile și trimiterile între articole.
- `npm run theory:check` validează front-matter-ul și **rulează tot codul Python** din articole, verificând și link-urile interne.
- Articolele cu `source:` în front-matter sunt adaptări după [cp-algorithms.com](https://cp-algorithms.com)
  (CC BY-SA 4.0); vezi `content/theory/NOTICE.md`.
- Progresul de citire se păstrează în `localStorage` (fără modificări în baza de date).

## Structură

- `src/app` — pagini și server actions (App Router)
- `content/theory` — articolele de teorie
- `src/lib/theory` — încărcarea și randarea articolelor
- `src/db` — schema Drizzle și scriptul de seed
- `src/lib/auth.ts` — sesiuni și hashing parole
- `src/lib/judge.ts` — execuția codului în Vercel Sandbox
- `legacy-flask/` — implementarea originală în Flask, păstrată ca referință

## Deploy

Proiectul este legat de Vercel; push pe `main` declanșează un deploy de producție.
