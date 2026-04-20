<p align="center">
  <img src="./githubheader.png" alt="Global Accord" width="100%" />
</p>

# Global Accord

A browser-based climate summit game built with **React** and **Vite**. You lead negotiations across five delegations over ten turns—balancing subsidies, technology sharing, pressure, and agreement votes—to secure enough commitments before the summit ends.

## Features

- **Turn-based diplomacy** with per-country stats (trust, openness, pressure), political needs, and cross-country reactions
- **Auth0** authentication for sign-in
- **Firebase (Firestore)** cloud saves—resume up to three in-progress games from the dashboard
- **Google Gemini** (optional) for AI-generated turn dialogue; falls back to handcrafted lines if the API is omitted or unavailable
- **Intro and ending cinematics** with branching outcomes based on how many delegations commit

## Prerequisites

- **Node.js** 18+ recommended
- Accounts / keys for services you enable: **Auth0**, **Firebase**, and optionally **Google AI (Gemini)**

## Quick start

```bash
git clone <your-repo-url> global-accord
cd global-accord
npm install
cp .env.example .env.local
```

Edit **`.env.local`** with your real values (see below), then:

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Environment variables

Copy from [`.env.example`](./.env.example) into **`.env.local`**. Vite only exposes variables prefixed with `VITE_`.

| Variable | Purpose |
|----------|---------|
| `VITE_AUTH0_DOMAIN` | Auth0 tenant domain |
| `VITE_AUTH0_CLIENT_ID` | Auth0 application client ID |
| `VITE_FIREBASE_*` | Firebase project config (Firestore for saves) |
| `VITE_GEMINI_API_KEY` | Optional; enables Gemini-written dialogue |
| `VITE_GEMINI_MODEL` | Optional; defaults to `gemini-2.5-flash` |

Without Firebase configured, the dashboard still loads but cloud save/load is disabled. Without Gemini, the game uses built-in dialogue only.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |

## Project layout

```
├── docs/              # Design notes, PRD, image prompts, etc.
├── images/            # Static art assets
├── scripts/           # Optional dev utilities (e.g. dialogue simulation)
├── src/
│   ├── App.jsx        # Game board, turn resolution, UI shell
│   ├── Dashboard.jsx  # Save / resume games (authenticated)
│   ├── IntroCinematic.jsx / EndingCinematic.jsx
│   ├── geminiDialogue.js
│   ├── firebase.js / gameSaves.js
│   └── styles.css
├── index.html
└── vite.config.js
```

## Documentation

Additional design and implementation detail lives under [`docs/`](./docs/) (e.g. product spec, endings, cinematics).

## License

Add a `LICENSE` file and reference it here when you choose one.
