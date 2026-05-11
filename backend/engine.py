import re
import copy
from openpyxl import load_workbook
from openpyxl.drawing.image import Image as OpenpyxlImage
from openpyxl.utils import get_column_letter
from io import BytesIO

class ExcelTemplateEngine:
    def __init__(self, template_path):
        self.template_path = template_path
        self.wb = load_workbook(template_path)
        self.placeholder_pattern = re.compile(r'value_[a-zA-Z0-9_]+')

    def find_placeholders(self, ws):
        placeholders = []
        for row in ws.iter_rows():
            for cell in row:
                if cell.value and isinstance(cell.value, str):
                    matches = self.placeholder_pattern.findall(cell.value)
                    for match in matches:
                        placeholders.append({
                            'name': match,
                            'cell': cell,
                            'coord': cell.coordinate,
                            'row': cell.row,
                            'col': cell.column
                        })
        return placeholders

    def copy_row_style(self, source_ws, source_row_idx, target_ws, target_row_idx):
        """
        Deep copies styles and dimensions from source row to target row.
        """
        # Copy row height
        target_ws.row_dimensions[target_row_idx].height = source_ws.row_dimensions[source_row_idx].height
        
        for col_idx in range(1, source_ws.max_column + 1):
            source_cell = source_ws.cell(row=source_row_idx, column=col_idx)
            target_cell = target_ws.cell(row=target_row_idx, column=col_idx)
            
            if source_cell.has_style:
                target_cell.font = copy.copy(source_cell.font)
                target_cell.border = copy.copy(source_cell.border)
                target_cell.fill = copy.copy(source_cell.fill)
                target_cell.number_format = copy.copy(source_cell.number_format)
                target_cell.protection = copy.copy(source_cell.protection)
                target_cell.alignment = copy.copy(source_cell.alignment)
            
            target_cell.value = source_cell.value

    def duplicate_template_row(self, ws, template_row_idx, count):
        """
        Duplicates a template row multiple times, preserving styles and merged cells.
        Useful for dynamic lists of receipts.
        """
        if count <= 1:
            return

        # Insert rows after the template row
        ws.insert_rows(template_row_idx + 1, amount=count - 1)
        
        # Track merged cells that start in the template row
        merged_ranges_to_clone = []
        for merged_range in ws.merged_cells.ranges:
            if merged_range.min_row == template_row_idx and merged_range.max_row == template_row_idx:
                merged_ranges_to_clone.append(merged_range)

        for i in range(1, count):
            target_row_idx = template_row_idx + i
            self.copy_row_style(ws, template_row_idx, ws, target_row_idx)
            
            # Re-apply merged cells for the new row
            for m_range in merged_ranges_to_clone:
                new_range = f"{get_column_letter(m_range.min_col)}{target_row_idx}:{get_column_letter(m_range.max_col)}{target_row_idx}"
                ws.merge_cells(new_range)

    def fill_template(self, data_list, output_path):
        """
        data_list: List of dicts, each dict contains key-value pairs for placeholders.
        """
        ws = self.wb.active
        print(f"Filling template on sheet: {ws.title}")
        
        # Collect images for the separate sheet
        receipt_images = []
        
        # 1. Detect which row contains the placeholders for the repeatable data
        all_placeholders = self.find_placeholders(ws)
        if not all_placeholders:
            print("Warning: No placeholders found in the active worksheet.")
            self.wb.save(output_path)
            return

        # Find rows that contain 'value_no' or similar repeatable markers
        repeat_row_idx = None
        repeatable_markers = ['value_no', 'value_nomor_order_grab', 'value_tanggal_perjalanan']
        for p in all_placeholders:
            if p['name'] in repeatable_markers: 
                repeat_row_idx = p['row']
                break
        
        if not repeat_row_idx:
            repeat_row_idx = all_placeholders[0]['row']
            print(f"Assuming repeatable row is {repeat_row_idx}")

        # 2. Duplicate the row if we have multiple items
        if repeat_row_idx and len(data_list) > 1:
            num_new_rows = len(data_list) - 1
            template_merges = []
            for m_range in list(ws.merged_cells.ranges):
                if m_range.min_row <= repeat_row_idx <= m_range.max_row:
                    template_merges.append(m_range)
            
            ws.insert_rows(repeat_row_idx + 1, amount=num_new_rows)
            max_col = ws.max_column
            source_cells = [ws.cell(row=repeat_row_idx, column=c) for c in range(1, max_col + 1)]

            for i in range(1, len(data_list)):
                target_row_idx = repeat_row_idx + i
                ws.row_dimensions[target_row_idx].height = ws.row_dimensions[repeat_row_idx].height
                
                for m_range in list(ws.merged_cells.ranges):
                    if m_range.min_row == target_row_idx and m_range.max_row == target_row_idx:
                        try:
                            ws.unmerge_cells(m_range.coord)
                        except:
                            pass

                for col_idx, source_cell in enumerate(source_cells, 1):
                    target_cell = ws.cell(row=target_row_idx, column=col_idx)
                    target_cell.value = source_cell.value
                    if source_cell.has_style:
                        target_cell.font = copy.copy(source_cell.font)
                        target_cell.border = copy.copy(source_cell.border)
                        target_cell.fill = copy.copy(source_cell.fill)
                        target_cell.number_format = copy.copy(source_cell.number_format)
                        target_cell.alignment = copy.copy(source_cell.alignment)

                for m_range in template_merges:
                    ws.merge_cells(
                        start_row=target_row_idx,
                        start_column=m_range.min_col,
                        end_row=target_row_idx,
                        end_column=m_range.max_col
                    )

        # 3. Substitute values in the table rows
        for i, data in enumerate(data_list):
            current_row_idx = repeat_row_idx + i if repeat_row_idx else i + 1
            row_cells = list(ws.iter_rows(min_row=current_row_idx, max_row=current_row_idx, min_col=1, max_col=ws.max_column))[0]
            for cell in row_cells:
                if cell.value and isinstance(cell.value, str):
                    new_value = str(cell.value)
                    original_val = new_value
                    
                    sorted_keys = sorted(data.keys(), key=len, reverse=True)
                    for key in sorted_keys:
                        if key in new_value:
                            val = data[key]
                            if key == 'value_image_receipt' and val:
                                # Collect for new sheet instead of inserting here
                                if val not in receipt_images:
                                    receipt_images.append(val)
                                new_value = new_value.replace(key, "Lihat Lampiran") 
                            else:
                                new_value = new_value.replace(key, str(val))
                    
                    if new_value != original_val:
                        cell.value = new_value

        # 4. Global Pass: Header/Footer
        global_data = {}
        if data_list:
            for d in reversed(data_list):
                global_data.update(d)
        
        try:
            def clean_float(val):
                if not val: return 0.0
                s = str(val).replace('IDR', '').replace('RP', '').replace(' ', '').replace(',', '')
                if '.' in s: s = s.replace('.', '')
                return float(s) if s else 0.0

            total_cost = sum(clean_float(d.get("value_total_biaya", 0)) for d in data_list)
            global_data["value_total_biaya"] = f"Rp {total_cost:,.0f}"
            global_data["value_total_fare"] = f"Rp {total_cost:,.0f}"
        except Exception as e:
            print(f"Total calculation error: {e}")
        
        for row in ws.iter_rows():
            for cell in row:
                if cell.value and isinstance(cell.value, str):
                    new_value = str(cell.value)
                    replaced = False
                    matches = self.placeholder_pattern.findall(new_value)
                    if matches:
                        sorted_matches = sorted(matches, key=len, reverse=True)
                        for match in sorted_matches:
                            if match in global_data:
                                val = global_data[match]
                                if match == 'value_image_receipt' and val:
                                    if val not in receipt_images:
                                        receipt_images.append(val)
                                    new_value = new_value.replace(match, "Lihat Lampiran")
                                else:
                                    new_value = new_value.replace(match, str(val))
                                replaced = True
                        if replaced:
                            cell.value = new_value
        
        # 5. Final Footer Correction
        last_data_row = repeat_row_idx + len(data_list)
        for row_idx in range(last_data_row, ws.max_row + 1):
            for cell in ws[row_idx]:
                if not cell.value: continue
                val = str(cell.value)
                if "Total Biaya" in val or "Rp" in val:
                    try:
                        ws.merge_cells(start_row=row_idx, start_column=2, end_row=row_idx, end_column=3)
                        ws.merge_cells(start_row=row_idx, start_column=4, end_row=row_idx, end_column=8)
                    except: pass
                if "Pemohon" in val or any(x in val for x in [global_data.get("value_nama_karyawan", ""), global_data.get("value_pemohon", "")] if x):
                    try:
                        ws.merge_cells(start_row=row_idx, start_column=2, end_row=row_idx, end_column=6)
                    except: pass
                if "HR/GA" in val or global_data.get("value_hr", "") in val:
                    try:
                        ws.merge_cells(start_row=row_idx, start_column=10, end_row=row_idx, end_column=12)
                    except: pass

        # 6. Create Attachment Sheet
        if receipt_images:
            ws_attach = self.wb.create_sheet("Lampiran Bukti")
            ws_attach.column_dimensions['B'].width = 80 # Make it wide
            
            current_row = 2
            for i, img_bytes in enumerate(receipt_images):
                ws_attach.cell(row=current_row, column=2).value = f"Bukti Reimbursement #{i+1}"
                ws_attach.cell(row=current_row, column=2).font = copy.copy(ws.cell(row=1, column=1).font) # Try to get some bold font
                
                img_coord = f"B{current_row + 1}"
                self.insert_image(ws_attach, img_bytes, img_coord, scale_height=600)
                current_row += 35 # Space out images (each roughly 600px height)

        self.wb.save(output_path)
        print(f"Successfully saved filled report to: {output_path}")

    def insert_image(self, ws, img_data, coordinate, scale_height=120):
        """
        Inserts an image into the specified cell with custom height.
        """
        img = OpenpyxlImage(BytesIO(img_data))
        scale = scale_height / img.height
        img.width = int(img.width * scale)
        img.height = scale_height
        img.anchor = coordinate
        ws.add_image(img)

    def save(self, path):
        self.wb.save(path)
