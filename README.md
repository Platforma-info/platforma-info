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

## Structură

- `src/app` — pagini și server actions (App Router)
- `src/db` — schema Drizzle și scriptul de seed
- `src/lib/auth.ts` — sesiuni și hashing parole
- `src/lib/judge.ts` — execuția codului în Vercel Sandbox
- `legacy-flask/` — implementarea originală în Flask, păstrată ca referință

## Deploy

Proiectul este legat de Vercel; push pe `main` declanșează un deploy de producție.
