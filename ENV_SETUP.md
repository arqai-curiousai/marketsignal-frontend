# Frontend Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in the frontend root directory with the following configuration:

```env
# ===========================================
# MarketSignal AI Frontend Configuration
# ===========================================

# API Configuration
NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api"

# App Configuration
NEXT_PUBLIC_APP_NAME="MarketSignal AI"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Development Configuration (for local development)
# NEXT_PUBLIC_API_URL="http://localhost:8000/api"
```

## Environment Files

### Production (.env.production)
```env
NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api"
NEXT_PUBLIC_APP_NAME="MarketSignal AI"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### Development (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:8000/api"
NEXT_PUBLIC_APP_NAME="MarketSignal AI"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### Testing (.env.test)
```env
NEXT_PUBLIC_API_URL="http://localhost:8000/api"
NEXT_PUBLIC_APP_NAME="MarketSignal AI Test"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

## Setup Instructions

### Step 1: Choose Your Configuration

**For Local Development:**
- Use `http://localhost:8000/api` if running backend locally
- Use your deployed backend URL if testing against production

**For Production:**
- Use your actual API domain (e.g., `https://api.yourdomain.com/api`)

### Step 2: Create Environment File

1. Copy the appropriate configuration above
2. Create `.env.local` in your frontend root directory
3. Replace `yourdomain.com` with your actual domain

### Step 3: Verify Configuration

Run the development server and check that:
- API calls are going to the correct URL
- CORS is properly configured on the backend
- Authentication flow works correctly

## Important Notes

1. **Next.js Environment Variables:**
   - Variables must start with `NEXT_PUBLIC_` to be accessible in the browser
   - Never put sensitive data in public environment variables
   - Use `.env.local` for local development (not tracked by Git)

2. **CORS Configuration:**
   - Make sure your backend `ALLOWED_ORIGINS` includes your frontend URL
   - For development: `http://localhost:3000`
   - For production: `https://yourdomain.com`

3. **API URL Format:**
   - Must end with `/api` (not `/api/`)
   - Include protocol (`http://` or `https://`)
   - Use HTTPS in production

## Environment File Priority

Next.js loads environment variables in this order:
1. `.env.local` (always loaded, ignored by Git)
2. `.env.production` or `.env.development` (based on NODE_ENV)
3. `.env`

## Common Issues

1. **CORS Errors:**
   - Check backend `ALLOWED_ORIGINS` setting
   - Verify frontend URL matches exactly

2. **API Connection Issues:**
   - Ensure backend is running and accessible
   - Check network connectivity and firewall rules

3. **Environment Variables Not Loading:**
   - Restart development server after changing `.env` files
   - Verify variable names start with `NEXT_PUBLIC_`

## Development vs Production

### Development
- Use `http://localhost:3000` for frontend
- Use `http://localhost:8000/api` for backend API
- CORS allows localhost origins

### Production
- Use your actual domain (e.g., `https://yourdomain.com`)
- Use secure HTTPS endpoints
- Proper SSL certificates configured 