"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { RoleType } from "@/types/erp";

export interface CurrentUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: RoleType;
  department?: string;
  position?: string;
  profileImage?: string;
  organizationId?: string;
  customPermissions?: string[];
  permissions?: string[];
}

interface UserContextType {
  user: CurrentUser | null;
  loading: boolean;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  refetch: async () => {},
  logout: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.user) {
          const u = json.data.user;
          setUser({
            id: u.id ?? u._id ?? "",
            fullName: u.fullName ?? "",
            username: u.username ?? "",
            email: u.email ?? "",
            role: (u.role ?? "Worker") as RoleType,
            department: u.department,
            position: u.position,
            profileImage: u.profileImage,
            organizationId: u.organizationId,
            customPermissions: u.customPermissions,
            permissions: json.data.permissions || [],
          });
          return;
        }
      }
    } catch {
      // Network error — keep existing user state if any
    }
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Offline or network error — proceed with client cleanup
    }

    setUser(null);

    if (typeof window !== "undefined") {
      try {
        localStorage.clear();
        sessionStorage.clear();
        // Expire the session cookie immediately on the client side too
        document.cookie =
          "apex_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      } catch {}

      // Hard redirect to the entry page, replacing history so Back cannot return
      window.location.replace("/");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = window.location.pathname.toLowerCase();
      // Skip session fetch on public/entry pages — no session needed there
      if (p === "/" || p === "/entrypage" || p === "/login" || p === "/authpage") {
        setLoading(false);
        return;
      }
    }
    fetchUser().finally(() => setLoading(false));
  }, [fetchUser]);

  return (
    <UserContext.Provider value={{ user, loading, refetch: fetchUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

/** Returns the authenticated user from the nearest UserProvider. */
export function useCurrentUser(): UserContextType {
  return useContext(UserContext);
}

