# Lavorare dall'altro PC

Situazione al 28/10/2026: il sito è online e collegato al database; il dominio **68cesena.it** è stato comprato
su Dinahosting ed è in attivazione.

| Cosa | Dove |
|---|---|
| Sito (provvisorio) | https://sbenzi17.github.io/68cesena/ |
| Sito (definitivo, da collegare) | https://68cesena.it |
| Dominio | Dinahosting, intestato a Maurizio Benzi (solo dominio, niente hosting né email) |
| Database e login (Supabase) | https://supabase.com/dashboard, progetto «68/77 a Cesena» (accesso con GitHub) |
| Immagini e PDF (Cloudflare R2) | https://dash.cloudflare.com, account Benzi580, bucket `archivio-foto` |
| Worker dei caricamenti | `https://archivio-upload.archivio6877.workers.dev` |
| Codice | GitHub `sbenzi17/68cesena`, branch principale `archivo-fotografico-v1` |

## 0. REGOLA: niente in produzione senza l'approvazione di Silvia
Vale per chiunque lavori al progetto, persone e Claude (è scritta anche in `CLAUDE.md` nel repo).
1. **Mai commit diretti sul branch principale** (`archivo-fotografico-v1`).
2. Ogni modifica va su un **branch nuovo** e si apre una **Pull Request** verso il branch principale.
3. **Silvia** rivede la PR e, se va bene, la approva e fa il merge.
4. **Solo dopo l'approvazione** si mette in produzione: pubblicazione del sito (`npm run deploy`), del Worker,
   modifiche ai dati veri, alle impostazioni di Cloudflare, Supabase, GitHub o del dominio.

## Da fare

### A. Subito (non dipende dal dominio)
- [ ] **Contatore visite**: nel pannello, pagina **Stato** → sezione «Visite» → «Copia il testo», poi su
  supabase.com → SQL Editor → + New query → incolla → **Run**. Il contatore parte da quel momento.
- [ ] **Silvia su GitHub (consigliato)**: perché l'approvazione delle PR sia vera, Silvia dovrebbe avere un suo
  account GitHub, aggiunto al repo in **Settings → Collaborators**. Poi in **Settings → Branches** si può
  proteggere il branch principale («Require a pull request before merging» + «Require approvals»), così GitHub
  stesso impedisce di scrivere sul branch principale senza approvazione.

### B. Quando 68cesena.it risulta «Activo» su Dinahosting — parte delle persone
- [ ] 1. Confermare l'eventuale email del registro .it (registrazione / dati dell'intestatario).
- [ ] 2. **Cloudflare prende in gestione il dominio**: dash.cloudflare.com → **Onboard a domain** → `68cesena.it`
  → piano **Free** → copiare i **due nameserver** indicati.
- [ ] 3. **Dinahosting**: area clienti → Dominios → 68cesena.it → **Servidores DNS** → «personalizados» →
  inserire i due nameserver di Cloudflare → salvare. (Dinahosting può avvisare che il dominio «non punta più» ai
  suoi servizi: è normale; il dominio si rinnova sempre da Dinahosting.)
- [ ] 4. Aspettare l'email di Cloudflare «dominio attivo» (da pochi minuti a 48 ore).
- [ ] 5. **Token per i DNS**: Cloudflare → My Profile → API Tokens → Create Token → modello **«Edit zone DNS»** →
  Zone Resources: `68cesena.it` → Create. Copiarlo in `.env.local` come `CLOUDFLARE_DNS_TOKEN=...`
  (non incollarlo in chat).
- [ ] 6. Chiedere a Claude di collegare il dominio (parte C), poi rivedere e approvare la sua PR.
- [ ] 7. Dopo la pubblicazione: GitHub → repo → **Settings → Pages** → controllare che il dominio personalizzato sia
  `68cesena.it` e spuntare **Enforce HTTPS** (disponibile quando GitHub ha emesso il certificato, fino a 24 ore).
- [ ] 8. **Email info@68cesena.it**: Cloudflare → 68cesena.it → **Email → Email Routing** → attivare (aggiunge da
  solo i record) → indirizzo di destinazione `benzi580@gmail.com` → cliccare il link di conferma che arriva su
  Gmail → creare l'indirizzo `info@68cesena.it` che inoltra lì.
  Per rispondere come info@: Gmail → Impostazioni → Account → «Invia messaggi come» → aggiungi
  `info@68cesena.it` → server `smtp.gmail.com`, porta 587, utente = indirizzo Gmail, password = una
  **password per le app** di Google (serve la verifica in due passaggi attiva).
