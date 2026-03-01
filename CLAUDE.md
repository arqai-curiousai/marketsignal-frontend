# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MarketSignal is an AI-powered investment research platform by arQai. It consists of a Python FastAPI backend and a Next.js 14 TypeScript frontend. The platform is **India-first** — it covers NSE (NIFTY 50), INR currency pairs, and MCX commodities. Signal generation uses a **Dual AI Agent pipeline** (Market Maker + Retail Investor perspectives) rather than traditional rule-based detectors. The platform also provides RAG-powered research Q&A and an algo-trading playground.

## Repository Structure

```
marketsignal-backend/   # Python FastAPI async backend
marketsignal-frontend/  # Next.js 14 + TypeScript frontend
resources/              # Notebooks and resources
```

## Common Commands

### Backend (`marketsignal-backend/`)

```bash
# Install dependencies
pip install -e ".[dev]"

# Run dev server
uvicorn app.main:app --reload --port 8000

# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Lint
ruff check app tests

# Format
black app tests

# Type check
mypy app

# Docker build & run
docker build -t marketsignal-backend .
docker-compose up -d
```

### Frontend (`marketsignal-frontend/`)

```bash
# Install dependencies
yarn install

# Dev server (port 3000)
yarn dev

# Build
yarn build

# Lint
yarn lint

# Test
yarn test
```

## Backend Architecture

**Entry point**: `app/main.py` — FastAPI app factory with lifespan manager that initializes MongoDB (Beanie ODM), APScheduler, and SlowAPI rate limiter.

### Key Layers

- **`app/api/`** — Route handlers: `auth_routes.py`, `signals.py`, `research.py`, `stocks.py`, `watchlist.py`, `playground.py`
- **`app/agents/`** — Dual AI Agent pipeline:
  - `base.py` — Shared types (`MarketSnapshot`, `AgentAnalysis`, `AgentProtocol`)
  - `market_maker.py` — Institutional/smart-money perspective agent (accumulating/distributing/neutral)
  - `retail_investor.py` — Retail sentiment agent (bullish/bearish/confused)
  - `signal_resolver.py` — Deterministic conflict resolver → BUY/SELL/HOLD with conflict type
- **`app/algos/`** — Algo-trading playground strategies:
  - `base.py` — `AlgoStrategy` ABC, `SignalAction` enum, `AlgoResult`
  - `registry.py` — `AlgoRegistry` with circuit breaker (auto-disable after 3 consecutive failures)
  - `strategies/` — MACD, RSI, SMA crossover implementations
- **`app/services/`** — Business logic:
  - `ondemand_signal_service.py` — Orchestrates dual-agent pipeline with per-ticker locking and caching
  - `data_pipeline.py` — Data ingestion orchestrator (pluggable `DataSource` via DI)
  - `market_hours.py` — Market-hours-aware scheduling (NSE, Forex, Commodity)
  - `instrument_config.py` — Fixed instrument universe (NIFTY 50, 5 INR pairs, 5 MCX commodities)
  - `archival_service.py` — S3 archival with upload verification before MongoDB deletion
  - `playground.py` — Algo-trading playground orchestrator
- **`app/datasources/`** — External data integrations (FCSAPI, Kite/Zerodha, NSE, NewsAPI). Each implements `DataSource` ABC from `base.py`
- **`app/ai/`** — RAG pipeline: `rag.py` (orchestrator), `ai_client.py` (OpenAI LLM), `embeddings.py`, `vector_store.py` (Qdrant)
- **`app/models/`** — Beanie document models (MongoDB ODM). All DB models end in `DB` suffix. Key models:
  - `AISignalDB` — Dual-agent signal results with outcome tracking
  - `ActiveSignalDB` — Cross-user signal activation state (shared AI calls)
  - `AlgoSignalDB`, `LatestSignalDB`, `AlgoPerformanceDB` — Algo playground signals
  - `OHLCVIntradayDB`, `OHLCVDailyDB`, `ArchiveReferenceDB` — Price data
  - `User`, `Session`, `OTP` — Auth models
  - `UserWatchlistDB` — User watchlist with signal_active toggle
- **`app/schemas/`** — Pydantic request/response schemas + enum validators (`PeriodEnum`, `ExchangeEnum`, `InstrumentTypeEnum`)
- **`app/signals/`** — `DetectorRegistry` and `DetectorProtocol` (legacy rule-based detectors removed; AI agents are primary)
- **`app/core/`** — Config (`settings` singleton), logging (structlog), auth (JWT + session revocation), scheduler (APScheduler), `rate_limit.py` (SlowAPI)
- **`app/utils/`** — `time.py` (timezone-aware `utcnow()`), `sanitize.py` (XSS protection via `sanitize_html()`)
- **`app/ingestion/`** — Data normalization, embedding pipelines, fundamentals pipeline
- **`scripts/`** — Utility scripts (`yahoo_utility.py` — standalone, not in production)

