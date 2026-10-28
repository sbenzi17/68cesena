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
3. Tutto viene salvato subito online, da qualsiasi computer.
   - **Schede**: modifica di tutti i campi; persone, formazioni e parole chiave si scrivono una per riga. Si possono aggiungere, togliere, riordinare e sostituire le immagini. Per i documenti completi (i Bollettini) nella scheda c'è solo la prima pagina come immagine, mentre il documento intero è un PDF: nella sezione «PDF del documento completo» lo carichi già pronto o lo crei da più immagini. Con lo stato «Sospesa» la scheda resta visibile solo agli admin.
   - **Storico**: chi ha cambiato cosa e quando, con il prima e il dopo. Il pulsante «Ripristina» riporta la scheda com'era, anche se era stata eliminata.
   - **Anteprima**: il sito come lo vede un visitatore, senza uscire dal pannello.
   - **Testi**: il testo in alto nel footer.
   - **Video e audio** (nella scheda): video = link di YouTube o link diretto a un file video (.mp4…); audio = file caricato su R2. Nelle schede esistenti i file stanno nel riquadro chiuso «Modifica i file».
   - **Evento**: un evento in evidenza (titolo, date, testo, immagine). Se è attivo, la sua immagine è la prima del banner e sotto il banner compare la sua sezione; dopo la data di fine sparisce da solo.
   - **Stato**: visite, spazio usato su R2 e nel database, controlli di funzionamento, ping anti-pausa (anche a mano).
   - **Utenti**: per aggiungere o togliere amministratori e reimpostare la password di un altro admin. Nella sezione «Il mio account» cambi la tua password.
4. Il pulsante **Esporta catalogo** scarica un CSV con le stesse colonne dell'Excel.
5. Password dimenticata: un altro admin la reimposta dalla pagina **Utenti**. Se sei l'unico admin, fallo da Supabase: Authentication → Users → utente → Reset password.

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
- `npm run deploy`: pubblica il sito. La build genera anche una pagina per ogni scheda e la `sitemap.xml` per Google (`scripts/seo.mjs`): ripubblicare ogni tanto tiene la sitemap aggiornata con le schede nuove.
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
CLOUDFLARE_API_TOKEN=...        (Cloudflare → Manage Account → Account API Tokens → modello "Edit Cloudflare Workers")
```
Per ripubblicare il Worker: `node scripts/pubblica-worker.mjs`. Lo script imposta anche la chiave service_role nel Worker, che serve alla pagina Utenti.

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
