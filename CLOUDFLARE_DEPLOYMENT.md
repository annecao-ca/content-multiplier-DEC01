# Cloudflare Pages Deployment Guide

Complete guide to deploy your Next.js frontend to Cloudflare Pages.

## Prerequisites

- A Cloudflare account (free tier works!)
- Your Railway API URL: `https://content-multiplier-production.up.railway.app`
- Node.js installed locally

## Method 1: Deploy via Cloudflare Dashboard (Recommended for First Time)

### Step 1: Push to GitHub
Your code is already on GitHub ✅

### Step 2: Connect to Cloudflare Pages

1. Go to https://dash.cloudflare.com
2. Select **Pages** from the left sidebar
3. Click **Create a project**
4. Click **Connect to Git**
5. Authorize Cloudflare to access your GitHub
6. Select your repository: `content-multiplier`

### Step 3: Configure Build Settings

**Framework preset:** `Next.js (Static HTML Export)`

**Build settings:**
- **Build command:** `cd apps/web && npm install && npm run deploy`
- **Build output directory:** `apps/web/.worker-next`
- **Root directory:** `/` (leave as root)

**Environment variables:** Click **Add variable**
- **Variable name:** `NEXT_PUBLIC_API_URL`
- **Value:** `https://content-multiplier-production.up.railway.app`

### Step 4: Deploy!

Click **Save and Deploy**

Cloudflare will:
1. Clone your repo
2. Install dependencies
3. Build the Next.js app
4. Deploy to their global CDN

This takes about 2-5 minutes.

### Step 5: Get Your URL

Once deployed, you'll get a URL like:
- **Production:** `https://content-multiplier.pages.dev`
- **Preview:** `https://[branch-name].content-multiplier.pages.dev`

## Method 2: Deploy via CLI (For Quick Updates)

### Step 1: Install Wrangler

```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open your browser to authenticate.

### Step 3: Build and Deploy

```bash
cd apps/web

# Install dependencies
npm install

# Deploy to Cloudflare Pages
npm run deploy
```

### For Subsequent Deploys

```bash
cd apps/web
npm run deploy
```

Or just use the upload command:

```bash
cd apps/web
npm run upload
```

## Local Testing

Test the production build locally before deploying:

```bash
cd apps/web

# Build for Cloudflare
npm run preview

# This will start a local Cloudflare Workers environment
```

## Environment Variables

### Production
Already configured in `wrangler.toml`:
```toml
NEXT_PUBLIC_API_URL = "https://content-multiplier-production.up.railway.app"
```

### Local Development
Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Updating the Deployment

### Automatic (via GitHub)
If you used Method 1 (Dashboard):
- Push to `main` branch → Auto-deploy to production
- Push to other branches → Auto-deploy to preview URLs

### Manual (via CLI)
If you used Method 2 (CLI):
```bash
cd apps/web
npm run deploy
```

## Custom Domain

### Add Your Own Domain

1. Go to Cloudflare Dashboard → Pages → Your Project
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain (e.g., `app.yourdomain.com`)
5. Follow the DNS instructions

Cloudflare automatically provisions SSL certificates!

## Troubleshooting

### Build Fails

**Error:** `Module not found`
- Make sure all dependencies are in `package.json`
- Run `cd apps/web && npm install` locally first

**Error:** `Build exceeded time limit`
- Cloudflare free tier has a 20-minute build limit
- This shouldn't be an issue for this project

### API Calls Not Working

**Check CORS:**
Make sure your Railway API has the Cloudflare domain in CORS:
```typescript
// In apps/api/src/index.ts
origin: [
    'https://content-multiplier.pages.dev',
    'https://*.pages.dev',
]
```

**Check Environment Variable:**
```bash
# View build logs in Cloudflare Dashboard
# Look for: NEXT_PUBLIC_API_URL is set correctly
```

### Preview Deployments Not Working

Preview deployments get their own URLs:
- Format: `https://[commit-hash].content-multiplier.pages.dev`
- They use the same environment variables as production

## Performance Optimization

Cloudflare Pages includes:
- ✅ Global CDN (300+ locations)
- ✅ Automatic SSL/TLS
- ✅ HTTP/3 support
- ✅ DDoS protection
- ✅ Unlimited bandwidth (free tier)
- ✅ Unlimited requests (free tier)

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Cloudflare Global CDN           │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   content-multiplier.pages.dev    │ │
│  │                                   │ │
│  │   Next.js Static/SSR Frontend     │ │
│  │   • Cached at edge locations      │ │
│  │   • Fast global delivery          │ │
│  │   • Automatic scaling             │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    ↓
            API Calls via fetch()
                    ↓
┌─────────────────────────────────────────┐
│           Railway Backend               │
│                                         │
│  content-multiplier-production          │
│  .up.railway.app                        │
│                                         │
│  Fastify API Server                     │
│  • Handles business logic               │
│  • Database operations                  │
│  • Authentication                       │
└─────────────────────────────────────────┘
```

## Cost

### Cloudflare Pages (Free Tier)
- ✅ Unlimited sites
- ✅ Unlimited requests
- ✅ Unlimited bandwidth
- ✅ 500 builds per month
- ✅ 1 build at a time

**Perfect for this project!**

## Quick Commands Reference

```bash
# Login to Cloudflare
wrangler login

# Deploy to production
cd apps/web && npm run deploy

# Preview locally
cd apps/web && npm run preview

# View deployment status
wrangler pages deployment list

# View logs
wrangler pages deployment tail
```

## Next Steps After Deployment

1. ✅ Visit your Cloudflare Pages URL
2. ✅ Test the application
3. ✅ Set up a custom domain (optional)
4. ✅ Configure preview deployments for testing
5. ✅ Update Railway CORS if needed

---

**Need help?** Check the Cloudflare Pages docs: https://developers.cloudflare.com/pages/

