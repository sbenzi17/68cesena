# Archivio Fotografico - React + Vite

Progetto React convertito da HTML vanilla con Vite come build tool.

## Struttura del Progetto

```
src/
├── components/        # Componenti riutilizzabili
│   ├── Header.jsx     # Intestazione
│   ├── Navigation.jsx # Menu di navigazione
│   └── Banner.jsx     # Banner con slider
├── pages/             # Pagine (Router)
│   ├── Home.jsx       # Home
│   ├── Search.jsx     # Ricerca
│   ├── PhotoDetail.jsx # Dettaglio foto
│   └── Login.jsx      # Login
├── App.jsx            # App principale con Router
├── main.jsx           # Entry point
└── index.css          # Stili globali
```

## Installazione Dipendenze

```bash
cd 68cesena
npm install
```

## Sviluppo

```bash
npm run dev
```

Apre automaticamente http://localhost:5173

## Build per Produzione

```bash
npm run build
```

Genera la cartella `dist/` con codice minificato e uglificato, pronto per l'upload online.

## Prossimi Passi

1. ✅ Struttura React con routing
2. ⬜ Integrare stili CSS completi
3. ⬜ Creare pagine di ricerca/dettaglio
4. ⬜ Connettere backend (quando pronto)
5. ⬜ Aggiungere form di login

Quando il backend Node.js + Express è pronto, aggiungeremo le API REST per il database.
