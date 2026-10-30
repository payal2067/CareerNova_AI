# CareerNova_AI — Enterprise Production Deployment & Operations Guide

**System Target**: CareerNova_AI Full-Stack Platform  
**Target Environments**: Linux (Ubuntu 22.04 LTS / Alpine Docker), Node.js 20 LTS, MongoDB Atlas  
**Architecture**: Decoupled MERN Stack (Static Client SPA + Stateless Express 5 REST API Gateway)

---

## 1. System Architecture & Topology

```
                                  [ Internet / Users ]
                                           │
                                           ▼
                                 [ Cloudflare / CDN ]
                        (DDoS Protection, SSL Termination, DNS)
                                ┌──────────┴──────────┐
                                │                     │
                        Static Assets             API Traffic
                                │                     │
                                ▼                     ▼
                        [ Frontend Host ]     [ Nginx Reverse Proxy ]
                     (Vercel / Netlify / S3)          │
                                                      ▼
                                            [ Node.js PM2 Cluster ]
                                            (CareerNova_AI Server)
                                            ┌─────────┴─────────┐
                                            │                   │
                                            ▼                   ▼
                                    [ MongoDB Atlas ]   [ Google Gemini AI ]
```

---

## 2. Environment Configuration Reference

### 2.1 Backend (`SERVER/.env`)
Ensure all values are configured in your production environment or secret manager:

| Variable | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `PORT` | Yes | HTTP server port | `4500` or `8080` |
| `NODE_ENV` | Yes | Node execution environment | `production` |
| `MONGO_URL` | Yes | MongoDB Atlas connection string | `mongodb+srv://<user>:<pwd>@cluster.mongodb.net/careernova?retryWrites=true&w=majority` |
| `JWT_SECRET` | Yes | Cryptographic secret for signing JWTs | `64-character random hex string` |
| `CLIENT_URL` | Yes | Allowed frontend origin for CORS | `https://careernova.ai` |
| `EMAIL` | Yes | Nodemailer sender email address | `support@careernova.ai` |
| `EMAIL_PASSWORD`| Yes | App-specific email password / SMTP credential | `app-password-token` |
| `GEMINI_API_KEY`| Optional | Google Gemini Generative AI Key | `AIzaSy...` (Falls back to local heuristic if unset) |
| `GEMINI_MODEL` | Optional | Gemini model identifier | `gemini-2.5-flash` |

### 2.2 Frontend (`CLIENT/.env.production`)
Variables consumed during the Vite build process:

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Yes | Full URL pointing to backend API server | `https://api.careernova.ai` |
| `VITE_BACKEND_URL`| Optional | Base URL fallback | `https://api.careernova.ai` |

---

## 3. Backend Deployment Runbook (Node.js & PM2)

### 3.1 Server Preparation
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential

# Verify versions
node -v  # v20.x or higher
npm -v   # v10.x or higher

# Install PM2 Process Manager globally
sudo npm install -g pm2
```

### 3.2 Application Setup
```bash
# Clone the repository
git clone https://github.com/your-org/CareerNova_AI.git /var/www/careernova
cd /var/www/careernova

# Install server production dependencies
cd SERVER
npm ci --only=production

# Set up production environment configuration
cp .env.example .env
nano .env  # Populate production credentials
```

### 3.3 Starting with PM2 Process Manager
Create a PM2 ecosystem file `ecosystem.config.js` in `SERVER/`:
```javascript
module.exports = {
  apps: [{
    name: "careernova-api",
    script: "index.js",
    instances: "max",        // Cluster mode utilizing all available CPU cores
    exec_mode: "cluster",
    env_production: {
      NODE_ENV: "production",
      PORT: 4500
    },
    max_memory_restart: "500M",
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};
```

Run PM2 commands:
```bash
# Start cluster
pm2 start ecosystem.config.js --env production

# Save process list for system reboot persistence
pm2 save
pm2 startup
```

### 3.4 Nginx Reverse Proxy Configuration
Create `/etc/nginx/sites-available/careernova-api`:
```nginx
server {
    listen 80;
    server_name api.careernova.ai;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.careernova.ai;

    ssl_certificate /etc/letsencrypt/live/api.careernova.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.careernova.ai/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:4500;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90s;
    }
}
```
Enable the site and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/careernova-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4. Frontend Deployment Runbook (Vite SPA)

### 4.1 Production Build
In the repository root or `CLIENT/` directory:
```bash
cd CLIENT
npm ci
npm run build
```
This produces an optimized static distribution in `CLIENT/dist/` (JS bundle is **277 kB gzipped**).

### 4.2 Hosting Option A: Vercel / Netlify
1. Point build settings to:
   - **Root Directory**: `CLIENT`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
2. Add environment variable:
   - `VITE_API_URL`: `https://api.careernova.ai`
3. Single-Page Application (SPA) Routing Configuration:
   - For Netlify, ensure `CLIENT/public/_redirects` exists:
     ```text
     /*    /index.html   200
     ```
   - For Vercel, ensure `CLIENT/vercel.json` exists:
     ```json
     {
       "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
     }
     ```

### 4.3 Hosting Option B: Nginx Static Server
```nginx
server {
    listen 80;
    server_name careernova.ai;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name careernova.ai;

    ssl_certificate /etc/letsencrypt/live/careernova.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/careernova.ai/privkey.pem;

    root /var/www/careernova/CLIENT/dist;
    index index.html;

    # Gzip / Brotli compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # Browser caching for static assets
    location ~* \.(?:css|js|woff2?|svg|png|jpg|jpeg|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 5. Observability & Health Probes

The backend exposes native health check endpoints for container orchestrators (Kubernetes, AWS ECS) and load balancers:

1. **Liveness Probe**:
   - `GET https://api.careernova.ai/health`
   - Returns `200 OK` with uptime, memory stats, and process status.
2. **Readiness Probe**:
   - `GET https://api.careernova.ai/health/ready`
   - Returns `200 OK` when MongoDB connection is live (`readyState === 1`).
   - Returns `503 Service Unavailable` if the database is disconnected.

---

## 6. Disaster Recovery & Rollback Protocol

1. **Fast Rollback (PM2)**:
   ```bash
   cd /var/www/careernova
   git checkout <PREVIOUS_STABLE_COMMIT_HASH>
   cd SERVER && npm ci --only=production
   pm2 restart careernova-api
   ```
2. **Database Backup & Restore**:
   - Continuous automated backups should be enabled in MongoDB Atlas (Point-in-Time Restore).
   - In case of catastrophic data corruption, initiate an Atlas Point-in-Time restore to a state prior to incident onset.

