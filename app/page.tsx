"use client";

import { useState, useRef, useEffect } from "react";
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
  Eye,
  LogOut,
  User,
  ShieldCheck,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as XLSX from "xlsx";
import { useSession, signIn, signOut } from "next-auth/react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const { data: session, status } = useSession();
  const [template, setTemplate] = useState<File | null>(null);
  const [receipts, setReceipts] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[][]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const [extraFields, setExtraFields] = useState({
    value_no_dok: "REIMB/2026/05/001",
    value_nama_karyawan: "",
    value_departemen: "IT",
    value_jabatan: "Senior Developer",
    value_tgl_pengajuan: new Date().toISOString().split('T')[0],
    value_pemohon: "",
    value_hr: "HRD/GA Dept",
    value_logo: " ",
  });

  const templateInputRef = useRef<HTMLInputElement>(null);
  const receiptsInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill from session
  useEffect(() => {
    if (session?.user?.name) {
      setExtraFields(prev => ({
        ...prev,
        value_nama_karyawan: session.user?.name || "",
        value_pemohon: session.user?.name || "",
      }));
    }
  }, [session]);

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

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-12 rounded-[3rem] shadow-2xl max-w-md w-full text-center border border-white/20"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <ShieldCheck className="text-primary" size={40} />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Enterprise Login</h1>
          <p className="text-zinc-500 mb-10 leading-relaxed">
            Please sign in with your corporate Microsoft account to access the reimbursement engine.
          </p>
          <button 
            onClick={() => signIn("microsoft-entra-id")}
            className="w-full bg-primary text-white py-5 rounded-[2rem] font-bold text-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
          >
            <span>Sign in with Microsoft</span>
            <ArrowRight size={20} />
          </button>
          <p className="mt-8 text-xs text-zinc-400 font-medium uppercase tracking-widest opacity-50">
            Secured by Microsoft Entra ID
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="pt-12 pb-8 px-6 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="text-white" size={24} />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold tracking-tight">
              Grab <span className="gradient-text">Reimbursement</span>
            </h1>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Premium Edition</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-zinc-900/50 p-2 pl-6 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="text-right mr-2 hidden sm:block">
            <p className="text-sm font-bold truncate max-w-[150px]">{session.user?.name}</p>
            <p className="text-[10px] text-zinc-500 truncate max-w-[150px]">{session.user?.email}</p>
          </div>
          <button 
            onClick={() => signOut()}
            className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 pb-32 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Input Steps */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            
            {/* Step 1: Additional Info */}
            <motion.section 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <User size={120} />
              </div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-lg">1</div>
                <div>
                  <h2 className="text-xl font-bold">Personal Info</h2>
                  <p className="text-sm text-zinc-500">Auto-filled from your profile</p>
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
                      placeholder="Your name"
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
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Pemohon (Signature)</label>
                    <input 
                      type="text" 
                      name="value_pemohon"
                      value={extraFields.value_pemohon}
                      onChange={handleExtraFieldChange}
                      placeholder="Your name"
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

            {/* Step 2: Receipts */}
            <motion.section 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass p-8 rounded-[2.5rem] shadow-sm"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-lg">2</div>
                <div>
                  <h2 className="text-xl font-bold">Grab Receipts</h2>
                  <p className="text-sm text-zinc-500">Upload your PDF statements here</p>
                </div>
              </div>

              <div 
                onClick={() => receiptsInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 flex flex-col items-center gap-5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all group"
              >
                <input 
                  type="file" 
                  ref={receiptsInputRef} 
                  onChange={handleReceiptsChange} 
                  multiple 
                  accept=".pdf,image/*" 
                  className="hidden" 
                />
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center text-zinc-400 transition-transform group-hover:scale-110">
                  <Upload size={32} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm mb-1">Click to Upload Receipts</p>
                  <p className="text-xs text-zinc-400">Multi-ride statements supported</p>
                </div>
              </div>

              <AnimatePresence>
                {receipts.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {receipts.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <ImageIcon className="text-primary shrink-0" size={16} />
                          <span className="text-xs font-bold truncate">{file.name}</span>
                        </div>
                        <button onClick={() => removeReceipt(i)} className="text-zinc-400 hover:text-red-500 transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>

            {/* Step 3: Template (Optional) */}
            <details className="group">
              <summary className="flex items-center justify-between p-4 px-8 glass rounded-[2rem] cursor-pointer list-none hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 transition-all">
                <div className="flex items-center gap-3">
                  <FileText className="text-zinc-400" size={18} />
                  <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Advanced: Custom Template</span>
                </div>
                <motion.div 
                  className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center group-open:rotate-180 transition-transform"
                >
                  <ArrowRight size={14} className="rotate-90" />
                </motion.div>
              </summary>
              <div className="p-8 pt-4">
                <div 
                  onClick={() => templateInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-3xl p-8 flex flex-col items-center gap-4 cursor-pointer transition-all",
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
                  <div className="text-center">
                    <p className="font-bold text-xs mb-1">{template ? template.name : "Using form_template.xlsx (Default)"}</p>
                    <p className="text-[10px] text-zinc-400">Upload .xlsx with value_ placeholders if you want to override</p>
                  </div>
                </div>
              </div>
            </details>
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
          Grab Template Engine • PT Asia Sistem Indonesia
        </p>
      </footer>
    </div>
  );
}
