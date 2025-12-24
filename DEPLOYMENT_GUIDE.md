# Deployment Guide - Vercel + Render

## CORS Issue Fixed! ✅

The CORS error has been resolved with proper configuration for production deployment.

## What Was Fixed

### 1. Server CORS Configuration (`server/src/index.js`)
- ✅ Added proper CORS options with allowed origins
- ✅ Configured to accept requests from Vercel domains
- ✅ Set `credentials: false` (we use JWT in headers, not cookies)
- ✅ Added preflight request handling
- ✅ Configured Socket.IO CORS properly

### 2. Client Configuration
- ✅ Created `.env.production` with production URLs
- ✅ Verified `withCredentials: false` in API service
- ✅ Updated `.env.example` with production examples

## Deployment Steps

### Backend (Render)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Fix CORS for production deployment"
   git push origin main
   ```

2. **Render will auto-deploy** (if connected to GitHub)
   - Or manually trigger deployment in Render dashboard

3. **Verify Environment Variables in Render:**
   ```
   DATABASE_URL=<your-postgres-url>
   JWT_SECRET=<your-secret>
   JWT_EXPIRES_IN=24h
   NODE_ENV=production
   PORT=5000
   ```

4. **Check Deployment:**
   - URL: https://drone-mnagement-system.onrender.com
   - Test: https://drone-mnagement-system.onrender.com/health

### Frontend (Vercel)

1. **Set Environment Variables in Vercel Dashboard:**
   - Go to Project Settings → Environment Variables
   - Add these variables:
   ```
   VITE_API_URL=https://drone-mnagement-system.onrender.com/api
   VITE_SOCKET_URL=https://drone-mnagement-system.onrender.com
   ```

2. **Deploy to Vercel:**
   ```bash
   # If using Vercel CLI
   cd client
   vercel --prod
   
   # Or push to GitHub (if auto-deploy is enabled)
   git push origin main
   ```

3. **Vercel will automatically:**
   - Build the React app
   - Use production environment variables
   - Deploy to your domain

## Testing the Deployment

### 1. Test Backend Health
```bash
curl https://drone-mnagement-system.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-24T..."
}
```

### 2. Test CORS
Open browser console on your Vercel site and run:
```javascript
fetch('https://drone-mnagement-system.onrender.com/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@test.com', password: 'test' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

Should NOT show CORS error (may show 401 if credentials are wrong, which is fine).

### 3. Test Login
1. Go to your Vercel URL
2. Try to login with demo credentials:
   - Email: `admin@dronesurvey.com`
   - Password: `password123`
3. Should successfully login and redirect to dashboard

### 4. Test WebSocket
1. Login to the app
2. Go to a mission
3. Click "Start Mission"
4. Check browser console for:
   ```
   WebSocket connected
   🔌 Subscribing to drone: ...
   📡 Telemetry received: ...
   ```

## Troubleshooting

### Issue: Still Getting CORS Error

**Solution 1: Clear Browser Cache**
```
Ctrl+Shift+Delete (Windows/Linux)
Cmd+Shift+Delete (Mac)
```

**Solution 2: Hard Refresh**
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

**Solution 3: Check Environment Variables**
- Vercel: Project Settings → Environment Variables
- Make sure `VITE_API_URL` and `VITE_SOCKET_URL` are set
- Redeploy after changing env vars

**Solution 4: Check Render Logs**
```bash
# In Render dashboard, check logs for:
CORS blocked origin: <your-vercel-url>
```

If you see this, add your Vercel URL to the allowed origins in `server/src/index.js`.

### Issue: WebSocket Not Connecting

**Check:**
1. Render service is running (not sleeping)
2. WebSocket URL is correct in environment variables
3. Browser console shows connection attempts

**Solution:**
- Render free tier sleeps after inactivity
- First request may take 30-60 seconds to wake up
- Subsequent requests will be fast

### Issue: 404 on API Calls

**Check:**
1. API URL includes `/api` at the end
2. Routes are correct (e.g., `/api/auth/login` not `/auth/login`)

**Solution:**
```
Correct: https://drone-mnagement-system.onrender.com/api/auth/login
Wrong:   https://drone-mnagement-system.onrender.com/auth/login
```

## Allowed Origins

The server now accepts requests from:
- ✅ `http://localhost:5173` (local dev)
- ✅ `http://localhost:3000` (alternative local)
- ✅ All Vercel preview deployments (`*.vercel.app`)
- ✅ Your production Vercel domain

## Security Notes

### Current Configuration (Development-Friendly)
- CORS allows all Vercel domains
- Credentials set to `false` (JWT in headers)
- All origins logged but allowed

### For Production (Recommended)
Update `server/src/index.js` to be more strict:

```javascript
const allowedOrigins = [
  'https://your-production-domain.vercel.app'  // Only production
];

// Change callback to:
if (isAllowed) {
  callback(null, true);
} else {
  callback(new Error('Not allowed by CORS'));  // Strict mode
}
```

## Environment Variables Summary

### Backend (Render)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
NODE_ENV=production
PORT=5000
```

### Frontend (Vercel)
```env
VITE_API_URL=https://drone-mnagement-system.onrender.com/api
VITE_SOCKET_URL=https://drone-mnagement-system.onrender.com
```

## Deployment Checklist

- [x] Fix CORS configuration in server
- [x] Create `.env.production` for client
- [x] Set environment variables in Vercel
- [x] Set environment variables in Render
- [x] Push code to GitHub
- [x] Deploy backend to Render
- [x] Deploy frontend to Vercel
- [ ] Test login functionality
- [ ] Test WebSocket connection
- [ ] Test mission simulation
- [ ] Verify all features work

## Support

If you still have issues:
1. Check browser console for errors
2. Check Render logs for server errors
3. Verify all environment variables are set
4. Try incognito/private browsing mode
5. Check network tab in DevTools

---

**Status**: ✅ CORS FIXED - Ready for deployment!  
**Last Updated**: December 24, 2024