- [ ] 9. **Google Search Console**: https://search.google.com/search-console → Aggiungi proprietà → tipo
  **«Dominio»** → `68cesena.it` → Google mostra un record **TXT**: aggiungerlo su Cloudflare (DNS → Add record →
  TXT, nome `@`) o farlo aggiungere a Claude → **Verifica**. Poi **Sitemap** → `https://68cesena.it/sitemap.xml`
  → **Invia**. Dopo qualche giorno, in **Pagine** si vede quante schede Google ha indicizzato.
- [ ] 10. Modulo «Contattaci»: al primo messaggio verso il nuovo indirizzo, formsubmit.co manda un'email di
  attivazione: cliccare il link, altrimenti i messaggi non arrivano.

### C. Collegamento del dominio — istruzioni tecniche per Claude (su un branch, con PR per Silvia)
1. **DNS su Cloudflare** (zona `68cesena.it`, con `CLOUDFLARE_DNS_TOKEN`), tutti **«DNS only»** (nuvola grigia),
   altrimenti GitHub non emette il certificato:
   - `A @` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `AAAA @` → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `CNAME www` → `sbenzi17.github.io`
2. **Codice**:
   - `public/CNAME` con dentro `68cesena.it` (gh-pages lo pubblica e GitHub Pages usa il dominio);
   - `vite.config.js`: `base: '/'`;
   - `.env.production`: `VITE_SITE_URL=https://68cesena.it` (sitemap, canonical, pagine per Google);
   - `src/pages/Contatto.jsx` e testo privacy in `src/pages/Collabora.jsx`: indirizzo → `info@68cesena.it`;
   - `ALTRO-PC.md`: aggiornare gli indirizzi.
