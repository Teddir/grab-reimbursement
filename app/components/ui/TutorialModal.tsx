"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";
import { Card } from "./Card";
import Image from "next/image";
import { useState } from "react";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    title: "Buka Riwayat Aktivitas",
    description: "Buka aplikasi Grab dan masuk ke menu 'Activity' atau 'Aktivitas'.",
    image: "/step-by-step-export-transport/export-pdf-transport-step-1.jpeg"
  },
  {
    title: "Klik 'Lihat Pengeluaran'",
    description: "Klik pada teks berwarna biru 'Lihat Pengeluaran' untuk melihat riwayat perjalanan bisnis.",
    image: "/step-by-step-export-transport/export-pdf-transport-step-2.jpeg"
  },
  {
    title: "Klik Transaksi Terbaru",
    description: "Cari dan klik ikon panah ke kanan.",
    image: "/step-by-step-export-transport/export-pdf-transport-step-3.jpeg"
  },
  {
    title: "Klik Icon Download",
    description: "Cari dan klik ikon download di kanan atas.",
    image: "/step-by-step-export-transport/export-pdf-transport-step-4.jpeg"
  },
  {
    title: "Pilih Transport Statement",
    description: "Pilih opsi 'Transport Statement' untuk mendapatkan riwayat perjalanan. Kemudian klik ekspor",
    image: "/step-by-step-export-transport/export-pdf-transport-step-5.jpeg"
  },
  {
    title: "Cek Email & Download PDF",
    description: "Grab akan mengirimkan PDF ke email bisnismu. Kemudian download dan upload file PDF tersebut ke dalam sistem.",
    image: "/step-by-step-export-transport/export-pdf-transport-step-6.jpeg"
  }
];

export const TutorialModal = ({ isOpen, onClose }: TutorialModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-card rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-y-auto md:overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto md:max-h-[90vh]"
          >
            {/* Left Side: Image Container */}
            <div className="relative w-full md:w-1/2 bg-muted flex items-center justify-center p-6 sm:p-8 shrink-0 min-h-[400px] md:min-h-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="relative w-full aspect-[9/19] max-w-[220px] sm:max-w-[280px] shadow-2xl rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border-4 sm:border-8 border-zinc-900 dark:border-zinc-800"
                >
                  <img
                    src={steps[currentStep].image}
                    alt={steps[currentStep].title}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Step Counter Overlay */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>

            {/* Right Side: Content */}
            <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-12 flex flex-col min-h-0">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground z-10 bg-card/50 backdrop-blur-md sm:bg-transparent"
              >
                <X size={20} />
              </button>

              <div className="flex-1 flex flex-col justify-center py-4">
                <div className="mb-6 sm:mb-8">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-primary mb-4 sm:mb-6">
                    <span className="text-lg sm:text-xl font-black">{currentStep + 1}</span>
                  </div>
                  <motion.h3
                    key={`title-${currentStep}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xl sm:text-2xl font-black mb-3 sm:mb-4 tracking-tight"
                  >
                    {steps[currentStep].title}
                  </motion.h3>
                  <motion.p
                    key={`desc-${currentStep}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm sm:text-base text-muted-foreground leading-relaxed"
                  >
                    {steps[currentStep].description}
                  </motion.p>
                </div>

                {/* Progress Dots */}
                <div className="flex gap-2 mb-8 sm:mb-10">
                  {steps.map((_, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "h-1 sm:h-1.5 rounded-full transition-all duration-300",
                        currentStep === idx ? "w-6 sm:w-8 bg-primary" : "w-1 sm:w-1.5 bg-muted-foreground/20"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3 sm:gap-4 mt-auto md:pb-0 pb-12">
                <Button
                  variant="secondary"
                  disabled={currentStep === 0}
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="flex-1 h-12 sm:h-14 rounded-xl sm:rounded-2xl"
                >
                  <ChevronLeft size={20} />
                  <span className="hidden sm:inline">Back</span>
                </Button>
                {currentStep === steps.length - 1 ? (
                  <Button
                    onClick={onClose}
                    className="flex-[2] h-12 sm:h-14 rounded-xl sm:rounded-2xl"
                  >
                    Got it!
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="flex-[2] h-12 sm:h-14 rounded-xl sm:rounded-2xl"
                  >
                    Next
                    <span className="hidden sm:inline"> Step</span>
                    <ChevronRight size={20} />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Helper for class merging
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
