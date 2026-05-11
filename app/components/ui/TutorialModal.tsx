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
    title: "Pilih Profil Bisnis",
    description: "Klik pada tab 'Business' atau pastikan kamu melihat riwayat perjalanan bisnis.",
    image: "/step-by-step-export-transport/export-pdf-transport-step-2.jpeg"
  },
  {
    title: "Klik Ikon Ekspor",
    description: "Cari dan klik ikon ekspor/download yang biasanya ada di pojok kanan atas.",
    image: "/step-by-step-export-transport/export-pdf-transport-step-3.jpeg"
  },
  {
    title: "Pilih Transport Statement",
    description: "Pilih opsi 'Transport Statement' untuk mendapatkan riwayat perjalanan.",
    image: "/step-by-step-export-transport/export-pdf-transport-step-4.jpeg"
  },
  {
    title: "Atur Rentang Tanggal",
    description: "Pilih periode perjalanan yang ingin kamu reimburse (maksimal 31 hari).",
    image: "/step-by-step-export-transport/export-pdf-transport-step-5.jpeg"
  },
  {
    title: "Kirim & Download PDF",
    description: "Klik 'Send Statement'. Grab akan mengirimkan PDF ke email bisnismu.",
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
            className="relative w-full max-w-4xl bg-card rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-auto max-h-[90vh]"
          >
            {/* Left Side: Image Container */}
            <div className="relative w-full md:w-1/2 bg-muted flex items-center justify-center p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="relative w-full aspect-[9/19] max-w-[280px] shadow-2xl rounded-[2rem] overflow-hidden border-8 border-zinc-900 dark:border-zinc-800"
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
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>

              <div className="flex-1 flex flex-col justify-center">
                <div className="mb-8">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                    <span className="text-xl font-black">{currentStep + 1}</span>
                  </div>
                  <motion.h3 
                    key={`title-${currentStep}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-black mb-4 tracking-tight"
                  >
                    {steps[currentStep].title}
                  </motion.h3>
                  <motion.p 
                    key={`desc-${currentStep}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-muted-foreground leading-relaxed"
                  >
                    {steps[currentStep].description}
                  </motion.p>
                </div>

                {/* Progress Dots */}
                <div className="flex gap-2 mb-10">
                  {steps.map((_, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        currentStep === idx ? "w-8 bg-primary" : "w-1.5 bg-muted-foreground/20"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-4">
                <Button
                  variant="secondary"
                  disabled={currentStep === 0}
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="flex-1 h-14 rounded-2xl"
                >
                  <ChevronLeft size={20} />
                  Back
                </Button>
                {currentStep === steps.length - 1 ? (
                  <Button
                    onClick={onClose}
                    className="flex-[2] h-14 rounded-2xl"
                  >
                    Got it!
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="flex-[2] h-14 rounded-2xl"
                  >
                    Next Step
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
