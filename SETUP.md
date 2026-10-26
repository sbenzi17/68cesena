# Messa in produzione: Supabase + Cloudflare R2

Architettura:
- **GitHub Pages**: il sito (gratuito)
- **Supabase**: database delle schede, login dell'area riservata, storico delle modifiche (piano gratuito)
- **Cloudflare R2**: immagini web e PDF (10 GB gratuiti, traffico gratuito)
- **Cloudflare Worker** `worker/`: riceve i caricamenti dal pannello admin e li scrive su R2 (gratuito)

## 1. Supabase
1. Crea un account su https://supabase.com (accesso con GitHub) e un progetto con regione **Central EU (Frankfurt)**. Salva la password del database.
2. **SQL Editor → New query**: incolla tutto `supabase/schema.sql` e premi **Run**.
3. **Authentication → Sign In / Providers**: disattiva "Allow new users to sign up".
4. **Authentication → Users → Add user**: crea l'utente admin (email + password, spunta "Auto Confirm").
5. **SQL Editor**: rendilo admin
   ```sql
   insert into public.admin (user_id, nome)
   select id, 'Nome Cognome' from auth.users where email = 'email@admin.it';
   ```
6. **Project Settings → API**: copia *Project URL*, la chiave *anon public* e la chiave *service_role* (segreta).

## 2. Cloudflare R2
1. Crea un account su https://dash.cloudflare.com.
2. **R2 Object Storage**: attiva R2 (chiede una carta o PayPal anche per il piano gratuito; sotto i 10 GB non si paga).
3. **Create bucket** con nome `archivio-foto` (posizione: Europa).
4. Nel bucket: **Settings → Public access → R2.dev subdomain → Allow**. Copia l'URL `https://pub-….r2.dev`.
5. **R2 → Manage API tokens → Create API token**: permesso *Object Read & Write*, solo sul bucket `archivio-foto`. Copia *Access Key ID*, *Secret Access Key* e l'*Account ID*.

## 3. File delle chiavi
Crea `.env.local` nella cartella del progetto (non viene mai caricato su GitHub):
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=archivio-foto
```
Compila `.env.production` (valori pubblici) e, in `worker/wrangler.toml`, `SUPABASE_URL` e `SUPABASE_ANON_KEY`.

## 4. Caricamento dei dati (una volta sola)
```
node scripts/web-images.mjs "G:\Il mio Drive\68-77" ..\web
node scripts/bollettini-pdf.mjs "G:\Il mio Drive\68-77" ..\pdf
node scripts/carica-r2.mjs ..\web ..\pdf
node scripts/importa-supabase.mjs "G:\Il mio Drive\68-77" ..\pdf
```

## 5. Worker di caricamento
```
cd worker
npx wrangler login
npx wrangler deploy
```
Copia l'URL `https://archivio-upload.….workers.dev` in `VITE_WORKER_URL` dentro `.env.production`.

## 6. Pubblicazione
```
npm run deploy
git add -A && git commit -m "Collegamento a Supabase e R2" && git push
```

## Da sapere
- Dopo l'importazione **il database è il master**: si modifica solo dal pannello admin. Il pulsante *Esporta catalogo* scarica il CSV con le colonne dell'Excel.
- Ogni modifica è registrata nella tabella `schede_storico` (chi, quando, prima/dopo).
- `.github/workflows/keepalive.yml` interroga Supabase ogni 3 giorni per evitare la pausa del piano gratuito.
- L'URL `r2.dev` va bene per iniziare; con molto traffico conviene collegare un dominio proprio al bucket.
