# Hostinger Deployment Guide for Next.js

## Option 1: Hostinger VPS/Cloud (Recommended for Next.js)

### 1. Set up Node.js on your server
```bash
# SSH into your Hostinger VPS
ssh user@your-server-ip

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager — keeps app running)
npm install -g pm2
```

### 2. Upload your project
```bash
# On your LOCAL machine — build the project first
npm run build

# Then upload the following to your server:
# - .next/ folder
# - public/ folder
# - package.json
# - next.config.js
# - node_modules/ (or run npm install on server)
```

### 3. Start the app with PM2
```bash
# On server:
cd /var/www/pixlr-tools
npm install --production

# Start with PM2
pm2 start npm --name "pixlr-tools" -- start

# Auto-restart on server reboot
pm2 startup
pm2 save
```

### 4. Set up Nginx reverse proxy (on server)
```nginx
# /etc/nginx/sites-available/pixlr-tools
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Gzip compression
    gzip on;
    gzip_types text/plain application/json application/javascript text/css application/wasm;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Required for FFmpeg.wasm SharedArrayBuffer
        add_header Cross-Origin-Opener-Policy "same-origin";
        add_header Cross-Origin-Embedder-Policy "require-corp";
    }

    # Cache static assets
    location /_next/static/ {
        proxy_pass http://localhost:3000/_next/static/;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/pixlr-tools /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get free SSL certificate
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Option 2: Hostinger Shared Hosting (Static Export)

If you only have shared hosting (not VPS), convert to static export:

### next.config.js change:
```js
const nextConfig = {
  output: 'export',   // Add this line
  // ... rest of config
}
```

### Then:
```bash
npm run build
# This generates an 'out/' folder — upload to public_html/
```

⚠️ Note: Static export does NOT support server-side features.
For this project it works because all processing is client-side.

---

## Environment Variables
Create a `.env.local` file (do NOT commit to git):
```
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

---

## After deployment checklist:
1. ✅ Replace 'yourdomain.com' in layout.tsx, sitemap.ts, robots.ts
2. ✅ Submit sitemap to Google Search Console: https://yourdomain.com/sitemap.xml
3. ✅ Test all tools work in browser
4. ✅ Test on mobile
5. ✅ Check page speed at pagespeed.web.dev
6. ✅ Verify security headers at securityheaders.com
