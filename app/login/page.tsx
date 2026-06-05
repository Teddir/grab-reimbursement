"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Globe, Zap, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleMicrosoftSignIn = async () => {
    setIsLoggingIn(true);
    setErrorMsg("");
    try {
      await signIn("microsoft-entra-id", { callbackUrl: "/" });
    } catch (error) {
      setIsLoggingIn(false);
      setErrorMsg("Microsoft login failed.");
    }
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setErrorMsg("");
    
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl: "/"
      });
      
      if (res?.error) {
        setErrorMsg("Invalid email or password.");
        setIsLoggingIn(false);
      } else if (res?.url) {
        window.location.href = res.url;
      }
    } catch (error) {
      setErrorMsg("An error occurred during login.");
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
      {/* LEFT SIDE: BRANDING & VISUALS */}
      <div className="relative w-full md:w-[45%] lg:w-[40%] bg-[#00b14f] flex-col justify-between p-6 sm:p-10 md:p-16 text-white shrink-0 min-h-[450px] md:min-h-screen md:flex hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex items-center gap-3 mb-12 md:mb-0"
        >
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-xl shrink-0">
            <img src="/asisgrab-logo.png" alt="Logo" className="w-full h-full object-contain p-1 rounded-full" />
          </div>
          <span className="text-xl font-black tracking-tighter">AsisGrab Business</span>
        </motion.div>

        <div className="relative z-10 py-8 md:py-0">
          <motion.h1
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black leading-tight mb-8 tracking-tighter"
          >
            Modernize Your <br />
            <span className="text-black/20">Reimbursement</span> <br />
            Workflow.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4 sm:space-y-6"
          >
            {[
              { icon: Zap, text: "AI-Powered Receipt Extraction" },
              { icon: Globe, text: "Seamless Microsoft Entra ID Sync" },
              { icon: CheckCircle2, text: "One-Click Auto Excel Reports" },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-4 text-white/90">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm shrink-0">
                  <feature.icon size={20} className="text-white" />
                </div>
                <span className="font-semibold text-sm sm:text-base">{feature.text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="relative z-10 pt-10 border-t border-white/10 mt-8 md:mt-0"
        >
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/60">© 2026 PT Asia Sistem Indonesia</p>
        </motion.div>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-12 bg-muted/30 min-h-[500px] md:min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-md relative"
        >
          <Card className="p-6 sm:p-10 md:p-12 shadow-2xl border-none bg-card/80 backdrop-blur-xl">
            <div className="text-center mb-8 sm:mb-10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-3xl sm:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-primary">
                <ShieldCheck size={32} className="sm:w-10 sm:h-10" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mb-3 tracking-tight">Welcome Back</h2>
              <p className="text-muted-foreground text-xs sm:text-sm">
                {showEmailLogin 
                  ? "Sign in with your email address." 
                  : "Please sign in with your Microsoft account to access the dashboard."}
              </p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {errorMsg && (
                <div className="p-3 text-xs text-red-600 bg-red-100 rounded-lg text-center font-semibold">
                  {errorMsg}
                </div>
              )}
              
              {!showEmailLogin ? (
                <>
                  {/* PRIMARY: Microsoft Login */}
                  <Button
                    type="button"
                    onClick={handleMicrosoftSignIn}
                    isLoading={isLoggingIn}
                    disabled={isLoggingIn}
                    className="w-full h-14 sm:h-16 text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Sign in with Microsoft
                    {!isLoggingIn && <ArrowRight size={18} className="sm:w-5 sm:h-5 ml-2" />}
                  </Button>

                  <div className="text-center pt-4">
                    <p className="text-xs text-muted-foreground">
                      Don't have a Microsoft account?{" "}
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowEmailLogin(true);
                          setErrorMsg("");
                        }}
                        className="text-primary font-bold hover:underline"
                      >
                        Sign in with Email
                      </button>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* SECONDARY: Email Form */}
                  <form onSubmit={handleCredentialsSignIn} className="space-y-4">
                    <div className="space-y-3">
                      <input 
                        type="email" 
                        placeholder="Email Address" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                        required
                      />
                      <input 
                        type="password" 
                        placeholder="Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full h-12 sm:h-14 text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Sign In with Email
                    </Button>
                  </form>
                  
                  <div className="text-center pt-2">
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowEmailLogin(false);
                        setErrorMsg("");
                      }}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                      ← Back to Microsoft Login
                    </button>
                  </div>
                </>
              )}

              <div className="relative py-4 flex items-center">
                <div className="grow border-t border-border"></div>
                <span className="shrink mx-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Enterprise Only</span>
                <div className="grow border-t border-border"></div>
              </div>

              <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
                By signing in, you agree to our{" "}
                <Link href="/terms" className="text-primary font-bold hover:underline underline-offset-4">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary font-bold hover:underline underline-offset-4">
                  Privacy Policy
                </Link>.
              </p>
            </div>
          </Card>

          {/* Floating Accents */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl -z-10"
          />
        </motion.div>
      </div>
    </div>
  );
}
