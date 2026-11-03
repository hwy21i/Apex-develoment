"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { RoleType, SYSTEM_ROLES } from "@/types/erp";
import { ApexLogo } from "@/components/brand/ApexLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useCurrentUser } from "@/components/auth/UserProvider";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  User,
  Mail,
  CheckCircle2,
  X,
  Loader2,
  Briefcase,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export type AuthIdentity = {
  name: string;
  username?: string;
  email?: string;
  role: RoleType;
};

const DEMO_PRESETS: { label: string; role: RoleType; identifier: string; seedPass?: string }[] = [
  { label: "Executive Admin", role: "Admin", identifier: "admin", seedPass: "Password123!" },
  { label: "Project Manager", role: "Project Manager", identifier: "pm.abebe", seedPass: "Password123!" },
  { label: "Site Engineer", role: "Site Engineer", identifier: "engineer.marta", seedPass: "Password123!" },
  { label: "Contractor Lead", role: "Contractor", identifier: "contractor.samuel", seedPass: "Password123!" },
  { label: "Certified Supplier", role: "Supplier", identifier: "supplier.mugher", seedPass: "Password123!" },
  { label: "Procurement Officer", role: "Procurement Officer", identifier: "procurement.dawit", seedPass: "Password123!" },
  { label: "Warehouse Manager", role: "Warehouse Manager", identifier: "warehouse.tadesse", seedPass: "Password123!" },
  { label: "Accountant", role: "Accountant", identifier: "accountant.hana", seedPass: "Password123!" },
  { label: "HR Manager", role: "HR Manager", identifier: "hr.selam", seedPass: "Password123!" },
  { label: "Site Worker", role: "Worker", identifier: "worker.yonas", seedPass: "Password123!" },
  { label: "Client Portal", role: "Client", identifier: "client.bole", seedPass: "Password123!" },
];

const QUICK_ROLE_CHIPS = [
  { label: "Admin", identifier: "admin" },
  { label: "PM", identifier: "pm.abebe" },
  { label: "Site Eng", identifier: "engineer.marta" },
  { label: "Contractor", identifier: "contractor.samuel" },
  { label: "Supplier", identifier: "supplier.mugher" },
  { label: "Finance", identifier: "accountant.hana" },
];

const ROLE_DESCRIPTIONS: Record<RoleType, string> = {
  "Super Admin": "Platform-wide root administration, tenant isolation & global security policies",
  "Company Admin": "Company-wide user access controls, enterprise governance & organizational units",
  Admin: "Full system administration, user oversight, security & enterprise audit trail",
  "Project Manager": "Project schedule milestones, workforce allocation & task authorization",
  "Site Engineer": "Field telemetry, daily engineering safety logs & quality inspections",
  "Quantity Surveyor": "Bill of quantities (BOQ), material estimation, rate analysis & takeoffs",
  "Procurement Officer": "Requisitions, purchase orders lifecycle & vendor quotations",
  Storekeeper: "Site stores receipt inspection, bin tracking & bin-to-job issues",
  "Warehouse Manager": "Dual-entry stock ledger, goods receipts & materials transfers",
  Contractor: "Subcontracted works delivery, site attendance & material usage tracking",
  Supplier: "Inbound materials dispatch, route tracking telemetry & shipment fulfillment",
  Accountant: "Expenditure ledgers, payment vouchers & CSI budget variance controls",
  "HR Manager": "Personnel certifications, workforce records & site onboarding",
  Worker: "Assigned construction deliverables, task checklist & shift attendance",
  Client: "Client stakeholder milestones view, progress reports & invoice approvals",
  Viewer: "Read-only workspace access across project milestones & executive dashboards",
};

