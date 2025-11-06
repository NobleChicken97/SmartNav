# 🚀 Vercel Deployment Guide for Smart Navigator

## ⚠️ Important Note
This is a **full-stack application** with separate frontend and backend. Vercel will only deploy the **frontend** (React app). You need to deploy the backend separately.

## 📋 Prerequisites

1. **Backend Deployment** (Choose one):
   - Railway.app (Recommended for beginners)
   - Render.com
   - Heroku
   - DigitalOcean App Platform
   - Your own VPS

2. **MongoDB Database**:
   - MongoDB Atlas (Free tier available)
   - Get your connection string ready

---

## 🎯 Step 1: Deploy Backend First

### Option A: Railway.app (Easiest)

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `SmartNav_Broken` repository
5. Select `backend` as the root directory
6. Add environment variables:
   ```
   MONGODB_URI=your-mongodb-atlas-connection-string
   JWT_SECRET=your-super-secret-jwt-key
   NODE_ENV=production
   PORT=5000
   ```
7. Deploy and note your backend URL (e.g., `https://smartnav-backend.railway.app`)

### Option B: Render.com

1. Go to [render.com](https://render.com)
2. Create new "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add same environment variables as above
6. Note your backend URL

---

## 🎯 Step 2: Configure Vercel for Frontend

### 2.1 Set Environment Variables in Vercel

Go to your Vercel project settings and add:

```bash
VITE_API_BASE_URL=https://your-backend-url.railway.app
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
VITE_MAP_ID=your-google-maps-map-id
```

**Important**: Replace `https://your-backend-url.railway.app` with your actual backend URL from Step 1.

### 2.2 Deploy to Vercel

#### Option 1: Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your `SmartNav_Broken` repository
4. Configure build settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variables from section 2.1
6. Click "Deploy"

#### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from root directory
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (Select your account)
# - Link to existing project? N
# - Project name? smart-navigator
# - In which directory is your code located? ./

# Add environment variables
vercel env add VITE_API_BASE_URL production
# Enter: https://your-backend-url.railway.app

vercel env add VITE_GOOGLE_MAPS_API_KEY production
# Enter: your-api-key

# Deploy to production
vercel --prod
```

---

## 🔧 Step 3: Update Backend CORS Settings

Your backend needs to allow requests from your Vercel frontend URL.

**File**: `backend/src/server.js`

Update the CORS configuration to include your Vercel URL:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://your-vercel-app.vercel.app',  // Add this
    'https://your-custom-domain.com'        // If you have one
  ],
  credentials: true
}));
```

Redeploy your backend after this change.

---

## 📝 Step 4: Seed Your Production Database

Once backend is deployed, seed the database with initial data:

```bash
# SSH into your backend deployment or use Railway/Render CLI
node scripts/seed.js
```

Or create an admin user manually via API:
```bash
curl -X POST https://your-backend-url.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "SecurePassword123",
    "role": "admin"
  }'
```

---

## ✅ Verification Checklist

- [ ] Backend deployed and accessible
- [ ] MongoDB Atlas database connected
- [ ] Backend environment variables set
- [ ] Backend CORS includes Vercel URL
- [ ] Frontend environment variables set in Vercel
- [ ] Frontend deployed successfully
- [ ] Can access Vercel URL
- [ ] Can login to the application
- [ ] Map displays correctly
- [ ] Events load from backend

---

## 🐛 Troubleshooting

### Issue: "Network Error" or "Failed to fetch"

**Solution**: Check that `VITE_API_BASE_URL` in Vercel points to your backend URL.

### Issue: CORS errors in browser console

**Solution**: Update backend CORS settings to include your Vercel URL.

### Issue: Frontend builds but shows blank page

**Solution**: 
1. Check browser console for errors
2. Verify all environment variables are set in Vercel
3. Check that paths in `vercel.json` are correct

### Issue: Backend crashes on Railway/Render

**Solution**: 
1. Check logs in Railway/Render dashboard
2. Verify MongoDB connection string is correct
3. Ensure all environment variables are set

---

## 🎨 Custom Domain (Optional)

### Vercel (Frontend)
1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `smartnav.yourdomain.com`)
3. Follow DNS configuration instructions

### Railway/Render (Backend)
1. Go to Settings → Domains
2. Add custom domain (e.g., `api.smartnav.yourdomain.com`)
3. Update `VITE_API_BASE_URL` in Vercel to use new domain

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────┐
│  Users                                  │
└────────────┬────────────────────────────┘
             │
             │ HTTPS
             ▼
┌─────────────────────────────────────────┐
│  Vercel (Frontend)                      │
│  - React + TypeScript                   │
│  - Vite build                           │
│  - Static assets                        │
└────────────┬────────────────────────────┘
             │
             │ API Calls
             │ (VITE_API_BASE_URL)
             ▼
┌─────────────────────────────────────────┐
│  Railway/Render (Backend)               │
│  - Node.js + Express                    │
│  - JWT Authentication                   │
│  - API Routes                           │
└────────────┬────────────────────────────┘
             │
             │ Database Connection
             ▼
┌─────────────────────────────────────────┐
│  MongoDB Atlas                          │
│  - User data                            │
│  - Locations                            │
│  - Events                               │
└─────────────────────────────────────────┘
```

---

## 💡 Cost Estimate

- **Vercel**: Free tier (hobby)
- **Railway/Render**: Free tier or ~$5/month
- **MongoDB Atlas**: Free tier (512 MB)
- **Total**: $0 - $5/month for learning/small projects

---

## 🔐 Security Notes

1. **Never commit `.env` files** to Git (already in `.gitignore`)
2. **Use strong JWT secrets** (generate with: `openssl rand -base64 32`)
3. **Enable MongoDB Atlas IP whitelisting** (0.0.0.0/0 for Railway/Render)
4. **Use HTTPS only** in production
5. **Rotate secrets regularly**

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)

---

**Need help?** Open an issue on GitHub or check the deployment logs for detailed error messages.
