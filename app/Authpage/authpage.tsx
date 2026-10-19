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
} from "lucide-react";

export type AuthIdentity = {
  name: string;
  username?: string;
  email?: string;
  role: RoleType;
};

const DEMO_PRESETS: { label: string; role: RoleType; identifier: string; seedPass?: string }[] = [
  { label: "Hawariya (Admin)", role: "Admin", identifier: "hawariya21", seedPass: "yohatli2023" },
  { label: "Executive Admin", role: "Admin", identifier: "admin", seedPass: "Password123!" },
  { label: "Project Manager", role: "Project Manager", identifier: "pm.abebe", seedPass: "Password123!" },
  { label: "Site Engineer", role: "Site Engineer", identifier: "engineer.marta", seedPass: "Password123!" },
  { label: "Procurement Officer", role: "Procurement Officer", identifier: "procurement.dawit", seedPass: "Password123!" },
  { label: "Warehouse Manager", role: "Warehouse Manager", identifier: "warehouse.tadesse", seedPass: "Password123!" },
  { label: "Accountant", role: "Accountant", identifier: "accountant.hana", seedPass: "Password123!" },
  { label: "HR Manager", role: "HR Manager", identifier: "hr.selam", seedPass: "Password123!" },
  { label: "Site Worker", role: "Worker", identifier: "worker.yonas", seedPass: "Password123!" },
  { label: "Client Portal", role: "Client", identifier: "client.bole", seedPass: "Password123!" },
];

