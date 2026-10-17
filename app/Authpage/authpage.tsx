"use client";

import { useState } from "react";
import { RoleType, SYSTEM_ROLES } from "@/types/erp";
import { ApexLogo } from "@/components/brand/ApexLogo";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Sun, Moon, Laptop, ShieldCheck, Lock, Eye, EyeOff } from "lucide-react";

export type AuthIdentity = {
  name: string;
  username?: string;
  email?: string;
  role: RoleType;
};

const DEMO_PRESETS: { label: string; role: RoleType; identifier: string }[] = [
  { label: "Hawariya (Admin)", role: "Admin", identifier: "hawariya21" },
  { label: "Executive Admin", role: "Admin", identifier: "admin" },
  { label: "Project Manager", role: "Project Manager", identifier: "pm.abebe" },
  { label: "Site Engineer", role: "Site Engineer", identifier: "engineer.marta" },
  { label: "Procurement Officer", role: "Procurement Officer", identifier: "procurement.dawit" },
  { label: "Warehouse Manager", role: "Warehouse Manager", identifier: "warehouse.tadesse" },
  { label: "Accountant", role: "Accountant", identifier: "accountant.hana" },
  { label: "HR Manager", role: "HR Manager", identifier: "hr.selam" },
  { label: "Site Worker", role: "Worker", identifier: "worker.yonas" },
  { label: "Client Portal", role: "Client", identifier: "client.bole" },
];

