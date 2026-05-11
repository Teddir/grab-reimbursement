from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
import shutil
import ssl
from typing import List, Optional
import json
import asyncio
import time
from datetime import datetime, timedelta
from ocr import GrabReceiptOCR
from engine import ExcelTemplateEngine

# Fix for macOS SSL certificate verification error
ssl._create_default_https_context = ssl._create_unverified_context

app = FastAPI()

# --- BACKGROUND CLEANUP TASK ---
async def cleanup_temp_files():
    """
    Scans the 'temp' directory every 24 hours and deletes folders older than 7 days.
    """
    while True:
        try:
            temp_root = "temp"
            if os.path.exists(temp_root):
                print(f"DEBUG: Starting scheduled cleanup of {temp_root}...")
                now = time.time()
                retention_period = 7 * 24 * 60 * 60  # 7 days in seconds
                
                for item in os.listdir(temp_root):
                    item_path = os.path.join(temp_root, item)
                    # Check if the folder/file is older than 7 days
                    if os.path.getmtime(item_path) < now - retention_period:
                        try:
                            if os.path.isdir(item_path):
                                shutil.rmtree(item_path)
                            else:
                                os.remove(item_path)
                            print(f"DEBUG: Cleaned up old temp item: {item}")
                        except Exception as e:
                            print(f"DEBUG: Failed to delete {item}: {e}")
            
            # Clear in-memory storage too if it gets too large (simple flush)
            # This is a basic safety measure
            if len(receipt_storage) > 1000:
                print("DEBUG: Clearing old in-memory receipt storage...")
                receipt_storage.clear()
                
        except Exception as e:
            print(f"DEBUG: Cleanup task error: {e}")
            
        # Wait 24 hours before the next run
        await asyncio.sleep(24 * 60 * 60)

@app.on_event("startup")
async def startup_event():
    # Start the cleanup task in the background
    asyncio.create_task(cleanup_temp_files())

# --- MIDDLEWARE & ENGINES ---

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"DEBUG: Incoming {request.method} request to {request.url}")
    response = await call_next(request)
    print(f"DEBUG: Response status: {response.status_code}")
    return response

ocr_engine = GrabReceiptOCR()

import base64

# In-memory storage for receipt images to avoid large payloads in JSON
receipt_storage = {}

@app.post("/ocr")
async def extract_receipt_data(
    receipts: List[UploadFile] = File(...),
):
    """
    Extracts data from receipts and returns JSON for frontend review.
    """
    extracted_data_list = []
    for receipt in receipts:
        contents = await receipt.read()
        rides_data = ocr_engine.extract_data(contents, filename=receipt.filename)
        
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
                receipt_storage[storage_key] = img_bytes
                normalized_data["image_storage_id"] = storage_key
                # Remove the actual bytes to keep JSON small
                if "image_bytes" in normalized_data:
                    del normalized_data["image_bytes"]
                
            extracted_data_list.append(normalized_data)
    
    return {"data": extracted_data_list}

from fastapi import Request

@app.post("/generate")
async def generate_excel(request: Request):
    """
    Generates Excel from reviewed/edited JSON data.
    """
    form_data = await request.form()
    data = form_data.get("data")
    extra_data = form_data.get("extra_data")
    template = form_data.get("template")
    
    print(f"DEBUG: Form keys received: {list(form_data.keys())}")
    
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
            if storage_id and storage_id in receipt_storage:
                img_bytes = receipt_storage[storage_id]
                item["image_bytes"] = img_bytes
                item["value_image_receipt"] = img_bytes
    except Exception as e:
        print(f"DEBUG: JSON parse error: {e}")
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
