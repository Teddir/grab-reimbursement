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
  Layout,
  ChevronRight,
  User,
  Building2,
  Calendar,
  Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useSession, signIn, signOut } from "next-auth/react";

/**
 * UTILITIES
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { Button } from "./components/ui/Button";
import { Card } from "./components/ui/Card";
import { Input } from "./components/ui/Input";

const nomor = 125;
const romawiBulan = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const sekarang = new Date();
const bulan = romawiBulan[sekarang.getMonth()];
const tahun = sekarang.getFullYear();
const kode = `${nomor}/ASI-HRGA/${bulan}/${tahun}`;

export default function Home() {
  const { data: session, status } = useSession();
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

  const receiptsInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setDarkMode(savedTheme === "dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDarkMode(prefersDark);
    }

    const savedFields = localStorage.getItem("grab_reimburse_fields");
    if (savedFields) {
      try { setExtraFields(JSON.parse(savedFields)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("grab_reimburse_fields", JSON.stringify(extraFields));
  }, [extraFields]);

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

  const handleExtraFieldChange = (e: any) => {
    const { name, value } = e.target;
    setExtraFields(prev => ({ ...prev, [name]: value }));
  };

  const handleReceiptsChange = (e: any) => {
    if (e.target.files) {
      setReceipts(prev => [...prev, ...Array.from(e.target.files!) as File[]]);
      setError(null);
    }
  };

  const handleStartOCR = async () => {
    if (receipts.length === 0) return setError("Please upload at least one receipt.");
    setIsProcessing(true);
    setError(null);
    const formData = new FormData();
    receipts.forEach((r) => formData.append("receipts", r));
    try {
      const res = await fetch("http://localhost:8000/ocr", { method: "POST", body: formData });
      if (!res.ok) throw new Error("OCR failed.");
      const result = await res.json();
      setPreviewData(result.data);
      setActiveStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally { setIsProcessing(false); }
  };

  const handleUpdatePreviewItem = (index: number, field: string, value: string) => {
    const newData = [...previewData];
    const item = { ...newData[index], [field]: value };
    if (field === "value_dropoff") item.value_destination = value;
    if (field === "value_destination") item.value_dropoff = value;
    if (field === "value_total_biaya") item.value_total_fare = value;
    if (field === "value_total_fare") item.value_total_biaya = value;
    newData[index] = item;
    setPreviewData(newData);
  };

  const handleGenerateExcel = async () => {
    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify(previewData));
      formData.append("extra_data", JSON.stringify(extraFields));
      const res = await fetch("http://localhost:8000/generate", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Excel failed.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Reimbursement_${extraFields.value_nama_karyawan}_${extraFields.value_tgl_pengajuan}.xlsx`;
      a.click();
    } catch (err: any) { alert(err.message); } finally { setIsGenerating(false); }
  };

  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary" size={48} />
    </div>
  );

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="p-12 max-w-md w-full text-center shadow-2xl border-none">
        <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-primary">
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-3xl font-black mb-4 tracking-tight">Grab Business</h1>
        <p className="text-muted-foreground mb-10 leading-relaxed">Sign in to access your enterprise reimbursement dashboard.</p>
        <Button onClick={() => signIn("microsoft-entra-id")} className="w-full h-16 text-lg">
          Sign in with Microsoft
          <ArrowRight size={20} />
        </Button>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      {/* MODERN HEADER */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border no-print">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <ScanText size={24} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter">Grab Business</span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="h-8 w-[1px] bg-border mx-2 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold leading-none mb-1">{session.user?.name}</p>
                <p className="text-[10px] text-muted-foreground leading-none">{session.user?.email}</p>
              </div>
              <button onClick={() => signOut()} className="w-10 h-10 bg-muted rounded-full flex items-center justify-center hover:text-red-500 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 print:p-0">
        {/* STEPPER */}
        <div className="flex items-center justify-center mb-16 no-print">
          <div className="flex items-center gap-4">
            {[
              { id: 0, label: "Configuration", icon: Info },
              { id: 1, label: "Upload", icon: FileUp },
              { id: 2, label: "Review", icon: CheckCircle2 }
            ].map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <button 
                    onClick={() => activeStep > step.id && setActiveStep(step.id)}
                    disabled={activeStep < step.id}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                      activeStep === step.id 
                        ? "bg-primary text-white scale-110 shadow-xl shadow-primary/30" 
                        : activeStep > step.id
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <step.icon size={18} />
                  </button>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-[0.15em]",
                    activeStep === step.id ? "text-primary" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div className="w-12 h-[2px] bg-border mx-4 -translate-y-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeStep === 0 && (
            <motion.div 
              key="step0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="p-10">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">Document Information</h2>
                    <p className="text-sm text-muted-foreground">Fill in the details for your reimbursement form.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Document No" name="value_no_dok" value={extraFields.value_no_dok} onChange={handleExtraFieldChange} icon={FileText} />
                  <Input label="Date" name="value_tgl_pengajuan" type="date" value={extraFields.value_tgl_pengajuan} onChange={handleExtraFieldChange} icon={Calendar} />
                  <Input label="Employee" name="value_nama_karyawan" value={extraFields.value_nama_karyawan} onChange={handleExtraFieldChange} icon={User} />
                  <Input label="Applicant" name="value_pemohon" value={extraFields.value_pemohon} onChange={handleExtraFieldChange} icon={User} />
                  <Input label="Department" name="value_departemen" value={extraFields.value_departemen} onChange={handleExtraFieldChange} icon={Building2} />
                  <Input label="Position" name="value_jabatan" value={extraFields.value_jabatan} onChange={handleExtraFieldChange} icon={Briefcase} />
                  <div className="md:col-span-2">
                    <Input label="HR / GA Manager" name="value_hr" value={extraFields.value_hr} onChange={handleExtraFieldChange} icon={ShieldCheck} />
                  </div>
                </div>

                <Button onClick={() => setActiveStep(1)} className="w-full h-14 mt-12 rounded-2xl">
                  Next Step
                  <ChevronRight size={20} />
                </Button>
              </Card>
            </motion.div>
          )}

          {activeStep === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="p-12 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-primary">
                  <Upload size={40} />
                </div>
                <h2 className="text-3xl font-black mb-4">Upload Receipts</h2>
                <p className="text-muted-foreground mb-10 max-w-sm mx-auto">Drop your Grab Transport Statements or ride receipts here. We'll handle the rest.</p>

                <div
                  onClick={() => receiptsInputRef.current?.click()}
                  className="h-64 border-2 border-dashed border-border rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:bg-muted hover:border-primary/50 transition-all cursor-pointer group mb-10"
                >
                  <input type="file" ref={receiptsInputRef} multiple className="hidden" onChange={handleReceiptsChange} accept=".pdf,image/*" />
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all">
                    <Plus size={32} />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Select Files</p>
                </div>

                {receipts.length > 0 && (
                  <div className="text-left space-y-3 mb-10">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Selected Files</p>
                    {receipts.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-muted rounded-2xl group">
                        <div className="flex items-center gap-3">
                          <File size={18} className="text-primary" />
                          <p className="text-sm font-bold truncate max-w-[200px]">{r.name}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setReceipts(prev => prev.filter((_, idx) => idx !== i)); }} className="text-muted-foreground hover:text-red-500">
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button variant="secondary" onClick={() => setActiveStep(0)} className="flex-1 h-14 rounded-2xl">Back</Button>
                  <Button onClick={handleStartOCR} isLoading={isProcessing} className="flex-[2] h-14 rounded-2xl">
                    Extract Data
                    <ScanText size={20} />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {activeStep === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto no-print"
            >
              <Card>
                <div className="p-8 border-b border-border flex items-center justify-between bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                      <TableIcon size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black">Review & Validate</h2>
                      <p className="text-sm text-muted-foreground">Adjust any details before generating the Excel report.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => window.print()} className="w-12 p-0"><Printer size={20} /></Button>
                    <Button variant="secondary" onClick={() => setActiveStep(1)} className="w-12 p-0"><RotateCcw size={20} /></Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        {["No", "Order ID", "Date", "Pickup", "Drop-Off", "Amount", "Time", "Purpose"].map((h) => (
                          <th key={h} className="px-6 py-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {previewData.map((row, i) => (
                        <tr key={i} className="hover:bg-primary/5 transition-colors group">
                          <td className="px-6 py-5 text-sm font-bold text-muted-foreground/30">{i + 1}</td>
                          <td className="px-6 py-5">
                            <input 
                              value={row.value_nomor_order_grab || ""} 
                              onChange={(e) => handleUpdatePreviewItem(i, "value_nomor_order_grab", e.target.value)} 
                              className="bg-transparent border-none p-0 text-sm font-bold w-32 focus:ring-0"
                            />
                          </td>
                          <td className="px-6 py-5">
                            <input 
                              value={row.value_tanggal_perjalanan || ""} 
                              onChange={(e) => handleUpdatePreviewItem(i, "value_tanggal_perjalanan", e.target.value)} 
                              className="bg-transparent border-none p-0 text-sm w-24 focus:ring-0"
                            />
                          </td>
                          <td className="px-6 py-5">
                            <input 
                              value={row.value_pickup || ""} 
                              onChange={(e) => handleUpdatePreviewItem(i, "value_pickup", e.target.value)} 
                              className="bg-transparent border-none p-0 text-[11px] w-48 truncate focus:ring-0"
                            />
                          </td>
                          <td className="px-6 py-5">
                            <input 
                              value={row.value_dropoff || ""} 
                              onChange={(e) => handleUpdatePreviewItem(i, "value_dropoff", e.target.value)} 
                              className="bg-transparent border-none p-0 text-[11px] w-48 truncate focus:ring-0"
                            />
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-1 text-primary">
                              <span className="text-[11px] font-bold">Rp</span>
                              <input 
                                value={row.value_total_biaya || ""} 
                                onChange={(e) => handleUpdatePreviewItem(i, "value_total_biaya", e.target.value)} 
                                className="bg-transparent border-none p-0 text-sm font-black w-24 focus:ring-0"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <input 
                              value={row.value_waktu_berangkat || ""} 
                              onChange={(e) => handleUpdatePreviewItem(i, "value_waktu_berangkat", e.target.value)} 
                              className="bg-transparent border-none p-0 text-[11px] w-16 focus:ring-0"
                            />
                          </td>
                          <td className="px-6 py-5">
                            <input 
                              placeholder="Add purpose..."
                              value={row.value_tujuan_perjalan || ""} 
                              onChange={(e) => handleUpdatePreviewItem(i, "value_tujuan_perjalan", e.target.value)} 
                              className="bg-transparent border-none p-0 text-[11px] italic text-muted-foreground w-32 focus:ring-0"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-8 bg-muted/30 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center border border-border">
                      <Layout size={18} />
                    </div>
                    <p className="text-sm font-bold">Ready to process <span className="text-primary">{previewData.length}</span> rides</p>
                  </div>
                  <Button onClick={handleGenerateExcel} isLoading={isGenerating} className="px-10 h-14 rounded-2xl text-lg">
                    Download Report
                    <Download size={20} />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* PRINT LAYOUT */}
      <div className="print-only p-12 text-black bg-white">
        <div className="flex justify-between items-start mb-12 pb-6 border-b-2 border-black">
          <div>
            <h1 className="text-2xl font-black uppercase mb-1">Reimbursement Form</h1>
            <p className="text-sm font-bold">{extraFields.value_no_dok}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold uppercase">Grab Business</p>
            <p className="text-xs">{extraFields.value_tgl_pengajuan}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 mb-12">
          <div className="space-y-3">
            <div className="flex justify-between border-b border-black/10 pb-1">
              <span className="text-xs font-bold uppercase">Employee</span>
              <span className="text-xs">{extraFields.value_nama_karyawan}</span>
            </div>
            <div className="flex justify-between border-b border-black/10 pb-1">
              <span className="text-xs font-bold uppercase">Department</span>
              <span className="text-xs">{extraFields.value_departemen}</span>
            </div>
            <div className="flex justify-between border-b border-black/10 pb-1">
              <span className="text-xs font-bold uppercase">Position</span>
              <span className="text-xs">{extraFields.value_jabatan}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-black/10 pb-1">
              <span className="text-xs font-bold uppercase">Applicant</span>
              <span className="text-xs">{extraFields.value_pemohon}</span>
            </div>
            <div className="flex justify-between border-b border-black/10 pb-1">
              <span className="text-xs font-bold uppercase">Date</span>
              <span className="text-xs">{extraFields.value_tgl_pengajuan}</span>
            </div>
          </div>
        </div>

        <table className="w-full border-collapse mb-12">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 text-[10px] text-left">NO</th>
              <th className="border border-black p-2 text-[10px] text-left">DATE</th>
              <th className="border border-black p-2 text-[10px] text-left">DESCRIPTION</th>
              <th className="border border-black p-2 text-[10px] text-right">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {previewData.map((row, i) => (
              <tr key={i}>
                <td className="border border-black p-2 text-[10px]">{i + 1}</td>
                <td className="border border-black p-2 text-[10px]">{row.value_tanggal_perjalanan}</td>
                <td className="border border-black p-2 text-[10px]">
                  {row.value_tujuan_perjalan || `${row.value_pickup} to ${row.value_dropoff}`}
                </td>
                <td className="border border-black p-2 text-[10px] text-right">{row.value_total_biaya}</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td colSpan={3} className="border border-black p-2 text-right text-[10px]">TOTAL</td>
              <td className="border border-black p-2 text-right text-[10px]">
                {previewData.reduce((acc, curr) => {
                  const val = String(curr.value_total_biaya || "0").replace(/[^\d]/g, "");
                  return acc + (parseInt(val) || 0);
                }, 0).toLocaleString("id-ID")}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="grid grid-cols-3 gap-10 mt-24 text-center">
          <div>
            <p className="text-[10px] font-bold uppercase mb-20">Submitted By,</p>
            <p className="text-xs font-bold border-t border-black pt-2">{extraFields.value_pemohon}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase mb-20">Approved By,</p>
            <p className="text-xs font-bold border-t border-black pt-2">{extraFields.value_hr}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase mb-20">Acknowledged By,</p>
            <p className="text-xs font-bold border-t border-black pt-2">Finance Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
}

