"use client";

import { useState } from "react";
import { RoleType, SYSTEM_ROLES } from "@/types/erp";

const A = {
  bg: "#F4F5F7",
  nav: "#16181D",
  panel: "#FFFFFF",
  border: "#D9DEE5",
  borderFocus: "#3B82B6",
  text: "#17191D",
  textDim: "#69707D",
  textMuted: "#8A929E",
  brass: "#3B82B6",
  brassDim: "rgba(59,130,182,0.12)",
  brassGlow: "rgba(59,130,182,0.2)",
  error: "#DC3545",
  success: "#22A06B",
};

const INPUT_BASE: React.CSSProperties = {
  width: "100%",
  background: "#FFFFFF",
  border: `1px solid ${A.border}`,
  borderRadius: 6,
  padding: "12px 14px",
  fontFamily: "Work Sans, sans-serif",
  fontSize: 14,
  color: A.text,
  outline: "none",
  transition: "border-color 0.18s ease, box-shadow 0.18s ease",
  boxSizing: "border-box",
};

function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  hint,
  required = false,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label
        style={{
          display: "block",
          fontFamily: "Work Sans, sans-serif",
          fontSize: 12,
          fontWeight: 600,
          color: A.textDim,
          marginBottom: 6,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label} {required && <span style={{ color: A.brass }}>*</span>}
      </label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...INPUT_BASE,
          borderColor: focused ? A.brass : A.border,
          boxShadow: focused ? `0 0 0 3px ${A.brassGlow}` : "none",
        }}
      />
      {hint && (
        <p
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 10,
            color: A.textMuted,
            marginTop: 4,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export type AuthIdentity = {
  name: string;
  username?: string;
  email?: string;
  role: RoleType;
};

const DEMO_PRESETS: { label: string; role: RoleType; identifier: string }[] = [
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

function SignIn({
  onSwitch,
  onEnter,
}: {
  onSwitch: () => void;
  onEnter: (identity: AuthIdentity) => void;
}) {
  const [identifier, setIdentifier] = useState("pm.abebe");
  const [password, setPassword] = useState("Password123!");
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
        body: JSON.stringify({ identifier, password }),
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
      setErrorMsg("Enter your email in the field above, then click 'Forgot password'.");
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
    <form className="auth-form" onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Demo Preset Quick-Fill */}
      <div>
        <label
          style={{
            display: "block",
            fontFamily: "Work Sans, sans-serif",
            fontSize: 11,
            fontWeight: 600,
            color: A.brass,
            marginBottom: 6,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          ⚡ Quick Demo Role Presets
        </label>
        <select
          onChange={(e) => {
            const found = DEMO_PRESETS.find((p) => p.role === e.target.value);
            if (found) {
              setIdentifier(found.identifier);
              setPassword("Password123!");
              setErrorMsg("");
            }
          }}
          style={{
            ...INPUT_BASE,
            background: "#F8FAFC",
            fontSize: 13,
            padding: "8px 12px",
            borderColor: A.brass,
            cursor: "pointer",
          }}
        >
          <option value="">Select a Demo Role to Test...</option>
          {DEMO_PRESETS.map((p) => (
            <option key={p.role} value={p.role}>
              {p.label} ({p.role})
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Email or Username"
        placeholder="admin, pm.abebe, or you@apexdev.et"
        value={identifier}
        onChange={setIdentifier}
        required
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••••••"
        value={password}
        onChange={setPassword}
        required
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: A.textDim }}>Default Seed Password: Password123!</span>
        <button
          type="button"
          onClick={handleForgotPassword}
          style={{
            fontFamily: "Work Sans, sans-serif",
            fontSize: 12,
            color: A.brass,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Forgot password?
        </button>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(220,53,69,0.08)",
            border: `1px solid ${A.error}`,
            borderRadius: 6,
            fontSize: 12,
            color: A.error,
          }}
        >
          ⚠️ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(34,160,107,0.08)",
            border: `1px solid ${A.success}`,
            borderRadius: 6,
            fontSize: 12,
            color: A.success,
          }}
        >
          ✓ {successMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 6,
          border: "none",
          background: loading ? A.brassDim : A.brass,
          color: loading ? A.textDim : "#FFFFFF",
          fontFamily: "Work Sans, sans-serif",
          fontSize: 14,
          fontWeight: 700,
          cursor: loading ? "default" : "pointer",
          letterSpacing: "0.02em",
          transition: "all 0.18s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: `0 4px 14px ${A.brassGlow}`,
        }}
      >
        {loading ? (
          <>
            <Spinner /> Authenticating...
          </>
        ) : (
          "Sign In to ERP"
        )}
      </button>

      <p
        style={{
          textAlign: "center",
          fontFamily: "Work Sans, sans-serif",
          fontSize: 13,
          color: A.textDim,
          marginTop: 4,
        }}
      >
        New team member?{" "}
        <button
          type="button"
          onClick={onSwitch}
          style={{
            color: A.brass,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
            fontFamily: "inherit",
          }}
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
    <form className="auth-form" onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="auth-two-column" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
        type="password"
        placeholder="Min 8 characters"
        value={password}
        onChange={setPassword}
        hint="Must be at least 8 characters"
        required
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label
            style={{
              display: "block",
              fontFamily: "Work Sans, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: A.textDim,
              marginBottom: 6,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Assigned ERP Role *
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as RoleType)}
            style={{
              ...INPUT_BASE,
              cursor: "pointer",
            }}
          >
            {SYSTEM_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Department"
          placeholder="e.g. Structural Engineering"
          value={department}
          onChange={setDepartment}
        />
      </div>

      {errorMsg && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(220,53,69,0.08)",
            border: `1px solid ${A.error}`,
            borderRadius: 6,
            fontSize: 12,
            color: A.error,
          }}
        >
          ⚠️ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(34,160,107,0.08)",
            border: `1px solid ${A.success}`,
            borderRadius: 6,
            fontSize: 12,
            color: A.success,
          }}
        >
          ✓ {successMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 6,
          border: "none",
          background: loading ? A.brassDim : A.brass,
          color: loading ? A.textDim : "#FFFFFF",
          fontFamily: "Work Sans, sans-serif",
          fontSize: 14,
          fontWeight: 700,
          cursor: loading ? "default" : "pointer",
          letterSpacing: "0.02em",
          transition: "all 0.18s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: `0 4px 14px ${A.brassGlow}`,
        }}
      >
        {loading ? (
          <>
            <Spinner /> Registering...
          </>
        ) : (
          "Create Verified Account"
        )}
      </button>

      <p
        style={{
          textAlign: "center",
          fontFamily: "Work Sans, sans-serif",
          fontSize: 13,
          color: A.textDim,
        }}
      >
        Already registered?{" "}
        <button
          type="button"
          onClick={onSwitch}
          style={{
            color: A.brass,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
            fontFamily: "inherit",
          }}
        >
          Sign in →
        </button>
      </p>
    </form>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: "spin 0.8s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="20 18"
      />
    </svg>
  );
}

