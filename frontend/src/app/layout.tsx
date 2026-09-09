import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DesignCoach — Low-Level Design Practice & Explainable AI Feedback",
  description:
    "Master Low-Level Design (LLD) by practicing real-world problems, submitting structured architectures, and receiving evidence-based evaluation against an 8-dimension rubric.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white`}
      >
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>DesignCoach LLD Evaluation Engine &copy; 2026</span>
            <span className="text-slate-400">
              Powered by Strategy Pattern &amp; 8-Dimension Rubrics
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
