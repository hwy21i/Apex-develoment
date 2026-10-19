"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  mounted: boolean;
}

const emptySubscribe = () => () => {};

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: () => {},
  mounted: false,
});

function syncThemeDOM(resolved: "light" | "dark") {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  const body = document.body;

  if (resolved === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
    root.style.colorScheme = "dark";
    if (body) {
      body.classList.add("dark");
      body.setAttribute("data-theme", "dark");
    }
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
    root.style.colorScheme = "light";
    if (body) {
      body.classList.remove("dark");
      body.setAttribute("data-theme", "light");
    }
  }

  window.dispatchEvent(
    new CustomEvent("apex-theme-changed", { detail: { theme: resolved } })
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("apex-erp-theme") as Theme | null;
        if (stored && (stored === "light" || stored === "dark" || stored === "system")) {
          return stored;
        }
      } catch {}
    }
    return "dark";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("apex-erp-theme") as Theme | null;
        if (stored === "light" || stored === "dark") return stored;
        if (stored === "system") {
          return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        if (document.documentElement.classList.contains("dark")) return "dark";
      } catch {}
    }
    return "dark";
  });

  const resolveTarget = useCallback((targetTheme: Theme): "light" | "dark" => {
    if (targetTheme === "system" && typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return targetTheme === "light" ? "light" : "dark";
  }, []);

  const applyTheme = useCallback((targetTheme: Theme) => {
    const resolved = resolveTarget(targetTheme);
    setResolvedTheme(resolved);
    syncThemeDOM(resolved);
  }, [resolveTarget]);

  // Initial client DOM sync & cross-tab storage listener
  useEffect(() => {
    syncThemeDOM(resolvedTheme);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "apex-erp-theme" && e.newValue) {
        const extTheme = e.newValue as Theme;
        if (extTheme === "light" || extTheme === "dark" || extTheme === "system") {
          setThemeState(extTheme);
          applyTheme(extTheme);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [applyTheme, resolvedTheme]);

  // System preference change listener
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? "dark" : "light";
      setResolvedTheme(resolved);

      const root = document.documentElement;
      const body = document.body;
      if (resolved === "dark") {
        root.classList.add("dark");
        root.setAttribute("data-theme", "dark");
        root.style.colorScheme = "dark";
        if (body) body.classList.add("dark");
      } else {
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
        root.style.colorScheme = "light";
        if (body) body.classList.remove("dark");
      }

      window.dispatchEvent(
        new CustomEvent("apex-theme-changed", { detail: { theme: resolved } })
      );
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("apex-erp-theme", newTheme);
    } catch {}
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
