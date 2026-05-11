import easyocr
import re
from PIL import Image
import io
import fitz  # PyMuPDF

class GrabReceiptOCR:
    def __init__(self):
        # Initialize the reader (English and Indonesian are common for Grab in SE Asia)
        self.reader = easyocr.Reader(['en', 'id'])

    def _convert_pdf_to_image(self, pdf_bytes):
        """Converts the first page of a PDF to an image for OCR."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page = doc.load_page(0)  # Grab receipts are usually 1 page
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # Scale up for better OCR
        img_data = pix.tobytes("jpg")
        doc.close()
        return img_data

    def extract_data(self, file_bytes, filename=""):
        # Check if it's a PDF
        if filename.lower().endswith('.pdf') or (file_bytes[:4] == b'%PDF'):
            image_bytes = self._convert_pdf_to_image(file_bytes)
        else:
            image_bytes = file_bytes

        image = Image.open(io.BytesIO(image_bytes))
        results = self.reader.readtext(image_bytes)
        
        # Combine all detected text into one string for regex processing
        full_text = " ".join([res[1] for res in results])
        print(f"OCR Full Text: {full_text}")

        # Check if it's a multi-ride statement or a single receipt
        if "Transport Statement" in full_text or "My bookings" in full_text:
            return self._extract_statement_rides(full_text, image_bytes)
        
        # Single receipt logic
        data = {
            "date": self._extract_date(full_text),
            "amount": self._extract_amount(full_text),
            "booking_id": self._extract_booking_id(full_text),
            "description": self._extract_description(full_text),
            "pickup": self._extract_pickup(full_text),
            "dropoff": self._extract_dropoff(full_text),
            "time": self._extract_time(full_text),
            "raw_text": full_text,
            "image_bytes": image_bytes
        }
        
        return [data] # Always return a list for consistency

    def _extract_statement_rides(self, text, image_bytes):
        """Extracts multiple rides from a Grab statement."""
        rides = []
        
        # Summary extraction
        summary = {
            "booking_type": "My bookings" if "My bookings" in text else "Corporate",
            "period": "N/A",
            "total_bookings": 0,
            "statement_total_amount": 0,
            "currency": "IDR"
        }
        
        # Extract Period: 01 May 2026 08 May 2026
        period_match = re.search(r'(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})', text)
        if period_match:
            summary["period"] = f"{period_match.group(1)} - {period_match.group(2)}"
            
        # Extract Total Amount: IDR 97.000
        total_match = re.search(r'(?:Total Amount|Total Fare).*?(?:IDR|RP)\s*([\d\.]+)', text, re.IGNORECASE)
        if total_match:
            summary["statement_total_amount"] = total_match.group(1).replace('.', '')

        # Pattern for a row: 
        # Date | Booking ID | Employee | Service | Payment | Addresses | Amount | Time
        # Improved pattern for Grab transport statements
        row_pattern = r'(?:(\d{1,2}\s+[A-Za-z]{3}\s+)?(\d{4}))\s+([A-Z0-9-]{10,})\s+(.*?)\s+(Bike|Car|Food|Express|GrabCar|GrabBike|Bike Standard|Car Standard|GrabBike Standard|GrabCar Standard)\s+(.*?)\s+((?:JL|Jl|-).*?)\s+(?:IDR|RP)\s*([\d\.]+)\s+(\d{1,2}[:\.]\d{2}(?:[:\.]\d{2})?\s*(?:AM|PM)?)'
        
        for idx, match in enumerate(re.finditer(row_pattern, text)):
            print(f"DEBUG: Found ride row match {idx+1}")
            # The addresses part (match.group(7)) contains both pickup and dropoff
            addr_text = match.group(7).strip()
            # Split by address markers (JL, Jl, or -)
            parts = re.split(r'(?=-|JL|Jl)', addr_text)
            # Remove empty strings and clean up
            parts = [p.strip().lstrip('-').strip() for p in parts if p.strip()]
            
            pickup = parts[0] if len(parts) > 0 else "See Statement"
            dropoff = parts[1] if len(parts) > 1 else "See Statement"
            
            # Construct date string
            date_str = f"{match.group(1) or ''}{match.group(2)}".strip()
            
            ride = {
                "value_tanggal_perjalanan": date_str,
                "value_nomor_order_grab": match.group(3),
                "employee_name": match.group(4).strip(),
                "service_type": match.group(5),
                "payment_method": match.group(6).strip(),
                "value_total_fare": match.group(8).replace('.', ''),
                "value_total_biaya": match.group(8).replace('.', ''),
                "value_waktu_berangkat": match.group(9),
                "value_waktu_tiba": match.group(9),
                "value_pickup": pickup,
                "value_dropoff": dropoff,
                "value_tujuan_perjalan": "-",
            }
            print(f"DEBUG: Extracted Ride {idx+1}: {ride['value_nomor_order_grab']} on {ride['value_tanggal_perjalanan']}")
            ride["image_bytes"] = image_bytes
            rides.append(ride)
            
        summary["total_bookings"] = len(rides)
        
        if not rides:
            # Fallback
            return [{
                "value_tanggal_perjalanan": self._extract_date(text),
                "value_total_biaya": self._extract_amount(text),
                "value_nomor_order_grab": self._extract_booking_id(text),
                "image_bytes": image_bytes
            }]
            
        return rides

    def _extract_date(self, text):
        # Match common date formats: 08 May 26, 08/05/2026, May 08, 2026
        date_pattern = r'(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})|(\d{1,2}/\d{1,2}/\d{2,4})'
        match = re.search(date_pattern, text)
        return match.group(0) if match else "N/A"

    def _extract_time(self, text):
        # Match 08:13:35 AM or similar
        time_pattern = r'\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?'
        match = re.search(time_pattern, text, re.IGNORECASE)
        return match.group(0) if match else "N/A"

    def _extract_amount(self, text):
        # Look for "Total" followed by numbers, or "RP" / "$"
        amount_pattern = r'(?:Total|Total Fare|Amount|RP|IDR)\s*[:\.]?\s*([\d,\.]+)'
        match = re.search(amount_pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).replace(',', '')
        return "0"

    def _extract_booking_id(self, text):
        booking_pattern = r'[A-Z0-9]+-\d+-\d+-\d+'
        match = re.search(booking_pattern, text)
        return match.group(0) if match else "N/A"

    def _extract_description(self, text):
        services = ['GrabCar', 'GrabBike', 'GrabFood', 'GrabExpress']
        for service in services:
            if service.lower() in text.lower():
                return service
        return "Grab Service"

    def _extract_pickup(self, text):
        # Very heuristic: Look for text between 'Pick-Up Address' and 'Drop-Off Address'
        # Or look for common patterns in Grab statements
        pattern = r'Pick-Up Address\s*(.*?)\s*Drop-Off Address'
        match = re.search(pattern, text, re.IGNORECASE)
        return match.group(1).strip()[:50] if match else "N/A"

    def _extract_dropoff(self, text):
        pattern = r'Drop-Off Address\s*(.*?)\s*(?:Total Fare|Generated Time|$)'
        match = re.search(pattern, text, re.IGNORECASE)
        return match.group(1).strip()[:50] if match else "N/A"
