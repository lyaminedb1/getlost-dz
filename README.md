# 🏔️ Get Lost DZ — Travel Platform

> Algerian travel agency platform connecting travelers with the best local agencies.

## 🚀 Deploy for FREE in 3 minutes

### Option 1: Railway (Recommended — easiest)
1. Go to [railway.app](https://railway.app) → Sign up free with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Push this folder to a GitHub repo first (see below), then connect it
4. Railway auto-detects Python → deploys automatically
5. Click **Generate Domain** → your live URL is ready!

### Option 2: Render.com
1. Go to [render.com](https://render.com) → Sign up free
2. Click **New → Web Service → Connect GitHub repo**
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn server:app --bind 0.0.0.0:$PORT`
5. Deploy → free URL in ~2 minutes

### Push to GitHub (required for both):
```bash
cd getlost2
git init
git add .
git commit -m "Get Lost DZ initial deploy"
# Create repo on github.com then:
git remote add origin https://github.com/YOUR_USERNAME/getlost-dz.git
git push -u origin main
```

## 💻 Run Locally
```bash
pip install -r requirements.txt
python server.py
# Open http://localhost:5000
```

## 🔑 Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@getlostdz.com | admin123 |
| Agency | agency1@getlostdz.com | agency123 |
| Traveler | sarah@test.com | user123 |

## 🛠 Stack
- **Backend**: Python/Flask + SQLite + JWT + bcrypt
- **Frontend**: React (CDN) + single HTML file
- **Deploy**: Railway / Render (free tier)
