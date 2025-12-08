# Quick Fix: Ideas Selection Issue

## Problem Found

✅ **Root Cause Identified:** API endpoint `/api/ideas` đang trả về `internal_error` (500)

## Console Logs Từ Browser

```
Failed to load ideas: 500 Internal Server Error
```

## API Response

```bash
curl http://localhost:3001/api/ideas
# Returns: {"ok":false,"error":"internal_error"}
```

## Solution Steps

### Step 1: Restart API Server

API server cần restart để apply fix mới:

```bash
# Stop current server
# Press Ctrl+C in terminal running API

# Start again
cd apps/api
npm run dev
```

### Step 2: Verify API Works

```bash
curl http://localhost:3001/api/ideas
# Should return: [] (empty array) or list of ideas
```

### Step 3: Test in Browser

1. Reload `/ideas` page (Ctrl+R hoặc Cmd+R)
2. Check console - should not see "500 Internal Server Error"
3. If ideas exist, try clicking Select button
4. Go to `/briefs` - should see selected ideas

## What Was Fixed

**File:** `apps/api/src/routes/ideas.ts`

**Changes:**
- Added try-catch block around database queries
- Better error messages with `.message` field
- Proper error logging with `app.log.error()`

**Before:**
```typescript
app.get('/', async (req: any) => {
    return q('SELECT * FROM ideas...')  // Throws error if fails
})
```

**After:**
```typescript
app.get('/', async (req: any, reply) => {
    try {
        return await q('SELECT * FROM ideas...')
    } catch (error: any) {
        app.log.error('[Ideas] Failed to list ideas:', error)
        return reply.status(500).send({
            ok: false,
            error: 'Failed to list ideas',
            message: error.message  // Now we can see actual error
        })
    }
})
```

## Possible Database Issues

If error persists after restart, check:

### 1. Database Connection

```bash
# Check if PostgreSQL is running
pg_isready

# Or check with psql
psql -d your_database_name -c "SELECT 1"
```

### 2. Table Exists

```sql
-- Connect to database
psql -d your_database_name

-- Check if ideas table exists
\dt ideas;

-- If not exists, run migrations
\i infra/migrations/001_initial.sql
```

### 3. Check DATABASE_URL

```bash
# In apps/api/.env
echo $DATABASE_URL

# Should be something like:
# postgresql://user:password@localhost:5432/dbname
```

## Expected Workflow After Fix

1. **Generate Ideas**
   - Go to `/ideas`
   - Fill form and click "Generate Ideas"
   - Should see list of ideas with status "proposed"

2. **Select Ideas**
   - Click ✓ (checkmark) button in Actions column
   - Status badge changes to "⭐ Selected"
   - Counter in header increments
   - Toast shows "Idea selected successfully"

3. **Create Briefs**
   - Go to `/briefs`
   - Should see list of selected ideas
   - Click button to generate brief

## Debug Commands

### Check API Server Status

```bash
# Health check
curl http://localhost:3001/api/health

# Should return:
# {"status":"ok","timestamp":"...","service":"content-multiplier-api","version":"1.0.0"}
```

### Check Ideas List

```bash
# List all ideas
curl http://localhost:3001/api/ideas | jq '.'

# Count ideas by status
curl http://localhost:3001/api/ideas | jq 'group_by(.status) | map({status: .[0].status, count: length})'
```

### Test Select API

```bash
# Select an idea
IDEA_ID=$(curl -s http://localhost:3001/api/ideas | jq -r '.[0].idea_id')
curl -X POST http://localhost:3001/api/ideas/$IDEA_ID/select \
  -H "Content-Type: application/json" \
  -H "x-user-id: demo-user" \
  -H "x-user-role: CL"

# Should return: {"ok":true}
```

## Still Not Working?

If issue persists:

1. **Check API Logs:**
   - Look for `[Ideas] Failed to list ideas:` in terminal
   - Error message will show exact database error

2. **Check Database:**
   ```sql
   SELECT COUNT(*) FROM ideas;
   SELECT DISTINCT status FROM ideas;
   ```

3. **Clear Data and Restart:**
   ```sql
   TRUNCATE TABLE ideas CASCADE;
   ```

4. **Check Browser Console:**
   - F12 → Console tab
   - Look for error messages
   - Check Network tab for API responses

## Next Steps

After server restart:

1. ✅ Test API: `curl http://localhost:3001/api/ideas`
2. ✅ Test Frontend: Reload `/ideas` page
3. ✅ Generate ideas if none exist
4. ✅ Select an idea
5. ✅ Verify in `/briefs` page

---

**Status:** Code fix applied, waiting for server restart ⏳

