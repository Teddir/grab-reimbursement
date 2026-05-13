# AsisGrab Business 🚀

AsisGrab Business is a premium enterprise-grade platform designed to modernize and automate the Grab reimbursement workflow for **PT Asia Sistem Indonesia**. Using AI-powered OCR, the platform extracts data from Grab receipts and generates professional Excel reports based on custom company templates.

---

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS v4, Framer Motion, NextAuth.js.
- **Backend**: FastAPI (Python), EasyOCR, OpenPyXL, SQLite (Storage).
- **Authentication**: Microsoft Entra ID (Azure AD).

---

## 🏗 Project Setup (From Scratch)

Follow these steps to get the project running on your local machine.

### 1. Prerequisites
- **Node.js** (v18.x or later)
- **Python** (v3.10 or later)
- **Git**

### 2. Backend Setup (FastAPI)
Open a terminal and navigate to the backend directory:

```bash
cd backend

# Create a virtual environment
python3 -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the development server
python main.py
```
*The backend will be available at `http://localhost:8000`.*

### 3. Frontend Setup (Next.js)
Open a new terminal in the root directory:

```bash
# Install dependencies
npm install

# Setup Environment Variables
cp .env.example .env.local
# Open .env.local and fill in the required credentials (see below)

# Run the development server
npm run dev
```
*The frontend will be available at `http://localhost:3000`.*

---

## 🔑 Environment Variables

### Frontend (`.env.local`)
| Variable | Description |
| :--- | :--- |
| `NEXTAUTH_URL` | The base URL of your app (e.g., `http://localhost:3000`). |
| `NEXTAUTH_SECRET` | A random string for session encryption. |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | Client ID from Azure Portal. |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | Client Secret from Azure Portal. |
| `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID` | Tenant ID from Azure Portal. |
| `NEXT_PUBLIC_API_URL` | The backend API URL (e.g., `http://localhost:8000`). |

---

## 📂 Project Structure

```text
├── app/               # Next.js App Router (Frontend)
│   ├── login/         # Custom Login Page
│   ├── terms/         # Terms of Service
│   ├── privacy/       # Privacy Policy
│   └── components/    # UI Components (OCRLoading, etc.)
├── backend/           # FastAPI Application
│   ├── main.py        # API Endpoints & Logic
│   ├── ocr.py         # AI OCR Engine
│   ├── engine.py      # Excel Generation Logic
│   └── storage.db     # SQLite Database (Auto-generated)
├── public/            # Static Assets (Logo, etc.)
├── DEPLOYMENT.md      # Production Deployment Guide
└── README.md          # This file
```

---

## 🚀 Production Deployment

### Backend (Gunicorn + Uvicorn)
For high-performance production scaling, use Gunicorn with Uvicorn workers:
```bash
cd backend
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

### Full Server Setup
For a complete guide on deploying to a Linux server using **PM2** and **Cloudflare Tunnel**, please refer to the detailed **[DEPLOYMENT.md](./DEPLOYMENT.md)** guide.

---

**© 2026 PT Asia Sistem Indonesia** | Confidential & Proprietary
