# REZ — zakazivanje muškog šišanja

Sajt berbernice sa jednim frizerom. Klijent bira jednu od četiri muške frizure, dan u kalendaru i slobodan sat.

## Pokretanje

```bash
npm install
npm run dev
```

Produkcijski build:

```bash
npm run build
```

Folder `dist` je statički sajt. Putanje su relativne, pa radi i na GitHub Pages projektu `https://gilenzi.github.io/hairdresser-calendar/`.

## GitHub Pages

Workflow `.github/workflows/pages.yml` objavljuje `dist` na svaki push u `master`. U podešavanjima repozitorijuma uključi **Pages → Build and deployment → Source: GitHub Actions**.

Termini se čuvaju u Supabase tabeli `bookings`. Zauzet sat važi za sve koji otvore sajt. Lozinka baze ostaje u lokalnom `.env` i ne ide u git.
