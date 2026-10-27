# Lavorare dall'altro PC

Situazione al 27/10/2026: il sito è online e collegato al database.

| Cosa | Dove |
|---|---|
| Sito | https://sbenzi17.github.io/archivio-fotografico-isr-fc-react/ |
| Database e login (Supabase) | https://supabase.com/dashboard, progetto «68/77 a Cesena» (accesso con GitHub) |
| Immagini e PDF (Cloudflare R2) | https://dash.cloudflare.com, account Benzi580, bucket `archivio-foto` |
| Worker dei caricamenti | `https://archivio-upload.archivio6877.workers.dev` |
| Codice | GitHub `sbenzi17/archivio-fotografico-isr-fc-react`, branch `archivo-fotografico-v1` |

## 1. Per modificare o aggiungere schede: niente da installare
1. Apri il sito e clicca **Area riservata**.
2. Entra con l'email e la password dell'utente admin creato su Supabase.
3. Modifica, aggiungi foto o elimina schede: tutto viene salvato subito online, da qualsiasi computer.
4. Il pulsante **Esporta catalogo** scarica un CSV con le stesse colonne dell'Excel.

**Il database è il master.** Le correzioni non si fanno più sull'Excel. Non rilanciare `scripts/importa-supabase.mjs`, perché sovrascriverebbe le modifiche fatte dall'admin.

## 2. Per modificare il codice del sito
Prima di tutto, nella cartella del progetto:
```
git checkout archivo-fotografico-v1
git pull
npm install
```
Poi, come sempre:
- `npm run dev`: prova in locale. Attenzione: usa il database vero, quindi le modifiche fatte dall'admin in locale sono reali.
- `npm run deploy`: pubblica il sito.
- `git add -A`, `git commit -m "..."`, `git push`: salva il codice su GitHub.

Il file `.env.production` (URL e chiavi pubbliche) è già nel repo, quindi la build si collega da sola a Supabase e R2.

## 3. Chiavi segrete: servono solo in casi rari
Per l'uso normale (admin e modifiche al codice) non servono. Servono solo per:
- **ricaricare in blocco** immagini o PDF su R2 (`scripts/carica-r2.mjs`);
- **ripubblicare il Worker** (cartella `worker/`), se si modifica il suo codice.

In quei casi crea nella cartella del progetto un file `.env.local` (git lo ignora):
```
SUPABASE_URL=https://zoxwrlmczdaelsovkeyl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...   (Supabase → Project Settings → API Keys → Legacy → service_role)
R2_ACCOUNT_ID=8efd28413561fa9f1a79b711ae50566c
R2_ACCESS_KEY_ID=...            (Cloudflare → R2 → Manage API tokens; se l'hai persa, crea un token nuovo)
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=archivio-foto
```
Per il Worker: `cd worker`, poi `npx wrangler login` e `npx wrangler deploy`.

## 4. Il sito resta sempre online?
Sì. Nessuna chiave usata dal sito scade a breve. Ci sono due cose da sapere:

- **Pausa di Supabase.** Il piano gratuito mette in pausa il database dopo 7 giorni senza attività. Per evitarlo, l'azione GitHub `keepalive` lo interroga ogni 3 giorni.
  - GitHub però **disattiva le azioni programmate se il repo non riceve commit per 60 giorni**, e manda un'email di avviso.
  - Se arriva: su GitHub vai in **Actions → keepalive → Enable workflow**, oppure fai un commit qualsiasi.
  - Se il database fosse già in pausa: su Supabase apri il progetto e clicca **Restore**. I dati non si perdono.
- **Scadenze delle chiavi.**
  - La chiave pubblica di Supabase scade nel 2036.
  - Il token R2 non scade.
  - Il token «Edit Cloudflare Workers» è servito solo per pubblicare il Worker: il sito non lo usa e lo si può cancellare.
- **Limiti gratuiti.**
  - R2: 10 GB, oggi ne usiamo circa 0,2.
  - Supabase: 500 MB di database (oggi 26 MB) e 5 GB di traffico al mese.
  - Oltre questi limiti si paga, ma non succede niente all'improvviso: arrivano prima le email di avviso.
