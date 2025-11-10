# 🚀 Deployment Guide

This guide will help you deploy your video calling application to production.

## 📋 Prerequisites

-   Node.js 18+ installed
-   A hosting service account (Vercel, Netlify, Railway, etc.)
-   (Optional) A TURN server account for better connectivity

---

## 🔧 Step 1: Configure Environment Variables

### Client (.env)

1. Copy `.env.example` to `.env`:

    ```bash
    cd client
    cp .env.example .env
    ```

2. Update the values:

    ```env
    VITE_NODE_ENV=production
    VITE_API_URL=https://your-backend-url.com

    # Optional TURN server (recommended for production)
    VITE_TURN_SERVER_URL=turn:your-turn-server.com:3478
    VITE_TURN_USERNAME=your-username
    VITE_TURN_CREDENTIAL=your-credential
    ```

### Server (.env)

1. Copy `.env.example` to `.env`:

    ```bash
    cd server
    cp .env.example .env
    ```

2. Update the values:
    ```env
    PORT=3000
    NODE_ENV=production
    CORS_ORIGIN=https://your-frontend-url.com
    ```

---

## 🌐 Step 2: Get a Free TURN Server (Optional but Recommended)

TURN servers help users behind firewalls connect reliably.

### Option 1: Metered.ca (Free Tier)

1. Go to https://www.metered.ca/tools/openrelay/
2. Get your free TURN server credentials
3. Add them to your client `.env` file

### Option 2: Twilio (Free Tier)

1. Sign up at https://www.twilio.com/stun-turn
2. Get your credentials
3. Add to `.env`

---

## 🖥️ Step 3: Deploy Backend (Server)

### Option A: Railway (Recommended)

1. Create account at https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Set root directory to `/server`
5. Add environment variables:
    - `PORT`: 3000
    - `NODE_ENV`: production
    - `CORS_ORIGIN`: your frontend URL (will add after deploying frontend)
6. Deploy!
7. Copy your backend URL (e.g., `https://yourapp.railway.app`)

### Option B: Render

1. Create account at https://render.com
2. Click "New" → "Web Service"
3. Connect your repository
4. Settings:
    - Root Directory: `server`
    - Build Command: `npm install`
    - Start Command: `npm start`
5. Add environment variables
6. Deploy!

### Option C: Heroku

```bash
cd server
heroku create your-app-name
git subtree push --prefix server heroku main
heroku config:set NODE_ENV=production
heroku config:set CORS_ORIGIN=https://your-frontend-url.com
```

---

## 🌍 Step 4: Deploy Frontend (Client)

### Option A: Vercel (Recommended)

1. Install Vercel CLI:

    ```bash
    npm install -g vercel
    ```

2. Deploy:

    ```bash
    cd client
    vercel
    ```

3. Add environment variables in Vercel dashboard:

    - `VITE_NODE_ENV`: production
    - `VITE_API_URL`: your backend URL from Step 3
    - (Optional) TURN server credentials

4. Redeploy to apply env vars

### Option B: Netlify

1. Create account at https://netlify.com
2. Click "Add new site" → "Import from Git"
3. Select your repository
4. Settings:
    - Base directory: `client`
    - Build command: `npm run build`
    - Publish directory: `client/dist`
5. Add environment variables
6. Deploy!

### Option C: Build and Host Manually

```bash
cd client
npm run build
# Upload the 'dist' folder to your hosting service
```

---

## 🔄 Step 5: Update CORS Settings

After deploying frontend, update your backend `.env`:

```env
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

Then redeploy your backend.

---

## ✅ Step 6: Test Your Deployment

1. Visit your frontend URL
2. Enter a username
3. Join a room
4. Open another browser/device
5. Join the same room
6. Test video/audio/chat functionality

---

## 🐛 Troubleshooting

### Issue: "Failed to connect to server"

-   Check backend URL in client `.env`
-   Verify backend is running
-   Check CORS settings

### Issue: "Connection failed" or video not working

-   Add TURN server credentials
-   Check firewall settings
-   Test on different networks

### Issue: "Microphone access denied"

-   Ensure HTTPS is enabled (required for getUserMedia)
-   Check browser permissions
-   Test on different browsers

---

## 🔐 Security Checklist

-   [ ] Environment variables configured
-   [ ] HTTPS enabled on both frontend and backend
-   [ ] CORS properly configured
-   [ ] TURN server credentials secured
-   [ ] No sensitive data in client code
-   [ ] Backend validates all socket events

---

## 📊 Monitoring (Optional)

Add logging and monitoring:

-   Backend: Use services like LogRocket, Sentry
-   Frontend: Google Analytics, Vercel Analytics
-   Uptime monitoring: UptimeRobot, Pingdom

---

## 🎉 You're Live!

Your video calling app is now deployed! Share the URL with users.

### Recommended Next Steps:

1. Set up custom domain
2. Add SSL certificate (usually automatic)
3. Monitor performance and errors
4. Gather user feedback
5. Iterate and improve!

---

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Check backend logs
3. Verify environment variables
4. Test on different networks
5. Check firewall/antivirus settings

Happy calling! 🎥✨
