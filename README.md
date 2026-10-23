# Pinch.

Pinch. is a student-first financial dashboard for tracking bank balances,
understanding everyday spending, and building clear SMART financial goals.

## Current build

The current browser prototype includes:

- An animated **Pinch.** wordmark loading screen
- A responsive midnight-blue, mint, sand, and coral visual system
- A clean account-focused overview
- Separate Accounts, Goals, and Activity pages
- Balance privacy controls
- Week, month, and semester spending views
- Browser-local transactions and SMART goals

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

- `index.html` — the account overview
- `accounts.html` — connected account details
- `goals.html` — SMART goal planning
- `activity.html` — spending and transaction history
- `styles.css` — responsive design system and loading animation
- `script.js` — shared interactions and local persistence
