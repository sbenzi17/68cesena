# Istruzioni per Claude — progetto 68cesena

## Controllo delle versioni: niente in produzione senza l'approvazione di Silvia — IMPERATIVO
- **Mai commit o push direttamente sul branch principale `archivo-fotografico-v1`.**
- Ogni modifica va su un **branch nuovo**, poi si apre una **Pull Request** verso `archivo-fotografico-v1`.
- Dopo aver aperto la PR, **avvisare sempre Silvia** di guardarla: «Silvia deve rivedere e approvare la PR: <link>»,
  con un riassunto di cosa cambia. **Mai fare il merge**: lo fa Silvia dopo l'approvazione.
- **Mai mettere niente in produzione senza l'approvazione esplicita di Silvia**: pubblicazione del sito
  (`npm run deploy` / `gh-pages`), del Worker (`node scripts/pubblica-worker.mjs`), modifiche ai dati veri di
  Supabase o ai file su R2 (salvo dati di prova creati e cancellati durante un test, dichiarandolo), modifiche alle
  impostazioni di Cloudflare, Supabase, GitHub o del dominio.
- Liberi: leggere, analizzare, provare in locale, preparare il codice sul branch della PR.

## Dove sono le informazioni
- `ALTRO-PC.md`: stato del progetto, cose da fare (dominio 68cesena.it, Google, email), uso del pannello.
- `SETUP.md`: architettura (GitHub Pages + Supabase + Cloudflare R2 + Worker) e messa in produzione iniziale.
- `supabase/schema.sql`: schema del database e funzioni aggiunte nel tempo.
