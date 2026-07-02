# StockLedger IMS — Brighto & Hoshi

Inventory & Ledger Management System for wholesale electrical/lighting import business.

## Features
- Executive Dashboard with KPIs, sales chart, aging receivables
- Multi-brand (Brighto / Hoshi) with one-click brand switcher
- Inventory with multi-batch cost tracking per product
- Supplier directory with balance tracking
- Shopkeeper profiles with full debit/credit ledger
- Invoice builder with line items and FIFO batch selection
- WhatsApp integration (opens pre-filled message)
- Expenses tracker by category and brand

## Deploy to Vercel (free, ~2 minutes)

1. Push this repo to GitHub
2. Go to https://vercel.com → New Project → Import your repo
3. Framework: **Vite** (auto-detected)
4. Build command: `npm run build`
5. Output directory: `dist`
6. Click Deploy

That's it. Vercel handles HTTPS, CDN, and auto-deploys on every push.

## Run locally

```bash
npm install
npm run dev
```

Opens at http://localhost:5173

## Tech stack
- React 18 + Vite
- React Router v6 (client-side routing)
- Recharts (dashboard charts)
- Lucide React (icons)
- date-fns (date utilities)
- All data in `src/data/mockData.js` — replace with real API calls

## Connecting a real backend

Replace the imports in each page from:
```js
import { products } from '../data/mockData';
```
to API calls (fetch/axios) hitting your FastAPI/Node backend with PostgreSQL.

## Adding real WhatsApp

Replace the `handleWhatsApp` function in Shopkeepers.jsx with a call to:
- **Twilio WhatsApp API** (recommended, $0.005/msg)
- **Meta WhatsApp Cloud API** (free tier, requires business verification)
