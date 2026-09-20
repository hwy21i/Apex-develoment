"use client";

import { useEffect, useState } from "react";
import EntryPage from "./entrypage/entrypage";
import AuthPage, { AuthIdentity } from "./Authpage/authpage";
import Workspace from "./workspace";
import { RoleType } from "@/types/erp";

export default function App() {
  const [screen, setScreen] = useState<"loading" | "entry" | "auth" | "workspace">("loading");
  const [currentUser, setCurrentUser] = useState<AuthIdentity | null>(null);

  // Check active session on initial load
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
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
        }
      } catch {
        // Fallback to entry page
      }
      setScreen("entry");
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
