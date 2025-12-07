# Deploying Both Frontend and Backend on Vercel

Yes! You can deploy both your Next.js frontend and FastAPI backend together on Vercel using serverless functions.

## How It Works

Vercel supports Python serverless functions. We've configured your FastAPI backend to run as Vercel serverless functions using Mangum (an ASGI adapter).

## Setup Steps

### 1. Install Mangum (Already Added)

The `api/requirements.txt` file includes `mangum` which wraps FastAPI for serverless compatibility.

### 2. Environment Variables

Add these to Vercel (Settings → Environment Variables):

**Required:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SECRET_KEY=your-secure-jwt-secret-key-here
```

**Optional:**
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Note:** You DON'T need `NEXT_PUBLIC_FASTAPI_URL` anymore! The backend runs on the same domain.

### 3. Deploy to Vercel

1. **Push your code to GitHub**
2. **Import to Vercel:**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Vercel will automatically:**
   - Build your Next.js frontend
   - Deploy Python serverless functions from `api/` directory
   - Route `/api/*` requests to your FastAPI backend

4. **That's it!** Everything deploys together.

## How Requests Work

- **Frontend:** `https://your-app.vercel.app` (Next.js)
- **Backend API:** `https://your-app.vercel.app/api/*` (FastAPI serverless functions)

All on the same domain! No CORS issues, no separate backend URL needed.

## Project Structure

```
UnthinkaBuy/
├── app/                    # Next.js frontend
├── api/                    # Vercel serverless functions
│   ├── index.py           # FastAPI entry point
│   └── requirements.txt   # Python dependencies
├── backend/                # Backend source code (imported by api/index.py)
└── vercel.json            # Vercel configuration
```

## Important Notes

### ⚠️ Dependency Size Limit

Vercel serverless functions have a **50MB limit** for dependencies. The `sentence-transformers` package in your `backend/requirements.txt` is very large (~500MB+).

**If you get deployment errors about package size:**

1. **Option 1:** Remove `sentence-transformers` if not critical
2. **Option 2:** Use a separate backend service (Railway/Render) for features that need it
3. **Option 3:** Use Vercel Pro plan (higher limits)

### Function Timeout

- **Free tier:** 10 seconds max execution time
- **Pro tier:** 60 seconds max execution time

Most API calls should complete within 10 seconds, but if you have long-running operations, consider:
- Using background jobs
- Optimizing database queries
- Upgrading to Pro plan

## Testing Locally

To test the serverless functions locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Run development server
vercel dev
```

This will run both Next.js and the serverless functions locally.

## Migration from Separate Backend

If you were using a separate backend (Railway/Render), you can now:

1. **Remove** `NEXT_PUBLIC_FASTAPI_URL` from Vercel environment variables
2. **Keep** the backend code in the `backend/` directory (it's imported by `api/index.py`)
3. **Deploy** everything together on Vercel

The frontend code automatically uses relative paths when `NEXT_PUBLIC_FASTAPI_URL` is not set.

## Troubleshooting

### "Module not found" errors
- Make sure `api/requirements.txt` includes all dependencies
- Check that `backend/` directory is accessible from `api/index.py`

### Function timeout errors
- Check Vercel function logs
- Optimize slow database queries
- Consider upgrading to Pro plan for longer timeouts

### Package size errors
- Remove large dependencies like `sentence-transformers` if not needed
- Or deploy backend separately for features requiring large packages

## Benefits of This Approach

✅ **Single deployment** - Everything in one place  
✅ **No CORS issues** - Same domain for frontend and backend  
✅ **Simpler setup** - No separate backend service needed  
✅ **Automatic scaling** - Vercel handles it  
✅ **Free tier available** - Good for development and small projects  

## When to Use Separate Backend

Consider deploying backend separately (Railway/Render) if:
- You need packages larger than 50MB
- You need execution times longer than 10 seconds
- You need persistent connections or WebSockets
- You need more control over the backend environment

