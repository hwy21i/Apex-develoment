"use client";

import { useEffect, useState } from "react";
import EntryPage from "./entrypage/entrypage";
import AuthPage, { AuthIdentity } from "./Authpage/authpage";
import Workspace from "./workspace";
import { RoleType } from "@/types/erp";

export default function App() {
  const [screen, setScreen] = useState<"loading" | "entry" | "auth" | "workspace" | "service-error">("loading");
  const [currentUser, setCurrentUser] = useState<AuthIdentity | null>(null);

  // Check active session on initial load
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.status === 401) {
          setScreen("entry");
          return;
        }
        if (!res.ok) {
  
          setScreen("service-error");
          return;
        }
        const json = await res.json();
        if (json.success && json.data?.user) {
          setCurrentUser({
            name: json.data.user.fullName,
            username: json.data.user.username,
            email: json.data.user.email,
            role: json.data.user.role as RoleType,
          });
          setScreen("workspace");
          return;
        }

        setScreen("service-error");
      } catch {

        setScreen("service-error");
      }
    }

    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    }
    setScreen("entry");
  };

  if (screen === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F172A",
          color: "#94A3B8",
          fontFamily: "Work Sans, sans-serif",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ width: 4, height: 28, background: "#3B82B6", borderRadius: 2 }} />
        <span style={{ fontSize: 13, letterSpacing: "0.1em" }}>APEX DEVELOPMENTS ERP · LOADING</span>
      </div>
    );
  }

  if (screen === "entry") {
    return <EntryPage onEnter={() => setScreen("auth")} />;
  }

  if (screen === "service-error") {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#0F172A", color: "#E2E8F0", fontFamily: "Work Sans, sans-serif" }}>
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Service unavailable</h1>
          <p style={{ color: "#94A3B8", marginBottom: 20 }}>We could not verify your session. Check the connection and try again.</p>
          <button type="button" onClick={() => { setScreen("loading"); window.location.reload(); }} style={{ padding: "11px 18px", border: 0, borderRadius: 6, background: "#3B82B6", color: "#FFFFFF", fontWeight: 700, cursor: "pointer" }}>Try again</button>
        </div>
      </div>
    );
  }

  if (screen === "auth") {
    return (
      <AuthPage
        onEnter={(identity) => {
          setCurrentUser(identity);
          setScreen("workspace");
        }}
      />
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <Workspace
      userName={currentUser.name}
      userRole={currentUser.role}
      onLogout={handleLogout}
    />
  );
}
