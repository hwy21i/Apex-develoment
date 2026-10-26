"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { usePathname } from "next/navigation";
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
  setUserImmediate: (user: CurrentUser) => void;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  setUserImmediate: () => {},
  refetch: async () => {},
  logout: async () => {},
});

const PUBLIC_ROUTES = new Set(["/", "/entrypage", "/login", "/authpage"]);
const USER_SESSION_KEY = "apex_user_session";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem(USER_SESSION_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.id) return parsed;
        }
      } catch {}
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem(USER_SESSION_KEY);
        if (cached) return false;
      } catch {}
    }
    return false;
  });
  const userRef = useRef<CurrentUser | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.user) {
          const u = json.data.user;
          const mapped: CurrentUser = {
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
          };
          const current = userRef.current;
          if (
            !current ||
            current.id !== mapped.id ||
            current.fullName !== mapped.fullName ||
            current.role !== mapped.role ||
            current.email !== mapped.email
          ) {
            setUser(mapped);
          }
          try {
            sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(mapped));
          } catch {}
          return;
        }
      } else if (res.status === 401) {
        // Explicitly unauthenticated
        setUser(null);
        try {
          sessionStorage.removeItem(USER_SESSION_KEY);
        } catch {}
      }
    } catch {
      // Network or transient error: keep existing user state rather than clearing
      if (!userRef.current) {
        setUser(null);
      }
    }
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
        sessionStorage.removeItem(USER_SESSION_KEY);
        sessionStorage.clear();
        localStorage.removeItem(USER_SESSION_KEY);
        // Expire the session cookie immediately on the client side too
        document.cookie =
          "apex_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      } catch {}

      // Hard redirect to the entry page, replacing history so Back cannot return
      window.location.replace("/");
    }
  }, []);

  // Sync session on mount or route changes to protected areas
  useEffect(() => {
    let ignore = false;
    const lowerPath = (pathname || "").toLowerCase();
    const isPublic = PUBLIC_ROUTES.has(lowerPath);

    if (isPublic) {
      return;
    }

    // Revalidate session in background on navigation without blocking
    fetchUser().finally(() => {
      if (!ignore) setLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [pathname, fetchUser]);

  const setUserImmediate = useCallback((u: CurrentUser) => {
    setUser(u);
    setLoading(false);
    try {
      sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(u));
    } catch {}
  }, []);

  return (
    <UserContext.Provider
      value={{ user, loading, setUserImmediate, refetch: fetchUser, logout }}
    >
      {children}
    </UserContext.Provider>
  );
}

/** Returns the authenticated user from the nearest UserProvider. */
export function useCurrentUser(): UserContextType {
  return useContext(UserContext);
}
