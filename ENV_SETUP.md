# Frontend Environment Setup Guide

## Environment Variables

Create a `.env` file in the `marketsignal-frontend/` root directory:

```env
# Backend API base URL (Next.js rewrites proxy to this)
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_API_ORIGIN=http://localhost:8000

# Server-side API key for stock proxy routes (optional)
# API_KEY=your-api-key-here
```

### Variable Reference

| Variable | Required | Scope | Description |
|----------|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Client + Server | Backend API URL with `/api` suffix. Used by `next.config.js` rewrites as fallback. |
| `NEXT_PUBLIC_API_ORIGIN` | Yes | Client + Server | Backend origin without `/api`. Primary rewrite target in `next.config.js`. |
| `API_KEY` | No | Server only | API key sent as `X-API-Key` header to backend stock routes (`app/api/stocks/`). Not exposed to browser. |

### How API Proxying Works

`next.config.js` rewrites `/api/:path*` requests to `NEXT_PUBLIC_API_ORIGIN` (or `NEXT_PUBLIC_API_URL` as fallback). The client uses relative URLs only — no API keys or backend URLs reach the browser.

## Environment File Priority

Next.js loads environment variables in this order (later files override earlier):
1. `.env` (base defaults)
2. `.env.development` or `.env.production` (based on `NODE_ENV`)
3. `.env.local` (local overrides, not tracked by Git)

For local development, `.env` is sufficient. For production, use `.env.production` or platform-level env vars.

## Setup

1. Copy `.env.example` to `.env`
2. Update `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_API_ORIGIN` to point to your backend
3. Run `yarn dev` — verify API calls reach the backend

## Common Issues

- **CORS errors**: Ensure backend `CORS_ORIGINS` includes your frontend URL (e.g., `http://localhost:3000`)
- **API connection failures**: Verify backend is running at the configured URL
- **Env changes not taking effect**: Restart `yarn dev` after modifying `.env` files
- **API URL format**: Must include protocol (`http://` or `https://`), must NOT have trailing slash
