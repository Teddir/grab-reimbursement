from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables from backend/.env and root/.env.local
load_dotenv()  # backend/.env
load_dotenv("../.env.local")  # root/.env.local (Next.js default)

import uuid
import shutil
import ssl
from typing import List, Optional
import json
import asyncio
import time
import logging
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from ocr import GrabReceiptOCR
from engine import ExcelTemplateEngine

# --- MONITORING & LOGGING SETUP ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("backend.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# --- SECURITY: RATE LIMITING ---
limiter = Limiter(key_func=get_remote_address)

# Fix for macOS SSL certificate verification error
ssl._create_default_https_context = ssl._create_unverified_context

import sqlite3

# --- DATABASE OPTIMIZATION: SQLITE STORAGE ---
DB_PATH = "storage.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS receipt_images (
            id TEXT PRIMARY KEY,
            data BLOB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_quotas (
            email TEXT,
            date TEXT,
            llama_count INTEGER DEFAULT 0,
            PRIMARY KEY (email, date)
        )
    """)
    conn.commit()
    conn.close()

def check_and_increment_quota(email: str, limit: int = 3) -> bool:
    if not email or email == "anonymous":
        return False # No free LlamaParse for anonymous/unknown users
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Get current count
    cursor.execute("SELECT llama_count FROM user_quotas WHERE email = ? AND date = ?", (email, today))
    row = cursor.fetchone()
    
    if row is None:
        cursor.execute("INSERT INTO user_quotas (email, date, llama_count) VALUES (?, ?, 1)", (email, today))
        conn.commit()
        conn.close()
        return True
    
    count = row[0]
    if count >= limit:
        conn.close()
        return False
        
    cursor.execute("UPDATE user_quotas SET llama_count = llama_count + 1 WHERE email = ? AND date = ?", (email, today))
    conn.commit()
    conn.close()
    return True

def save_image_to_db(image_id: str, data: bytes):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO receipt_images (id, data) VALUES (?, ?)", (image_id, data))
    conn.commit()
    conn.close()

def get_image_from_db(image_id: str) -> Optional[bytes]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT data FROM receipt_images WHERE id = ?", (image_id,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

def clear_old_db_records(days: int = 7):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM receipt_images WHERE created_at < datetime('now', '-' || ? || ' days')", (days,))
    cursor.execute("DELETE FROM user_quotas WHERE date < date('now', '-' || ? || ' days')", (days,))
    conn.commit()
    conn.close()

# --- BACKGROUND CLEANUP TASK ---
async def cleanup_maintenance_loop():
    """
    Scans the 'temp' directory every 24 hours and deletes old files and DB records.
    """
    while True:
        try:
            # 1. Temp Files Cleanup
            temp_root = "temp"
            if os.path.exists(temp_root):
                logger.info(f"Cleanup: Scanning {temp_root} for old files...")
                now = time.time()
                retention_period = 7 * 24 * 60 * 60  # 7 days
                
                for item in os.listdir(temp_root):
                    item_path = os.path.join(temp_root, item)
                    if os.path.getmtime(item_path) < now - retention_period:
                        try:
                            if os.path.isdir(item_path):
                                shutil.rmtree(item_path)
                            else:
                                os.remove(item_path)
                            logger.info(f"Cleanup: Deleted old item {item}")
                        except Exception as e:
                            logger.error(f"Cleanup Error: Failed to delete {item}: {e}")
            
            # 2. Database Cleanup
            logger.info("Cleanup: Purging old database records...")
            clear_old_db_records(7)
                
        except Exception as e:
            logger.error(f"Cleanup Task Failure: {e}")
            
        await asyncio.sleep(24 * 60 * 60)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP
    logger.info("Server: Initializing SQLite database...")
    init_db()
    logger.info("Server: Starting background maintenance task...")
    maintenance_task = asyncio.create_task(cleanup_maintenance_loop())
    yield
    # SHUTDOWN
    maintenance_task.cancel()
    logger.info("Server: Application shutting down...")

app = FastAPI(lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- SECURITY: CORS RESTRICTION ---
# In production, replace "*" with your actual frontend domain
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# --- MONITORING: HEALTH CHECK ---
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": "sqlite3"
    }

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"API: {request.method} {request.url.path} - {response.status_code} ({process_time:.4f}s)")
    return response


ocr_engine = GrabReceiptOCR()

@app.post("/ocr")
@limiter.limit("10/minute")
async def extract_receipt_data(
    request: Request,
    receipts: List[UploadFile] = File(...),
    user_email: str = Form(None),
):
    """
    Extracts data from receipts and returns JSON for frontend review.
    """
    
    # Check LlamaParse daily quota
    can_use_llama = check_and_increment_quota(user_email, limit=3)
    if not can_use_llama:
        logger.warning(f"LlamaParse quota exceeded or no email provided for: {user_email}. Falling back to free OCR engines.")
    else:
        logger.info(f"LlamaParse quota OK for: {user_email}.")
        
    extracted_data_list = []
    for receipt in receipts:
        contents = await receipt.read()
        rides_data = ocr_engine.extract_data(contents, filename=receipt.filename, use_llama=can_use_llama)
        
        # Store the original image/PDF for this receipt session
        receipt_id = str(uuid.uuid4())
        
        for data in rides_data:
            # Preserve all data from OCR engine
            normalized_data = data.copy()
            
            # Ensure mandatory keys exist if OCR missed them
            if "value_tujuan_perjalan" not in normalized_data:
                normalized_data["value_tujuan_perjalan"] = ""
            if "value_total_fare" not in normalized_data and "value_total_biaya" in normalized_data:
                normalized_data["value_total_fare"] = normalized_data["value_total_biaya"]
            if "value_dropoff" not in normalized_data and "value_destination" in normalized_data:
                normalized_data["value_dropoff"] = normalized_data["value_destination"]

            # Get the image bytes for this ride (from OCR engine)
            img_bytes = data.get("image_bytes")
            if img_bytes:
                # Store it and replace with an ID
                storage_key = f"{receipt_id}_{uuid.uuid4()}"
                save_image_to_db(storage_key, img_bytes)
                normalized_data["image_storage_id"] = storage_key
                # Remove the actual bytes to keep JSON small
                if "image_bytes" in normalized_data:
                    del normalized_data["image_bytes"]
                
            extracted_data_list.append(normalized_data)
    
    return {"data": extracted_data_list}

@app.post("/generate")
@limiter.limit("5/minute")
async def generate_excel(request: Request):
    """
    Generates Excel from reviewed/edited JSON data.
    """
    form_data = await request.form()
    data = form_data.get("data")
    extra_data = form_data.get("extra_data")
    template = form_data.get("template")
    
    logger.info(f"API: Generating Excel report for session...")
    
    temp_dir = f"temp/{uuid.uuid4()}"
    os.makedirs(temp_dir, exist_ok=True)
    
    if not data:
        return {"error": "Missing required 'data' field"}
    
    try:
        data_list = json.loads(data)
        custom_fields = json.loads(extra_data) if extra_data else {}
        
        # Retrieve image bytes from storage using IDs
        for item in data_list:
            storage_id = item.get("image_storage_id")
            if storage_id:
                img_bytes = get_image_from_db(storage_id)
                if img_bytes:
                    item["image_bytes"] = img_bytes
                    item["value_image_receipt"] = img_bytes
    except Exception as e:
        logger.error(f"API: JSON parse error in /generate: {e}")
        return {"error": f"Invalid JSON data: {str(e)}"}

    # Add back custom fields and index
    for i, item in enumerate(data_list):
        item["value_no"] = i + 1
        item.update(custom_fields)

    template_path = os.path.join(temp_dir, "template.xlsx")
    if template and hasattr(template, 'file'):
        with open(template_path, "wb") as f:
            shutil.copyfileobj(template.file, f)
    else:
        default_template = "../form_template.xlsx"
        if os.path.exists(default_template):
            shutil.copy(default_template, template_path)
        else:
            return {"error": "Default template not found"}
    
    output_path = os.path.join(temp_dir, "output.xlsx")
    engine = ExcelTemplateEngine(template_path)
    engine.fill_template(data_list, output_path)
    
    return FileResponse(
        output_path, 
        filename="Reimbursement_Report.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
