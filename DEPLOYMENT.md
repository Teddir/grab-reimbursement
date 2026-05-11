# AsisGrab Business: Server Deployment Guide

This guide provides a step-by-step walkthrough for deploying the AsisGrab Business platform on a Linux server using **PM2** for process management and **Cloudflare Tunnel** for secure, SSL-encrypted public access without opening firewall ports.

---

## 🚀 Prerequisites

Ensure your Linux server (Ubuntu/Debian recommended) has the following installed:

- **Node.js**: v18.x or later
- **npm**: v9.x or later
- **Python**: v3.10+ and `venv`
- **PM2**: `npm install -g pm2`
- **Cloudflared**: [Install Guide](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)

---

## 📂 1. Project Setup

Clone the repository to your server:

```bash
git clone <your-repo-url> /var/www/asisgrab
cd /var/www/asisgrab
```

### Configure Environment Variables

Create `.env.local` for the Frontend:
```bash
cp .env.example .env.local
nano .env.local
# Fill in: NEXTAUTH_SECRET, AUTH_MICROSOFT_ENTRA_ID_ID, etc.
# Set NEXTAUTH_URL to your public domain (e.g., https://reimburse.yourcompany.com)
```

Create `.env` for the Backend:
```bash
cd backend
nano .env
# Fill in: SECRET_KEY, etc.
cd ..
```

---

## 🐍 2. Backend Deployment (Python/FastAPI)

We will use a Virtual Environment to keep dependencies isolated.

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Test the server manually first
# python main.py
deactivate
cd ..
```

### Start Backend with PM2
```bash
pm2 start "backend/venv/bin/python backend/main.py" --name "asisgrab-backend"
```

---

## 🌐 3. Frontend Deployment (Next.js)

```bash
# Install dependencies
npm install

# Build the production bundle
npm run build
```

### Start Frontend with PM2
```bash
pm2 start npm --name "asisgrab-frontend" -- start
```

---

## 🛡️ 4. Secure Access with Cloudflare Tunnel

Cloudflare Tunnel (Argo Tunnel) allows you to expose your local ports (3000 and 8000) to the internet securely.

1. **Login to Cloudflare**:
   ```bash
   cloudflared tunnel login
   ```

2. **Create a Tunnel**:
   ```bash
   cloudflared tunnel create asisgrab-tunnel
   ```

3. **Configure the Tunnel**:
   Create a configuration file `~/.cloudflared/config.yml`:
   ```yaml
   tunnel: <TUNNEL_ID>
   credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

   ingress:
     - hostname: reimburse.yourcompany.com
       service: http://localhost:3000
     - hostname: api-reimburse.yourcompany.com
       service: http://localhost:8000
     - service: http_status:404
   ```

4. **Route DNS**:
   ```bash
   cloudflared tunnel route dns asisgrab-tunnel reimburse.yourcompany.com
   cloudflared tunnel route dns asisgrab-tunnel api-reimburse.yourcompany.com
   ```

5. **Run as a Service**:
   ```bash
   cloudflared service install
   systemctl start cloudflared
   ```

---

## 📊 5. Maintenance & Monitoring

Useful PM2 commands:

- `pm2 list`: View running processes.
- `pm2 logs`: View real-time logs.
- `pm2 restart all`: Restart both apps after an update.
- `pm2 save`: Save process list to restore on reboot.
- `pm2 startup`: Generate startup script for Linux.

### Updating the App
```bash
git pull
npm install
npm run build
pm2 restart asisgrab-frontend
pm2 restart asisgrab-backend
```

---

**© 2026 PT Asia Sistem Indonesia** | Confidential & Proprietary
