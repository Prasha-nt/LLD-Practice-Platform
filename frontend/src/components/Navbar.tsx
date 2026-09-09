"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, BookOpen, History, Cpu } from "lucide-react";
import { useEffect, useState } from "react";
import { checkHealth } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const checkApi = async () => {
      const isOk = await checkHealth();
      setApiOnline(isOk);
    };
    checkApi();
    const interval = setInterval(checkApi, 8000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { href: "/problems", label: "Problems Catalog", icon: BookOpen },
    { href: "/history", label: "Attempt History", icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-amber-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent tracking-tight">
                DesignCoach
              </span>
              <span className="text-[10px] text-indigo-400 font-medium tracking-wider uppercase">
                LLD Practice &amp; AI Feedback
              </span>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="flex items-center space-x-1 sm:space-x-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* API Status Badge */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Engine:</span>
            <span className="flex items-center space-x-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  apiOnline === true
                    ? "bg-emerald-400 animate-pulse"
                    : apiOnline === false
                    ? "bg-rose-500"
                    : "bg-amber-400"
                }`}
              />
              <span
                className={`font-semibold ${
                  apiOnline === true
                    ? "text-emerald-400"
                    : apiOnline === false
                    ? "text-rose-400"
                    : "text-amber-400"
                }`}
              >
                {apiOnline === true ? "Ready" : apiOnline === false ? "Offline" : "Connecting"}
              </span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
