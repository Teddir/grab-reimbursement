import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://reimburse.asiasistem.com"),
  title: "AsisGrab Business | Enterprise Reimbursement Platform",
  description: "The ultimate AI-powered solution for Grab reimbursement. Automated receipt extraction, Excel report generation, and enterprise-grade security for PT Asia Sistem Indonesia.",
  keywords: ["Grab Reimbursement", "Automated Excel", "OCR Receipt", "Expense Management", "Asia Sistem Indonesia"],
  authors: [{ name: "PT Asia Sistem Indonesia" }],
  openGraph: {
    title: "AsisGrab Business",
    description: "Modernize your reimbursement workflow with AI-powered automation.",
    url: process.env.NEXTAUTH_URL || "https://reimburse.asiasistem.com",
    siteName: "AsisGrab Business",
    images: [
      {
        url: "/asisgrab-logo.png",
        width: 800,
        height: 800,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AsisGrab Business",
    description: "Modernize your reimbursement workflow with AI-powered automation.",
    images: ["/asisgrab-logo.png"],
  },
  icons: {
    icon: "/asisgrab-logo.png",
    apple: "/asisgrab-logo.png",
  },
};

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
