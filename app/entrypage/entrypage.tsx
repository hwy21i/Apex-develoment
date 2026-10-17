"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  TrendingUp,
  Users,
  HardHat,
  ArrowRight,
  CheckCircle2,
  Clock,
  BarChart3,
  Boxes,
  FileText,
  Sun,
  Moon,
  Compass,
} from "lucide-react";
import { ApexLogo } from "@/components/brand/ApexLogo";
import { useTheme } from "@/components/theme/ThemeProvider";

const STATS = [
  { value: "214", label: "Crew Deployed", icon: HardHat, change: "+18 active this week" },
  { value: "56.4M ETB", label: "Portfolio Value", icon: TrendingUp, change: "On budget trajectory" },
  { value: "4", label: "Active Regional Sites", icon: Building2, change: "100% safety verified" },
  { value: "98.4%", label: "QA/QC Compliance", icon: Clock, change: "Top tier rating" },
];

const PROJECTS_PREVIEW = [
  { name: "Addis Heights Tower", type: "Commercial High-Rise (Bole)", progress: 74, status: "Active", budget: "28.4M ETB" },
  { name: "Modjo Logistics Hub", type: "Multi-Modal Freight Depot", progress: 42, status: "Active", budget: "14.2M ETB" },
  { name: "Hawassa Industrial Extension", type: "Special Economic Zone", progress: 84, status: "Active", budget: "8.6M ETB" },
  { name: "Dire Dawa Corridor Depot", type: "Eastern Trade Facility", progress: 29, status: "Critical Path", budget: "5.2M ETB" },
];

const SIX_CAPABILITIES = [
  {
    icon: Building2,
    title: "Project Planning & Scheduling",
    body: "Track project milestones, Gantt phases, and site dependencies from groundbreaking to final handover in real time.",
    tag: "Milestone Engine",
  },
  {
    icon: BarChart3,
    title: "Cost & Budget Control",
    body: "Real-time spend tracking against approved cost codes, committed purchase orders, and multi-currency expenditure forecasts.",
    tag: "Fiscal Guard",
  },
  {
    icon: Boxes,
    title: "Materials & Procurement",
    body: "Dual-entry stock ledger, automated PO generation, vendor quotation comparisons, and three-way match goods receipt.",
    tag: "Stock Ledger",
  },
  {
    icon: Users,
    title: "Workforce & Task Management",
    body: "Daily work orders, subcontractor coordination, shift logs, safety compliance, and live on-site crew deployment.",
    tag: "Field Coordination",
  },
  {
    icon: Compass,
    title: "Progress Monitoring",
    body: "Multi-phase completion metrics, automated S-curve velocity calculations, and documented engineering milestones.",
    tag: "Telemetry & S-Curve",
  },
  {
    icon: FileText,
    title: "Reports & Accountability",
    body: "Cryptographic audit trails, board-ready executive summaries, 9-role authorization, and one-click PDF/Excel exports.",
    tag: "Cryptographic Audit",
  },
];

