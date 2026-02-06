# MarketSignal AI - Complete Project Documentation

> **AI-Powered Investment Research Platform**
> A full-stack application providing real-time market data, algorithmic signals, and RAG-powered Q&A for investment research.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Backend Deep Dive](#backend-deep-dive)
5. [Frontend Deep Dive](#frontend-deep-dive)
6. [Data Flow](#data-flow)
7. [API Reference](#api-reference)
8. [Configuration & Environment](#configuration--environment)
9. [Running the Project](#running-the-project)

---

## Project Overview

**MarketSignal AI** is a professional-grade investment research platform that combines:

- **Real-Time Market Data**: Live stock prices, OHLCV charts, and fundamentals from global exchanges (NASDAQ, NYSE, NSE, BSE, LSE)
- **Algorithmic Signals**: Automated detection of market patterns, anomalies, and correlation breakdowns
- **AI-Powered Research Assistant**: RAG (Retrieval-Augmented Generation) system for answering market questions with sourced citations
- **Regulatory Compliance**: Built-in content filtering to ensure outputs are informational only (no buy/sell recommendations)

### Key Features

| Feature | Description |
|---------|-------------|
| **Stock Dashboard** | Browse 500+ stocks with real-time prices, color-coded signal indicators |
| **AI Chat** | Contextual AI assistant for each stock with sourced answers |
| **Analytics Pages** | Deep-dive into individual stocks with technical analysis |
| **Research Q&A** | Ask any market question, get AI answers backed by documents |
| **Live Signals** | System-generated alerts for market events |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Frontend (Next.js 14)                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Landing Page│  │Stock Dashboard│ │ AI Assistant│  │Analytics Page│       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ HTTP/REST
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Backend (FastAPI)                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         REST API Layer                                 │  │
│  │  /api/stocks    /api/signals    /api/research                         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │ RAG Orchestrator│  │   APScheduler   │  │  Rate Limiter   │            │
│  │ (OpenAI + FAISS)│  │ (Background Jobs)│  │    (Redis)      │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        Data Sources                                    │  │
│  │  FCSAPI (Stocks)    NewsAPI (News)    NSE/BSE (Indian Markets)        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Data Storage                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   MongoDB   │  │    Redis    │  │   S3/MinIO  │  │ Vector Store│        │
│  │ (Documents) │  │  (Caching)  │  │  (Archives) │  │   (FAISS)   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
signal_ai/
├── prod/
│   ├── backend/
│   │   └── app/
│   │       ├── main.py              # FastAPI application factory
│   │       ├── api/                 # REST API endpoints
│   │       │   ├── stocks.py        # Stock data endpoints
│   │       │   ├── signals.py       # Market signals endpoints
│   │       │   └── research.py      # RAG Q&A endpoints
│   │       ├── ai/                  # AI/ML components
│   │       │   ├── rag.py           # RAG orchestrator
│   │       │   ├── embeddings.py    # Text embeddings
│   │       │   └── vector_store.py  # FAISS/Pinecone wrapper
│   │       ├── core/                # Core infrastructure
│   │       │   ├── config.py        # Pydantic settings
│   │       │   ├── scheduler.py     # APScheduler jobs
│   │       │   └── rate_limiter.py  # Redis rate limiting
│   │       ├── datasources/         # External data integrations
│   │       │   ├── fcsapi.py        # FCSAPI (stocks, fundamentals)
│   │       │   ├── newsapi.py       # News aggregation
│   │       │   ├── nse.py           # Indian markets
│   │       │   └── storage.py       # S3-compatible storage
│   │       ├── db/                  # Database layer
│   │       │   ├── session.py       # MongoDB/Beanie setup
│   │       │   └── repositories.py  # Data access patterns
│   │       ├── models/              # Pydantic & Beanie models
│   │       │   ├── stock_metadata.py
│   │       │   ├── ohlcv.py
│   │       │   └── market.py
│   │       └── services/            # Business logic
│   │
│   └── frontend/
│       ├── app/                     # Next.js App Router
│       │   ├── page.tsx             # Landing page
│       │   ├── stocks/              # Stock dashboard
│       │   │   └── [ticker]/        # Stock analytics
│       │   ├── assistant/           # AI chat page
│       │   └── research/            # Research library
│       ├── components/
│       │   ├── ui/                  # Shadcn UI components
│       │   ├── signals/             # Signal cards & orbs
│       │   ├── stocks/              # Stock list & chat
│       │   ├── chat/                # ChatWindow
│       │   └── layout/              # Header, Footer
│       └── lib/
│           └── api/                 # API client functions
│
└── project.md                       # This file
```

---

## Technology Stack

### Backend

| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance async Python web framework |
| **MongoDB + Beanie** | Document database with async ODM |
| **Redis** | Rate limiting, caching, session store |
| **APScheduler** | Background job scheduling |
| **OpenAI GPT-4** | LLM for research Q&A |
| **FAISS / Pinecone** | Vector similarity search |
| **Pydantic** | Data validation and settings |
| **Prometheus** | Application metrics |

### Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type-safe JavaScript |
| **Tailwind CSS** | Utility-first styling |
| **Shadcn/ui** | Accessible component library |
| **Framer Motion** | Smooth animations |
| **Lucide Icons** | Modern iconography |

---

## Backend Deep Dive

### Application Entry Point (`main.py`)

The FastAPI application is created using a factory pattern with:

1. **Lifespan Manager**: Initializes MongoDB, Redis rate limiter, and scheduler on startup
2. **CORS Middleware**: Configured via environment variables
3. **Request Logging**: Logs all requests with Prometheus metrics
4. **Global Exception Handler**: Catches unhandled errors gracefully

```python
# Key components initialized at startup
await init_db()  # MongoDB/Beanie connection
app.state.rate_limiter = RateLimiter(...)  # Redis-backed
app.state.scheduler = await start_scheduler()  # APScheduler
```

### Authentication Deep Dive
The system uses a passwordless, OTP-based authentication flow secured by JWTs.

#### 1. Components
- **User**: MongoDB document storing profile and persistence data.
- **OTP**: Temporary 6-digit codes sent via Email (Resend).
- **Session**: Tracks active logins, devices, and refresh tokens.

#### 2. The Login Flow
1. **Check Email**: Frontend checks if the user exists (`/check-email`).
2. **Request OTP**: System generates checks rate limits, and e-mails code (`/request-otp`).
3. **Verify**: User enters code; System validates and issues HTTP-only Cookies (`/verify-otp`).

#### 3. Security
- **HttpOnly Cookies**: Prevents XSS token theft.
- **JWT**: Stateless access tokens (30m) and stateful refresh tokens (7d).
- **Rate Limiting**: Strict limits on OTP generation and verification attempts.

### API Endpoints


#### Stocks API (`/api/stocks`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | List stocks by exchange with pagination |
| `/{ticker}/ohlcv` | GET | Historical OHLCV bars (1m, 5m, 1h, 1d, 1w) |
| `/{ticker}/quote` | GET | Real-time price quote |
| `/exchanges` | GET | List available exchanges with stock counts |
| `/custom/sync-prices` | POST | Batch sync prices from FCSAPI |

#### Signals API (`/api/signals`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | List active signals with filters |
| `/{signal_id}` | GET | Signal details with provenance (sources) |
| `/refresh` | POST | Trigger signal recomputation |
| `/{signal_id}` | DELETE | Deactivate a signal |

#### Research API (`/api/research`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ask` | POST | Ask a question, get AI answer with sources |
| `/ask/stream` | GET | SSE-streamed AI response |
| `/docs` | GET | Search indexed documents |
| `/docs/index` | POST | Add document to vector store |

### Data Sources

#### FCSAPI (`datasources/fcsapi.py`)

Primary source for international stock data:

- **Stock Tickers**: List of stocks per exchange
- **Latest Prices**: Real-time (delayed) quotes in batches
- **Historical OHLCV**: Intraday and daily candlestick data
- **Company Profiles**: Sector, industry, description
- **Financials**: Earnings, dividends, statistics

```python
# Example: Fetch latest prices
ds = FCSAPIDataSource()
result = await ds.get_latest_prices(["AAPL", "MSFT", "GOOGL"])
# Returns: List[StockLatestPrice]
```

#### Scheduler Jobs (`core/scheduler.py`)

Automated data ingestion runs on a schedule:

| Job | Schedule | Description |
|-----|----------|-------------|
| NSE Bhavcopy | Daily 6:00 PM IST | Indian market EOD data |
| AMFI NAV | Daily 11:00 PM IST | Mutual fund NAVs |
| News Fetch | Every 60 minutes | Market news aggregation |
| Intraday OHLCV | Every 5 minutes | Live price data |
| Daily OHLCV | EOD | End-of-day candles |
| Fundamentals Sync | Weekly | Company profiles |
| Data Archival | Weekly | S3 cold storage |

### RAG System (`ai/rag.py`)

The RAG (Retrieval-Augmented Generation) pipeline:

```
User Question → Embed Query → Vector Search → Build Context → LLM Generate → Content Filter → Response + Disclaimer
```

**Content Filtering**: All outputs are filtered against forbidden keywords (buy, sell, recommend) to ensure regulatory compliance. A disclaimer is always appended.

### Database Models

#### StockMetadataDB

```python
class StockMetadataDB(Document):
    ticker: str
    exchange: str
    name: str
    sector: Optional[str]
    industry: Optional[str]
    country: str = "US"
    currency: str = "USD"
    status: str = "active"
    last_price: Optional[float]
    change: Optional[float]
    change_percent: Optional[float]
    price_updated_at: Optional[datetime]
```

#### OHLCVDB

```python
class OHLCVDB(Document):
    ticker: str
    exchange: str
    period: str  # "1d", "1h", "5m"
    timestamp: datetime
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: int
    vwap: Optional[Decimal]
```

---

## Frontend Deep Dive

### Pages

#### Landing Page (`/`)

Marketing page with:
- Hero section with gradient CTAs
- Stats (latency, sources, accuracy)
- Feature highlights (Signals, Research, Compliance)
- Final CTA

#### Stock Dashboard (`/stocks`)

Main application dashboard:
- **Exchange Tabs**: NASDAQ, NYSE, NSE, BSE, LSE
- **List/Grid Toggle**: Switch between views
- **Search**: Filter by ticker or company name
- **Stock List Items**: 
  - Color-coded signal bar (Green/White/Red)
  - Real-time price with change indicators
  - Analytics button (links to `/stocks/[ticker]`)
  - Click to open AI Chat sheet

#### Stock Analytics (`/stocks/[ticker]`)

Detailed stock page:
- Back navigation
- Technical analysis chart (placeholder)
- Signal strength indicator
- Key levels (support/resistance)

#### AI Assistant (`/assistant`)

Full-page chat interface for general market research.

### Key Components

#### StockListItem

Displays a single stock row with:
- **SignalOrb**: Visual buy/hold/sell indicator
- **Confidence Bar**: Animated progress bar in Green/White/Red
- **Price Data**: Last price, change, change percent
- **Analytics Button**: Navigate to stock detail page

#### StockChatSheet

Floating side panel for contextual AI chat:
- Non-blocking (transparent overlay)
- Stock-specific context pre-loaded
- Uses `ChatWindow` component
- Glassmorphism styling

#### ChatWindow

Reusable chat interface:
- Message history
- Typing indicator
- Markdown rendering
- Accepts `initialContext` and `initialMessage` props

### Styling System

**Zen-Inspired Dark Theme**:

```css
:root {
  --brand-slate: #0F1117;
  --brand-blue: #3B82F6;
  --brand-emerald: #10B981;
  --brand-violet: #8B5CF6;
}

.glass-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
}
```

---

## Data Flow

### Stock Price Update Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Scheduler   │────▶│   FCSAPI     │────▶│   MongoDB    │
│  (Cron Job)  │     │  (External)  │     │  (Storage)   │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │◀────│   FastAPI    │◀────│   MongoDB    │
│   (React)    │     │   (REST)     │     │   (Query)    │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Research Q&A Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    User      │────▶│   FastAPI    │────▶│     RAG      │
│  (Question)  │     │   (/ask)     │     │ Orchestrator │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                     ┌───────────────────────────┼───────────────────────────┐
                     ▼                           ▼                           ▼
              ┌──────────────┐           ┌──────────────┐           ┌──────────────┐
              │ Vector Store │           │   OpenAI     │           │   Content    │
              │   (FAISS)    │           │   GPT-4      │           │   Filter     │
              └──────────────┘           └──────────────┘           └──────────────┘
                     │                           │                           │
                     └───────────────────────────┼───────────────────────────┘
                                                 ▼
                                          ┌──────────────┐
                                          │   Response   │
                                          │ + Disclaimer │
                                          └──────────────┘
```

---

## API Reference

### Authentication

#### Auth API (`/api/auth`)

| Endpoint | Method | Description | Payload Example |
|---|---|---|---|
| `/check-email` | POST | Check if user is registered | `{ "email": "user@example.com" }` |
| `/request-otp` | POST | Request login code via email | `{ "email": "...", "first_name": "..." }` |
| `/verify-otp` | POST | Exchange code for cookies | `{ "email": "...", "otp_code": "123456" }` |
| `/profile` | GET | Get current logged-in user | *None (Cookie)* |
| `/logout` | POST | Clear session | *None (Cookie)* |

> **Note**: For general API endpoints (`/stocks`, etc.), the browser automatically handles authentication via the `access_token` cookie set by the login flow.
> Legacy/Dev access is still supported via `X-API-Key` header.

### Rate Limiting

Default: 100 requests per 60 seconds per API key.

### Response Format

All successful responses follow this structure:

```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "page_size": 50
}
```

Errors return:

```json
{
  "detail": "Error message here"
}
```

---

## Configuration & Environment

### Required Environment Variables

```bash
# Environment
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO
TIMEZONE=Asia/Kolkata

# Database
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=signal_ai

# Redis
REDIS_URL=redis://localhost:6379

# External APIs
FCSAPI_ACCESS_KEY=your_fcsapi_key
NEWS_API_KEY=your_newsapi_key
OPENAI_API_KEY=your_openai_key

# Storage (S3-compatible)
S3_BUCKET=signal-ai-data
S3_ENDPOINT_URL=http://localhost:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin

# Security
API_KEYS=["dev-key-123"]
CORS_ORIGINS=["http://localhost:3000"]

# Scheduler
SCHEDULER_ENABLED=true
```

### Frontend Environment

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_KEY=dev-key-123
```

---

## Running the Project

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB 6+
- Redis 7+

### Backend

```bash
cd signal_ai/prod/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd signal_ai/prod/frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Health Check | http://localhost:8000/health |
| Metrics | http://localhost:8000/metrics |

---

## Summary

MarketSignal AI is a production-ready investment research platform that demonstrates:

1. **Modern Python Backend**: FastAPI, async MongoDB, scheduled jobs, RAG pipelines
2. **Rich React Frontend**: Next.js 14, Shadcn UI, Framer Motion animations
3. **Real Data Integration**: FCSAPI for global stock data, NewsAPI for market news
4. **AI-Powered Research**: OpenAI GPT-4 with vector search and content filtering
5. **Professional UX**: Zen-inspired dark theme, glassmorphism, color-coded signals

The codebase follows SOLID principles, uses TypeScript/Pydantic for type safety, and implements proper separation of concerns across API, service, and repository layers.

---

*Last Updated: February 2026*
