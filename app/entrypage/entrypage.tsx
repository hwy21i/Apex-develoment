"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Compass,
  MapPin,
} from "lucide-react";
import { ApexLogo } from "@/components/brand/ApexLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const STATS = [
  { value: "214", label: "Crew Deployed", icon: HardHat, change: "+18 active this week" },
  { value: "56.4M ETB", label: "Portfolio Value", icon: TrendingUp, change: "On budget trajectory" },
  { value: "4", label: "Active Regional Sites", icon: Building2, change: "100% safety verified" },
  { value: "98.4%", label: "QA/QC Compliance", icon: Clock, change: "Top tier rating" },
];

const PROJECTS_PREVIEW = [
  {
    name: "Addis Heights Tower",
    type: "Commercial High-Rise",
    location: "Bole, Addis Ababa",
    progress: 74,
    status: "Active",
    budget: "28.4M ETB",
    crew: 86,
  },
  {
    name: "Modjo Logistics Hub",
    type: "Multi-Modal Freight Depot",
    location: "Modjo Dry Port Corridor",
    progress: 42,
    status: "Active",
    budget: "14.2M ETB",
    crew: 54,
  },
  {
    name: "Hawassa Industrial Extension",
    type: "Special Economic Zone",
    location: "Hawassa Eco-Industrial Park",
    progress: 84,
    status: "Active",
    budget: "8.6M ETB",
    crew: 42,
  },
  {
    name: "Dire Dawa Corridor Depot",
    type: "Eastern Trade Facility",
    location: "Dire Dawa Free Trade Area",
    progress: 29,
    status: "Critical Path",
    budget: "5.2M ETB",
    crew: 32,
  },
];

const QUICK_DEMO_ROLES = [
  { title: "Super Admin", role: "Admin", identifier: "admin", note: "Full system & RBAC authority" },
  { title: "Project Manager", role: "Project Manager", identifier: "pm.abebe", note: "Gantt schedules & site logs" },
  { title: "Site Engineer", role: "Site Engineer", identifier: "engineer.marta", note: "QA/QC & inspection records" },
  { title: "Contractor Lead", role: "Contractor", identifier: "contractor.samuel", note: "Site execution & daily workforce logs" },
  { title: "Financial Controller", role: "Accountant", identifier: "accountant.hana", note: "Cost codes & fiscal ledger" },
  { title: "Procurement Officer", role: "Procurement Officer", identifier: "procurement.dawit", note: "POs & stock replenishment" },
];

const SIX_CAPABILITIES = [
  {
    icon: Building2,
    title: "Project Planning & Scheduling",
    body: "Track project milestones, Gantt phases, and critical path site dependencies from groundbreaking to final handover in real time.",
    tag: "Milestone Engine",
  },
  {
    icon: BarChart3,
    title: "Cost & Budget Control",
    body: "Real-time spend tracking against approved Ethiopian Birr cost codes, committed purchase orders, and expenditure forecasts.",
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
    title: "Telemetry & S-Curve Progress",
    body: "Multi-phase completion metrics, automated S-curve velocity calculations, and documented engineering milestones.",
    tag: "Telemetry & S-Curve",
  },
  {
    icon: FileText,
    title: "Reports & Cryptographic Audit",
    body: "Immutable audit trails, board-ready executive summaries, 9-role authorization, and one-click PDF/Excel exports.",
    tag: "Cryptographic Audit",
  },
];