export default function EntryPage({ onEnter }: { onEnter: () => void }) {
  const [visible, setVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeProjectIdx, setActiveProjectIdx] = useState(0);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    const onScroll = () => setScrolled(window.scrollY > 25);
    window.addEventListener("scroll", onScroll);
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen bg-[#F9FAFB] dark:bg-[#0B0B0B] text-[#111827] dark:text-[#FFFFFF] selection:bg-[#111111] selection:text-[#FFFFFF] dark:selection:bg-[#FFFFFF] dark:selection:text-[#111111] relative overflow-hidden transition-colors duration-300"
    >
      {/* ─── CINEMATIC PHOTOGRAPHIC ARCHITECTURAL BACKGROUND ─── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Authentic Local Construction Photography */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 scale-105 motion-safe:animate-pulse-glow"
          style={{
            backgroundImage: `url('/images/construction-hero.jpg')`,
            filter: resolvedTheme === "dark" ? "grayscale(100%) contrast(115%) brightness(70%)" : "grayscale(100%) contrast(110%) brightness(95%)",
            opacity: resolvedTheme === "dark" ? 0.55 : 0.22,
          }}
        />

        {/* Ambient Dark/Light Monochromatic Vignette Overlays that keep the photo visible */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F9FAFB]/90 via-[#F9FAFB]/60 to-[#F9FAFB]/85 dark:from-[#0B0B0B]/90 dark:via-[#0B0B0B]/50 dark:to-[#0B0B0B]/85" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#F9FAFB] dark:to-[#0B0B0B]" />

        {/* Precision Blueprint Grid Lines */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, ${resolvedTheme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.035)"} 1px, transparent 1px),
              linear-gradient(to bottom, ${resolvedTheme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.035)"} 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Top Edge Clean Monochromatic Gradient Border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#111111] dark:via-[#FFFFFF] to-transparent opacity-40" />
      </div>

      {/* ─── FLOATING HEADER / NAVIGATION ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 sm:px-12 ${
          scrolled
            ? "bg-[#FFFFFF]/90 dark:bg-[#111111]/90 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#2A2A2A] py-3 shadow-xs"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* APEX ERP Brand Mark */}
          <Link href="/" className="flex items-center gap-3 group">
            <ApexLogo size={34} />
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-widest text-[#111827] dark:text-[#FFFFFF] uppercase leading-none">
                Apex <span className="text-[#6B7280] dark:text-[#A1A1A1]">ERP</span>
              </span>
              <span className="text-[9.5px] font-mono tracking-widest text-[#9CA3AF] dark:text-[#777777] uppercase mt-0.5">
                Construction Management
              </span>
            </div>
          </Link>

          {/* Navigation Links & Action */}
          <nav className="flex items-center gap-3 sm:gap-6">
            <a
              href="#capabilities"
              className="hidden md:inline-block text-xs font-semibold text-[#6B7280] dark:text-[#A1A1A1] hover:text-[#111827] dark:hover:text-[#FFFFFF] transition-colors"
            >
              Capabilities
            </a>
            <a
              href="#telemetry"
              className="hidden md:inline-block text-xs font-semibold text-[#6B7280] dark:text-[#A1A1A1] hover:text-[#111827] dark:hover:text-[#FFFFFF] transition-colors"
            >
              Sites
            </a>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A] bg-[#FFFFFF] dark:bg-[#1F1F1F] text-[#111827] dark:text-[#FFFFFF] hover:bg-[#F3F4F6] dark:hover:bg-[#303030] transition-colors"
              title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link
              href="/login"
              className="text-xs font-semibold text-[#6B7280] dark:text-[#A1A1A1] hover:text-[#111827] dark:hover:text-[#FFFFFF] transition-colors px-3 py-1.5 rounded-lg"
            >
              Sign In
            </Link>

            <button
              onClick={onEnter}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-4 sm:px-5 py-2.5 rounded-xl bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] hover:opacity-90 transition-opacity shadow-xs"
            >
              <span>Enter Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </nav>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-screen flex items-center pt-28 pb-20 px-6 sm:px-12 z-10">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Mission & Value Proposition */}
          <div
            className={`lg:col-span-7 transition-all duration-700 ease-out ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Live Operational Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFFFFF] dark:bg-[#1F1F1F] border border-[#E5E7EB] dark:border-[#2A2A2A] mb-6 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#6B7280] dark:text-[#A1A1A1]">
                Enterprise Construction Intelligence
              </span>
            </div>

            {/* Exact Headline: Build Better. Deliver with Confidence. */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#111827] dark:text-[#FFFFFF] leading-[1.08] mb-6">
              Build Better. <br />
              <span className="text-[#6B7280] dark:text-[#A1A1A1]">
                Deliver with Confidence.
              </span>
            </h1>

            {/* Exact Subtitle */}
            <p className="text-base sm:text-lg text-[#4B5563] dark:text-[#A1A1A1] leading-relaxed max-w-xl mb-8 font-normal">
              One connected workspace for construction projects, people, materials, budgets, and progress. Built for modern builders and high-velocity field teams.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <button
                onClick={onEnter}
                className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3.5 rounded-xl bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] hover:opacity-90 transition-opacity shadow-md"
              >
                <span>Launch ERP Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                href="/login"
                className="text-sm font-semibold px-6 py-3.5 rounded-xl bg-[#FFFFFF] dark:bg-[#1F1F1F] border border-[#E5E7EB] dark:border-[#2A2A2A] text-[#111827] dark:text-[#FFFFFF] hover:bg-[#F3F4F6] dark:hover:bg-[#252525] transition-colors"
              >
                Sign In With Demo Role
              </Link>
            </div>

            {/* Assurance Badges */}
            <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-[#E5E7EB] dark:border-[#2A2A2A] text-xs text-[#6B7280] dark:text-[#A1A1A1]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#111827] dark:text-[#FFFFFF]" />
                <span>Dual-Entry Stock Ledger</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#111827] dark:text-[#FFFFFF]" />
                <span>9 Strict Security Roles</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#111827] dark:text-[#FFFFFF]" />
                <span>Fail-Secure Multi-Tenant</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Portfolio Telemetry Card */}
          <div
            id="telemetry"
            className={`lg:col-span-5 transition-all duration-700 delay-150 ease-out ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="bg-[#FFFFFF] dark:bg-[#1F1F1F] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-2xl p-5 sm:p-6 shadow-xl relative group">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB] dark:border-[#2A2A2A]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
                  <span className="text-[11px] font-mono tracking-widest uppercase font-bold text-[#111827] dark:text-[#FFFFFF]">
                    LIVE PORTFOLIO TELEMETRY
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F3F4F6] dark:bg-[#141414] text-[#111827] dark:text-[#FFFFFF] border border-[#E5E7EB] dark:border-[#2A2A2A] font-semibold">
                  4 Active Sites
                </span>
              </div>

              {/* Interactive Project List */}
              <div className="divide-y divide-[#E5E7EB] dark:divide-[#2A2A2A] my-3">
                {PROJECTS_PREVIEW.map((p, idx) => (
                  <div
                    key={p.name}
                    onClick={() => setActiveProjectIdx(idx)}
                    className={`py-3.5 px-3 rounded-xl cursor-pointer transition-all ${
                      activeProjectIdx === idx
                        ? "bg-[#F9FAFB] dark:bg-[#141414] border border-[#E5E7EB] dark:border-[#2A2A2A] shadow-xs"
                        : "hover:bg-[#F3F4F6] dark:hover:bg-[#252525]"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div>
                        <h4 className="text-xs font-bold text-[#111827] dark:text-[#FFFFFF]">{p.name}</h4>
                        <p className="text-[10px] font-mono text-[#6B7280] dark:text-[#A1A1A1]">{p.type}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-[#111827] dark:text-[#FFFFFF]">
                          {p.progress}%
                        </span>
                        <div className="mt-0.5">
                          <span
                            className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                              p.status === "Critical Path"
                                ? "bg-[#FEF2F2] dark:bg-[#2A1515] text-[#991B1B] dark:text-[#FCA5A5] border border-[#FECACA] dark:border-[#5C2323]"
                                : "bg-[#F3F4F6] dark:bg-[#141414] text-[#111827] dark:text-[#FFFFFF] border border-[#E5E7EB] dark:border-[#2A2A2A]"
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="h-1.5 w-full rounded-full bg-[#E5E7EB] dark:bg-[#2A2A2A] overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-[#111111] dark:bg-[#FFFFFF]"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Card Bottom Summary */}
              <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#2A2A2A] flex items-center justify-between text-xs font-mono text-[#6B7280] dark:text-[#A1A1A1]">
                <span>214 Field Crew</span>
                <span className="font-bold text-[#111827] dark:text-[#FFFFFF]">56.4M ETB Committed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LIVE STATS BAND ─── */}
      <section className="relative z-10 bg-[#FFFFFF] dark:bg-[#141414] border-y border-[#E5E7EB] dark:border-[#2A2A2A] py-8 px-6 sm:px-12 shadow-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex items-center gap-4 p-4 rounded-xl bg-[#F9FAFB] dark:bg-[#1F1F1F] border border-[#E5E7EB] dark:border-[#2A2A2A] hover:border-[#111827] dark:hover:border-[#FFFFFF] transition-all group"
              >
                <div className="p-3 rounded-xl bg-[#FFFFFF] dark:bg-[#141414] border border-[#E5E7EB] dark:border-[#2A2A2A] text-[#111827] dark:text-[#FFFFFF] group-hover:scale-105 transition-all shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#111827] dark:text-[#FFFFFF] tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-xs font-semibold text-[#6B7280] dark:text-[#A1A1A1] mt-0.5">
                    {stat.label}
                  </div>
                  <div className="text-[10px] font-mono text-[#9CA3AF] dark:text-[#777777] mt-0.5">
                    {stat.change}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 6 CAPABILITIES SECTION ─── */}
      <section id="capabilities" className="relative z-10 py-24 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="max-w-2xl mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF] dark:bg-[#1F1F1F] border border-[#E5E7EB] dark:border-[#2A2A2A] text-[11px] font-mono uppercase tracking-wider text-[#6B7280] dark:text-[#A1A1A1] mb-4">
              Comprehensive Operations Suite
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] dark:text-[#FFFFFF] tracking-tight leading-tight mb-4">
              Engineered for the demands of real site execution.
            </h2>
            <p className="text-sm sm:text-base text-[#6B7280] dark:text-[#A1A1A1] leading-relaxed">
              Every capability is designed from the ground up to prevent supply bottlenecks, protect project margins, and maintain strict multi-tenant accountability across your entire organization.
            </p>
          </div>

          {/* 6 Capabilities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SIX_CAPABILITIES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="bg-[#FFFFFF] dark:bg-[#1F1F1F] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-2xl p-6 sm:p-7 hover:border-[#111827] dark:hover:border-[#FFFFFF] transition-all group shadow-xs"
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-[#F3F4F6] dark:bg-[#141414] border border-[#E5E7EB] dark:border-[#2A2A2A] flex items-center justify-center text-[#111827] dark:text-[#FFFFFF] group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F3F4F6] dark:bg-[#141414] text-[#6B7280] dark:text-[#A1A1A1] border border-[#E5E7EB] dark:border-[#2A2A2A] font-bold">
                      {feat.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#111827] dark:text-[#FFFFFF] mb-2 group-hover:underline transition-all">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-[#6B7280] dark:text-[#A1A1A1] leading-relaxed font-normal">
                    {feat.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CALL TO ACTION BANNER ─── */}
      <section className="relative z-10 py-20 px-6 sm:px-12 border-t border-[#E5E7EB] dark:border-[#2A2A2A] bg-[#FFFFFF] dark:bg-[#141414]">
        <div className="max-w-5xl mx-auto rounded-3xl bg-[#F9FAFB] dark:bg-[#1F1F1F] border border-[#E5E7EB] dark:border-[#2A2A2A] p-8 sm:p-14 text-center shadow-lg relative overflow-hidden">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] dark:text-[#FFFFFF] tracking-tight leading-tight mb-4 relative z-1">
            Ready to streamline your site operations?
          </h2>
          <p className="text-sm sm:text-base text-[#6B7280] dark:text-[#A1A1A1] max-w-xl mx-auto mb-8 relative z-1">
            Sign in with verified credentials, explore pre-configured role presets, and experience end-to-end construction resource planning.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 relative z-1">
            <button
              onClick={onEnter}
              className="inline-flex items-center gap-2 text-sm font-bold px-8 py-3.5 rounded-xl bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] hover:opacity-90 transition-opacity shadow-xs"
            >
              <span>Access Control Center →</span>
            </button>
            <Link
              href="/login"
              className="px-6 py-3.5 rounded-xl text-sm font-semibold text-[#111827] dark:text-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#141414] border border-[#E5E7EB] dark:border-[#2A2A2A] hover:bg-[#F3F4F6] dark:hover:bg-[#252525] transition-colors"
            >
              Role Matrix Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 py-8 px-6 sm:px-12 border-t border-[#E5E7EB] dark:border-[#2A2A2A] bg-[#FFFFFF] dark:bg-[#111111] text-xs text-[#6B7280] dark:text-[#A1A1A1]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ApexLogo size={20} />
            <span className="font-extrabold text-[#111827] dark:text-[#FFFFFF] tracking-wider uppercase">
              Apex <span className="text-[#6B7280] dark:text-[#A1A1A1]">ERP</span>
            </span>
          </div>
          <p className="font-mono text-[11px] text-[#9CA3AF] dark:text-[#777777]">
            © {new Date().getFullYear()} APEX ERP · Enterprise Construction Project Management · All Rights Reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
