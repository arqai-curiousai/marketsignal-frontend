# MarketSignal AI — Frontend Documentation

> **AI-Powered Investment Research Platform**
> Next.js 14 frontend with real-time market data, AI signal visualization, algo playground dashboard, and research Q&A.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Pages & Routing](#pages--routing)
5. [Components](#components)
6. [API Layer](#api-layer)
7. [Authentication & Security](#authentication--security)
8. [Type System](#type-system)
9. [Styling](#styling)
10. [Configuration & Environment](#configuration--environment)
11. [Running the Project](#running-the-project)

---

## Project Overview

The MarketSignal frontend is an **India-first** investment research interface featuring:

- **Markets Page**: 4-tab layout (My Portfolio, NSE, Currency, Commodity) with per-instrument signal toggles
- **AI Signal Cards**: Display BUY/SELL/HOLD from the dual AI agent pipeline with conflict type (divergence/alignment) and confidence
- **Algo Playground Dashboard**: Visualize MACD/RSI/SMA strategy signals, outcomes, and performance metrics
- **Research Q&A**: RAG-powered chat with SSE streaming and sourced citations
- **Stock Analytics**: OHLCV candlestick charts, fundamentals, and per-stock AI chat

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Next.js 14 (App Router)                            │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Pages (App Router)                                                   │  │
│  │ /          /login     /signals    /signals/[id]   /stocks            │  │
│  │ /stocks/[ticker]      /research   /assistant      /playground        │  │
│  │ /settings  /legal                                                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐    │
│  │ Components       │  │ API Client       │  │ Auth Context         │    │
│  │ signals/ stocks/ │  │ (CSRF, Retry,    │  │ (JWT cookies,        │    │
│  │ playground/      │  │  Token Refresh)  │  │  Session mgmt)       │    │
│  │ chat/ layout/    │  │                  │  │                      │    │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘    │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Security Layer                                                       │  │
│  │ Middleware (route protection)  │  CSRF (double-submit)              │  │
│  │ Security Headers (CSP, DENY, nosniff, referrer-policy)              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ API Proxy (next.config.js rewrites)                                  │  │
│  │ /api/:path* → ${NEXT_PUBLIC_API_URL}/:path*                         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                     FastAPI Backend (port 8000)
```

### Directory Structure

```
marketsignal-frontend/
├── app/                           # Next.js App Router pages
│   ├── page.tsx                   # Landing page
│   ├── layout.tsx                 # Root layout
│   ├── error.tsx                  # Error boundary (per-segment)
│   ├── global-error.tsx           # Root error boundary
│   ├── login/page.tsx             # OTP login
│   ├── signals/                   # Markets page
│   │   ├── page.tsx               # 4 tabs: Portfolio, NSE, Currency, Commodity
│   │   └── [id]/page.tsx          # Signal detail
│   ├── stocks/
│   │   ├── page.tsx               # Stock list
│   │   └── [ticker]/page.tsx      # Stock detail + analytics
│   ├── research/page.tsx          # RAG Q&A
│   ├── assistant/page.tsx         # Chat assistant
│   ├── playground/page.tsx        # Algo trading dashboard
│   ├── settings/page.tsx          # User settings
│   ├── legal/page.tsx             # Legal / compliance
│   └── api/                       # Server-side API proxy routes
│       ├── auth/                  # Auth proxy (5 routes)
│       │   ├── check-email/route.ts
│       │   ├── request-otp/route.ts
│       │   ├── verify-otp/route.ts
│       │   ├── logout/route.ts
│       │   └── profile/route.ts
│       ├── stocks/                # Stock proxy routes
│       └── watchlist/             # Watchlist proxy routes
├── components/
│   ├── signals/                   # Signal components
│   │   ├── SignalToggle.tsx        # Toggle AI signal ON/OFF per instrument
│   │   ├── MarketStatusBadge.tsx   # Market open/closed indicator
│   │   ├── InstrumentList.tsx      # List of NSE/Currency/Commodity instruments
│   │   ├── MyPicksList.tsx         # User's watchlist with signal data
│   │   ├── SignalCard.tsx          # Signal result card (BUY/SELL/HOLD)
│   │   ├── SignalOrb.tsx           # Visual signal strength indicator
│   │   ├── StockListItem.tsx       # Stock row in instrument list
│   │   ├── AddToPicksButton.tsx    # Add instrument to portfolio
│   │   ├── StockSignalCard.tsx     # Combined stock + signal card
│   │   └── SignalTimeline.tsx      # Timeline view
│   ├── stocks/                    # Stock components
│   │   ├── StockCard.tsx           # Stock info card
│   │   ├── StockList.tsx           # Filterable stock list
│   │   ├── OHLCVChart.tsx          # Candlestick chart (Recharts)
│   │   ├── StockChatSheet.tsx      # Side sheet for per-stock AI chat
│   │   └── index.ts
│   ├── playground/                # Algo dashboard components
│   │   ├── SignalGrid.tsx          # Grid of algo signals
│   │   ├── SignalDot.tsx           # Individual signal visualization
│   │   ├── AlgoPerformanceCard.tsx # Algo performance metrics card
│   │   ├── OutcomeCard.tsx         # Signal outcome + P&L card
│   │   └── DashboardStats.tsx      # Dashboard summary statistics
│   ├── chat/                      # Chat components
│   │   ├── ChatWindow.tsx          # Main chat UI
│   │   ├── Message.tsx             # Chat message bubble
│   │   └── SourcePanel.tsx         # Source citations panel
│   ├── layout/                    # Layout components
│   │   ├── Header.tsx              # Navigation header ("Markets" link)
│   │   ├── Footer.tsx              # Footer
│   │   └── Shell.tsx               # Main layout wrapper
│   ├── auth/
│   │   └── LoginForm.tsx           # OTP login form
│   └── ui/                        # Shadcn/Radix library (70+ components)
├── src/
│   ├── lib/
│   │   ├── api/                   # API client layer
│   │   │   ├── apiClient.ts        # Core client (CSRF, retry, 401 refresh)
│   │   │   ├── signalApi.ts        # Signal & market status API
│   │   │   ├── stockApi.ts         # Stock data API
│   │   │   ├── watchlistApi.ts     # Watchlist CRUD API
│   │   │   ├── playgroundApi.ts    # Algo playground API
│   │   │   ├── backendUrl.ts       # Server-side backend URL resolver
│   │   │   ├── client.ts           # Re-export of apiClient
│   │   │   └── config.ts           # API config (timeouts, retries)
│   │   ├── security/
│   │   │   ├── csrf.ts             # CSRF double-submit cookie
│   │   │   └── xss.ts              # XSS sanitization
│   │   ├── ai/                    # Frontend AI client
│   │   ├── datasources/           # Data source adapters
│   │   ├── services/              # Signal service, source registry
│   │   ├── config/                # App configuration
│   │   └── utils/                 # cn(), countryFlags, user helpers
│   ├── types/
│   │   ├── stock.ts               # IStock, IAISignal, IMarketStatus, IInstrument
│   │   ├── playground.ts          # IAlgoSignal, IAlgoPerformance, IPlaygroundDashboard
│   │   └── index.ts               # User, AuthTokens, Message, ChatSession
│   ├── hooks/
│   │   ├── useWatchlist.ts        # Watchlist state management
│   │   ├── use-mobile.ts         # Mobile viewport detection
│   │   └── use-toast.ts          # Toast notifications
│   ├── context/
│   │   └── AuthContext.tsx        # Auth provider (login, logout, checkAuth)
│   └── middleware.ts              # Route protection middleware
├── next.config.js                 # Rewrites, security headers, standalone output
├── tailwind.config.ts             # Tailwind CSS configuration
├── package.json                   # Dependencies (Next.js 14, React 18)
├── tsconfig.json
├── ENV_SETUP.md                   # Environment variable guide
└── .env.local                     # Local environment (gitignored)
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14.2 (App Router) |
| **Language** | TypeScript 5.9 |
| **Styling** | Tailwind CSS 3.4 + tailwindcss-animate |
| **UI Library** | Shadcn/ui (Radix UI primitives) |
| **Charts** | Recharts 2.15 |
| **Animation** | Framer Motion 12 |
| **Forms** | React Hook Form + Zod validation |
| **State** | React Context (AuthContext) |
| **HTTP** | Native Fetch API (no axios) |
| **Icons** | Lucide React |
| **Notifications** | Sonner (toast) |
| **Testing** | Jest + React Testing Library |
| **Linting** | ESLint (strict TS rules) + Prettier |
| **Package Manager** | Yarn 1.22 |

---

## Pages & Routing

| Route | Page | Auth Required | Description |
|-------|------|---------------|-------------|
| `/` | Landing | No | Marketing landing page |
| `/login` | Login | No | OTP-based email authentication |
| `/signals` | Markets | Yes | 4-tab layout: My Portfolio, NSE, Currency, Commodity |
| `/signals/[id]` | Signal Detail | Yes | Individual AI signal details |
| `/stocks` | Stocks | Yes | Stock list with exchange filtering |
| `/stocks/[ticker]` | Stock Detail | Yes | OHLCV chart, fundamentals, AI chat sheet |
| `/research` | Research | Yes | RAG Q&A with SSE streaming |
| `/assistant` | Assistant | Yes | General AI chat assistant |
| `/playground` | Playground | Yes | Algo trading dashboard |
| `/settings` | Settings | Yes | User preferences |
| `/legal` | Legal | No | Terms, privacy, disclaimers |

### Navigation

- **Header**: "Markets" links to `/signals` (primary navigation)
- **Protected routes**: Middleware redirects unauthenticated users to `/login?from=<path>`

---

## Components

### Signal Components (`components/signals/`)

| Component | Purpose |
|-----------|---------|
| `SignalToggle` | Toggle button to activate/deactivate AI signal for a portfolio item |
| `MarketStatusBadge` | Shows "Open" / "Closed" with color coding for each market |
| `InstrumentList` | Renders list of NSE stocks, currency pairs, or commodities |
| `MyPicksList` | User's watchlist items with enriched signal data |
| `SignalCard` | Displays BUY/SELL/HOLD with confidence, conflict type, reasoning |
| `StockListItem` | Single stock row with price, change %, and signal indicator |
| `AddToPicksButton` | Button to add/remove instrument from user's portfolio |

### Playground Components (`components/playground/`)

| Component | Purpose |
|-----------|---------|
| `SignalGrid` | Grid of algo signals with visual indicators |
| `SignalDot` | Color-coded dot: green (BUY), red (SELL), gray (HOLD) |
| `AlgoPerformanceCard` | Win rate, accuracy, total signals, P&L summary |
| `OutcomeCard` | Individual signal outcome with price comparison |
| `DashboardStats` | Aggregate statistics for the dashboard header |

---

## API Layer

### Core Client (`src/lib/api/apiClient.ts`)

The API client provides a type-safe wrapper around `fetch`:

```typescript
interface ApiResult<T> {
  success: true; data: T;
} | {
  success: false; error: IApiError;
}
```

**Features:**
- **CSRF protection**: Double-submit cookie pattern via `addCSRFHeader()`
- **Retry logic**: Max 2 retries for 5xx errors with 500ms exponential backoff
- **401 token refresh**: Automatically calls `/api/auth/refresh` on 401, retries original request once
- **Credential forwarding**: `credentials: 'include'` for cookie-based auth
- **Relative URLs only**: All requests go through Next.js proxy (no API keys in browser)

### API Modules

| Module | Key Functions |
|--------|--------------|
| `signalApi.ts` | `getMarketStatus()`, `activateSignal()`, `deactivateSignal()`, `getActiveSignals()`, `getInstruments()` |
| `stockApi.ts` | `getStocks()`, `getOHLCV()`, `getQuote()`, `getExchanges()`, `getStockSignal()` |
| `watchlistApi.ts` | `getWatchlist()`, `addToWatchlist()`, `removeFromWatchlist()`, `checkWatchlist()` |
| `playgroundApi.ts` | `getDashboard()`, `getAlgos()`, `getSignals()`, `getPerformance()`, `triggerRun()` |

### Server-Side Routes (`app/api/auth/`)

All auth proxy routes import `BACKEND_URL` from `src/lib/api/backendUrl.ts` and forward requests to the FastAPI backend. Cookie forwarding in `verify-otp` uses `response.headers.getSetCookie()` to handle multiple Set-Cookie headers (access + refresh tokens).

---

## Authentication & Security

### Auth Flow

```
1. User enters email → POST /api/auth/check-email
2. User submits name (if new) → POST /api/auth/request-otp
3. User enters OTP code → POST /api/auth/verify-otp
4. Backend returns JWT cookies (httpOnly, sameSite=lax)
5. All subsequent requests include cookies automatically
```

### Route Protection

**Middleware** (`src/middleware.ts`) intercepts requests to protected routes:
- Checks for `access_token` cookie
- Redirects to `/login?from=<original_path>` if missing
- Excludes: API routes, `_next/`, static files, favicon

### Security Headers

`next.config.js` applies to all routes:

| Header | Value |
|--------|-------|
| `X-Frame-Options` | `DENY` |
| `Content-Security-Policy` | `frame-ancestors 'none'` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

### Client-Side Security

- **CSRF**: Double-submit cookie pattern (cookie + header must match)
- **401 Handling**: Automatic token refresh before redirecting to login
- **XSS**: Sanitization utilities in `src/lib/security/xss.ts`
- **No API keys in browser**: All API calls routed through Next.js proxy

---

## Type System

### Core Types (`src/types/stock.ts`)

```typescript
interface IAISignal {
  action: 'buy' | 'hold' | 'sell';
  confidence: number;            // 0.0 - 1.0
  conflict_type: 'divergence' | 'alignment' | 'uncertain';
  market_maker_bias: string;
  retail_bias: string;
  reasoning: string;
  price_at_signal: number;
  generated_at: string;
  is_eod: boolean;
}

interface IMarketStatus {
  nse: { is_open: boolean; next_open: string; next_close: string };
  forex: { is_open: boolean; next_open: string; next_close: string };
  commodity: { is_open: boolean; next_open: string; next_close: string };
}

interface IInstrument {
  ticker: string;
  name: string;
  exchange: string;
  instrument_type: 'nse' | 'currency' | 'commodity';
}
```

### Playground Types (`src/types/playground.ts`)

```typescript
interface IAlgoSignal {
  ticker: string;
  signal: 'buy' | 'hold' | 'sell';
  confidence: number;
  algo_name: string;
  indicators: Record<string, number>;
  reason: string;
  outcome_correct?: boolean;
  pnl_percent?: number;
}

interface IAlgoPerformance {
  algo_name: string;
  total_signals: number;
  accuracy: number;
  win_rate: number;
  avg_pnl: number;
}
```

---

## Styling

- **Theme**: Zen-inspired dark theme with glassmorphism effects
- **Design System**: Shadcn/ui components (consistent Radix primitives)
- **Color Coding**: Green (#22c55e) = BUY, Red (#ef4444) = SELL, Gray (#6b7280) = HOLD
- **Responsive**: Mobile-first with `use-mobile.ts` hook for viewport detection
- **Fonts**: Geist (loaded via `next/font`)
- **Animations**: Framer Motion for page transitions and component animations

---

## Configuration & Environment

### Required Environment Variables

```env
# Backend API URL (must end with /api, no trailing slash)
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Optional

```env
NEXT_PUBLIC_APP_NAME=MarketSignal AI
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Files

| File | Purpose |
|------|---------|
| `.env.local` | Local dev (gitignored) |
| `.env.production` | Production build |
| `ENV_SETUP.md` | Detailed setup guide |

### API URL Resolution

`backendUrl.ts` strips trailing slashes to prevent double-slash paths:
```typescript
export const BACKEND_URL =
    (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '');
```

---

## Running the Project

### Development

```bash
yarn install
cp ENV_SETUP.md  # Follow setup instructions
yarn dev         # http://localhost:3000
```

### Production Build

```bash
yarn build       # Generates standalone output
yarn start       # Production server
```

### Testing

```bash
yarn test        # Jest + React Testing Library
yarn lint        # ESLint
```

### Docker

The frontend uses `output: 'standalone'` in `next.config.js` for optimized Docker builds.

---

*Last Updated: March 2026*