function Spinner() {
  return (
    <span
      className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin mr-2 align-middle"
    />
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
      <label className="block text-xs font-bold tracking-wider uppercase text-[#6B7280] dark:text-[#A1A1A1]">
        {label} {required && <span className="text-[#EF4444]">*</span>}
      </label>
      <div className="relative flex items-center">
        <input
          type={effectiveType}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-[#FFFFFF] dark:bg-[#171717] border border-[#D1D5DB] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] dark:text-[#FFFFFF] placeholder-[#9CA3AF] dark:placeholder-[#777777] outline-none focus:border-[#111827] dark:focus:border-[#FFFFFF] transition-all shadow-2xs ${
            isPassword ? "pr-10" : ""
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 p-1 text-[#9CA3AF] dark:text-[#777777] hover:text-[#111827] dark:hover:text-[#FFFFFF] transition-colors"
            title={showPassword ? "Hide password" : "Show password"}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {hint && (
        <p className="text-[10px] font-mono text-[#9CA3AF] dark:text-[#777777] mt-0.5">
          {hint}
        </p>
      )}
    </div>
  );
}

function SignIn({
  onSwitch,
  onEnter,
}: {
  onSwitch: () => void;
  onEnter: (identity: AuthIdentity) => void;
}) {
  const [identifier, setIdentifier] = useState("hawariya21");
  const [password, setPassword] = useState("yohatli2023");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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
      setTimeout(() => {
        onEnter({
          name: json.data.user.fullName,
          username: json.data.user.username,
          email: json.data.user.email,
          role: json.data.user.role as RoleType,
        });
      }, 400);
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
      <div className="space-y-1.5">
        <label className="block text-xs font-bold tracking-wider uppercase text-[#6B7280] dark:text-[#A1A1A1]">
          ⚡ Quick Demo Role Presets
        </label>
        <select
          onChange={(e) => {
            const found = DEMO_PRESETS.find((p) => p.identifier === e.target.value);
            if (found) {
              setIdentifier(found.identifier);
              setPassword(found.identifier === "hawariya21" ? "yohatli2023" : "Password123!");
              setErrorMsg("");
            }
          }}
          className="w-full bg-[#FFFFFF] dark:bg-[#171717] border border-[#D1D5DB] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] dark:text-[#FFFFFF] outline-none focus:border-[#111827] dark:focus:border-[#FFFFFF] transition-all cursor-pointer shadow-2xs"
        >
          <option value="">Select a Demo Role to Test...</option>
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
        <label className="flex items-center gap-2 cursor-pointer select-none text-[#6B7280] dark:text-[#A1A1A1]">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-[#D1D5DB] dark:border-[#303030] text-[#111111] dark:text-[#FFFFFF] focus:ring-0 cursor-pointer accent-[#111111] dark:accent-[#FFFFFF]"
          />
          <span>Remember session</span>
        </label>

        <button
          type="button"
          onClick={handleForgotPassword}
          className="text-[#6B7280] dark:text-[#A1A1A1] hover:text-[#111827] dark:hover:text-[#FFFFFF] hover:underline"
        >
          Forgot password?
        </button>
      </div>

      <div className="text-[11px] font-mono text-[#9CA3AF] dark:text-[#777777]">
        Default seed password: <span className="font-semibold text-[#111827] dark:text-[#FFFFFF]">Password123!</span>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-[#FEF2F2] dark:bg-[#2A1515] border border-[#FECACA] dark:border-[#5C2323] text-xs text-[#991B1B] dark:text-[#FCA5A5]">
          ⚠️ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-[#F0FDF4] dark:bg-[#14291D] border border-[#BBF7D0] dark:border-[#245838] text-xs text-[#166534] dark:text-[#86EFAC]">
          ✓ {successMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] font-bold text-xs tracking-wider uppercase hover:opacity-90 transition-opacity shadow-xs disabled:opacity-50"
      >
        {loading ? (
          <>
            <Spinner /> Authenticating...
          </>
        ) : (
          "Sign In to APEX ERP"
        )}
      </button>

      <p className="text-center text-xs text-[#6B7280] dark:text-[#A1A1A1] pt-2">
        New team member?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-bold text-[#111827] dark:text-[#FFFFFF] hover:underline"
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
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleType>("Site Engineer");
  const [department, setDepartment] = useState("Engineering");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !email || !password) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          username: username.toLowerCase().trim(),
          email: email.toLowerCase().trim(),
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

      setSuccessMsg("Account created successfully! Loading workspace...");
      setTimeout(() => {
        onEnter({
          name: json.data.user.fullName,
          username: json.data.user.username,
          email: json.data.user.email,
          role: json.data.user.role as RoleType,
        });
      }, 400);
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
          <label className="block text-xs font-bold tracking-wider uppercase text-[#6B7280] dark:text-[#A1A1A1]">
            Assigned Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as RoleType)}
            className="w-full bg-[#FFFFFF] dark:bg-[#171717] border border-[#D1D5DB] dark:border-[#303030] rounded-xl px-3 py-2 text-xs text-[#111827] dark:text-[#FFFFFF] outline-none focus:border-[#111827] dark:focus:border-[#FFFFFF]"
          >
            {SYSTEM_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold tracking-wider uppercase text-[#6B7280] dark:text-[#A1A1A1]">
            Department
          </label>
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full bg-[#FFFFFF] dark:bg-[#171717] border border-[#D1D5DB] dark:border-[#303030] rounded-xl px-3 py-2 text-xs text-[#111827] dark:text-[#FFFFFF] outline-none focus:border-[#111827] dark:focus:border-[#FFFFFF]"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-[#FEF2F2] dark:bg-[#2A1515] border border-[#FECACA] dark:border-[#5C2323] text-xs text-[#991B1B] dark:text-[#FCA5A5]">
          ⚠️ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-[#F0FDF4] dark:bg-[#14291D] border border-[#BBF7D0] dark:border-[#245838] text-xs text-[#166534] dark:text-[#86EFAC]">
          ✓ {successMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] font-bold text-xs tracking-wider uppercase hover:opacity-90 transition-opacity shadow-xs disabled:opacity-50"
      >
        {loading ? (
          <>
            <Spinner /> Provisioning Profile...
          </>
        ) : (
          "Create Account & Enter"
        )}
      </button>

      <p className="text-center text-xs text-[#6B7280] dark:text-[#A1A1A1] pt-2">
        Already registered?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-bold text-[#111827] dark:text-[#FFFFFF] hover:underline"
        >
          Sign in here →
        </button>
      </p>
    </form>
  );
}

export default function AuthPage({
  onEnter,
}: {
  onEnter: (identity: AuthIdentity) => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F9FAFB] dark:bg-[#0B0B0B] text-[#111827] dark:text-[#FFFFFF] transition-colors relative overflow-hidden">
      {/* Top Floating Bar for Theme Switcher */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-1 bg-[#FFFFFF] dark:bg-[#1F1F1F] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-xl p-1 shadow-xs">
        <button
          onClick={() => setTheme("light")}
          className={`p-1.5 rounded-lg transition-colors ${
            theme === "light"
              ? "bg-[#111111] text-[#FFFFFF]"
              : "text-[#6B7280] dark:text-[#A1A1A1] hover:text-[#111827] dark:hover:text-[#FFFFFF]"
          }`}
          title="Light theme"
          aria-label="Light theme"
        >
          <Sun className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={`p-1.5 rounded-lg transition-colors ${
            theme === "dark"
              ? "bg-[#FFFFFF] text-[#111111]"
              : "text-[#6B7280] dark:text-[#A1A1A1] hover:text-[#111827] dark:hover:text-[#FFFFFF]"
          }`}
          title="Dark theme"
          aria-label="Dark theme"
        >
          <Moon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setTheme("system")}
          className={`p-1.5 rounded-lg transition-colors ${
            theme === "system"
              ? "bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111]"
              : "text-[#6B7280] dark:text-[#A1A1A1] hover:text-[#111827] dark:hover:text-[#FFFFFF]"
          }`}
          title="System theme"
          aria-label="System theme"
        >
          <Laptop className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* LEFT PANEL — Architectural Mission & Credentials Showcase */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-[#F3F4F6] dark:bg-[#111111] border-r border-[#E5E7EB] dark:border-[#2A2A2A] relative overflow-hidden">
        {/* Subtle grid backdrop */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, ${resolvedTheme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} 1px, transparent 1px),
              linear-gradient(to bottom, ${resolvedTheme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} 1px, transparent 1px)
            `,
            backgroundSize: "36px 36px",
          }}
        />

        {/* Top Logo */}
        <div className="relative z-1 flex items-center gap-3">
          <ApexLogo size={34} />
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-widest text-[#111827] dark:text-[#FFFFFF] uppercase leading-none">
              Apex <span className="text-[#6B7280] dark:text-[#A1A1A1]">ERP</span>
            </span>
            <span className="text-[9.5px] font-mono tracking-widest text-[#9CA3AF] dark:text-[#777777] uppercase mt-0.5">
              Construction Project Management
            </span>
          </div>
        </div>

        {/* Middle Value Proposition */}
        <div className="relative z-1 my-auto max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF] dark:bg-[#1F1F1F] border border-[#E5E7EB] dark:border-[#2A2A2A] text-[10px] font-mono uppercase tracking-wider text-[#6B7280] dark:text-[#A1A1A1]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#111827] dark:text-[#FFFFFF]" />
            Enterprise Access Gateway
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111827] dark:text-[#FFFFFF] leading-tight">
            Real Workflows. <br />
            <span className="text-[#6B7280] dark:text-[#A1A1A1]">
              Complete Auditability.
            </span> <br />
            Zero Disconnect.
          </h1>

          <p className="text-sm text-[#4B5563] dark:text-[#A1A1A1] leading-relaxed">
            Integrated procurement lifecycle, multi-warehouse stock ledger, project cost tracking,
            and strict 9-role authorization for construction enterprises.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#E5E7EB] dark:border-[#2A2A2A]">
            <div className="p-4 rounded-xl bg-[#FFFFFF] dark:bg-[#1F1F1F] border border-[#E5E7EB] dark:border-[#2A2A2A]">
              <div className="text-xl font-extrabold text-[#111827] dark:text-[#FFFFFF]">9 Roles</div>
              <div className="text-xs text-[#6B7280] dark:text-[#A1A1A1] mt-0.5">Strict RBAC Enforced</div>
            </div>
            <div className="p-4 rounded-xl bg-[#FFFFFF] dark:bg-[#1F1F1F] border border-[#E5E7EB] dark:border-[#2A2A2A]">
              <div className="text-xl font-extrabold text-[#111827] dark:text-[#FFFFFF]">100% Traceable</div>
              <div className="text-xs text-[#6B7280] dark:text-[#A1A1A1] mt-0.5">Dual-Entry Stock Ledger</div>
            </div>
          </div>
        </div>

        {/* Bottom Security Note */}
        <div className="relative z-1 flex items-center gap-2 text-[10px] font-mono text-[#9CA3AF] dark:text-[#777777] uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5" />
          <span>Secure HTTP-Only JWT Sessions · Multi-Tenant Isolation</span>
        </div>
      </div>

      {/* RIGHT PANEL — Authentication Form Card */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto z-1">
        <div className="w-full max-w-[440px] bg-[#FFFFFF] dark:bg-[#1F1F1F] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-3xl p-7 sm:p-9 shadow-xl space-y-6">
          {/* Mode Switch Pills */}
          <div className="inline-flex p-1 bg-[#F3F4F6] dark:bg-[#141414] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-xl">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === m
                    ? "bg-[#FFFFFF] dark:bg-[#1F1F1F] text-[#111827] dark:text-[#FFFFFF] font-bold shadow-2xs border border-[#E5E7EB] dark:border-[#2A2A2A]"
                    : "text-[#6B7280] dark:text-[#A1A1A1] hover:text-[#111827] dark:hover:text-[#FFFFFF]"
                }`}
              >
                {m === "signin" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-[#111827] dark:text-[#FFFFFF] tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create ERP Account"}
            </h2>
            <p className="mt-1 text-xs text-[#6B7280] dark:text-[#A1A1A1]">
              {mode === "signin"
                ? "Sign in with your credentials or select a demo role below."
                : "Register a new profile to access project operations and workflows."}
            </p>
          </div>

          {mode === "signin" ? (
            <SignIn onSwitch={() => setMode("signup")} onEnter={onEnter} />
          ) : (
            <SignUp onSwitch={() => setMode("signin")} onEnter={onEnter} />
          )}
        </div>
      </div>
    </div>
  );
}
