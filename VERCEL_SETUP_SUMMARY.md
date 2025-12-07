# ✅ Yes! You Can Deploy Both on Vercel

I've configured your project to deploy both the **Next.js frontend** and **FastAPI backend** together on Vercel using serverless functions.

## What Changed

1. **Created `api/index.py`** - Vercel serverless function entry point
2. **Created `api/requirements.txt`** - Python dependencies for serverless functions
3. **Updated `vercel.json`** - Routes `/api/*` to Python serverless functions
4. **Updated `lib/api-config.ts`** - Uses relative paths when backend is on same domain
5. **Updated API routes** - They now work with both separate backend and Vercel serverless functions

## How to Deploy

### Step 1: Add Environment Variables to Vercel

Go to Vercel → Your Project → Settings → Environment Variables

Add these **3 variables**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SECRET_KEY=your-secure-jwt-secret-key-here
```

**Important:** You DON'T need `NEXT_PUBLIC_FASTAPI_URL` anymore! The backend runs on the same Vercel domain.

### Step 2: Deploy

1. Push your code to GitHub
2. Import to Vercel (or push to connected repo)
3. Vercel will automatically:
   - Build Next.js frontend
   - Deploy Python serverless functions
   - Route everything correctly

### Step 3: Test

- Frontend: `https://your-app.vercel.app`
- Backend API: `https://your-app.vercel.app/api/health` (should return `{"status":"healthy"}`)

## How It Works

```
User Request → Vercel
    ↓
Next.js Frontend (/) → Your React app
    ↓
API Request (/api/*) → Vercel Python Serverless Function
    ↓
FastAPI Backend (api/index.py) → Handles all /api/* routes
```

Everything runs on the same domain - no CORS, no separate backend URL needed!

## Important Notes

### ⚠️ Package Size Limit

Vercel has a **50MB limit** for serverless function dependencies. Your `backend/requirements.txt` includes `sentence-transformers` which is very large (~500MB+).

**If deployment fails due to package size:**

1. **Temporarily remove** `sentence-transformers` from `api/requirements.txt` if you're not using it
2. Or deploy backend separately (Railway/Render) for features that need large packages

### Function Timeout

- **Free tier:** 10 seconds max
- **Pro tier:** 60 seconds max

Most API calls should be fine, but optimize slow queries if needed.

## Benefits

✅ **Single deployment** - Everything in one place  
✅ **No CORS issues** - Same domain  
✅ **Simpler setup** - No separate backend service  
✅ **Automatic scaling** - Vercel handles it  
✅ **Free tier available**  

## Troubleshooting

### "Module not found" errors
- Check that `api/requirements.txt` has all dependencies
- Make sure `mangum` is included (it's already there)

### Function timeout
- Check Vercel function logs
- Optimize database queries
- Consider Pro plan for longer timeouts

### Package too large
- Remove `sentence-transformers` if not needed
- Or use separate backend for features requiring large packages

## Next Steps

1. **Test locally** (optional):
   ```bash
   npm i -g vercel
   vercel dev
   ```

2. **Deploy to Vercel:**
   - Push to GitHub
   - Import to Vercel
   - Add environment variables
   - Deploy!

3. **Verify:**
   - Check `/api/health` endpoint
   - Test login/signup
   - Check clustered products section

That's it! Everything should work now. 🎉

