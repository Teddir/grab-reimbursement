# Grab Reimbursement Template Engine

Automated Grab receipt extraction and Excel reimbursement form generator using custom company templates.

## Features
- **Template Fidelity**: Preserves all Excel formatting (styles, formulas, logos, merged cells).
- **OCR Extraction**: Automatically extracts date, amount, booking ID, and service type from Grab receipts.
- **Dynamic Row Duplication**: Automatically clones template rows for multiple receipts while maintaining layout and formulas.
- **Image Insertion**: Embeds receipt images directly into the Excel file.

## Placeholder Requirements
The engine detects placeholders using the regex `r'value_[a-zA-Z0-9_]+'`. Use these keys in your Excel template:

| Placeholder | Description |- [Microsoft Auth Setup Guide](./MICROSOFT_AUTH_SETUP.md) — Step-by-step instructions for Azure AD integration.
|---|---|
| `value_date` | Date of the Grab ride |
| `value_amount` | Total fare amount |
| `value_id` | Grab Booking ID (e.g., ADR-...) |
| `value_desc` | Description/Service Type (e.g., GrabCar) |
| `value_image_receipt` | Cell where the receipt image will be inserted |

## Getting Started

### 1. Start Backend (Python)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### 2. Start Frontend (Next.js)
```bash
npm install
npm run dev
```

## Technology Stack
- **Frontend**: Next.js 14+, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: FastAPI, OpenPyXL, EasyOCR.
