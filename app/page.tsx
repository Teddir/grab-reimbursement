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
  LogOut,
  ArrowRight,
  Sparkles,
  Printer,
  Edit3,
  ShieldCheck,
  ScanText,
  Sun,
  Moon,
  Info,
  FileUp,
  Plus,
  File,
  FileCheck,
  FilePlus,
  RotateCcw,
  Layout
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useSession, signIn, signOut } from "next-auth/react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const nomor = 125;

const romawiBulan = [
  "I", "II", "III", "IV", "V", "VI",
  "VII", "VIII", "IX", "X", "XI", "XII"
];

const sekarang = new Date();

const bulan = romawiBulan[sekarang.getMonth()];
const tahun = sekarang.getFullYear();
const kode = `${nomor}/ASI-HRGA/${bulan}/${tahun}`;

export default function Home() {
  const { data: session, status } = useSession();
  const [template, setTemplate] = useState<File | null>(null);
  const [receipts, setReceipts] = useState<File[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [darkMode, setDarkMode] = useState(false);


  const [extraFields, setExtraFields] = useState({
    value_no_dok: kode,
    value_nama_karyawan: "",
    value_pemohon: "",
    value_hr: "Marsha Nadia Annisya",
    value_departemen: "",
    value_jabatan: "",
    value_tgl_pengajuan: new Date().toISOString().split('T')[0],
  });

  const templateInputRef = useRef<HTMLInputElement>(null);
  const receiptsInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("grab_reimburse_fields");
    if (saved) {
      try {
        setExtraFields(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved fields", e);
      }
    }

    // Check system preference for dark mode
    const isDark = localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
  }, []);

  // Save to localStorage whenever extraFields changes
  useEffect(() => {
    localStorage.setItem("grab_reimburse_fields", JSON.stringify(extraFields));
  }, [extraFields]);

  // Apply dark mode class and save to localStorage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    if (session?.user?.name && !extraFields.value_nama_karyawan) {
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

  const handleReceiptsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setReceipts(prev => [...prev, ...Array.from(e.target.files!)]);
      setError(null);
    }
  };

  const removeReceipt = (index: number) => {
    setReceipts(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartOCR = async () => {
    if (receipts.length === 0) {
      setError("Please upload at least one receipt.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    receipts.forEach((r) => formData.append("receipts", r));

    try {
      const response = await fetch("http://localhost:8000/ocr", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("OCR failed. Please check your files.");

      const result = await response.json();
      setPreviewData(result.data);
      setActiveStep(2); // Move to review step
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdatePreviewItem = (index: number, field: string, value: string) => {
    const newData = [...previewData];
    const item = { ...newData[index], [field]: value };

    // Sync related keys to ensure Excel engine finds them
    if (field === "value_dropoff") item.value_destination = value;
    if (field === "value_destination") item.value_dropoff = value;
    if (field === "value_total_biaya") item.value_total_fare = value;
    if (field === "value_total_fare") item.value_total_biaya = value;
    if (field === "value_pickup") item.pickup = value;
    if (field === "value_tanggal_perjalanan") item.date = value;

    newData[index] = item;
    setPreviewData(newData);
  };

  const handleGenerateExcel = async () => {
    setIsGenerating(true);
    try {
      const formData = new FormData();
      if (template) formData.append("template", template);

      formData.append("data", JSON.stringify(previewData));
      formData.append("extra_data", JSON.stringify(extraFields));

      const response = await fetch("http://localhost:8000/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Excel generation failed.");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Reimbursement_${extraFields.value_nama_karyawan}_${extraFields.value_tgl_pengajuan}.xlsx`;
      a.click();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
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
          className="bg-white dark:bg-zinc-900 p-12 rounded-[3rem] shadow-2xl max-w-md w-full text-center border border-zinc-100 dark:border-zinc-800"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <ShieldCheck className="text-primary" size={40} />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight dark:text-white">Enterprise Login</h1>
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
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black selection:bg-primary/20 transition-colors duration-500">
      <header className="max-w-7xl mx-auto px-6 py-10 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4 text-left">
          <div className="w-14 h-14 bg-primary rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-primary/30 transform -rotate-6">
            <ScanText size={32} className="text-white transform rotate-6" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">GrabReimburse</h1>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Enterprise Edition</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:scale-110 transition-all shadow-sm"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="hidden sm:flex flex-col items-end mr-2 text-right">
            <p className="text-sm font-bold truncate max-w-[150px] dark:text-white">{session.user?.name}</p>
            <p className="text-[10px] text-zinc-500 truncate max-w-[150px]">{session.user?.email}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="w-12 h-12 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-32 pt-4 print:p-0">
        {/* Step Indicator */}
        <div className="max-w-2xl mx-auto mb-16 flex items-center justify-between relative print:hidden">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-200 dark:bg-zinc-800 -translate-y-1/2 rounded-full -z-10" />
          <div
            className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full -z-10 transition-all duration-500 ease-out"
            style={{ width: `${(activeStep / 2) * 100}%` }}
          />
          {[
            { id: 0, label: "Info", icon: <Info size={16} /> },
            { id: 1, label: "Upload", icon: <FileUp size={16} /> },
            { id: 2, label: "Review", icon: <CheckCircle2 size={16} /> }
          ].map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-3">
              <button
                onClick={() => activeStep > step.id && setActiveStep(step.id)}
                disabled={activeStep < step.id}
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg",
                  activeStep === step.id
                    ? "bg-primary text-white scale-110 shadow-primary/30"
                    : activeStep > step.id
                      ? "bg-primary/10 text-primary border-2 border-primary/20"
                      : "bg-white dark:bg-zinc-800 text-zinc-400 border border-zinc-100 dark:border-zinc-700"
                )}
              >
                {step.icon}
              </button>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                activeStep === step.id ? "text-primary" : "text-zinc-400"
              )}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeStep === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto text-left"
            >
              <section className="bg-white dark:bg-zinc-900/50 p-10 rounded-[3rem] shadow-xl shadow-zinc-200/50 dark:shadow-none border border-white dark:border-zinc-800 text-left">
                <div className="flex items-center gap-5 mb-10 text-left">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-lg">1</div>
                  <div className="text-left">
                    <h2 className="text-xl font-bold dark:text-white">Document Information</h2>
                    <p className="text-sm text-zinc-500">Auto-saved to your local storage</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  {[
                    { label: "No. Dokumen", name: "value_no_dok", type: "text" },
                    { label: "Pemohon", name: "value_pemohon", type: "text" },
                    { label: "Nama Karyawan", name: "value_nama_karyawan", type: "text" },
                    { label: "Jabatan", name: "value_jabatan", type: "text" },
                    { label: "Departemen", name: "value_departemen", type: "text" },
                    { label: "HR / GA Approval", name: "value_hr", type: "text" },
                    { label: "Tgl Pengajuan", name: "value_tgl_pengajuan", type: "date" },
                  ].map((f) => (
                    <div key={f.name} className="flex flex-col gap-2 text-left">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1 text-left">{f.label}</label>
                      <input
                        type={f.type}
                        name={f.name}
                        value={(extraFields as any)[f.name]}
                        onChange={handleExtraFieldChange}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium dark:text-white"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-12">
                  <button
                    onClick={() => setActiveStep(1)}
                    className="w-full h-16 bg-primary text-white rounded-[1.5rem] font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                  >
                    Continue to Upload
                    <ArrowRight size={20} />
                  </button>
                </div>
              </section>
            </motion.div>
          )}

          {activeStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto text-left"
            >
              <section className="bg-white dark:bg-zinc-900/50 p-12 rounded-[4rem] shadow-2xl shadow-zinc-200/50 dark:shadow-none border border-white dark:border-zinc-800 text-left">
                <div className="flex flex-col items-center text-center mb-12">
                  <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mb-6">
                    <FileUp size={40} />
                  </div>
                  <h2 className="text-3xl font-black dark:text-white mb-3 tracking-tight">Upload Your Receipts</h2>
                  <p className="text-zinc-500 max-w-md leading-relaxed">
                    Select your Grab Transport Statements (PDF) or ride receipts. We'll extract all ride details automatically.
                  </p>
                </div>

                <div
                  onClick={() => receiptsInputRef.current?.click()}
                  className="group relative h-72 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-primary/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-6"
                >
                  <input type="file" ref={receiptsInputRef} multiple className="hidden" onChange={handleReceiptsChange} accept=".pdf,image/*" />
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                    <Plus size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold dark:text-white tracking-tight">Click to browse or drop files here</p>
                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Support PDF and Images (Max 10MB)</p>
                  </div>
                </div>

                {receipts.length > 0 && (
                  <div className="mt-12 space-y-4 text-left">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-2 text-left">Selected Files ({receipts.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      {receipts.map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-white dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm group text-left">
                          <div className="flex items-center gap-4 text-left">
                            <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-400">
                              <File size={20} />
                            </div>
                            <div className="truncate max-w-[150px] text-left">
                              <p className="text-sm font-bold dark:text-white truncate">{r.name}</p>
                              <p className="text-[10px] text-zinc-400 font-bold">{(r.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); removeReceipt(i); }} className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-12 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setActiveStep(0)}
                    className="flex-1 h-16 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-2xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                  >
                    Back to Info
                  </button>
                  <button
                    onClick={handleStartOCR}
                    disabled={receipts.length === 0 || isProcessing}
                    className="flex-[2] h-16 bg-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={24} /> : (
                      <>
                        Analyze Receipts
                        <ScanText size={20} />
                      </>
                    )}
                  </button>
                </div>
              </section>
            </motion.div>
          )}

          {activeStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-6xl mx-auto text-left no-print"
            >
              <section className="bg-white dark:bg-zinc-900/50 rounded-[3rem] overflow-hidden shadow-2xl border border-white dark:border-zinc-800 text-left">
                <div className="p-10 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 text-left">
                  <div className="flex items-center gap-5 text-left">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                      <CheckCircle2 size={24} />
                    </div>
                    <div className="text-left">
                      <h2 className="text-xl font-bold dark:text-white">Review Results</h2>
                      <p className="text-sm text-zinc-500 text-left">Edit any cell to correct OCR inaccuracies</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handlePrint} className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 border border-zinc-100 dark:border-zinc-700 hover:scale-110 transition-all shadow-sm">
                      <Printer size={20} />
                    </button>
                    <button onClick={() => setActiveStep(1)} className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 border border-zinc-100 dark:border-zinc-700 hover:scale-110 transition-all shadow-sm">
                      <RotateCcw size={20} />
                    </button>
                  </div>
                </div>

                <div className="overflow-auto max-h-[60vh] text-left">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-zinc-100/90 dark:bg-zinc-800/90 backdrop-blur-md z-10 text-left">
                      <tr>
                        {["No", "Order ID", "Date", "Pickup", "Drop-Off", "Amount", "Time", "Purpose"].map((h) => (
                          <th key={h} className="px-6 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900 text-left">
                      {previewData.map((row, i) => (
                        <tr key={i} className="hover:bg-primary/5 transition-colors group text-left">
                          <td className="px-6 py-5 text-sm font-bold text-zinc-300">{i + 1}</td>
                          <td className="px-6 py-5"><input type="text" value={row.value_nomor_order_grab || ""} onChange={(e) => handleUpdatePreviewItem(i, "value_nomor_order_grab", e.target.value)} className="bg-transparent border-none focus:ring-0 text-sm font-bold dark:text-white w-28 p-0" /></td>
                          <td className="px-6 py-5"><input type="text" value={row.value_tanggal_perjalanan || ""} onChange={(e) => handleUpdatePreviewItem(i, "value_tanggal_perjalanan", e.target.value)} className="bg-transparent border-none focus:ring-0 text-sm dark:text-zinc-300 w-24 p-0" /></td>
                          <td className="px-6 py-5"><input type="text" value={row.value_pickup || ""} onChange={(e) => handleUpdatePreviewItem(i, "value_pickup", e.target.value)} className="bg-transparent border-none focus:ring-0 text-[10px] dark:text-zinc-400 w-32 p-0 truncate" /></td>
                          <td className="px-6 py-5"><input type="text" value={row.value_dropoff || ""} onChange={(e) => handleUpdatePreviewItem(i, "value_dropoff", e.target.value)} className="bg-transparent border-none focus:ring-0 text-[10px] dark:text-zinc-400 w-32 p-0 truncate" /></td>
                          <td className="px-6 py-5 text-left">
                            <div className="flex items-center gap-1 text-left">
                              <span className="text-[10px] font-bold text-primary">Rp</span>
                              <input type="text" value={row.value_total_biaya || row.value_total_fare || ""} onChange={(e) => handleUpdatePreviewItem(i, "value_total_biaya", e.target.value)} className="bg-transparent border-none focus:ring-0 text-sm font-bold dark:text-white w-20 p-0" />
                            </div>
                          </td>
                          <td className="px-6 py-5"><input type="text" value={row.value_waktu_berangkat || ""} onChange={(e) => handleUpdatePreviewItem(i, "value_waktu_berangkat", e.target.value)} className="bg-transparent border-none focus:ring-0 text-[10px] dark:text-zinc-400 w-16 p-0" /></td>
                          <td className="px-6 py-5"><input type="text" value={row.value_tujuan_perjalan || ""} onChange={(e) => handleUpdatePreviewItem(i, "value_tujuan_perjalan", e.target.value)} className="bg-transparent border-none focus:ring-0 text-xs italic text-zinc-400 dark:text-zinc-500 focus:text-primary w-28 p-0" placeholder="Purpose..." /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-10 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-8 text-left">
                  <div className="flex items-center gap-4 text-zinc-500 text-left">
                    <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm">
                      <Layout size={18} />
                    </div>
                    <p className="text-sm font-medium text-left">Ready to generate <span className="font-bold text-primary">{previewData.length}</span> entries</p>
                  </div>
                  <button
                    onClick={handleGenerateExcel}
                    disabled={isGenerating}
                    className="w-full sm:w-auto px-12 h-16 bg-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" size={24} /> : (
                      <>
                        Finalize & Download Report
                        <Download size={20} />
                      </>
                    )}
                  </button>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Printable Report (Hidden on Screen) */}
      <div className="print-only p-10 font-sans text-black">
        <div className="text-center mb-10 border-b-2 border-black pb-6">
          <h1 className="text-2xl font-bold uppercase tracking-widest">Formulir Klaim Reimbursement</h1>
          <p className="text-sm font-bold mt-2">{extraFields.value_no_dok}</p>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-10 text-sm">
          <div className="space-y-2">
            <p><span className="font-bold inline-block w-32">Nama Karyawan</span>: {extraFields.value_nama_karyawan}</p>
            <p><span className="font-bold inline-block w-32">Jabatan</span>: {extraFields.value_jabatan}</p>
            <p><span className="font-bold inline-block w-32">Departemen</span>: {extraFields.value_departemen}</p>
          </div>
          <div className="space-y-2">
            <p><span className="font-bold inline-block w-32">Tanggal</span>: {extraFields.value_tgl_pengajuan}</p>
            <p><span className="font-bold inline-block w-32">Pemohon</span>: {extraFields.value_pemohon}</p>
          </div>
        </div>

        <table className="w-full border-collapse border border-black text-xs mb-10">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2">No</th>
              <th className="border border-black p-2">Tanggal</th>
              <th className="border border-black p-2">Order ID</th>
              <th className="border border-black p-2">Keterangan / Tujuan</th>
              <th className="border border-black p-2 text-right">Biaya (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {previewData.map((row, i) => (
              <tr key={i}>
                <td className="border border-black p-2 text-center">{i + 1}</td>
                <td className="border border-black p-2">{row.value_tanggal_perjalanan}</td>
                <td className="border border-black p-2">{row.value_nomor_order_grab}</td>
                <td className="border border-black p-2">{row.value_tujuan_perjalan || `${row.value_pickup} - ${row.value_destination || row.value_dropoff}`}</td>
                <td className="border border-black p-2 text-right">
                  {row.value_total_biaya || row.value_total_fare}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-gray-50">
              <td colSpan={4} className="border border-black p-2 text-right uppercase">Total Klaim</td>
              <td className="border border-black p-2 text-right">
                Rp {previewData.reduce((acc, curr) => {
                  const val = String(curr.value_total_biaya || curr.value_total_fare || "0").replace(/[^\d]/g, "");
                  return acc + (parseInt(val) || 0);
                }, 0).toLocaleString("id-ID")}
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="grid grid-cols-3 gap-4 text-center mt-20 text-sm">
          <div>
            <p className="font-bold mb-16">Diajukan Oleh,</p>
            <p className="border-t border-black pt-2 inline-block px-10">{extraFields.value_pemohon}</p>
            <p className="text-[10px] mt-1">( Karyawan )</p>
          </div>
          <div>
            <p className="font-bold mb-16">Disetujui Oleh,</p>
            <p className="border-t border-black pt-2 inline-block px-10">{extraFields.value_hr}</p>
            <p className="text-[10px] mt-1">( HR / GA Manager )</p>
          </div>
          <div>
            <p className="font-bold mb-16">Diketahui Oleh,</p>
            <p className="border-t border-black pt-2 inline-block px-10">Finance Dept</p>
            <p className="text-[10px] mt-1">( Bendahara )</p>
          </div>
        </div>
      </div>
    </div>
  );
}
