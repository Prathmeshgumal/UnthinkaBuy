# Quick Start: Deploying UnthinkaBuy

## Overview

You need to deploy **TWO separate services**:
1. **Frontend** (Next.js) → Vercel
2. **Backend** (FastAPI) → Railway/Render/etc.

## Step 1: Deploy Backend First (Railway Example)

### Why deploy backend first?
Because you need the backend URL to configure the frontend!

### Steps:

1. **Go to Railway.app** and sign up/login
   - https://railway.app

2. **Create New Project** → "Deploy from GitHub repo"
   - Select your UnthinkaBuy repository
   - Railway will detect it's a Python project

3. **Configure the deployment:**
   - Set **Root Directory** to `backend`
   - Railway will auto-detect `requirements.txt`

4. **Add Environment Variables** in Railway:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key-here
   SECRET_KEY=your-secure-jwt-secret-key-here
   ```
   
   To generate SECRET_KEY, run:
   ```bash
   python create_secret.py
   ```
   Or:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

5. **Deploy** - Railway will automatically deploy

6. **Get your backend URL:**
   - After deployment, Railway gives you a URL like:
   - `https://your-app-name.railway.app`
   - **THIS IS YOUR `NEXT_PUBLIC_FASTAPI_URL`!**

7. **Test your backend:**
   - Visit: `https://your-app-name.railway.app/health`
   - Should return: `{"status":"healthy"}`

## Step 2: Deploy Frontend to Vercel

### Steps:

1. **Go to Vercel.com** and sign up/login
   - https://vercel.com

2. **Import your GitHub repository**
   - Click "Add New Project"
   - Select your UnthinkaBuy repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables** in Vercel:
   - Go to Project Settings → Environment Variables
   - Add these **3 variables**:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
   NEXT_PUBLIC_FASTAPI_URL=https://your-app-name.railway.app
   ```
   
   ⚠️ **IMPORTANT**: Use the Railway URL from Step 1 as `NEXT_PUBLIC_FASTAPI_URL`!

4. **Deploy** - Vercel will automatically deploy

5. **Test your deployment:**
   - Visit your Vercel URL
   - Check browser console for errors
   - Try logging in/signing up
   - Check if clustered products appear

## Where to Find Values

### Supabase Values:
1. Go to https://supabase.com
2. Open your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Backend URL (NEXT_PUBLIC_FASTAPI_URL):
- **You create this** by deploying your backend!
- After deploying to Railway/Render/etc., they give you a URL
- That URL becomes your `NEXT_PUBLIC_FASTAPI_URL`
- Example: `https://unthinkabuy-backend.railway.app`

### SECRET_KEY:
- Generate it yourself using `create_secret.py` or:
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(32))"
  ```
- Use the same value in both Railway (backend) and keep it secret!

## Alternative Backend Hosting Options

### Option 1: Railway (Recommended - Easiest)
- ✅ Free tier available
- ✅ Auto-detects Python
- ✅ Easy GitHub integration
- https://railway.app

### Option 2: Render
- ✅ Free tier available
- ✅ Good for Python apps
- https://render.com

### Option 3: Fly.io
- ✅ Free tier available
- ✅ Good performance
- https://fly.io

### Option 4: DigitalOcean App Platform
- 💰 Paid (but affordable)
- ✅ Very reliable
- https://www.digitalocean.com/products/app-platform

## Troubleshooting

### "Backend URL not configured" error
- Make sure `NEXT_PUBLIC_FASTAPI_URL` is set in Vercel
- Make sure you redeployed Vercel after adding the variable
- Check that your backend is actually running (test `/health` endpoint)

### Backend not responding
- Check Railway/Render logs for errors
- Verify environment variables are set correctly
- Make sure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct

### Clustered products not showing
- Check browser console for errors
- Verify `NEXT_PUBLIC_FASTAPI_URL` points to your deployed backend
- Test backend directly: `https://your-backend-url/api/random-cluster-products`

### Login/Signup not working
- Same as above - verify backend URL is correct
- Check backend logs for authentication errors
- Verify `SECRET_KEY` is set in backend

## Summary

**You deploy separately because:**
- Vercel = Frontend hosting (Next.js)
- Railway/Render = Backend hosting (Python/FastAPI)

**NEXT_PUBLIC_FASTAPI_URL is:**
- The URL of your deployed backend
- You get it AFTER deploying the backend
- You set it in Vercel environment variables

**Order matters:**
1. Deploy backend → Get backend URL
2. Deploy frontend → Use backend URL in environment variables

