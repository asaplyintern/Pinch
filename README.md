# Pinch.

Pinch. is a student-first financial dashboard for tracking bank balances,
understanding everyday spending, and building clear SMART financial goals.

## Current build

The first main-page prototype includes:

- An animated **Pinch.** wordmark loading screen
- A responsive midnight-blue, mint, sand, and coral visual system
- Balance visibility controls
- Connected-account summaries
- Week, month, and semester spending views
- Browser-local transaction entry
- SMART goal creation and progress tracking
- A student-focused savings insight

All data in this prototype is demo data. User changes are saved only in the
current browser with `localStorage`; no real bank connection exists yet.

## Run locally

This project has no build step or third-party dependencies. From the repository
root, run:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Project files

- `index.html` — page structure and accessible forms
- `styles.css` — responsive design system and loading animation
- `script.js` — dashboard interactions and local persistence
