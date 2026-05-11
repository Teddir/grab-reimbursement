"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ScrollText, ShieldCheck, Clock, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "../components/ui/Button";

export default function TermsPage() {
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
            <ScrollText size={32} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-6 tracking-tight">Terms of Service</h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-medium">
            <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
              <Clock size={14} />
              Last Updated: May 8, 2026
            </div>
            <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full">
              <ShieldCheck size={14} />
              Version 2.4
            </div>
          </div>
        </motion.div>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-12">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using the AsisGrab Business platform ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the Platform. The Platform is provided by PT Asia Sistem Indonesia for authorized enterprise employees.
            </p>
          </section>

          <section className="space-y-4 p-8 bg-muted/50 rounded-3xl border border-border">
            <div className="flex items-center gap-3 text-primary mb-2">
              <ShieldAlert size={20} />
              <h2 className="text-xl font-bold tracking-tight m-0">Enterprise Usage Only</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed m-0">
              This platform is strictly for authorized business reimbursement purposes. Any unauthorized access or fraudulent use of document extraction features will result in immediate termination of access and potential disciplinary action by your organization.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">2. User Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed">
              Users are responsible for the accuracy of the documents uploaded. While our AI engine strives for 99.9% extraction accuracy, you must validate all extracted data before final submission. The Platform is not responsible for errors in your final reimbursement claims.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Ensure all uploaded receipts are clear and legible.</li>
              <li>Tag bookings correctly (Business vs. Personal).</li>
              <li>Respect the daily extraction limits set by your organization.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">3. Data Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We process your data according to our <Link href="/privacy" className="text-primary font-bold underline underline-offset-4">Privacy Policy</Link>. By using AsisGrab, you consent to the collection and processing of ride-sharing data for reimbursement report generation.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">4. Modifications to Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              PT Asia Sistem Indonesia reserves the right to modify or discontinue the Platform (or any part thereof) with or without notice at any time. We shall not be liable to you or to any third party for any modification, price change, suspension, or discontinuance of the Service.
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