3. **Worker**: in `worker/wrangler.toml` `ALLOWED_ORIGIN = "https://68cesena.it,https://www.68cesena.it,https://sbenzi17.github.io"`
   e ripubblicarlo con `node scripts/pubblica-worker.mjs` (dopo l'approvazione).
4. **Immagini su img.68cesena.it**: Cloudflare → R2 → bucket `archivio-foto` → Settings → **Custom Domains** →
   Connect Domain → `img.68cesena.it`. Poi `.env.production`: `VITE_IMG_BASE=https://img.68cesena.it`.
   Nel database ci sono solo i nomi dei file, quindi non va cambiato niente lì. L'indirizzo `r2.dev` si può
   lasciare attivo finché tutto funziona.
5. **Pubblicazione** (solo dopo l'approvazione di Silvia): `npm run deploy`, poi verificare
   `https://68cesena.it`, una scheda (`/foto/084/`), `https://68cesena.it/sitemap.xml`, il login del pannello,
   un caricamento di prova (da cancellare) e che `https://sbenzi17.github.io/68cesena/` porti al dominio.
6. Supabase non richiede modifiche (il login è con email e password, senza link di ritorno al sito).

## 1. Per modificare o aggiungere schede: niente da installare
1. Apri il sito e clicca **Area riservata** (in fondo alla pagina).
2. Entra con l'email e la password dell'utente admin creato su Supabase.
3. Tutto viene salvato subito online, da qualsiasi computer.
   - **Schede**: modifica di tutti i campi; persone, formazioni e parole chiave si scrivono una per riga. Nelle
     schede esistenti i file (immagini, PDF, video, audio) stanno nel riquadro chiuso «Modifica i file». Per i
     documenti completi (i Bollettini) nella scheda c'è solo la prima pagina come immagine, mentre il documento
     intero è un PDF. Con lo stato «Sospesa» la scheda resta visibile solo agli admin.
   - **Anteprima**: il sito come lo vede un visitatore, senza uscire dal pannello.
   - **Storico**: chi ha cambiato cosa e quando, con il prima e il dopo; «Ripristina» riporta la scheda com'era;
     «Elimina riga» toglie una riga dallo storico.
   - **Evento**: un evento in evidenza (titolo, date, testo, immagine). Se è attivo, la sua immagine è la prima del
     banner e sotto il banner compare la sua sezione; dopo la data di fine sparisce da solo.
   - **Testi**: il testo in alto nel footer.
   - **Utenti**: aggiungere o togliere amministratori, reimpostare password; «Il mio account» per la propria.
   - **Stato**: visite, spazio usato su R2 e nel database, controlli di funzionamento, ping anti-pausa (anche a mano).
   - **Video e audio** (nella scheda): video = link di YouTube o link diretto a un file video (.mp4…);
     audio = file caricato su R2.
4. Il pulsante **Esporta catalogo** scarica un CSV con le stesse colonne dell'Excel.
5. Password dimenticata: un altro admin la reimposta dalla pagina **Utenti**. Se sei l'unico admin, fallo da
   Supabase: Authentication → Users → utente → Reset password.

**Il database è il master.** Le correzioni non si fanno più sull'Excel. Non rilanciare
`scripts/importa-supabase.mjs`, perché sovrascriverebbe le modifiche fatte dall'admin.

**Le modifiche fatte dal pannello sono dati, non codice**: vanno online subito e non passano dalle PR.
La regola della sezione 0 riguarda il codice, la pubblicazione e le impostazioni dei servizi.

## 2. Per modificare il codice del sito
Prima di tutto, nella cartella del progetto:
```
git checkout archivo-fotografico-v1
git pull
npm install
```
Poi:
```
git checkout -b modifica/descrizione-breve     # branch nuovo per ogni modifica
npm run dev                                     # prova in locale (usa il database vero: attenzione)
git add -A
git commit -m "Descrizione della modifica"
git push -u origin modifica/descrizione-breve
```
Poi su GitHub si apre la **Pull Request** verso `archivo-fotografico-v1` e si avvisa **Silvia**. Dopo
l'approvazione e il merge, dal branch principale aggiornato: `npm run deploy` per pubblicare. La build genera
anche una pagina per ogni scheda e la `sitemap.xml` per Google (`scripts/seo.mjs`): ripubblicare ogni tanto
tiene la sitemap aggiornata con le schede nuove.

Il file `.env.production` (URL e chiavi pubbliche) è già nel repo, quindi la build si collega da sola a
Supabase e R2.

## 3. Chiavi segrete: servono solo in casi rari
Per l'uso normale (admin e modifiche al codice) non servono. Servono per ricaricare in blocco immagini o PDF su R2
(`scripts/carica-r2.mjs`), ripubblicare il Worker e gestire i DNS del dominio.

In quei casi crea nella cartella del progetto un file `.env.local` (git lo ignora):
```
SUPABASE_URL=https://zoxwrlmczdaelsovkeyl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...   (Supabase → Project Settings → API Keys → Legacy → service_role)
R2_ACCOUNT_ID=8efd28413561fa9f1a79b711ae50566c
R2_ACCESS_KEY_ID=...            (Cloudflare → R2 → Manage API tokens; se l'hai persa, crea un token nuovo)
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=archivio-foto
CLOUDFLARE_API_TOKEN=...        (Cloudflare → Manage Account → Account API Tokens → modello "Edit Cloudflare Workers")
CLOUDFLARE_DNS_TOKEN=...        (vedi «Da fare» B.5)
```
Una copia delle chiavi è in `G:\Il mio Drive\chiavi-archivio.txt` (privata, mai nel repo).
Per ripubblicare il Worker: `node scripts/pubblica-worker.mjs`.

## 4. Il sito resta sempre online?
Sì. Cose da sapere:
- **Pausa di Supabase.** Il piano gratuito mette in pausa il database dopo 7 giorni senza attività. L'azione GitHub
  `keepalive` lo interroga ogni giorno; il pannello (Stato) mostra l'ultimo ping e ha il pulsante «Fai un ping
  adesso». Anche ogni visita al sito conta come attività.
  - GitHub **disattiva le azioni programmate se il repo non riceve commit per 60 giorni** e manda un'email:
    riattivarla da **Actions → keepalive → Enable workflow**.
  - Se il database fosse in pausa: su Supabase apri il progetto e clicca **Restore**. I dati non si perdono.
- **Scadenze.** La chiave pubblica di Supabase scade nel 2036; il token R2 non scade; il dominio va rinnovato ogni
  anno su Dinahosting (circa 16 €; meglio con rinnovo automatico).
- **Limiti gratuiti.** R2: 10 GB (oggi circa 0,26). Supabase: 500 MB di database (oggi circa 12 MB) e 5 GB di
  traffico al mese. Oltre si paga, ma arrivano prima le email di avviso; la pagina Stato diventa arancione al 70%.