const QUICK_ROLE_CHIPS = [
  { label: "Admin", identifier: "hawariya21" },
  { label: "PM", identifier: "pm.abebe" },
  { label: "Site Eng", identifier: "engineer.marta" },
  { label: "Finance", identifier: "accountant.hana" },
  { label: "Procurement", identifier: "procurement.dawit" },
];

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
  required = false,
  isPassword = false,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
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
          className={`w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#A3A3A3] dark:placeholder-[#666666] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] transition-all shadow-2xs ${
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
      {hint && (
        <p className="text-[10px] font-mono text-[#A3A3A3] dark:text-[#666666] mt-0.5">
          {hint}
        </p>
      )}
    </div>
  );
}

function SignIn({
  onSwitch,
  onEnter,
  initialPreset,
}: {
  onSwitch: () => void;
  onEnter: (identity: AuthIdentity) => void;
  initialPreset?: string;
}) {
  const { setUserImmediate } = useCurrentUser();
  const [identifier, setIdentifier] = useState(() => initialPreset || "hawariya21");
  const [password, setPassword] = useState(() =>
    initialPreset && initialPreset !== "hawariya21" ? "Password123!" : "yohatli2023"
  );
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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
        body: JSON.stringify({ identifier, password, rememberMe }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMsg(json.error?.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      setSuccessMsg("Authenticated successfully! Loading workspace...");

      // Prime UserProvider state with zero delay
      setUserImmediate({
        id: json.data.user.id,
        fullName: json.data.user.fullName,
        username: json.data.user.username,
        email: json.data.user.email,
        role: json.data.user.role as RoleType,
        department: json.data.user.department,
        organizationId: json.data.user.organizationId,
        customPermissions: json.data.user.customPermissions,
      });

      // Immediate transition without artificial timeout
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

  const handleForgotPassword = async () => {
    if (!identifier.includes("@")) {
      setErrorMsg("Enter your work email in the field above, then click 'Forgot password'.");
      return;
    }
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier }),
      });
      const json = await res.json();
      setSuccessMsg(json.message || "Reset instructions generated.");
    } catch {
      setErrorMsg("Error requesting password reset.");
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
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

        {/* Quick select chip pills */}
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

        {/* Full 10-Role Selector Dropdown */}
        <select
          value={identifier}
          onChange={(e) => selectPreset(e.target.value)}
          className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] transition-all cursor-pointer shadow-2xs"
        >
          <option value="">Or browse all 10 system roles...</option>
          {DEMO_PRESETS.map((p) => (
            <option key={p.identifier} value={p.identifier}>
              {p.label} ({p.role})
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Email or Username"
        placeholder="hawariya21, pm.abebe, or you@apexdev.et"
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
          onClick={handleForgotPassword}
          className="text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:underline cursor-pointer"
        >
          Forgot password?
        </button>
      </div>

      <div className="text-[11px] font-mono text-[#A3A3A3] dark:text-[#666666]">
        Default seed password: <span className="font-semibold text-[#000000] dark:text-[#FFFFFF]">Password123!</span>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-[#F5F5F5] dark:bg-[#171717] border border-[#000000] dark:border-[#FFFFFF] text-xs font-mono text-[#000000] dark:text-[#FFFFFF]">
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
  );
}

function SignUp({
  onSwitch,
  onEnter,
}: {
  onSwitch: () => void;
  onEnter: (identity: AuthIdentity) => void;
}) {
  const { setUserImmediate } = useCurrentUser();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleType>("Worker");
  const [department, setDepartment] = useState("Engineering");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          username,
          email,
          password,
          role,
          department,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMsg(json.error?.message || "Registration failed");
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
        onChange={setEmail}
        required
      />

      <Input
        label="Password"
        isPassword
        placeholder="Min 8 chars, 1 uppercase, 1 digit"
        value={password}
        onChange={setPassword}
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
            className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
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
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full bg-[#FFFFFF] dark:bg-[#000000] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-[#F5F5F5] dark:bg-[#171717] border border-[#000000] dark:border-[#FFFFFF] text-xs font-mono text-[#000000] dark:text-[#FFFFFF]">
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
}: {
  onEnter: (identity: AuthIdentity) => void;
  initialPreset?: string;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FAFAFA] dark:bg-[#000000] text-[#000000] dark:text-[#FFFFFF] selection:bg-[#000000] selection:text-[#FFFFFF] relative overflow-x-hidden transition-colors duration-300"
    >
      {/* ─── MOBILE ARCHITECTURAL HERO HEADER (< lg) ─── */}
      <div className="lg:hidden w-full h-44 sm:h-52 relative overflow-hidden shrink-0 border-b border-[#D4D4D4] dark:border-[#303030]">
        <Image
          src="/images/construction-auth.jpg"
          alt="Apex Developments Steelwork & Tower Cranes"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_28%] opacity-75 dark:opacity-55"
        />
        <div className="absolute inset-0 bg-[#FFFFFF]/50 dark:bg-[#0A0A0A]/70 backdrop-blur-[0.5px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAFA] dark:from-[#000000] to-transparent" />
        <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
          <div className="flex items-center justify-between">
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
            <ThemeToggle size="sm" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFFFFF]/90 dark:bg-[#111111]/90 border border-[#D4D4D4] dark:border-[#303030] text-[9.5px] font-mono uppercase tracking-wider text-[#000000] dark:text-[#FFFFFF] shadow-2xs">
              <ShieldCheck className="w-3 h-3" />
              Enterprise Access Gateway
            </div>
          </div>
        </div>
      </div>

      {/* ─── DESKTOP LEFT PANEL — ARCHITECTURAL STEELWORK SHOWCASE (52% - 54% width) ─── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[54%] min-h-screen relative overflow-hidden flex-col justify-between p-10 xl:p-14 border-r border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#0A0A0A] shrink-0">
        {/* Authentic Construction Photography: Dramatic Upward View of Steelwork & Cranes */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
          <Image
            src="/images/construction-auth.jpg"
            alt="Apex Developments Steelwork & Tower Cranes"
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover object-[center_28%] lg:object-[center_24%] opacity-75 dark:opacity-55 transition-opacity duration-300"
          />
          {/* Subtle monochrome contrast veil for readability */}
          <div className="absolute inset-0 bg-[#FFFFFF]/50 dark:bg-[#0A0A0A]/70 backdrop-blur-[0.5px] transition-colors duration-300" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFFFFF]/95 via-[#FFFFFF]/80 to-transparent dark:from-[#0A0A0A]/95 dark:via-[#0A0A0A]/85 dark:to-transparent transition-colors duration-300" />
          {/* Architectural Precision Blueprint Grid */}
          <div
            className="absolute inset-0 opacity-40 dark:opacity-20"
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
            and strict 9-role authorization for construction enterprises.
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
          <span>Secure HTTP-Only JWT Sessions · Multi-Tenant Isolation</span>
        </div>
      </div>

      {/* ─── RIGHT PANEL — AUTHENTICATION FORM CARD ─── */}
      <div className="flex-1 min-w-0 flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto relative z-10 bg-[#FAFAFA] dark:bg-[#000000]">
        {/* Desktop Theme Toggle at Top Right */}
        <div className="hidden lg:block absolute top-6 right-6 z-20">
          <ThemeToggle size="sm" />
        </div>

        <div className="w-full max-w-[460px] bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-7 sm:p-9 shadow-xl space-y-6">
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
                ? "Sign in with your credentials or select a demo role below."
                : "Register a new profile to access project operations and workflows."}
            </p>
          </div>

          {mode === "signin" ? (
            <SignIn
              onSwitch={() => setMode("signup")}
              onEnter={onEnter}
              initialPreset={initialPreset}
            />
          ) : (
            <SignUp onSwitch={() => setMode("signin")} onEnter={onEnter} />
          )}
        </div>
      </div>
    </div>
  );
}
