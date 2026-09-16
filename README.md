# GEX Dashboard — Gamma Exposure Signal Analyzer

A production-grade web tool that visualizes dealer gamma exposure across the options chain, identifies key support/resistance levels, and classifies market regime (positive vs. negative gamma).

## Tech Stack

- **Backend:** Python 3.9+, FastAPI, NumPy, Pandas
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts
- **Data Source:** Charles Schwab API (OAuth 2.0) with static sample fallback
- **Fonts:** JetBrains Mono (data) + Inter (UI)

## Quick Start

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs on `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard runs on `http://localhost:3000`.

### Run Tests

```bash
cd backend
source .venv/bin/activate
python -m pytest tests/ -v
```

## Environment Variables

### Backend (`backend/.env.local`)

```env
DATA_SOURCE=sample          # "sample" or "schwab"
SCHWAB_APP_KEY=             # From developer.schwab.com
SCHWAB_APP_SECRET=          # From developer.schwab.com
SCHWAB_ACCESS_TOKEN=        # After OAuth flow
SCHWAB_REFRESH_TOKEN=       # After OAuth flow
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Endpoints

- `GET /api/health` — Health check + data source status
- `GET /api/gex/{symbol}?expiration_filter=all` — Computed GEX data
  - Filters: `0dte`, `weekly`, `monthly`, `all`
