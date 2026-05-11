from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
import shutil
import ssl
from typing import List, Optional
import json
from ocr import GrabReceiptOCR
from engine import ExcelTemplateEngine

# Fix for macOS SSL certificate verification error
ssl._create_default_https_context = ssl._create_unverified_context

app = FastAPI()

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ocr_engine = GrabReceiptOCR()

@app.post("/process")
async def process_reimbursement(
    receipts: List[UploadFile] = File(...),
    template: Optional[UploadFile] = File(None),
    extra_data: str = Form("{}")
):
    temp_dir = f"temp/{uuid.uuid4()}"
    os.makedirs(temp_dir, exist_ok=True)
    
    # Custom fields from frontend
    try:
        custom_fields = json.loads(extra_data)
    except:
        custom_fields = {}
    
    # Save or use default template
    template_path = os.path.join(temp_dir, "template.xlsx")
    if template:
        with open(template_path, "wb") as f:
            shutil.copyfileobj(template.file, f)
    else:
        # Use default template from root (parent directory)
        default_template = "../form_template.xlsx"
        if os.path.exists(default_template):
            shutil.copy(default_template, template_path)
        else:
            return {"error": f"No template provided and default template not found at {os.path.abspath(default_template)}"}
    
    # Process each receipt
    extracted_data_list = []
    global_counter = 1
    for receipt in receipts:
        contents = await receipt.read()
        # OCR engine now returns a LIST of one or more rides
        rides_data = ocr_engine.extract_data(contents, filename=receipt.filename)
        
        for idx, data in enumerate(rides_data):
            print(f"--- Mapping Ride {idx + 1} ---")
            # Map OCR data to placeholders (Matching refined OCR output)
            placeholder_data = {
                "value_no": global_counter,
                "value_image_receipt": data.get("image_bytes")
            }
            # Merge all fields from OCR directly
            placeholder_data.update(data)
            
            # Merge custom fields from frontend
            placeholder_data.update(custom_fields)
            
            # Log the mapped data for debugging (Clean up bytes for JSON)
            debug_info = {k: (v if not isinstance(v, bytes) else "<bytes>") for k, v in placeholder_data.items()}
            print(f"Mapped Ride {idx + 1}: {json.dumps(debug_info, indent=2)}")
            
            extracted_data_list.append(placeholder_data)
            global_counter += 1
    
    # Initialize engine
    output_path = os.path.join(temp_dir, "output.xlsx")
    engine = ExcelTemplateEngine(template_path)
    
    # Fill template
    engine.fill_template(extracted_data_list, output_path)
    
    return FileResponse(
        output_path, 
        filename="Reimbursement_Report.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
