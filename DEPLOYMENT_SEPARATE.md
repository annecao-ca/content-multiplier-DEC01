# Separate Deployment Guide

This application uses a **separated deployment architecture**:
- **Backend API**: Deployed on Railway
- **Frontend**: Deploy separately on Cloudflare Pages (or Vercel/Netlify)

## Backend Deployment (Railway)

### What's Deployed
- Only the Fastify API server (`apps/api`)
- No frontend - just pure API endpoints

### Configuration

**railway.json:**
- Build: `cd apps/api && npm install`
- Start: `cd apps/api && npm start`
- Health Check: `/healthz`

**API Endpoints:**
- `/healthz` - Health check for Railway
- `/api/health` - API health status
- `/api/*` - Your business logic endpoints
- `/` - API info page

**Port:**
- Listens on `$PORT` (Railway provides this automatically, usually 8080)

### CORS Configuration
The API is configured to accept requests from:
- `http://localhost:3000` (local development)
- `https://*.pages.dev` (Cloudflare Pages)
- Your custom Cloudflare domain

To add your custom domain, update `apps/api/src/index.ts`:

```typescript
await app.register(cors, {
    origin: [
        'http://localhost:3000',
        'https://*.pages.dev',
        'https://your-custom-domain.com', // Add your domain here
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
})
```

## Frontend Deployment (Cloudflare Pages)

### Prerequisites
1. Your Railway API URL (e.g., `https://content-multiplier-production.up.railway.app`)
2. A Cloudflare account

### Configuration

**Next.js Build Settings:**
- Build Command: `npm run build`
- Build Output Directory: `.next`
- Root Directory: `apps/web`

**Environment Variables:**
Add this to your Cloudflare Pages settings:
```
NEXT_PUBLIC_API_URL=https://your-railway-api-url.railway.app
```

### Deploy to Cloudflare Pages

#### Option 1: Using Wrangler CLI

```bash
cd apps/web

# Install Cloudflare CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build the app
npm run build

# Deploy (first time)
npm run deploy

# Or for subsequent deploys
npm run upload
```

#### Option 2: Using Cloudflare Dashboard

1. Go to Cloudflare Dashboard → Pages
2. Connect your GitHub repository
3. Configure build settings:
   - Framework preset: Next.js
   - Build command: `cd apps/web && npm install && npm run build`
   - Build output directory: `apps/web/.next`
   - Root directory: `/`
4. Add environment variable: `NEXT_PUBLIC_API_URL`
5. Deploy!

## Local Development

### Run Both Servers Locally

```bash
# Terminal 1: Start the API
cd apps/api
npm install
npm run dev

# Terminal 2: Start the frontend
cd apps/web
npm install
npm run dev
```

Or use the convenience script:

```bash
npm run dev
```

This will start:
- API on http://localhost:3001
- Frontend on http://localhost:3000

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         Railway (Backend)               │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Fastify API Server              │ │
│  │   Port: $PORT (8080)              │ │
│  │                                   │ │
│  │   Endpoints:                      │ │
│  │   • /healthz                      │ │
│  │   • /api/health                   │ │
│  │   • /api/briefs                   │ │
│  │   • /api/packs                    │ │
│  │   • /api/*                        │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    ↑
                    │ API Calls
                    │
┌─────────────────────────────────────────┐
│    Cloudflare Pages (Frontend)          │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Next.js Application             │ │
│  │                                   │ │
│  │   • Static pages                  │ │
│  │   • Client-side routing           │ │
│  │   • SSR/SSG                       │ │
│  │   • Calls Railway API             │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    ↓
                 Users
```

## Benefits of This Architecture

1. **Separation of Concerns**: Frontend and backend are independently deployed
2. **Scalability**: Scale API and frontend separately
3. **Performance**: Cloudflare's CDN serves frontend globally
4. **Reliability**: If one service is down, the other can still operate
5. **Cost Effective**: Use best platform for each service

## Troubleshooting

### CORS Errors
If you get CORS errors, make sure:
1. Your frontend domain is added to the CORS configuration in `apps/api/src/index.ts`
2. You're using `credentials: true` in your API calls if needed

### API Not Responding
Check Railway logs:
```bash
railway logs
```

Look for:
- ✅ `Server successfully listening at...`
- ✅ `Healthz check requested`

### Frontend Can't Connect to API
1. Check that `NEXT_PUBLIC_API_URL` is set correctly
2. Verify the Railway API URL is accessible
3. Check browser console for errors

---

**Need help?** Check the logs in Railway and Cloudflare Pages dashboards.

