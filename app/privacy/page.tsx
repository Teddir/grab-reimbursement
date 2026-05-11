"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Lock, Eye, Database, FileCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "../components/ui/Button";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/login">
            <Button variant="secondary" className="gap-2 rounded-xl h-11 px-4">
              <ArrowLeft size={18} />
              Back to Login
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md border border-border overflow-hidden p-0.5">
              <img src="/asisgrab-logo.png" alt="Logo" className="w-full h-full object-contain rounded-full" />
            </div>
            <span className="text-sm font-black tracking-tighter">AsisGrab Business</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-8">
            <Lock size={32} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-6 tracking-tight">Privacy Policy</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium bg-muted px-3 py-1.5 rounded-full w-fit">
            <ShieldCheck size={14} />
            Your data is encrypted and secure
          </div>
        </motion.div>

        <div className="space-y-16">
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-primary">
              <Eye size={24} />
              <h2 className="text-2xl font-black tracking-tight">How we use your data</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg">
              AsisGrab Business is designed to process reimbursement documents with maximum efficiency while respecting your privacy. We only collect the data necessary to generate your reports.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-muted/50 rounded-3xl border border-border">
              <Database className="text-primary mb-4" size={24} />
              <h3 className="text-xl font-bold mb-3">Data Collection</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We collect transaction dates, merchant names (Grab), booking IDs, and fare totals extracted from your uploaded PDFs or images.
              </p>
            </div>
            <div className="p-8 bg-muted/50 rounded-3xl border border-border">
              <FileCheck className="text-primary mb-4" size={24} />
              <h3 className="text-xl font-bold mb-3">Data Security</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                All uploaded documents are processed in-memory. We do not store your physical receipt images permanently unless required by your organization's policy.
              </p>
            </div>
          </div>

          <section className="space-y-6">
            <h2 className="text-2xl font-black tracking-tight">Information Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell, trade, or otherwise transfer your personal information to outside parties. Your extracted reimbursement data is only accessible to you and your authorized organization administrators for financial auditing purposes.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-black tracking-tight">Your Choices</h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to review, edit, or delete any extracted data before generating a report. If you have concerns about a specific document, you can reset your session at any time.
            </p>
          </section>
        </div>

        <footer className="mt-24 pt-12 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2026 PT Asia Sistem Indonesia. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
