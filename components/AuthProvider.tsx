"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { RoleType, SessionUser } from "@/types/erp";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "service-error";

type AuthContextValue = {
  user: SessionUser | null;
  status: AuthStatus;
  refreshUser: () => Promise<SessionUser | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (response.status === 401) {
        setUser(null);
        setStatus("unauthenticated");
        return null;
      }
      if (!response.ok) {
        setStatus("service-error");
        return null;
      }

      const json = await response.json();
      if (!json.success || !json.data?.user) {
        setStatus("service-error");
        return null;
      }

      const sessionUser: SessionUser = {
        id: json.data.user.id,
        fullName: json.data.user.fullName,
        username: json.data.user.username,
        email: json.data.user.email,
        role: json.data.user.role as RoleType,
        department: json.data.user.department,
        assignedProjects: json.data.user.assignedProjects,
      };
      setUser(sessionUser);
      setStatus("authenticated");
      return sessionUser;
    } catch {
      setStatus("service-error");
      return null;
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshUser();
    });
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo(() => ({ user, status, refreshUser, logout }), [user, status, refreshUser, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
