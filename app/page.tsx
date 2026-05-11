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
  Briefcase,
  Menu as MenuIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useSession, signIn, signOut } from "next-auth/react";
import { redirect } from "next/navigation";

/**
 * UTILITIES
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { Button } from "./components/ui/Button";
import { Card } from "./components/ui/Card";
import { Input } from "./components/ui/Input";
import { TutorialModal } from "./components/ui/TutorialModal";
import { OCRLoading } from "./components/ui/OCRLoading";

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
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      try { setExtraFields(JSON.parse(savedFields)); } catch (e) { }
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/ocr`, { method: "POST", body: formData });
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/generate`, { method: "POST", body: formData });
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

  if (!session) {
    redirect("/login");
    return null;
  }


  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
      {/* MODERN HEADER */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 overflow-hidden rounded-xl shadow-lg shadow-primary/20 bg-white">
              <img src="/asisgrab-logo.png" alt="AsisGrab Logo" className="w-full h-full object-contain p-0.5 rounded-full" />
            </div>
            <span className="text-lg sm:text-xl font-black tracking-tighter">AsisGrab Business</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="h-8 w-[1px] bg-border mx-1 hidden sm:block" />

            {/* Desktop User Menu */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold leading-none mb-1">{session.user?.name}</p>
                <p className="text-[10px] text-muted-foreground leading-none">{session.user?.email}</p>
              </div>
              <button onClick={() => signOut()} className="w-10 h-10 bg-muted rounded-full flex items-center justify-center hover:text-red-500 transition-colors">
                <LogOut size={18} />
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground transition-colors"
            >
              {isMobileMenuOpen ? <X size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden bg-card border-b border-border overflow-hidden"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-black">{session.user?.name}</p>
                    <p className="text-[10px] text-muted-foreground">{session.user?.email}</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => signOut()}
                  className="w-full h-14 rounded-2xl justify-start px-6 gap-3 text-red-500 border-red-500/20 hover:bg-red-500/5"
                >
                  <LogOut size={20} />
                  Sign Out
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 print:p-0">
        {/* STEPPER */}
        <div className="flex items-center justify-center mb-8 sm:mb-16 no-print overflow-hidden px-4">
          <div className="flex items-center gap-2 sm:gap-4">
            {[
              { id: 0, label: "Info", icon: Info },
              { id: 1, label: "Upload", icon: FileUp },
              { id: 2, label: "Review", icon: CheckCircle2 }
            ].map((step, idx) => (
              <div key={step.id} className="flex items-center justify-center">
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => activeStep > step.id && setActiveStep(step.id)}
                    disabled={activeStep < step.id}
                    className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300",
                      activeStep === step.id
                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                        : activeStep > step.id
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    <step.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                  <span className={cn(
                    "text-[8px] sm:text-[10px] font-bold uppercase tracking-widest",
                    activeStep === step.id ? "text-primary" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={cn(
                    "h-[2px] mx-2 sm:mx-4 -translate-y-4 transition-all duration-300",
                    "w-6 sm:w-12",
                    activeStep > idx ? "bg-primary" : "bg-border"
                  )} />
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
              className="max-w-2xl mx-auto w-full"
            >
              <Card className="p-6 sm:p-10">
                <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-10">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                    <Building2 size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black">Document Information</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">Fill in the details for your reimbursement form.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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

                <Button onClick={() => setActiveStep(1)} className="w-full h-14 mt-8 sm:mt-12 rounded-2xl">
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
              className="max-w-2xl mx-auto w-full"
            >
              <Card className="p-6 sm:p-12 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 sm:mb-8 text-primary">
                  <Upload size={32} className="sm:w-10 sm:h-10" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black mb-3 sm:mb-4">Upload Receipts</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-sm mx-auto">Drop your Grab Transport Statements or ride receipts here. We'll handle the rest.</p>

                <button
                  onClick={() => setIsTutorialOpen(true)}
                  className="mb-8 text-xs font-bold text-primary hover:underline flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Info size={14} />
                  How to get PDF Transport Statement?
                </button>

                <div
                  onClick={() => receiptsInputRef.current?.click()}
                  className="h-48 sm:h-64 border-2 border-dashed border-border rounded-[2rem] sm:rounded-[2.5rem] flex flex-col items-center justify-center gap-3 sm:gap-4 hover:bg-muted hover:border-primary/50 transition-all cursor-pointer group mb-8 sm:mb-10"
                >
                  <input type="file" ref={receiptsInputRef} multiple className="hidden" onChange={handleReceiptsChange} accept=".pdf,image/*" />
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all">
                    <Plus size={24} className="sm:w-8 sm:h-8" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-widest">Select Files</p>
                </div>

                {receipts.length > 0 && (
                  <div className="text-left space-y-2 sm:space-y-3 mb-8 sm:mb-10">
                    <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Selected Files</p>
                    {receipts.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-3 sm:p-4 bg-muted rounded-xl sm:rounded-2xl group">
                        <div className="flex items-center gap-3 min-w-0">
                          <File size={16} className="text-primary shrink-0" />
                          <p className="text-xs sm:text-sm font-bold truncate">{r.name}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setReceipts(prev => prev.filter((_, idx) => idx !== i)); }} className="text-muted-foreground hover:text-red-500 shrink-0 ml-2">
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button variant="secondary" onClick={() => setActiveStep(0)} className="order-2 sm:order-1 h-14 rounded-2xl">Back</Button>
                  <Button onClick={handleStartOCR} isLoading={isProcessing} className="order-1 sm:order-2 flex-grow h-14 rounded-2xl">
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
              className="max-w-6xl mx-auto no-print w-full"
            >
              <Card>
                <div className="p-5 sm:p-8 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between bg-muted/30 gap-4 sm:gap-0">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                      <TableIcon size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black">Review & Validate</h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">Adjust details before generating report.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="secondary" onClick={() => window.print()} className="flex-1 sm:w-12 sm:p-0"><Printer size={18} /></Button>
                    <Button variant="secondary" onClick={() => setActiveStep(1)} className="flex-1 sm:w-12 sm:p-0"><RotateCcw size={18} /></Button>
                  </div>
                </div>

                <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        {["No", "Order ID", "Date", "Pickup", "Drop-Off", "Amount", "Time", "Purpose"].map((h) => (
                          <th key={h} className="px-4 sm:px-6 py-4 text-[10px] sm:text-[11px] font-black text-muted-foreground uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {previewData.map((row, i) => (
                        <tr key={i} className="hover:bg-primary/5 transition-colors group">
                          <td className="px-4 sm:px-6 py-4 sm:py-5 text-xs sm:text-sm font-bold text-muted-foreground/30">{i + 1}</td>
                          <td className="px-4 sm:px-6 py-4 sm:py-5">
                            <input
                              value={row.value_nomor_order_grab || ""}
                              onChange={(e) => handleUpdatePreviewItem(i, "value_nomor_order_grab", e.target.value)}
                              className="bg-transparent border-none p-0 text-xs sm:text-sm font-bold w-24 sm:w-32 focus:ring-0"
                            />
                          </td>
                          <td className="px-4 sm:px-6 py-4 sm:py-5">
                            <input
                              value={row.value_tanggal_perjalanan || ""}
                              onChange={(e) => handleUpdatePreviewItem(i, "value_tanggal_perjalanan", e.target.value)}
                              className="bg-transparent border-none p-0 text-xs sm:text-sm w-20 sm:w-24 focus:ring-0"
                            />
                          </td>
                          <td className="px-4 sm:px-6 py-4 sm:py-5">
                            <input
                              value={row.value_pickup || ""}
                              onChange={(e) => handleUpdatePreviewItem(i, "value_pickup", e.target.value)}
                              className="bg-transparent border-none p-0 text-[10px] sm:text-[11px] w-32 sm:w-48 truncate focus:ring-0"
                            />
                          </td>
                          <td className="px-4 sm:px-6 py-4 sm:py-5">
                            <input
                              value={row.value_dropoff || ""}
                              onChange={(e) => handleUpdatePreviewItem(i, "value_dropoff", e.target.value)}
                              className="bg-transparent border-none p-0 text-[10px] sm:text-[11px] w-32 sm:w-48 truncate focus:ring-0"
                            />
                          </td>
                          <td className="px-4 sm:px-6 py-4 sm:py-5">
                            <div className="flex items-center gap-1 text-primary">
                              <span className="text-[10px] sm:text-[11px] font-bold">Rp</span>
                              <input
                                value={row.value_total_biaya || ""}
                                onChange={(e) => handleUpdatePreviewItem(i, "value_total_biaya", e.target.value)}
                                className="bg-transparent border-none p-0 text-xs sm:text-sm font-black w-20 sm:w-24 focus:ring-0"
                              />
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 sm:py-5">
                            <input
                              value={row.value_waktu_berangkat || ""}
                              onChange={(e) => handleUpdatePreviewItem(i, "value_waktu_berangkat", e.target.value)}
                              className="bg-transparent border-none p-0 text-[10px] sm:text-[11px] w-12 sm:w-16 focus:ring-0"
                            />
                          </td>
                          <td className="px-4 sm:px-6 py-4 sm:py-5">
                            <input
                              placeholder="Add purpose..."
                              value={row.value_tujuan_perjalan || ""}
                              onChange={(e) => handleUpdatePreviewItem(i, "value_tujuan_perjalan", e.target.value)}
                              className="bg-transparent border-none p-0 text-[10px] sm:text-[11px] italic text-muted-foreground w-24 sm:w-32 focus:ring-0"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-5 sm:p-8 bg-muted/30 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center border border-border shrink-0">
                      <Layout size={18} />
                    </div>
                    <p className="text-sm font-bold">Ready to process <span className="text-primary">{previewData.length}</span> rides</p>
                  </div>
                  <Button onClick={handleGenerateExcel} isLoading={isGenerating} className="w-full sm:w-auto px-10 h-14 rounded-2xl text-lg">
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
            <p className="text-sm font-bold uppercase">AsisGrab Business</p>
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

      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
      <OCRLoading isVisible={isProcessing} />
    </div>
  );
}