function GoogleLogo({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function GoogleButton({
  onClick,
  loading = false,
  text = "Continue with Google (Gmail)",
}: {
  onClick: () => void;
  loading?: boolean;
  text?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full py-2.5 px-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#171717] hover:bg-[#F5F5F5] dark:hover:bg-[#202020] text-[#000000] dark:text-[#FFFFFF] text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
    >
      <GoogleLogo className="w-4 h-4" />
      <span>{loading ? "Connecting to Google..." : text}</span>
    </button>
  );
}

function Spinner() {
  return (
    <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin mr-2 align-middle" />
  );
}

function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  hint,
  error,
  required = false,
  isPassword = false,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  isPassword?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const effectiveType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold tracking-wider uppercase text-[#666666] dark:text-[#A3A3A3]">
        {label} {required && <span className="text-[#666666] dark:text-[#A3A3A3]">*</span>}
      </label>
      <div className="relative flex items-center">
        <input
          type={effectiveType}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-[#FFFFFF] dark:bg-[#000000] border ${
            error
              ? "border-red-500 dark:border-red-500 focus:border-red-500"
              : "border-[#D4D4D4] dark:border-[#303030] focus:border-[#000000] dark:focus:border-[#FFFFFF]"
          } rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#A3A3A3] dark:placeholder-[#666666] outline-none transition-all shadow-2xs ${
            isPassword ? "pr-10" : ""
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 p-1 text-[#A3A3A3] dark:text-[#666666] hover:text-[#000000] dark:hover:text-[#FFFFFF] transition-colors cursor-pointer"
            title={showPassword ? "Hide password" : "Show password"}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p className="text-[10px] font-mono text-red-600 dark:text-red-400 mt-0.5 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-[10px] font-mono text-[#A3A3A3] dark:text-[#666666] mt-0.5">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * First-Time Google Sign-In Role Prompt Modal
 * Prompts user to select their role & department before entering the dashboard
 */
function GoogleRoleOnboardingModal({
  email,
  name,
  picture,
  onComplete,
  onCancel,
}: {
  email: string;
  name: string;
  picture?: string;
  onComplete: (user: any) => void;
  onCancel: () => void;
}) {
  const [selectedRole, setSelectedRole] = useState<RoleType>("Site Engineer");
  const [department, setDepartment] = useState("Engineering & Operations");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          role: selectedRole,
          department,
          picture,
          isCompleteOnboarding: true,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success || !json.data?.user) {
        setError(json.error?.message || "Failed to complete role onboarding. Please try again.");
        setSubmitting(false);
        return;
      }

      onComplete(json.data.user);
    } catch {
      setError("Network error communicating with authentication server.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F5F5F5] dark:bg-[#1C1C1C] border border-[#D4D4D4] dark:border-[#303030] flex items-center justify-center shrink-0">
              <GoogleLogo className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] block">
                Google Identity Verified
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-[#000000] dark:text-[#FFFFFF] leading-tight">
                Select Your Operational Role
              </h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={submitting}
            className="p-1.5 rounded-xl text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#1C1C1C] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Identity Preview Banner */}
        <div className="p-3.5 rounded-2xl bg-[#F9FAFB] dark:bg-[#171717] border border-[#E5E5E5] dark:border-[#282828] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] flex items-center justify-center text-sm font-bold overflow-hidden shrink-0 shadow-2xs">
            {picture ? (
              <img src={picture} alt={name} className="w-full h-full object-cover" />
            ) : name ? (
              name.charAt(0).toUpperCase()
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#000000] dark:text-[#FFFFFF] truncate">
                {name}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </span>
            </div>
            <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3] truncate mt-0.5">
              {email}
            </p>
          </div>
        </div>

        <p className="text-xs text-[#666666] dark:text-[#A3A3A3] leading-relaxed">
          Welcome to APEX ERP. As a first-time Google sign-in, please choose your assigned role to configure your operational permissions, telemetry views, and workflow authorizations.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[50vh] pr-1">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold tracking-wider uppercase text-[#666666] dark:text-[#A3A3A3]">
              Operational Role Type *
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as RoleType)}
              className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] cursor-pointer shadow-2xs"
            >
              {SYSTEM_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r} — {ROLE_DESCRIPTIONS[r] || "Standard system role"}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3] italic bg-[#F5F5F5] dark:bg-[#171717] p-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#262626]">
              💡 {ROLE_DESCRIPTIONS[selectedRole]}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold tracking-wider uppercase text-[#666666] dark:text-[#A3A3A3]">
              Department or Division
            </label>
            <input
              type="text"
              placeholder="e.g. Civil Works, Structural Logistics, Financial Audit"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#A3A3A3] dark:placeholder-[#666666] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] shadow-2xs"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-mono text-red-600 dark:text-red-400">
              ⚠️ {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] font-bold text-xs tracking-wider uppercase transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Spinner /> Finalizing Enrollment...
                </>
              ) : (
                <>
                  <span>Confirm Role & Access Dashboard</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Google Sign-In Selector Modal
 * Provides interactive sign-in with Gmail accounts
 */
function GoogleSignInModal({
  isOpen,
  onClose,
  onSuccess,
  onRequireOnboarding,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  onRequireOnboarding: (data: { email: string; name: string; picture?: string }) => void;
}) {
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSelectAccount = async (email: string, name: string, picture?: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, picture }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message || "Failed to authenticate Google identity.");
        setLoading(false);
        return;
      }

      // If user requires first-time role onboarding:
      if (json.data?.isNewUser || json.isNewUser) {
        setLoading(false);
        onClose();
        onRequireOnboarding({
          email: json.data?.email || email,
          name: json.data?.name || name,
          picture: json.data?.picture || picture,
        });
        return;
      }

      // Existing verified user
      if (json.data?.user) {
        onSuccess(json.data.user);
        return;
      }

      setError("Unexpected response from authentication endpoint.");
      setLoading(false);
    } catch {
      setError("Network error connecting to Google Auth service.");
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes("@")) {
      setError("Please enter a valid Gmail or Google Workspace email.");
      return;
    }
    const resolvedName = nameInput.trim() || emailInput.split("@")[0].replace(/[._]/g, " ");
    handleSelectAccount(emailInput.trim(), resolvedName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#E5E5E5] dark:border-[#262626] pb-4">
          <div className="flex items-center gap-2.5">
            <GoogleLogo className="w-5 h-5" />
            <h3 className="text-sm font-bold text-[#000000] dark:text-[#FFFFFF]">
              Sign in with Google
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-[#666666] dark:text-[#A3A3A3] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">
          Choose an authorized Google account or enter your Gmail address to connect to APEX ERP.
        </p>

        {/* Quick Google Test Identities */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] block">
            Instant Google Accounts
          </span>

          <button
            type="button"
            disabled={loading}
            onClick={() =>
              handleSelectAccount(
                "engineer.apex@gmail.com",
                "Marta Tesfaye",
                "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"
              )
            }
            className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#282828] hover:bg-[#F5F5F5] dark:hover:bg-[#171717] text-left transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
              MT
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] group-hover:underline">
                Marta Tesfaye (Site Engineer)
              </div>
              <div className="text-[10px] text-[#666666] dark:text-[#A3A3A3] truncate font-mono">
                engineer.apex@gmail.com
              </div>
            </div>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() =>
              handleSelectAccount(
                "manager.apex@gmail.com",
                "Abebe Kebede",
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
              )
            }
            className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#282828] hover:bg-[#F5F5F5] dark:hover:bg-[#171717] text-left transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
              AK
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] group-hover:underline">
                Abebe Kebede (Project Manager)
              </div>
              <div className="text-[10px] text-[#666666] dark:text-[#A3A3A3] truncate font-mono">
                manager.apex@gmail.com
              </div>
            </div>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() =>
              handleSelectAccount(
                "new.onboarding@gmail.com",
                "New Enterprise Specialist"
              )
            }
            className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-dashed border-[#D4D4D4] dark:border-[#383838] hover:bg-[#F5F5F5] dark:hover:bg-[#171717] text-left transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] group-hover:underline">
                New User (Triggers Role Prompt)
              </div>
              <div className="text-[10px] text-[#666666] dark:text-[#A3A3A3] truncate font-mono">
                new.onboarding@gmail.com
              </div>
            </div>
          </button>
        </div>

        {/* Custom Gmail Input Form */}
        <form onSubmit={handleCustomSubmit} className="space-y-3 pt-2 border-t border-[#E5E5E5] dark:border-[#262626]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] block">
            Or Use Another Gmail Account
          </span>

          <input
            type="email"
            required
            placeholder="you@gmail.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#A3A3A3] dark:placeholder-[#666666] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
          />

          <input
            type="text"
            placeholder="Display Name (e.g. Samuel Bekele)"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#A3A3A3] dark:placeholder-[#666666] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
          />

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-mono text-red-600 dark:text-red-400">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] font-bold text-xs tracking-wider uppercase transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Spinner /> Verifying with Google...
              </>
            ) : (
              "Authorize Google Account"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * Forgot Password Dialog
 */
function ForgotPasswordModal({
  isOpen,
  onClose,
  initialEmail = "",
}: {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid work email address.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setStatusMsg("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setStatusMsg(
          json.message ||
            `If an account with ${email} exists, password reset instructions and security tokens have been generated.`
        );
      } else {
        setErrorMsg(json.error?.message || "Failed to submit password reset request.");
      }
    } catch {
      setErrorMsg("Network error connecting to reset service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#E5E5E5] dark:border-[#262626] pb-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#000000] dark:text-[#FFFFFF]" />
            <h3 className="text-sm font-bold text-[#000000] dark:text-[#FFFFFF]">
              Password Recovery
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#666666] dark:text-[#A3A3A3] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#666666] dark:text-[#A3A3A3] leading-relaxed">
          Enter your registered work email. An encrypted password reset link and single-use verification token will be dispatched to your inbox.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input
            label="Work Email"
            type="email"
            placeholder="e.g. you@apexdev.et"
            value={email}
            onChange={setEmail}
            required
          />

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-mono text-red-600 dark:text-red-400">
              ⚠️ {errorMsg}
            </div>
          )}

          {statusMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs font-mono text-emerald-700 dark:text-emerald-300 leading-relaxed">
              ✓ {statusMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] font-bold text-xs tracking-wider uppercase transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Spinner /> : "Send Reset Token"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SignIn({
  onSwitch,
  onEnter,
  onOpenGoogle,
  initialPreset,
}: {
  onSwitch: () => void;
  onEnter: (identity: AuthIdentity) => void;
  onOpenGoogle: () => void;
  initialPreset?: string;
}) {
  const { setUserImmediate } = useCurrentUser();
  const [identifier, setIdentifier] = useState(() => initialPreset || "");
  const [password, setPassword] = useState(() =>
    initialPreset ? (DEMO_PRESETS.find((p) => p.identifier === initialPreset)?.seedPass || "Password123!") : ""
  );
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  useEffect(() => {
    if (initialPreset) {
      const match = DEMO_PRESETS.find((p) => p.identifier === initialPreset);
      if (match) {
        Promise.resolve().then(() => {
          setIdentifier(match.identifier);
          setPassword(match.seedPass || "Password123!");
        });
      }
    }
  }, [initialPreset]);

  const selectPreset = (id: string) => {
    const match = DEMO_PRESETS.find((p) => p.identifier === id);
    if (match) {
      setIdentifier(match.identifier);
      setPassword(match.seedPass || "Password123!");
      setErrorMsg("");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMsg("Please provide your email/username and password.");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password, rememberMe }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMsg(
          json.error?.message ||
            "Invalid credentials. Please verify your email or password, or use 'Forgot password?'."
        );
        setLoading(false);
        return;
      }

      setSuccessMsg("Authenticated successfully! Loading workspace...");

      setUserImmediate({
        id: json.data.user.id,
        fullName: json.data.user.fullName,
        username: json.data.user.username,
        email: json.data.user.email,
        role: json.data.user.role as RoleType,
        department: json.data.user.department,
        profileImage: json.data.user.profileImage,
        organizationId: json.data.user.organizationId,
        customPermissions: json.data.user.customPermissions,
      });

      onEnter({
        name: json.data.user.fullName,
        username: json.data.user.username,
        email: json.data.user.email,
        role: json.data.user.role as RoleType,
      });
    } catch {
      setErrorMsg("Network error connecting to authentication server.");
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleLogin} className="space-y-4">
        {/* ─── Google / Gmail OAuth Login Button ─── */}
        <GoogleButton onClick={onOpenGoogle} text="Continue with Google (Gmail)" />

        <div className="relative flex items-center justify-center py-0.5">
          <div className="border-t border-[#E5E5E5] dark:border-[#262626] w-full" />
          <span className="bg-[#FFFFFF] dark:bg-[#111111] px-2 text-[10px] font-mono uppercase tracking-wider text-[#A3A3A3] dark:text-[#666666] absolute">
            or sign in with password
          </span>
        </div>

        {/* Demo Preset Quick-Fill */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold tracking-wider uppercase text-[#666666] dark:text-[#A3A3A3]">
              ⚡ Quick Demo Roles
            </label>
            <span className="text-[10px] font-mono text-[#A3A3A3] dark:text-[#666666]">
              One-click test fill
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {QUICK_ROLE_CHIPS.map((chip) => {
              const isSelected = identifier === chip.identifier;
              return (
                <button
                  key={chip.identifier}
                  type="button"
                  onClick={() => selectPreset(chip.identifier)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-[#000000] text-[#FFFFFF] border-[#000000] dark:bg-[#FFFFFF] dark:text-[#000000] dark:border-[#FFFFFF] shadow-2xs"
                      : "bg-[#FFFFFF] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border-[#D4D4D4] dark:border-[#303030] hover:border-[#000000] dark:hover:border-[#FFFFFF]"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <select
            value={identifier}
            onChange={(e) => selectPreset(e.target.value)}
            className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] transition-all cursor-pointer shadow-2xs"
          >
            <option value="">Or browse system roles...</option>
            {DEMO_PRESETS.map((p) => (
              <option key={p.identifier} value={p.identifier}>
                {p.label} ({p.role})
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Email or Username"
          placeholder="e.g. admin, pm.abebe, or you@apexdev.et"
          value={identifier}
          onChange={setIdentifier}
          required
        />

        <Input
          label="Password"
          isPassword
          placeholder="••••••••••••"
          value={password}
          onChange={setPassword}
          required
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-[#666666] dark:text-[#A3A3A3]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] focus:ring-0 cursor-pointer accent-[#000000] dark:accent-[#FFFFFF]"
            />
            <span>Remember session</span>
          </label>

          <button
            type="button"
            onClick={() => setForgotModalOpen(true)}
            className="text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:underline cursor-pointer"
          >
            Forgot password?
          </button>
        </div>

        <div className="text-[11px] font-mono text-[#A3A3A3] dark:text-[#666666]">
          Default seed password: <span className="font-semibold text-[#000000] dark:text-[#FFFFFF]">Password123!</span>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-mono text-red-600 dark:text-red-400">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-[#F5F5F5] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-xs font-mono text-[#000000] dark:text-[#FFFFFF]">
            ✓ {successMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] font-bold text-xs tracking-wider uppercase transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Spinner /> Authenticating...
            </>
          ) : (
            "Sign In to APEX ERP"
          )}
        </button>

        <p className="text-center text-xs text-[#666666] dark:text-[#A3A3A3] pt-2">
          New team member?{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="font-bold text-[#000000] dark:text-[#FFFFFF] hover:underline cursor-pointer"
          >
            Register account →
          </button>
        </p>
      </form>

      <ForgotPasswordModal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        initialEmail={identifier.includes("@") ? identifier : ""}
      />
    </>
  );
}

function SignUp({
  onSwitch,
  onEnter,
  onOpenGoogle,
}: {
  onSwitch: () => void;
  onEnter: (identity: AuthIdentity) => void;
  onOpenGoogle: () => void;
}) {
  const { setUserImmediate } = useCurrentUser();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleType>("Site Engineer");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [emailError, setEmailError] = useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (val && !emailRegex.test(val)) {
      setEmailError("Please enter a valid work email (e.g. name@company.com)");
    } else {
      setEmailError("");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid work email address.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          password,
          role,
          department: department.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMsg(
          json.error?.message || "Registration failed. Please check your credentials or try another email."
        );
        setLoading(false);
        return;
      }

      setUserImmediate({
        id: json.data.user.id,
        fullName: json.data.user.fullName,
        username: json.data.user.username,
        email: json.data.user.email,
        role: json.data.user.role as RoleType,
        department: json.data.user.department,
        profileImage: json.data.user.profileImage,
        organizationId: json.data.user.organizationId,
      });

      onEnter({
        name: json.data.user.fullName,
        username: json.data.user.username,
        email: json.data.user.email,
        role: json.data.user.role as RoleType,
      });
    } catch {
      setErrorMsg("Network error connecting to registration server.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      {/* ─── Google / Gmail OAuth Sign-Up Button ─── */}
      <GoogleButton onClick={onOpenGoogle} text="Continue with Google (Gmail)" />

      <div className="relative flex items-center justify-center py-0.5">
        <div className="border-t border-[#E5E5E5] dark:border-[#262626] w-full" />
        <span className="bg-[#FFFFFF] dark:bg-[#111111] px-2 text-[10px] font-mono uppercase tracking-wider text-[#A3A3A3] dark:text-[#666666] absolute">
          or register with work email
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Full Name"
          placeholder="e.g. Marta Tesfaye"
          value={fullName}
          onChange={setFullName}
          required
        />
        <Input
          label="Username"
          placeholder="e.g. marta.eng"
          value={username}
          onChange={setUsername}
          required
        />
      </div>

      <Input
        label="Work Email"
        type="email"
        placeholder="marta@apexdev.et"
        value={email}
        onChange={handleEmailChange}
        error={emailError}
        required
      />

      <Input
        label="Password"
        isPassword
        placeholder="Min 8 characters"
        value={password}
        onChange={setPassword}
        hint="Must contain at least 8 characters"
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold tracking-wider uppercase text-[#666666] dark:text-[#A3A3A3]">
            Assigned Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as RoleType)}
            className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] cursor-pointer"
          >
            {SYSTEM_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold tracking-wider uppercase text-[#666666] dark:text-[#A3A3A3]">
            Department
          </label>
          <input
            type="text"
            placeholder="e.g. Civil Works, Operations"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-mono text-red-600 dark:text-red-400">
          ⚠️ {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] font-bold text-xs tracking-wider uppercase transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          <>
            <Spinner /> Creating Account...
          </>
        ) : (
          "Complete Registration"
        )}
      </button>

      <p className="text-center text-xs text-[#666666] dark:text-[#A3A3A3] pt-2">
        Already have credentials?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-bold text-[#000000] dark:text-[#FFFFFF] hover:underline cursor-pointer"
        >
          Sign In here →
        </button>
      </p>
    </form>
  );
}

export default function AuthPage({
  onEnter,
  initialPreset,
  initialGoogleOnboarding = false,
  initialGoogleEmail = "",
  initialGoogleName = "",
  initialGooglePicture = "",
}: {
  onEnter: (identity: AuthIdentity) => void;
  initialPreset?: string;
  initialGoogleOnboarding?: boolean;
  initialGoogleEmail?: string;
  initialGoogleName?: string;
  initialGooglePicture?: string;
}) {
  const { setUserImmediate } = useCurrentUser();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [onboardingData, setOnboardingData] = useState<{
    email: string;
    name: string;
    picture?: string;
  } | null>(() => {
    if (initialGoogleOnboarding && initialGoogleEmail) {
      return {
        email: initialGoogleEmail,
        name: initialGoogleName || initialGoogleEmail.split("@")[0],
        picture: initialGooglePicture || undefined,
      };
    }
    return null;
  });

  const handleGoogleSuccess = (userData: any) => {
    setUserImmediate({
      id: userData.id,
      fullName: userData.fullName,
      username: userData.username,
      email: userData.email,
      role: userData.role as RoleType,
      department: userData.department,
      profileImage: userData.profileImage,
      organizationId: userData.organizationId,
      customPermissions: userData.customPermissions,
    });
    setGoogleModalOpen(false);
    onEnter({
      name: userData.fullName,
      username: userData.username,
      email: userData.email,
      role: userData.role as RoleType,
    });
  };

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FAFAFA] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] selection:bg-[#000000] selection:text-[#FFFFFF] relative overflow-x-hidden transition-colors duration-300"
    >
      {/* ─── FULL-BLEED ARCHITECTURAL BACKGROUND IMAGE ─── */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
        <Image
          src="/images/construction-gateway.jpg"
          alt="Apex Developments Construction Architecture"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-30 dark:opacity-20 grayscale transition-opacity duration-500 scale-[1.01]"
        />
        {/* Full-bleed atmospheric veil for high text contrast */}
        <div className="absolute inset-0 bg-[#FAFAFA]/90 dark:bg-[#000000]/90 backdrop-blur-[0.5px] transition-colors duration-300" />
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

      {/* ─── MOBILE ARCHITECTURAL HERO HEADER (< lg) ─── */}
      <div className="lg:hidden w-full relative z-10 p-5 flex items-center justify-between border-b border-[#D4D4D4]/60 dark:border-[#303030]/60 bg-[#FFFFFF]/60 dark:bg-[#111111]/60 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2.5">
          <ApexLogo size={28} />
          <div className="flex flex-col">
            <span className="text-xs font-extrabold tracking-widest text-[#000000] dark:text-[#FFFFFF] uppercase leading-none">
              Apex <span className="text-[#666666] dark:text-[#A3A3A3]">ERP</span>
            </span>
            <span className="text-[8.5px] font-mono tracking-widest text-[#666666] dark:text-[#A3A3A3] uppercase mt-0.5">
              Construction Management
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFFFFF]/90 dark:bg-[#111111]/90 border border-[#D4D4D4] dark:border-[#303030] text-[9.5px] font-mono uppercase tracking-wider text-[#000000] dark:text-[#FFFFFF] shadow-2xs">
            <ShieldCheck className="w-3 h-3" />
            <span>Gateway</span>
          </div>
          <ThemeToggle size="sm" />
        </div>
      </div>

      {/* ─── DESKTOP LEFT PANEL — ARCHITECTURAL STEELWORK SHOWCASE (52% - 54% width) ─── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[54%] min-h-screen relative overflow-hidden flex-col justify-between p-10 xl:p-14 border-r border-[#D4D4D4]/80 dark:border-[#303030]/80 bg-[#FFFFFF]/40 dark:bg-[#0A0A0A]/40 backdrop-blur-sm shrink-0 z-10">
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
          <Image
            src="/images/construction-gateway.jpg"
            alt="Apex Developments Steelwork & Tower Cranes"
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover object-[center_28%] lg:object-[center_24%] opacity-70 dark:opacity-50 grayscale transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-[#FFFFFF]/45 dark:bg-[#0A0A0A]/65 backdrop-blur-[0.5px] transition-colors duration-300" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFFFFF]/95 via-[#FFFFFF]/80 to-transparent dark:from-[#0A0A0A]/95 dark:via-[#0A0A0A]/85 dark:to-transparent transition-colors duration-300" />
          <div
            className="absolute inset-0 opacity-40 dark:opacity-20 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(128,128,128,0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(128,128,128,0.08) 1px, transparent 1px)
              `,
              backgroundSize: "36px 36px",
            }}
          />
        </div>

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <ApexLogo size={36} />
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-widest text-[#000000] dark:text-[#FFFFFF] uppercase leading-none">
                Apex <span className="text-[#666666] dark:text-[#A3A3A3]">ERP</span>
              </span>
              <span className="text-[9.5px] font-mono tracking-widest text-[#666666] dark:text-[#A3A3A3] uppercase mt-0.5">
                Construction Project Management
              </span>
            </div>
          </Link>
        </div>

        {/* Middle Value Proposition */}
        <div className="relative z-10 my-auto max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFFFFF]/90 dark:bg-[#111111]/90 backdrop-blur-sm border border-[#D4D4D4] dark:border-[#303030] text-[10px] font-mono uppercase tracking-wider text-[#000000] dark:text-[#FFFFFF] shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            Enterprise Access Gateway
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#000000] dark:text-[#FFFFFF] leading-tight">
            Real Workflows. <br />
            <span className="text-[#666666] dark:text-[#A3A3A3]">
              Complete Auditability.
            </span> <br />
            Zero Disconnect.
          </h1>

          <p className="text-sm text-[#666666] dark:text-[#A3A3A3] leading-relaxed">
            Integrated procurement lifecycle, multi-warehouse stock ledger, project cost tracking,
            and strict multi-role authorization for construction enterprises.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#D4D4D4] dark:border-[#303030]">
            <div className="p-4 rounded-xl bg-[#FFFFFF]/85 dark:bg-[#111111]/85 backdrop-blur-sm border border-[#D4D4D4] dark:border-[#303030]">
              <div className="text-xl font-extrabold text-[#000000] dark:text-[#FFFFFF]">9 Roles</div>
              <div className="text-xs text-[#666666] dark:text-[#A3A3A3] mt-0.5">Strict RBAC Enforced</div>
            </div>
            <div className="p-4 rounded-xl bg-[#FFFFFF]/85 dark:bg-[#111111]/85 backdrop-blur-sm border border-[#D4D4D4] dark:border-[#303030]">
              <div className="text-xl font-extrabold text-[#000000] dark:text-[#FFFFFF]">100% Traceable</div>
              <div className="text-xs text-[#666666] dark:text-[#A3A3A3] mt-0.5">Dual-Entry Stock Ledger</div>
            </div>
          </div>
        </div>

        {/* Bottom Security Note */}
        <div className="relative z-10 flex items-center gap-2 text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5" />
          <span>Secure HTTP-Only JWT Sessions · Google OAuth & Multi-Tenant Isolation</span>
        </div>
      </div>

      {/* ─── RIGHT PANEL — AUTHENTICATION FORM CARD ─── */}
      <div className="flex-1 min-w-0 flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto relative z-10 bg-transparent">
        {/* Desktop Theme Toggle at Top Right */}
        <div className="hidden lg:block absolute top-6 right-6 z-20">
          <ThemeToggle size="sm" />
        </div>

        <div className="v18-card-elevated animate-v18-spring w-full max-w-[460px] bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-3xl p-7 sm:p-9 shadow-2xl space-y-6 relative z-10">
          {/* Mode Switch Pills */}
          <div className="inline-flex p-1 bg-[#F5F5F5] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === m
                    ? "bg-[#FFFFFF] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] font-bold shadow-2xs border border-[#D4D4D4] dark:border-[#303030]"
                    : "text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
                }`}
              >
                {m === "signin" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create ERP Account"}
            </h2>
            <p className="mt-1 text-xs text-[#666666] dark:text-[#A3A3A3]">
              {mode === "signin"
                ? "Sign in with Google OAuth or enter your work credentials below."
                : "Register a new profile to access project operations and workflows."}
            </p>
          </div>

          {mode === "signin" ? (
            <SignIn
              onSwitch={() => setMode("signup")}
              onEnter={onEnter}
              onOpenGoogle={() => setGoogleModalOpen(true)}
              initialPreset={initialPreset}
            />
          ) : (
            <SignUp
              onSwitch={() => setMode("signin")}
              onEnter={onEnter}
              onOpenGoogle={() => setGoogleModalOpen(true)}
            />
          )}
        </div>
      </div>

      {/* ─── GOOGLE SIGN-IN SELECTOR MODAL ─── */}
      <GoogleSignInModal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        onSuccess={handleGoogleSuccess}
        onRequireOnboarding={(data) => {
          setGoogleModalOpen(false);
          setOnboardingData(data);
        }}
      />

      {/* ─── FIRST-TIME GOOGLE ONBOARDING ROLE PROMPT MODAL ─── */}
      {onboardingData && (
        <GoogleRoleOnboardingModal
          email={onboardingData.email}
          name={onboardingData.name}
          picture={onboardingData.picture}
          onComplete={handleGoogleSuccess}
          onCancel={() => setOnboardingData(null)}
        />
      )}
    </div>
  );
}