### API Route Prefixes

| Prefix | Handler | Description |
|--------|---------|-------------|
| `/api/auth` | `auth_routes.py` | OTP login, JWT tokens, sessions |
| `/api/signals` | `signals.py` | Market status, signal activate/deactivate, active signals |
| `/api/research` | `research.py` | RAG Q&A with SSE streaming |
| `/api/stocks` | `stocks.py` | Stock data, OHLCV, rate-limited |
| `/api/watchlist` | `watchlist.py` | User watchlist CRUD |
| `/api/playground` | `playground.py` | Algo dashboard, signals, performance |
| `/health` | inline | Health check |
| `/metrics` | inline | Prometheus metrics |

### Config

`app/core/config.py` loads all settings from `.env` via Pydantic Settings.

- `LLM_PROVIDER`: `openai` or `mock`
- `VECTOR_STORE_TYPE`: `qdrant` or `mock`
- `AI_AGENT_MODEL`: Model for dual-agent pipeline (default `gpt-4-turbo-preview`)
- `AI_AGENT_COOLDOWN_SECONDS`: Minimum interval between re-generating a signal (default 30)
- `MAX_ACTIVE_SIGNALS_PER_USER`: Per-user limit (default 10)
- `CORS_ORIGINS`: Defaults to `[]` (disabled); must be explicitly set

### Data Sources

- **FCSAPI**: Forex, commodities, fundamentals, news, global stock data (production)
- **Kite Connect**: NSE live quotes, historical data, F&O (production)
- **Yahoo Finance**: Standalone utility only (`scripts/yahoo_utility.py`), not in production

### Infrastructure

- **MongoDB** — Hot data via Motor/Beanie (with connection timeouts: 5s server selection, 10s connect, 45s socket)
- **S3-compatible storage** — Cold data archival via aioboto3 (verified uploads before deletion)
- **Qdrant Cloud** — Vector store for RAG embeddings
- **SlowAPI** — In-memory rate limiting (no Redis)
- **Prometheus** — Request count and latency metrics
- **Docker** — Multi-stage build, non-root user, health check

### Scheduled Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Active signal refresh | Every 5 min | Dual-agent pipeline for instruments with active users |
| EOD signals | Daily 15:35 IST | End-of-day signals for active instruments |
| Playground algos | Every 5 min | Run all registered algo strategies |
| Algo outcome eval | Every 30 min | Check past predictions vs actual prices |
| Intraday OHLCV | Every 5 min | 5-min bars for tracked stocks |
| Daily OHLCV | Daily 18:30 EST | End-of-day bars |
| Forex prices | Every 5 min | FCSAPI forex sync |
| Commodity prices | Every 5 min | FCSAPI commodity sync |
| Market news | Every 30 min | FCSAPI news sync |
| NSE Bhavcopy | Daily 18:00 IST | End-of-day NSE data |
| Fundamentals | Weekly Sun 2 AM | Earnings, financials |
| S3 Archival | Weekly Sun 3 AM | Move old intraday to cold storage |

## Frontend Architecture

**Framework**: Next.js 14 App Router with TypeScript, Tailwind CSS, Shadcn/Radix UI.

### Key Directories

- **`app/`** — Pages (App Router):
  - Landing (`/`), Login (`/login`), Markets (`/signals`), Signal Detail (`/signals/[id]`)
  - Stocks (`/stocks`), Stock Detail (`/stocks/[ticker]`), Research (`/research`)
  - Assistant (`/assistant`), Playground (`/playground`), Settings (`/settings`), Legal (`/legal`)
  - `error.tsx` + `global-error.tsx` — Error boundaries
- **`app/api/`** — Next.js API routes that proxy to the backend (auth, stocks, watchlist)
  - All auth routes import `BACKEND_URL` from `src/lib/api/backendUrl.ts`
- **`components/`** — React components:
  - `signals/` — SignalToggle, MarketStatusBadge, InstrumentList, MyPicksList, SignalCard, StockListItem
  - `stocks/` — StockCard, StockList, OHLCVChart, StockChatSheet
  - `playground/` — SignalGrid, SignalDot, AlgoPerformanceCard, OutcomeCard, DashboardStats
  - `chat/` — ChatWindow, Message, SourcePanel
  - `layout/` — Header, Footer, Shell
  - `ui/` — Shadcn component library (70+ components)
