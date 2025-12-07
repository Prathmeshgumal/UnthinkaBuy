# Deployment Guide for UnthinkaBuy

This guide will help you deploy UnthinkaBuy to Vercel and fix production issues.

## Important: Backend Deployment

**The FastAPI backend MUST be deployed separately** - Vercel does not natively support Python/FastAPI applications. You need to deploy the backend to a service like:

- **Railway** (Recommended): https://railway.app
- **Render**: https://render.com
- **Fly.io**: https://fly.io
- **Heroku**: https://heroku.com
- **DigitalOcean App Platform**: https://www.digitalocean.com/products/app-platform

## Required Environment Variables for Vercel

Add these environment variables in your Vercel project settings (Settings → Environment Variables):

### Frontend (Vercel) - REQUIRED

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# FastAPI Backend URL (REQUIRED - this is why things aren't working!)
NEXT_PUBLIC_FASTAPI_URL=https://your-backend-url.railway.app
```

### Optional (Frontend)

```env
# Only if you need to override auto-detection
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Service role key (for server-side operations only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Backend Deployment (Railway Example)

1. **Create a Railway account** and create a new project
2. **Connect your GitHub repository**
3. **Set the root directory** to `backend`
4. **Add environment variables** in Railway:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
SECRET_KEY=your-secure-jwt-secret-key-here
```

5. **Generate SECRET_KEY**:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

6. **Railway will auto-detect** Python and install dependencies from `requirements.txt`
7. **Get your Railway URL** (e.g., `https://your-app.railway.app`)
8. **Add this URL** to Vercel as `NEXT_PUBLIC_FASTAPI_URL`

## Quick Fix Checklist

If clustered products and login/signup aren't working in production:

- [ ] Backend is deployed and accessible (test the `/health` endpoint)
- [ ] `NEXT_PUBLIC_FASTAPI_URL` is set in Vercel to your backend URL
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set in Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set in Vercel
- [ ] Backend has `SUPABASE_URL` and `SUPABASE_ANON_KEY` set
- [ ] Backend has `SECRET_KEY` set (for JWT tokens)
- [ ] Redeploy Vercel after adding environment variables

## Testing Your Backend

After deploying your backend, test it:

```bash
# Health check
curl https://your-backend-url.railway.app/health

# Should return: {"status":"healthy"}

# Test random cluster products
curl https://your-backend-url.railway.app/api/random-cluster-products

# Should return cluster data
```

## Local Development Setup

### Frontend (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000
```

### Backend (backend/.env)

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
SECRET_KEY=your-secure-jwt-secret-key-here
```

## Common Issues

### Clustered Products Not Showing

- **Cause**: Backend URL not configured or backend not accessible
- **Fix**: Set `NEXT_PUBLIC_FASTAPI_URL` in Vercel to your deployed backend URL
- **Check**: Open browser console and look for errors like "Backend URL not configured"

### Login/Signup Not Working

- **Cause**: Same as above - backend not accessible
- **Fix**: Ensure `NEXT_PUBLIC_FASTAPI_URL` points to your deployed backend
- **Check**: Backend logs for authentication errors

### CORS Errors

- **Cause**: Backend CORS settings
- **Fix**: Backend already allows all origins (`allow_origins=["*"]`), but ensure your backend URL is correct

## Minimal Environment Variables

For a minimal setup, you only need:

**Vercel (Frontend):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_FASTAPI_URL` ⚠️ **CRITICAL - This is likely missing!**

**Backend (Railway/Render/etc.):**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SECRET_KEY`

That's it! These 6 variables are the minimum required.

