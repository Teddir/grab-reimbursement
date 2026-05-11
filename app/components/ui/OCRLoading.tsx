"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Scan, Search, FileText, CheckCircle2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const statuses = [
  { text: "Uploading receipts to server...", icon: FileText },
  { text: "Scanning document layout...", icon: Scan },
  { text: "AI identifying merchant details...", icon: Search },
  { text: "Extracting ride date and time...", icon: Sparkles },
  { text: "Calculating total fares...", icon: CheckCircle2 },
  { text: "Preparing your review table...", icon: Loader2 },
];

export const OCRLoading = ({ isVisible }: { isVisible: boolean }) => {
  const [currentStatus, setCurrentStatus] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCurrentStatus(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStatus((prev) => (prev + 1) % statuses.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-background/40 backdrop-blur-xl"
        >
          <div className="max-w-md w-full text-center">
            {/* Animated Scanner Mock */}
            <div className="relative w-48 h-64 mx-auto mb-12">
              <motion.div 
                className="absolute inset-0 bg-primary/5 rounded-[2rem] border-2 border-primary/20 overflow-hidden"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Paper Lines */}
                <div className="p-6 space-y-4">
                  <div className="w-full h-2 bg-primary/10 rounded-full" />
                  <div className="w-2/3 h-2 bg-primary/10 rounded-full" />
                  <div className="w-full h-2 bg-primary/10 rounded-full" />
                  <div className="w-3/4 h-2 bg-primary/10 rounded-full" />
                  <div className="w-full h-2 bg-primary/10 rounded-full" />
                  <div className="w-1/2 h-2 bg-primary/10 rounded-full" />
                </div>

                {/* Scanning Light Line */}
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(0,177,79,0.8)] z-10"
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Glowing Overlay */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              
              {/* Corner Accents */}
              <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
              <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-right-4 border-primary rounded-tr-xl" />
              <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-right-4 border-primary rounded-br-xl" />
            </div>

            {/* Status Text */}
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStatus}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    {(() => {
                      const Icon = statuses[currentStatus].icon;
                      return <Icon size={24} className={currentStatus === 5 ? "animate-spin" : ""} />;
                    })()}
                  </div>
                  <h3 className="text-xl font-black tracking-tight">{statuses[currentStatus].text}</h3>
                </motion.div>
              </AnimatePresence>
              
              <div className="flex justify-center gap-1">
                {statuses.map((_, i) => (
                  <motion.div
                    key={i}
                    className="h-1 rounded-full bg-primary"
                    animate={{ 
                      width: i === currentStatus ? 24 : 8,
                      opacity: i === currentStatus ? 1 : 0.3
                    }}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em] mt-8">Powered by Grab OCR Engine</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
