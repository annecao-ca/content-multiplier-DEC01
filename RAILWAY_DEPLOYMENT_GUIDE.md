# Railway Deployment Guide - Full Stack Setup

## What We Changed

We've configured your application to run as a **single unified service** on Railway, where the Fastify backend acts as a reverse proxy to the Next.js server.

### Files Modified

1. **`apps/api/package.json`** - Added `@fastify/http-proxy` for proxying requests
2. **`apps/api/src/index.ts`** - Modified to start Next.js server and proxy frontend requests
3. **`apps/web/next.config.js`** - Configured for standalone server mode
4. **`apps/web/package.json`** - Updated start script to use port 3000
5. **`package.json`** - Updated build scripts to build both frontend and backend

## How It Works

```
User visits URL
    ↓
Railway Server (Port 3001) - Fastify API
    ↓
    ├─→ /api/* requests → Fastify API handlers (health, briefs, packs, etc.)
    └─→ All other requests → Proxied to Next.js Server (Port 3000 internally)
                              ↓
                         Next.js handles routing and rendering
```

## Deployment Steps

### 1. Commit and Push Changes

```bash
git add .
git commit -m "Configure unified frontend-backend deployment for Railway"
git push origin main
```

### 2. Railway Will Automatically

1. Run `npm install` (installs dependencies for both frontend and backend)
2. Run `npm run build` which:
   - Builds Next.js frontend to `apps/web/out/`
   - Installs API dependencies
3. Run `npm start` which starts the Fastify server
4. The Fastify server serves both API and frontend

### 3. Verify Deployment

Once deployed, visit: `https://content-multiplier-production.up.railway.app`

You should see:
- ✅ Your full Next.js application interface
- ✅ Navigation, forms, and UI components working
- ✅ API available at `/api/health`, `/api/briefs`, etc.

## Local Testing

To test this setup locally before deploying:

```bash
# 1. Build the frontend
cd apps/web
npm install
npm run build

# 2. Start the unified server (which runs both Next.js and API)
cd ../api
npm install
npm start

# 3. Visit http://localhost:3001
```

The API server will:
- Start Next.js on port 3000 internally
- Listen on port 3001 for all requests  
- Proxy frontend requests to Next.js
- Handle API requests directly

You should see your full application running on port 3001!

## How This Differs From Before

### Before
- Backend ran on port 3001 (only API endpoints)
- Frontend would need to run separately on port 3000
- Railway could only expose one port → frontend wasn't accessible

### After
- API server runs on port 3001 (the exposed port)
- Next.js server runs internally on port 3000
- API proxies all non-API requests to Next.js
- Everything accessible through one port → perfect for Railway!

## Architecture Benefits

1. **Full Next.js Features** - Dynamic routing, server components, API routes all work
2. **Easy Development** - Same setup works locally and in production
3. **Single Deployment** - One Railway service handles everything
4. **Clean Separation** - API and frontend remain independent but integrated

## Troubleshooting

### Frontend not showing after deployment

Check Railway logs for:
```
🌐 Starting Next.js server on port 3000
✅ Next.js server should be running
```

If you see errors about Next.js not starting, check that:
- The web app dependencies were installed
- The build completed successfully
- Port 3000 is available internally

### API routes not working

Make sure your frontend code uses relative URLs like `/api/health` instead of absolute URLs like `http://localhost:3001/api/health`.

### 404 errors on page refresh

The `setNotFoundHandler` in index.ts handles this - it serves `index.html` for non-API routes, allowing client-side routing to work.

## Environment Variables

Make sure these are set in Railway:
- `NODE_ENV=production`
- Any other environment variables your app needs (database URLs, API keys, etc.)

## Next Steps

After deployment:
1. Visit your Railway URL
2. Test the main features (dashboard, creating briefs, etc.)
3. Check the browser console for any errors
4. Verify API calls are working by checking Network tab in DevTools

## Architecture Diagram

```
┌───────────────────────────────────────────────────┐
│           Railway Deployment (Port 3001)          │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │       Fastify API Server (Main Process)     │ │
│  │                                             │ │
│  │  ┌───────────────────────────────────────┐ │ │
│  │  │  API Routes (/api/*)                  │ │ │
│  │  │  • Health checks                      │ │ │
│  │  │  • Business logic                     │ │ │
│  │  │  • Database operations                │ │ │
│  │  └───────────────────────────────────────┘ │ │
│  │                                             │ │
│  │  ┌───────────────────────────────────────┐ │ │
│  │  │  HTTP Proxy (/* except /api)          │ │ │
│  │  │  Forwards to ↓                        │ │ │
│  │  └───────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────┘ │
│                       ↓                           │
│  ┌─────────────────────────────────────────────┐ │
│  │     Next.js Server (Internal Port 3000)     │ │
│  │  • Frontend pages and routing               │ │
│  │  • Server-side rendering                    │ │
│  │  • Static assets                            │ │
│  └─────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

---

**Ready to deploy?** Just push your changes to GitHub and Railway will handle the rest!

