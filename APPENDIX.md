# Application Appendix: AsisGrab Business (Grab Reimbursement Platform)

This document serves as the technical appendix for the AsisGrab Business application. It outlines the core architecture, data extraction algorithms, security measures, and database schemas implemented to ensure a robust, production-ready environment.

## 1. System Architecture
The platform is built using a decoupled client-server architecture:
- **Frontend (Client):** Next.js 15 (App Router) with React, Tailwind CSS, and Framer Motion for UI/UX.
- **Backend (API):** FastAPI (Python) running on Uvicorn/Gunicorn.
- **Storage:** SQLite3 (`storage.db`) for lightweight, portable, and persistent data storage.

### 1.1 Request Flow
1. User authenticates via Microsoft Entra ID on the frontend.
2. User uploads PDF/Image files.
3. Frontend packages files via `FormData` (appending `user_email`) and POSTs to `/ocr`.
4. Backend verifies IP rate limits and user daily quotas.
5. Backend routes the file to the appropriate extraction engine.
6. Extracted structured data is returned to the frontend.
7. Frontend generates an Excel (`.xlsx`) report containing the data and embedded images.

## 2. Extraction Engine Pipeline (OCR & Parsing)
To ensure maximum accuracy and reliability, the backend implements a three-tier fallback mechanism for data extraction:

### Tier 1: LlamaIndex (LlamaParse) - Primary Engine
- **Target:** Native PDFs and Images.
- **Mechanism:** Utilizes AI-driven document parsing. Configured to return data as `markdown` to perfectly preserve table structures (`| Pick-Up | Drop-Off |`), effectively solving column-spanning issues.
- **Limitation:** Restricted by API tokens and daily quotas (Max 3/user/day).

### Tier 2: PDFPlumber - Secondary Fallback
- **Target:** Native PDFs (Transport Statements).
- **Mechanism:** Pure Python library that extracts text and tables directly from PDF metadata.
- **Optimization:** Programmatically mimics LlamaParse by converting extracted 2D arrays into Markdown tables. This allows the system to reuse the exact same Markdown-parsing algorithm, guaranteeing zero data loss for multiline addresses.

### Tier 3: EasyOCR - Tertiary Fallback
- **Target:** JPG/PNG Images (Single Receipts).
- **Mechanism:** Visual character recognition. Extracts raw text strings which are then matched against complex Regex patterns to extract fields like Date, Amount, and Booking ID.

## 3. Security & Quota Management

### 3.1 Spam Protection & Rate Limiting
- **Frontend:** `SessionProvider` is configured with `refetchOnWindowFocus={false}` to prevent aggressive polling against Microsoft's Auth servers.
- **Backend:** `SlowAPI` enforces a strict rate limit of `10 requests per minute` based on the client's IP address on the `/ocr` endpoint.

### 3.2 LlamaParse Token Conservation
To protect against API exhaustion:
- The backend SQLite database tracks `user_quotas`.
- Each user (identified via Microsoft Email) is granted **3 LlamaParse extractions per day**.
- Upon exceeding this limit, the backend silently switches to **Tier 2 (PDFPlumber)**, ensuring the user experiences no downtime while protecting enterprise API limits.
- Anonymous users are denied LlamaParse access by default.

## 4. Database Schema (SQLite)
The database (`storage.db`) is initialized automatically and maintained via lifespan background tasks.

### Table: `receipt_images`
Stores the original uploaded images/PDFs (converted to images) temporarily to embed them into the final Excel report.
- `id` (TEXT, Primary Key): UUID generated per image.
- `data` (BLOB): Binary image data.
- `created_at` (TIMESTAMP): Auto-generated timestamp.

### Table: `user_quotas`
Tracks daily LlamaParse usage per user.
- `email` (TEXT, Primary Key): User's Microsoft Email.
- `date` (TEXT, Primary Key): Current date (YYYY-MM-DD).
- `llama_count` (INTEGER): Number of times LlamaParse was used today.

## 5. Automated Maintenance
FastAPI utilizes a `@asynccontextmanager` lifespan event to trigger background cleanup jobs on startup.
- **Temp Files:** Deletes orphaned files in the `/temp` directory older than 2 hours.
- **Database:** Purges records in `receipt_images` and `user_quotas` older than 7 days to prevent database bloat.

## 6. Environment Variables
The application requires the following environment configurations to function properly:

**Frontend (`.env.local`):**
- `NEXTAUTH_URL`: Base URL of the application.
- `NEXTAUTH_SECRET`: Secure random string for session encryption.
- `AUTH_MICROSOFT_ENTRA_ID_ID`: Azure Client ID.
- `AUTH_MICROSOFT_ENTRA_ID_SECRET`: Azure Client Secret.
- `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID`: Azure Tenant ID.
- `NEXT_PUBLIC_API_URL`: Backend API URL (e.g., `http://localhost:8000`).

**Backend (`backend/.env`):**
- `LLAMA_CLOUD_API_KEY`: API token for LlamaParse (Optional, falls back to free engines if missing).