- **`src/lib/api/`** — API client layer:
  - `apiClient.ts` — Core client with CSRF double-submit, retry logic (max 2), 401 token refresh
  - `signalApi.ts` — Market status, activate/deactivate, active signals, instruments
  - `stockApi.ts` — Stocks, OHLCV, quotes, exchanges
  - `watchlistApi.ts` — Watchlist CRUD
  - `playgroundApi.ts` — Algo dashboard, signals, performance
  - `backendUrl.ts` — Centralized backend URL for server-side routes
  - `client.ts` — Re-export of apiClient (backward compatibility)
- **`src/types/`** — TypeScript types: `stock.ts` (IStock, IAISignal, IMarketStatus), `playground.ts` (IAlgoSignal, IAlgoPerformance), `index.ts` (User, AuthTokens)
- **`context/`** — AuthContext provider (login, logout, checkAuth)

### API Proxying

`next.config.js` rewrites `/api/:path*` to the Python backend URL from `NEXT_PUBLIC_API_ORIGIN` or `NEXT_PUBLIC_API_URL`. The client uses relative URLs only — no API keys in the browser.

### Auth

- Middleware (`src/middleware.ts`) protects `/stocks`, `/signals`, `/playground`, `/assistant`, `/research`, `/settings`
- Cookie-based JWT (httpOnly, sameSite=lax)
- Client-side 401 interceptor: attempts token refresh before redirect
- CSRF via double-submit cookie pattern
- Session revocation on logout (backend checks `is_revoked`)

### Security Headers

`next.config.js` sets on all routes:
- `X-Frame-Options: DENY`
- `Content-Security-Policy: frame-ancestors 'none'`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Code Style

**Backend**: Black formatter (line-length 100), Ruff linter, mypy strict mode. Python 3.11+, fully async with asyncio. pytest with `asyncio_mode = "auto"`. Use `from app.utils.time import utcnow` instead of `datetime.utcnow()` (deprecated in Python 3.12+).

**Frontend**: Prettier (semi, singleQuote, tabWidth 2), ESLint with strict TypeScript rules (`no-explicit-any: error`). No `console.log` (only `console.warn`/`console.error` allowed). Use `apiClient` from `src/lib/api/apiClient.ts` for all API calls.

## Key Design Patterns

- **Dual AI Agent Pipeline**: Two independent LLM agents (Market Maker = institutional, Retail Investor = crowd) analyze the same `MarketSnapshot`. A deterministic `SignalResolver` maps their bias combinations to BUY/SELL/HOLD. Divergence signals (smart money vs retail disagree) have highest conviction.
- **On-Demand Signal Generation**: Signals are computed only when users activate the toggle. `ActiveSignalDB` tracks cross-user count so AI calls are shared. Per-ticker `asyncio.Lock` prevents duplicate concurrent generation with double-check caching.
- **Hallucination Guard**: Agent confidence is capped at 0.85 if the LLM returns >0.95.
- **Algo Playground**: Pluggable strategies implement `AlgoStrategy` ABC and auto-register. Circuit breaker disables after 3 consecutive failures. Outcome tracking compares predictions to actual prices.
- **Market Hours Aware**: `market_hours.py` provides `is_nse_open()`, `is_forex_open()`, `is_commodity_open()`. Signal refresh and snapshot building skip stale intraday data when markets are closed.
- **Content Filtering**: Regulatory compliance filter blocks investment advice keywords (buy/sell/recommend). Controlled by `CONTENT_FILTER_ENABLED` setting.
- **Data Provider Abstraction**: `app/datasources/base.py` defines the `DataSource` ABC. New exchange providers implement it and inject into `DataPipelineService`.
- **S3 Archival Safety**: Upload verification (`storage.exists()`) before MongoDB deletion prevents data loss.
- **Rate Limiting**: SlowAPI on public endpoints (60/min stocks, 10/min signal activate, 60/min market status).
- **Auth Flow**: OTP-based email authentication with JWT tokens (access + refresh), session revocation on logout.

## Environment Setup

Backend `.env` in `marketsignal-backend/` — see `.env.example` for all fields.

Required: `ENVIRONMENT`, `MONGODB_URL`, `MONGODB_DB_NAME`, `OPENAI_API_KEY`, `FCSAPI_ACCESS_KEY`, `S3_BUCKET`, `S3_ENDPOINT_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `SECRET_KEY` (min 32 chars), `RESEND_API_KEY`, `MAIL_FROM`.

Frontend `.env` in `marketsignal-frontend/` — see `ENV_SETUP.md` for guidance.

Required: `NEXT_PUBLIC_API_URL` pointing to the backend (e.g., `http://localhost:8000/api`).