export default function EntryPage({ onEnter }: { onEnter: () => void }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeProjectIdx, setActiveProjectIdx] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    const onScroll = () => setScrolled(window.scrollY > 25);
    window.addEventListener("scroll", onScroll);
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const handleQuickRole = (identifier: string) => {
    router.push(`/login?preset=${encodeURIComponent(identifier)}`);
  };

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen bg-[#FAFAFA] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] selection:bg-[#111111] selection:text-[#FFFFFF] dark:selection:bg-[#FFFFFF] dark:selection:text-[#111111] relative overflow-x-hidden transition-colors duration-300"
    >
      {/* ─── FULL-PAGE ARCHITECTURAL BACKGROUND IMAGE ─── */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
        <Image
          src="/images/construction-gateway.jpg"
          alt="Apex Developments Commercial Construction Project"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-35 dark:opacity-25 grayscale transition-opacity duration-500 scale-[1.01]"
        />
        {/* Full-page atmospheric veil to maintain perfect readability */}
        <div className="absolute inset-0 bg-[#FAFAFA]/85 dark:bg-[#000000]/85 backdrop-blur-[0.5px] transition-colors duration-300" />
        {/* Architectural Precision Blueprint Grid */}
        <div
          className="absolute inset-0 opacity-20 dark:opacity-10 animate-blueprint-drift pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(128,128,128,0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(128,128,128,0.08) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ─── FLOATING HEADER / NAVIGATION ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 sm:px-12 ${
          scrolled
            ? "bg-[#FFFFFF]/90 dark:bg-[#111111]/90 backdrop-blur-md border-b border-[#D4D4D4] dark:border-[#303030] py-3 shadow-xs"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* APEX ERP Brand Mark */}
          <Link href="/" className="flex items-center gap-3 group">
            <ApexLogo size={34} />
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-widest text-[#000000] dark:text-[#FFFFFF] uppercase leading-none">
                Apex <span className="text-[#666666] dark:text-[#A3A3A3]">ERP</span>
              </span>
              <span className="text-[9.5px] font-mono tracking-widest text-[#A3A3A3] dark:text-[#777777] uppercase mt-0.5">
                Construction Management
              </span>
            </div>
          </Link>

          {/* Navigation Links & Action */}
          <nav className="flex items-center gap-3 sm:gap-6">
            <a
              href="#capabilities"
              className="hidden md:inline-block text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] transition-colors"
            >
              Capabilities
            </a>
            <a
              href="#telemetry"
              className="hidden md:inline-block text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] transition-colors"
            >
              Sites
            </a>
            <a
              href="#roles"
              className="hidden lg:inline-block text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] transition-colors"
            >
              Roles
            </a>

            {/* Theme Toggle Component with Sun and Moon */}
            <ThemeToggle size="sm" />

            <Link
              href="/login"
              className="hidden sm:inline-block text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] transition-colors px-3 py-1.5 rounded-lg"
            >
              Sign In
            </Link>

            <button
              onClick={onEnter}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] hover:opacity-90 transition-opacity shadow-xs cursor-pointer shrink-0"
            >
              <span>Access Platform</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </nav>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-[100svh] w-full flex items-center pt-28 pb-16 px-6 sm:px-12 z-10 overflow-hidden">
        {/* Dedicated Hero Photographic Background Container — fills 100% without gaps */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
          {/* Authentic Construction Photography: Building Under Development with Multiple Cranes */}
          <Image
            src="/images/construction-hero-v2.jpg"
            alt="Apex Developments Construction Site with Multiple Tower Cranes"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_18%] sm:object-[center_16%] lg:object-[center_14%] opacity-90 dark:opacity-65 transition-opacity duration-300"
          />
          {/* Subtle monochrome contrast veil for readability */}
          <div className="absolute inset-0 w-full h-full bg-[#FFFFFF]/45 dark:bg-[#0A0A0A]/65 backdrop-blur-[0.5px] transition-colors duration-300" />
          {/* Directional gradient ensuring high text contrast on the left and full photo visibility on the right */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#FFFFFF]/90 via-[#FFFFFF]/75 to-transparent dark:from-[#0A0A0A]/90 dark:via-[#0A0A0A]/80 dark:to-transparent lg:w-7/12 transition-colors duration-300" />
          {/* Architectural Precision Blueprint Grid */}
          <div
            className="absolute inset-0 w-full h-full opacity-35 dark:opacity-20 animate-blueprint-drift"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(128,128,128,0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(128,128,128,0.08) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />
          {/* Subtle bottom gradient seamlessly connecting to the stats band */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#FFFFFF] dark:from-[#000000] to-transparent transition-colors duration-300" />
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
          {/* Left Column: Mission & Value Proposition */}
          <div
            className={`lg:col-span-7 transition-all duration-700 ease-out ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Live Operational Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFFFFF]/90 dark:bg-[#111111]/90 border border-[#D4D4D4] dark:border-[#303030] mb-6 shadow-xs backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[#000000] dark:bg-[#FFFFFF] animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#666666] dark:text-[#A3A3A3]">
                Apex Developments ERP
              </span>
            </div>

            {/* Exact Required Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#000000] dark:text-[#FFFFFF] leading-[1.08] mb-6">
              BUILD WITH PRECISION. <br />
              <span className="text-[#666666] dark:text-[#A3A3A3]">
                MANAGE WITH CONFIDENCE.
              </span>
            </h1>

            {/* Exact Required Description */}
            <p className="text-base sm:text-lg text-[#666666] dark:text-[#A3A3A3] leading-relaxed max-w-xl mb-8 font-normal">
              Manage construction projects, teams, materials, budgets, and progress through one integrated project management platform.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <button
                onClick={onEnter}
                className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] hover:opacity-90 active:scale-[0.98] transition-all shadow-md cursor-pointer"
              >
                <span>Access Platform</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#capabilities"
                className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3.5 rounded-xl bg-[#FFFFFF]/90 dark:bg-[#111111]/90 border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] active:scale-[0.98] transition-all backdrop-blur-sm"
              >
                <span>Learn More</span>
              </a>
              <Link
                href="/login"
                className="text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] px-3 py-2 transition-colors"
              >
                Sign In With Demo Role →
              </Link>
            </div>

            {/* ─── QUICK DEMO ROLES CHIP SELECTOR ─── */}
            <div id="roles" className="mb-8 pt-4 border-t border-[#D4D4D4] dark:border-[#303030]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono tracking-wider uppercase font-bold text-[#666666] dark:text-[#A3A3A3]">
                  ⚡ Fast-Track Demo Roles (Instant Access)
                </span>
                <span className="text-[10px] font-mono text-[#A3A3A3] dark:text-[#666666]">
                  Click to pre-fill credentials
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_DEMO_ROLES.map((r) => (
                  <button
                    key={r.identifier}
                    onClick={() => handleQuickRole(r.identifier)}
                    className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFFFFF]/90 dark:bg-[#111111]/90 border border-[#D4D4D4] dark:border-[#303030] hover:border-[#000000] dark:hover:border-[#FFFFFF] transition-all text-left cursor-pointer shadow-2xs backdrop-blur-sm"
                    title={`Test as ${r.title}: ${r.note}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#666666] dark:bg-[#A3A3A3] group-hover:bg-[#000000] dark:group-hover:bg-[#FFFFFF] transition-colors" />
                    <span className="text-xs font-bold text-[#000000] dark:text-[#FFFFFF]">
                      {r.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3]">
                      →
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Assurance Badges */}
            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[#D4D4D4] dark:border-[#303030] text-xs text-[#666666] dark:text-[#A3A3A3]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#000000] dark:text-[#FFFFFF]" />
                <span>Dual-Entry Stock Ledger</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#000000] dark:text-[#FFFFFF]" />
                <span>9 Strict Security Roles</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#000000] dark:text-[#FFFFFF]" />
                <span>Fail-Secure Multi-Tenant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#000000] dark:text-[#FFFFFF]" />
                <span>Ethiopian Geospatial Map</span>
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
            <div className="v18-card-elevated animate-v18-spring bg-[#FFFFFF]/95 dark:bg-[#111111]/95 backdrop-blur-md border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-5 sm:p-6 shadow-2xl relative group">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#000000] dark:bg-[#FFFFFF] animate-ping" />
                  <span className="text-[11px] font-mono tracking-widest uppercase font-bold text-[#000000] dark:text-[#FFFFFF]">
                    LIVE PORTFOLIO TELEMETRY
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F5F5F5] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030] font-semibold">
                  4 Active Sites
                </span>
              </div>

              {/* Interactive Project List */}
              <div className="divide-y divide-[#D4D4D4] dark:divide-[#303030] my-3">
                {PROJECTS_PREVIEW.map((p, idx) => (
                  <div
                    key={p.name}
                    onClick={() => setActiveProjectIdx(idx)}
                    className={`py-3.5 px-3 rounded-xl cursor-pointer transition-all ${
                      activeProjectIdx === idx
                        ? "bg-[#FAFAFA] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] shadow-xs"
                        : "hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F]"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-[#000000] dark:text-[#FFFFFF]">{p.name}</h4>
                          <span className="text-[9px] font-mono text-[#A3A3A3] dark:text-[#666666]">
                            ({p.crew} crew)
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#666666] dark:text-[#A3A3A3]" />
                          <span>{p.location}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">
                          {p.progress}%
                        </span>
                        <div className="mt-0.5">
                          <span
                            className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                              p.status === "Critical Path"
                                ? "bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#000000] border border-[#000000] dark:border-[#FFFFFF]"
                                : "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]"
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="h-1.5 w-full rounded-full bg-[#D4D4D4] dark:bg-[#303030] overflow-hidden mt-2">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-[#111111] dark:bg-[#FFFFFF]"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Card Bottom Summary */}
              <div className="pt-3 border-t border-[#D4D4D4] dark:border-[#303030] flex items-center justify-between text-xs font-mono text-[#666666] dark:text-[#A3A3A3]">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#000000] dark:text-[#FFFFFF]" />
                  <span>214 Field Crew</span>
                </div>
                <span className="font-bold text-[#000000] dark:text-[#FFFFFF]">56.4M ETB Committed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LIVE STATS BAND ─── */}
      <section className="relative z-10 bg-[#FFFFFF]/75 dark:bg-[#0A0A0A]/75 backdrop-blur-md border-y border-[#D4D4D4] dark:border-[#303030] py-8 px-6 sm:px-12 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {STATS.map((stat, sIdx) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`v18-card animate-v18-spring v18-stagger-${sIdx + 1} flex items-center gap-4 p-4 rounded-xl bg-[#FAFAFA] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] transition-all group`}
              >
                <div className="p-3 rounded-xl bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] group-hover:scale-105 transition-all shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] mt-0.5">
                    {stat.label}
                  </div>
                  <div className="text-[10px] font-mono text-[#A3A3A3] dark:text-[#777777] mt-0.5">
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] text-[11px] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-4">
              Comprehensive Operations Suite
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight leading-tight mb-4">
              Engineered for the demands of real site execution.
            </h2>
            <p className="text-sm sm:text-base text-[#666666] dark:text-[#A3A3A3] leading-relaxed">
              Every capability is designed from the ground up to prevent supply bottlenecks, protect project margins, and maintain strict multi-tenant accountability across your entire organization.
            </p>
          </div>

          {/* 6 Capabilities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SIX_CAPABILITIES.map((feat, fIdx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className={`v18-card animate-v18-spring v18-stagger-${(fIdx % 3) + 1} bg-[#FFFFFF]/90 dark:bg-[#111111]/90 backdrop-blur-xs border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-6 sm:p-7 transition-all group shadow-xs`}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-[#F5F5F5] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] flex items-center justify-center text-[#000000] dark:text-[#FFFFFF] group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F5F5F5] dark:bg-[#000000] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#303030] font-bold">
                      {feat.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF] mb-2 group-hover:underline transition-all">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-[#666666] dark:text-[#A3A3A3] leading-relaxed font-normal">
                    {feat.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CALL TO ACTION BANNER ─── */}
      <section className="relative z-10 py-20 px-6 sm:px-12 border-t border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF]/70 dark:bg-[#000000]/70 backdrop-blur-md transition-colors">
        <div className="max-w-5xl mx-auto rounded-3xl bg-[#FAFAFA]/90 dark:bg-[#111111]/90 backdrop-blur-xl border border-[#D4D4D4] dark:border-[#303030] p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight leading-tight mb-4 relative z-1">
            Ready to streamline your site operations?
          </h2>
          <p className="text-sm sm:text-base text-[#666666] dark:text-[#A3A3A3] max-w-xl mx-auto mb-8 relative z-1">
            Sign in with verified credentials, explore pre-configured role presets, and experience end-to-end construction resource planning.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 relative z-1">
            <button
              onClick={onEnter}
              className="inline-flex items-center gap-2 text-sm font-bold px-8 py-3.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
            >
              <span>Access Control Center →</span>
            </button>
            <Link
              href="/login"
              className="px-6 py-3.5 rounded-xl text-sm font-semibold text-[#000000] dark:text-[#FFFFFF] bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] hover:bg-[#F5F5F5] dark:hover:bg-[#252525] transition-colors"
            >
              Role Matrix Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 py-8 px-6 sm:px-12 border-t border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF]/80 dark:bg-[#111111]/80 backdrop-blur-md text-xs text-[#666666] dark:text-[#A3A3A3] transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ApexLogo size={20} />
            <span className="font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-wider uppercase">
              Apex <span className="text-[#666666] dark:text-[#A3A3A3]">ERP</span>
            </span>
          </div>
          <p className="font-mono text-[11px] text-[#A3A3A3] dark:text-[#777777]">
            © {new Date().getFullYear()} APEX ERP · Enterprise Construction Project Management · All Rights Reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
