import easyocr
import re
import os
from PIL import Image
import io
import fitz  # PyMuPDF
import tempfile
from llama_parse import LlamaParse

class GrabReceiptOCR:
    def __init__(self):
        # Initialize the reader (English and Indonesian are common for Grab in SE Asia)
        self.reader = easyocr.Reader(['en', 'id'])
        
        # Initialize LlamaParse
        # Note: Set LLAMA_CLOUD_API_KEY in your .env file
        api_key = os.getenv("LLAMA_CLOUD_API_KEY", "")
        if api_key:
            self.llama_parser = LlamaParse(
                api_key=api_key,
                result_type="markdown",
                verbose=False
            )
        else:
            self.llama_parser = None

    def _convert_pdf_to_image(self, pdf_bytes):
        """Converts the first page of a PDF to an image for OCR."""
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page = doc.load_page(0)  # Grab receipts are usually 1 page
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # Scale up for better OCR
        img_data = pix.tobytes("jpg")
        doc.close()
        return img_data

    def extract_data(self, file_bytes, filename="", use_llama=True):
        full_text = ""
        used_llama = False
        
        # 1. Try LlamaIndex (LlamaParse) First if permitted
        if self.llama_parser and use_llama:
            try:
                print("Attempting to parse with LlamaIndex (LlamaParse)...")
                ext = ".pdf" if filename.lower().endswith(".pdf") else ".jpg"
                with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
                    temp_file.write(file_bytes)
                    temp_file_path = temp_file.name
                
                # LlamaParse load_data extracts text
                documents = self.llama_parser.load_data(temp_file_path)
                full_text = " ".join([doc.text for doc in documents])
                os.remove(temp_file_path)
                
                if full_text.strip():
                    used_llama = True
                    print(f"LlamaIndex parsing successful. Extracted {len(full_text)} chars.")
                else:
                    print("LlamaIndex returned empty text. Falling back to EasyOCR.")
            except Exception as e:
                print(f"LlamaIndex parsing failed (Token exhausted or error): {e}")
                print("Falling back to EasyOCR...")

        # Determine image_bytes for downstream saving regardless of OCR engine used
        is_pdf = filename.lower().endswith('.pdf') or (file_bytes[:4] == b'%PDF')
        if is_pdf:
            image_bytes = self._convert_pdf_to_image(file_bytes)
        else:
            image_bytes = file_bytes

        # 2. Fallback to PDFPlumber (for PDFs) or EasyOCR if LlamaIndex failed or was not configured
        if not used_llama:
            pdfplumber_success = False
            if is_pdf:
                print("LlamaIndex unavailable. Running PDFPlumber for native PDF table extraction...")
                try:
                    import pdfplumber
                    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                        plumber_text = ""
                        for page in pdf.pages:
                            # Extract normal text for summary data
                            text = page.extract_text()
                            if text: plumber_text += text + "\n"
                            
                            # Extract tables and format as Markdown to seamlessly trigger our LlamaParse markdown logic!
                            tables = page.extract_tables()
                            for table in tables:
                                for row in table:
                                    if not row: continue
                                    clean_row = [str(c).replace('\n', ', ').strip() if c is not None else "" for c in row]
                                    plumber_text += "| " + " | ".join(clean_row) + " |\n"
                                    
                        if plumber_text.strip():
                            full_text = plumber_text
                            pdfplumber_success = True
                            print("PDFPlumber extraction successful (mimicking LlamaParse Markdown).")
                except Exception as e:
                    print(f"PDFPlumber failed: {e}")
                    
            if not pdfplumber_success:
                print("Running EasyOCR fallback...")
                image = Image.open(io.BytesIO(image_bytes))
                results = self.reader.readtext(image_bytes)
                # Combine all detected text into one string for regex processing
                full_text = " ".join([res[1] for res in results])
        
        print(f"OCR Full Text: {full_text[:500]}...") # Truncated for cleaner logs

        # Check if it's a multi-ride statement or a single receipt
        if "Transport Statement" in full_text or "My bookings" in full_text:
            return self._extract_statement_rides(full_text, image_bytes)
        
        # Single receipt logic
        data = {
            "value_tanggal_perjalanan": self._extract_date(full_text),
            "value_total_biaya": self._extract_amount(full_text),
            "value_total_fare": self._extract_amount(full_text),
            "value_nomor_order_grab": self._extract_booking_id(full_text),
            "value_service_type": self._extract_description(full_text),
            "value_pickup": self._extract_pickup(full_text),
            "value_dropoff": self._extract_dropoff(full_text),
            "value_waktu_berangkat": self._extract_time(full_text),
            "value_nama_karyawan_per_row": "", # Will be filled by header info or user
            "value_tujuan_perjalan": "-",
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

        # --- MARKDOWN TABLE PARSING (LlamaParse Optimal) ---
        if '|' in text and 'Booking ID' in text:
            lines = text.split('\n')
            headers = []
            for line in lines:
                if '|' not in line: continue
                cols = [c.strip() for c in line.split('|')]
                # Identify header row
                if 'Booking ID' in line and not headers:
                    headers = cols
                    continue
                # Skip separator row
                if headers and '---' in line:
                    continue
                # Parse data rows
                if headers and len(cols) >= 5:
                    try:
                        # Find indices based on headers
                        def get_col(keywords):
                            for i, h in enumerate(headers):
                                if any(k.lower() in h.lower() for k in keywords): return i
                            return -1
                        
                        idx_booking = get_col(['booking id'])
                        idx_date = get_col(['date', 'time'])
                        idx_emp = get_col(['employee'])
                        idx_service = get_col(['service'])
                        idx_pay = get_col(['payment'])
                        idx_pickup = get_col(['pick-up', 'pickup'])
                        idx_dropoff = get_col(['drop-off', 'dropoff'])
                        idx_fare = get_col(['total fare', 'amount'])
                        
                        if idx_booking != -1 and cols[idx_booking] and 'A-' in cols[idx_booking]:
                            date_time_str = cols[idx_date] if idx_date != -1 else ""
                            date_match = re.search(r'(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})', date_time_str)
                            time_match = re.search(r'(\d{1,2}[:\.]\d{2}(?:[:\.]\d{2})?\s*(?:AM|PM)?)', date_time_str)
                            
                            fare_str = cols[idx_fare] if idx_fare != -1 else "0"
                            fare_val = re.search(r'([\d\.,]+)', fare_str)
                            fare = fare_val.group(1).replace('.', '').replace(',', '') if fare_val else "0"

                            ride = {
                                "value_tanggal_perjalanan": date_match.group(1) if date_match else "N/A",
                                "value_nomor_order_grab": cols[idx_booking].upper(),
                                "value_nama_karyawan_per_row": cols[idx_emp] if idx_emp != -1 else "",
                                "value_service_type": cols[idx_service] if idx_service != -1 else "",
                                "payment_method": cols[idx_pay] if idx_pay != -1 else "",
                                "value_total_fare": fare,
                                "value_total_biaya": fare,
                                "value_waktu_berangkat": time_match.group(1) if time_match else "N/A",
                                "value_waktu_tiba": time_match.group(1) if time_match else "N/A",
                                "value_pickup": cols[idx_pickup] if idx_pickup != -1 else "-",
                                "value_dropoff": cols[idx_dropoff] if idx_dropoff != -1 else "-",
                                "value_tujuan_perjalan": "-",
                                "image_bytes": image_bytes
                            }
                            rides.append(ride)
                            print(f"DEBUG: Markdown Extracted Ride: {ride['value_nomor_order_grab']}")
                        elif rides:
                            # If no Booking ID, this is likely a continuation (multiline cell) of the previous row
                            last_ride = rides[-1]
                            
                            # Check if the time fell onto the next line
                            if idx_date != -1 and len(cols) > idx_date and cols[idx_date]:
                                time_match = re.search(r'(\d{1,2}[:\.]\d{2}(?:[:\.]\d{2})?\s*(?:AM|PM|am|pm)?)', cols[idx_date])
                                if time_match and last_ride["value_waktu_berangkat"] == "N/A":
                                    last_ride["value_waktu_berangkat"] = time_match.group(1).strip()
                                    last_ride["value_waktu_tiba"] = "-"

                            if idx_pickup != -1 and len(cols) > idx_pickup and cols[idx_pickup]:
                                if last_ride["value_pickup"] == "-": last_ride["value_pickup"] = ""
                                last_ride["value_pickup"] += " " + cols[idx_pickup]
                                last_ride["value_pickup"] = last_ride["value_pickup"].strip()
                                
                            if idx_dropoff != -1 and len(cols) > idx_dropoff and cols[idx_dropoff]:
                                if last_ride["value_dropoff"] == "-": last_ride["value_dropoff"] = ""
                                last_ride["value_dropoff"] += " " + cols[idx_dropoff]
                                last_ride["value_dropoff"] = last_ride["value_dropoff"].strip()
                                
                            if idx_emp != -1 and len(cols) > idx_emp and cols[idx_emp]:
                                last_ride["value_nama_karyawan_per_row"] += " " + cols[idx_emp]
                                last_ride["value_nama_karyawan_per_row"] = last_ride["value_nama_karyawan_per_row"].strip()
                    except Exception as e:
                        print(f"DEBUG: Markdown parse error on line: {e}")
                        pass
            
            if rides:
                summary["total_bookings"] = len(rides)
                return rides

        # Pattern for a row: 
        # Handles optional Date/Time before or after, making it robust for both LlamaParse and EasyOCR.
        row_pattern = r'(?:(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\s*)?(?:(\d{1,2}[:\.]\d{2}(?:[:\.]\d{2})?\s*(?:AM|PM)?)\s*)?([A-Z0-9]{1,3}-[A-Z0-9]{10,})\s+(.*?)\s+(Bike|Car|Food|Express|GrabCar|GrabBike|Bike Standard|Car Standard|GrabBike Standard|GrabCar Standard)\s+(.*?)\s+((?:Jl\.|JL|Jl|-).*?)\s+(?:IDR|RP|Rp)\s*([\d\.,]+)(?:\s*(\d{1,2}[:\.]\d{2}(?:[:\.]\d{2})?\s*(?:AM|PM)?))?'
        
        for idx, match in enumerate(re.finditer(row_pattern, text, re.IGNORECASE)):
            print(f"DEBUG: Found ride row match {idx+1}")
            
            # Extract basic fields
            date_before = match.group(1)
            time_before = match.group(2)
            booking_id = match.group(3).upper()
            employee = match.group(4).strip()
            service = match.group(5).strip()
            payment = match.group(6).strip()
            addr_text = match.group(7).strip()
            amount = match.group(8).replace('.', '').replace(',', '')
            time_after = match.group(9)
            
            # --- Smart Address Splitting ---
            # Clean leading weird characters
            addr_text = re.sub(r'^[-\s,]+', '', addr_text)
            
            # Split by common address start markers (Jl, Jalan, Gedung, Tower) if preceded by space or comma
            parts = re.split(r'(?i)(?:\s+|,\s+)(?=jl\.|jl\b|jalan\b|jln\b|gedung\b|tower\b)', addr_text)
            
            if len(parts) == 1:
                # Fallback if no clear marker found: split by middle comma
                half = len(addr_text) // 2
                comma_idx = addr_text.find(',', max(0, half - 15), min(len(addr_text), half + 15))
                if comma_idx != -1:
                    pickup = addr_text[:comma_idx].strip(' ,-')
                    dropoff = addr_text[comma_idx+1:].strip(' ,-')
                else:
                    pickup = addr_text
                    dropoff = "See Statement"
            else:
                pickup = parts[0].strip(' ,-')
                dropoff = " ".join(parts[1:]).strip(' ,-')
            
            # --- Resolve Date and Time ---
            final_date = date_before if date_before else "N/A"
            final_time = time_before if time_before else (time_after if time_after else "N/A")
            
            ride = {
                "value_tanggal_perjalanan": final_date.strip(),
                "value_nomor_order_grab": booking_id,
                "value_nama_karyawan_per_row": employee,
                "value_service_type": service,
                "payment_method": payment,
                "value_total_fare": amount,
                "value_total_biaya": amount,
                "value_waktu_berangkat": final_time.strip(),
                "value_waktu_tiba": "-",
                "value_pickup": pickup,
                "value_dropoff": dropoff,
                "value_tujuan_perjalan": "-",
            }
            print(f"DEBUG: Extracted Ride {idx+1}: {ride['value_nomor_order_grab']} | Pickup: {pickup} | Dropoff: {dropoff}")
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
