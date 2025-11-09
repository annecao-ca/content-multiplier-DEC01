# Deployment Guide

## Railway Deployment

This app can be deployed to Railway with the following steps:

### Prerequisites

1. Railway account (https://railway.app)
2. GitHub repository with your code
3. Railway CLI (optional): `npm i -g @railway/cli`

### API Deployment

1. **Connect Repository**:
   - Go to Railway dashboard
   - Click "New Project"
   - Connect your GitHub repository
   - Railway will automatically detect the build configuration

2. **Set Environment Variables**:
   In Railway dashboard → Project → Variables, add:
   ```
   PORT=3001
   NODE_ENV=production
   DATABASE_URL=postgresql://postgres:password@railway.internal:5432/railway
   OPENAI_API_KEY=your-openai-key
   PUBLISHING_ENCRYPTION_KEY=your-32-character-hex-key
   ```

3. **Add PostgreSQL Service**:
   - In Railway dashboard, click "New Service"
   - Select "PostgreSQL" 
   - Railway will automatically provide DATABASE_URL

4. **Deploy**:
   Railway will automatically deploy when you push to your main branch

### Frontend Deployment Options

#### Option 1: Deploy Frontend to Vercel/Netlify
1. Deploy the `apps/web` folder separately
2. Set `NEXT_PUBLIC_API_URL` to your Railway API URL

#### Option 2: Serve Frontend from Railway (Static)
You can modify the API to serve the built frontend as static files

### Environment Variables Required

Copy from `.env.example` and set the following in your deployment:

**Essential:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_API_URL` - API endpoint URL

**Optional (depending on features used):**
- `OPENAI_API_KEY` - For LLM features
- `PUBLISHING_ENCRYPTION_KEY` - For publishing features
- OAuth credentials for social platforms
- Email service API keys

### Database Setup

1. Run migrations on your production database:
   ```sql
   -- Run the files in infra/migrations/ in order
   ```

2. Ensure pgvector extension is available for RAG features

### Deployment Commands

```bash
# Install dependencies
pnpm install

# Build the frontend
cd apps/web && pnpm build

# Deploy to Vercel
vercel --prod
```

### Post-Deployment

1. Test the deployment
2. Set up domain (if custom domain needed)
3. Configure any webhook URLs for OAuth callbacks
4. Update OAuth redirect URIs in platform settings

### Monitoring

- Check Vercel Functions logs for API issues
- Monitor database connections
- Set up error tracking (Sentry, etc.)