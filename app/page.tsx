"use client";

import { useState, useRef } from "react";
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  Loader2, 
  Download,
  AlertCircle,
  X,
  Table as TableIcon,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as XLSX from "xlsx";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const [template, setTemplate] = useState<File | null>(null);
  const [receipts, setReceipts] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[][]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const [extraFields, setExtraFields] = useState({
    value_no_dok: "REIMB/2026/05/001",
    value_nama_karyawan: "Teddi Rahman",
    value_departemen: "IT",
    value_jabatan: "Senior Developer",
    value_tgl_pengajuan: new Date().toISOString().split('T')[0],
    value_pemohon: "Teddi Rahman",
    value_hr: "HRD/GA Dept",
    value_logo: " ",
  });

  const templateInputRef = useRef<HTMLInputElement>(null);
  const receiptsInputRef = useRef<HTMLInputElement>(null);

  const handleExtraFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setExtraFields(prev => ({ ...prev, [name]: value }));
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTemplate(e.target.files[0]);
      setError(null);
    }
  };

  const handleReceiptsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setReceipts(prev => [...prev, ...Array.from(e.target.files!)]);
      setError(null);
    }
  };

  const removeReceipt = (index: number) => {
    setReceipts(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (receipts.length === 0) {
      setError("Please upload at least one receipt.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResultUrl(null);
    setPreviewData([]);

    const formData = new FormData();
    if (template) {
      formData.append("template", template);
    }
    receipts.forEach((r) => formData.append("receipts", r));
    formData.append("extra_data", JSON.stringify(extraFields));

    try {
      const response = await fetch("http://localhost:8000/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process reimbursement. Please try again.");
      }

      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
        setPreviewData(jsonData);
      };
      reader.readAsArrayBuffer(blob);

      const url = window.URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="py-12 md:py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            Grab <span className="gradient-text">Reimbursement</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-xl mx-auto px-6">
            Automate your reimbursement process with OCR and custom Excel templates.
          </p>
        </motion.div>
      </header>

      {/* Workflow Steps */}
      <main className="max-w-5xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Input Steps */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            
            {/* Step 1: Additional Info */}
            <motion.section 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass p-8 rounded-[2.5rem] shadow-sm"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-lg">1</div>
                <div>
                  <h2 className="text-xl font-bold">Additional Info</h2>
                  <p className="text-sm text-zinc-500">Fill in header details for the template</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">No. Dokumen</label>
                  <input 
                    type="text" 
                    name="value_no_dok"
                    value={extraFields.value_no_dok}
                    onChange={handleExtraFieldChange}
                    placeholder="e.g. REIMB/2026/05/001"
                    className="bg-zinc-100 dark:bg-zinc-900/50 border border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-zinc-900 rounded-2xl px-5 py-4 text-sm outline-none transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Nama Karyawan</label>
                    <input 
                      type="text" 
                      name="value_nama_karyawan"
                      value={extraFields.value_nama_karyawan}
                      onChange={handleExtraFieldChange}
                      placeholder="Teddi Rahman"
                      className="bg-zinc-100 dark:bg-zinc-900/50 border border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-zinc-900 rounded-2xl px-5 py-4 text-sm outline-none transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Departemen</label>
                    <input 
                      type="text" 
                      name="value_departemen"
                      value={extraFields.value_departemen}
                      onChange={handleExtraFieldChange}
                      placeholder="Engineering"
                      className="bg-zinc-100 dark:bg-zinc-900/50 border border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-zinc-900 rounded-2xl px-5 py-4 text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Jabatan</label>
                    <input 
                      type="text" 
                      name="value_jabatan"
                      value={extraFields.value_jabatan}
                      onChange={handleExtraFieldChange}
                      placeholder="Senior Developer"
                      className="bg-zinc-100 dark:bg-zinc-900/50 border border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-zinc-900 rounded-2xl px-5 py-4 text-sm outline-none transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Tgl Pengajuan</label>
                    <input 
                      type="date" 
                      name="value_tgl_pengajuan"
                      value={extraFields.value_tgl_pengajuan}
                      onChange={handleExtraFieldChange}
                      className="bg-zinc-100 dark:bg-zinc-900/50 border border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-zinc-900 rounded-2xl px-5 py-4 text-sm outline-none transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Requested By (Pemohon)</label>
                    <input 
                      type="text" 
                      name="value_pemohon"
                      value={extraFields.value_pemohon}
                      onChange={handleExtraFieldChange}
                      placeholder="Teddi Rahman"
                      className="bg-zinc-100 dark:bg-zinc-900/50 border border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-zinc-900 rounded-2xl px-5 py-4 text-sm outline-none transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">HR/GA Approver</label>
                    <input 
                      type="text" 
                      name="value_hr"
                      value={extraFields.value_hr}
                      onChange={handleExtraFieldChange}
                      placeholder="HRD/GA Dept"
                      className="bg-zinc-100 dark:bg-zinc-900/50 border border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-zinc-900 rounded-2xl px-5 py-4 text-sm outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Step 2: Excel Template */}
            <motion.section 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass p-8 rounded-[2.5rem] shadow-sm"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-lg">2</div>
                <div>
                  <h2 className="text-xl font-bold">Excel Template</h2>
                  <p className="text-sm text-zinc-500">Must contain value_ placeholders</p>
                </div>
              </div>

              <div 
                onClick={() => templateInputRef.current?.click()}
                className={cn(
                  "group border-2 border-dashed rounded-3xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
                  template ? "border-primary bg-primary/5" : "border-zinc-200 dark:border-zinc-800"
                )}
              >
                <input 
                  type="file" 
                  ref={templateInputRef} 
                  onChange={handleTemplateChange} 
                  accept=".xlsx" 
                  className="hidden" 
                />
                <div className="w-20 h-20 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm flex items-center justify-center transition-transform group-hover:scale-110">
                  {template ? <CheckCircle2 className="text-primary" size={40} /> : <CheckCircle2 className="text-primary/50" size={40} />}
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm mb-1">{template ? template.name : "form_template.xlsx"}</p>
                  <p className="text-xs text-zinc-400">{template ? "Custom template uploaded" : "Default template will be used"}</p>
                </div>
              </div>
            </motion.section>

            {/* Step 3: Receipts */}
            <motion.section 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass p-8 rounded-[2.5rem] shadow-sm"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-lg">3</div>
                <div>
                  <h2 className="text-xl font-bold">Grab Receipts</h2>
                  <p className="text-sm text-zinc-500">PDFs or images (multi-ride supported)</p>
                </div>
              </div>

              <div 
                onClick={() => receiptsInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 flex flex-col items-center gap-5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all"
              >
                <input 
                  type="file" 
                  ref={receiptsInputRef} 
                  onChange={handleReceiptsChange} 
                  multiple 
                  accept=".pdf,image/*" 
                  className="hidden" 
                />
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400">
                  <Upload size={32} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm mb-1">Click to Upload Receipts</p>
                  <p className="text-xs text-zinc-400">Selected: {receipts.length} files</p>
                </div>
              </div>

              <AnimatePresence>
                {receipts.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-6 flex flex-col gap-3"
                  >
                    {receipts.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all">
                        <div className="flex items-center gap-3">
                          <ImageIcon className="text-primary" size={18} />
                          <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <button onClick={() => removeReceipt(i)} className="text-zinc-400 hover:text-red-500 transition-colors">
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          </div>

          {/* Right Column: Processing & Results */}
          <div className="lg:col-span-5">
            <div className="sticky top-8 flex flex-col gap-8">
              
              <div className="glass p-10 rounded-[2.5rem] shadow-sm text-center">
                {!isProcessing && !resultUrl && (
                  <>
                    <h3 className="text-2xl font-bold mb-4">Automation Hub</h3>
                    <p className="text-zinc-500 text-sm mb-10 leading-relaxed px-4">
                      All set? Click below to start the OCR extraction and template generation engine.
                    </p>
                    <button 
                      onClick={handleSubmit}
                      disabled={receipts.length === 0}
                      className="w-full bg-primary text-white py-6 rounded-3xl font-bold text-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                    >
                      Start Engine
                    </button>
                  </>
                )}

                {isProcessing && (
                  <div className="py-12 flex flex-col items-center gap-8">
                    <div className="relative">
                      <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="text-primary animate-pulse" size={32} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Processing...</h3>
                      <p className="text-sm text-zinc-500">Running OCR & Filling Excel</p>
                    </div>
                  </div>
                )}

                {resultUrl && (
                  <div className="flex flex-col items-center gap-8">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                      <CheckCircle2 className="text-white" size={40} />
                    </div>
                    <div className="w-full">
                      <h3 className="text-2xl font-bold mb-2">Done!</h3>
                      <p className="text-zinc-500 text-sm mb-10 px-4">
                        Your reimbursement form is ready. Verify below or download directly.
                      </p>
                      
                      <div className="flex flex-col gap-4">
                        <button 
                          onClick={() => setShowPreview(!showPreview)}
                          className="w-full flex items-center justify-center gap-3 bg-zinc-100 dark:bg-zinc-900 py-4 rounded-2xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
                        >
                          <Eye size={20} />
                          {showPreview ? "Hide Preview" : "Preview Results"}
                        </button>
                        
                        <a 
                          href={resultUrl} 
                          download="Reimbursement_Report.xlsx"
                          className="w-full flex items-center justify-center gap-3 bg-primary text-white py-5 rounded-[2rem] font-bold text-lg hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
                        >
                          <Download size={22} />
                          Download Excel
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-8 p-5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-sm flex items-start gap-4">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <span className="text-left font-medium">{error}</span>
                  </div>
                )}
              </div>

              {/* Preview Table Overlay */}
              <AnimatePresence>
                {showPreview && previewData.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass p-6 rounded-[2.5rem] shadow-lg max-h-[500px] overflow-auto border border-zinc-200 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <TableIcon className="text-primary" size={24} />
                      <h4 className="font-bold">Live Data Preview</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px] text-left">
                        <thead className="bg-zinc-100 dark:bg-zinc-900 sticky top-0">
                          <tr>
                            {previewData[0]?.map((cell: any, i: number) => (
                              <th key={i} className="px-3 py-2 font-bold text-zinc-500 uppercase tracking-tighter">
                                {cell || "-"}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                          {previewData.slice(1).map((row, i) => (
                            <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                              {row.map((cell: any, j: number) => (
                                <td key={j} className="px-3 py-2 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                                  {cell?.toString() || ""}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-12 border-t border-zinc-200 dark:border-zinc-900">
        <p className="text-zinc-400 text-xs font-medium uppercase tracking-[0.2em] opacity-50">
          Grab Template Engine • Premium Edition
        </p>
      </footer>
    </div>
  );
}
