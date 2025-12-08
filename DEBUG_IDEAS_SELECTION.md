# Debug Guide: Ideas Selection Issue

## Problem

Khi select ideas ở trang `/ideas`, sau đó chuyển sang trang `/briefs` thì không thấy selected ideas.

## Root Cause Analysis

Có thể có các nguyên nhân sau:

### 1. Database Connection Issue

Backend có thể không kết nối được với database. Check logs:

```bash
# Check API logs
# Tìm dòng: "Database not configured"
```

### 2. Status Update Failed

API `/api/ideas/:id/select` có thể failed silently.

### 3. Frontend Not Reloading

Briefs page có thể load cached data.

## Debug Steps

### Step 1: Check Browser Console

1. Mở trang `/ideas`
2. Mở Developer Tools (F12)
3. Chọn tab Console
4. Click nút Select trên một idea
5. Xem logs:
   - `[Ideas] Selecting idea: <id>`
   - `[Ideas] Select API response: {ok: true}`

### Step 2: Check Briefs Page Logs

1. Chuyển sang trang `/briefs`
2. Xem Console logs:
   - `[Briefs] Loading ideas from: ...`
   - `[Briefs] Received ideas: [...]`
   - `[Briefs] Total ideas: X, Selected: Y`

### Step 3: Test API Directly

Chạy test script:

```bash
./test-select-idea.sh
```

Expected output:
- Test 1: Shows total and selected count
- Test 2: Finds a proposed idea
- Test 3: Selects it successfully (returns `{ok: true}`)
- Test 4: Shows the idea with status "selected"
- Test 5: Shows count of selected ideas
- Test 6: Lists all ideas with their statuses

### Step 4: Manual API Test

```bash
# 1. List all ideas
curl http://localhost:3001/api/ideas | jq '.'

# 2. Select an idea (replace IDEA_ID)
curl -X POST http://localhost:3001/api/ideas/IDEA_ID/select \
  -H "Content-Type: application/json" \
  -H "x-user-id: demo-user" \
  -H "x-user-role: CL"

# 3. Verify the idea is selected
curl http://localhost:3001/api/ideas | jq '.[] | select(.idea_id == "IDEA_ID")'
```

## Common Issues & Solutions

### Issue 1: Database Not Configured

**Symptom:** API returns empty array or error

**Solution:**
1. Check `.env` file có DATABASE_URL
2. Ensure PostgreSQL is running
3. Run migrations: `npm run migrate`

### Issue 2: Status Not Persisted

**Symptom:** Status shows as "selected" in UI but reverts after page reload

**Solution:**
- Check database table has `status` column:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ideas';
```

- If missing, run migration:
```sql
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'proposed';
```

### Issue 3: API Returns 500 Error

**Symptom:** Console shows error with status 500

**Solution:**
1. Check API server logs
2. Verify database connection
3. Check if `pool` is null in backend

### Issue 4: CORS or Network Error

**Symptom:** Console shows network error or CORS error

**Solution:**
1. Ensure API server is running on port 3001
2. Check CORS settings in backend
3. Verify API_URL in frontend matches backend URL

## Verification Checklist

- [ ] API server is running on port 3001
- [ ] Database is connected (check logs)
- [ ] Ideas table exists with `status` column
- [ ] Browser console shows no errors
- [ ] `test-select-idea.sh` passes all tests
- [ ] Manual curl test works
- [ ] Page reload shows selected ideas

## Quick Fix

If all else fails, try this:

1. **Restart API server:**
```bash
cd apps/api
npm run dev
```

2. **Check database migration:**
```bash
psql -d your_database_name
\d ideas;
-- Should show 'status' column
```

3. **Clear browser cache:**
- Hard reload: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

4. **Test in Incognito/Private window:**
- Rules out cache issues

## Success Indicators

When working correctly:

1. **Ideas Page:**
   - Click Select → Toast "Idea selected successfully"
   - Badge changes to "⭐ Selected"
   - Counter in header increments
   - Console shows: `[Ideas] Select API response: {ok: true}`

2. **Briefs Page:**
   - Shows list of selected ideas
   - Counter shows correct number
   - Console shows: `[Briefs] Selected ideas: [...]`
   - No "No Selected Ideas" empty state

## Additional Debugging

### Enable Detailed Logging

Add to `apps/api/src/routes/ideas.ts`:

```typescript
app.post('/:idea_id/select', async (req: any, reply) => {
    console.log('[Select] Request:', req.params.idea_id);
    console.log('[Select] Pool:', pool ? 'Connected' : 'Not connected');
    
    // ... existing code ...
    
    console.log('[Select] Update result:', result);
});
```

### Check Database Directly

```sql
-- See all ideas and their statuses
SELECT idea_id, one_liner, status, created_at 
FROM ideas 
ORDER BY created_at DESC;

-- Count by status
SELECT status, COUNT(*) 
FROM ideas 
GROUP BY status;
```

## Contact Support

If issue persists after following all steps:

1. Collect logs:
   - Browser console output
   - API server logs
   - Database query results

2. Create issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Log outputs
   - Screenshots