export default function AuthPage({ onEnter }: { onEnter: (identity: AuthIdentity) => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div
      className="auth-shell"
      style={{
        display: "flex",
        minHeight: "100vh",
        background: A.bg,
        fontFamily: "Work Sans, sans-serif",
      }}
    >
      {/* LEFT PANEL — Architecture / Brand */}
      <div
        className="auth-brand-panel"
        style={{
          flex: "0 0 46%",
          position: "relative",
          overflow: "hidden",
          background: A.nav,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(rgba(59,130,182,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,182,0.05) 1px, transparent 1px)`,
            backgroundSize: "44px 44px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(to right, ${A.brass}, transparent)`,
          }}
        />

        <div
          className="auth-brand-inner"
          style={{
            position: "relative",
            padding: "44px 48px",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            zIndex: 1,
          }}
        >
          {/* Logo */}
          <div className="auth-brand-logo flex items-center gap-2" style={{ marginBottom: "auto" }}>
            <div style={{ width: 4, height: 24, background: A.brass, borderRadius: 2 }} />
            <span
              style={{
                fontFamily: "Roboto Slab, serif",
                fontSize: 18,
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "-0.01em",
              }}
            >
              Apex <span style={{ color: A.brass }}>Developments ERP</span>
            </span>
          </div>

          <div
            className="auth-brand-copy"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              paddingBottom: 24,
            }}
          >
            <div
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
                color: A.brass,
                letterSpacing: "0.2em",
                marginBottom: 16,
                textTransform: "uppercase",
              }}
            >
              Enterprise Construction Management
            </div>

            <h1
              style={{
                fontFamily: "Roboto Slab, serif",
                fontSize: 38,
                fontWeight: 700,
                color: "#FFFFFF",
                lineHeight: 1.15,
                letterSpacing: "-0.025em",
                marginBottom: 18,
              }}
            >
              Real Workflows.
              <br />
              <span style={{ color: A.brass }}>Complete Auditability.</span>
              <br />
              Zero Disconnect.
            </h1>

            <p
              style={{
                fontSize: 14,
                color: "#CBD5E1",
                lineHeight: 1.7,
                maxWidth: 420,
                marginBottom: 36,
              }}
            >
              Integrated procurement lifecycle, multi-warehouse stock ledger, project cost tracking,
              and strict 9-role authorization for construction enterprises.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                borderTop: "1px solid rgba(255,255,255,0.1)",
                paddingTop: 24,
              }}
            >
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: A.brass }}>9 Roles</div>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>Granular RBAC Enforced</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: A.brass }}>100% Traceable</div>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>Dual-Entry Stock Ledger</div>
              </div>
            </div>
          </div>

          <div
            className="auth-security-note"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10,
              color: "#64748B",
              letterSpacing: "0.1em",
            }}
          >
            🔒 SECURE HTTP-ONLY JWT SESSIONS · RESTRICTED ACCESS
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — Form */}
      <div
        className="auth-form-panel"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 32px",
          overflowY: "auto",
        }}
      >
        <div className="auth-form-content" style={{ width: "100%", maxWidth: 440 }}>
          {/* Mode Toggle */}
          <div
            className="auth-mode-toggle"
            style={{
              display: "inline-flex",
              background: "#E2E8F0",
              borderRadius: 6,
              padding: 3,
              marginBottom: 28,
            }}
          >
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  fontFamily: "Work Sans, sans-serif",
                  fontSize: 13,
                  fontWeight: mode === m ? 600 : 400,
                  padding: "7px 20px",
                  borderRadius: 4,
                  border: "none",
                  cursor: "pointer",
                  background: mode === m ? "#FFFFFF" : "transparent",
                  color: mode === m ? "#0F172A" : "#64748B",
                  boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.18s ease",
                }}
              >
                {m === "signin" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 24 }}>
            <h2
              style={{
                fontFamily: "Roboto Slab, serif",
                fontSize: 26,
                fontWeight: 700,
                color: A.text,
                letterSpacing: "-0.02em",
                marginBottom: 6,
              }}
            >
              {mode === "signin" ? "Welcome back." : "Create ERP Account."}
            </h2>
            <p style={{ fontSize: 13, color: A.textDim, lineHeight: 1.5 }}>
              {mode === "signin"
                ? "Sign in with your verified credentials or select a demo role."
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
