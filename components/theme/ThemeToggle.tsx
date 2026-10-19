"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

export function ThemeToggle({ className = "", size = "md" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setTheme("light");
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setTheme("dark");
    }
  };

  return (
    <div
      role="group"
      aria-label="Color theme selector"
      className={`inline-flex items-center p-1 rounded-full border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF]/90 dark:bg-[#111111]/90 backdrop-blur-md shadow-xs transition-colors shrink-0 ${className}`}
    >
      {/* Sun Button -> Selects Light Mode */}
      <button
        type="button"
        onClick={() => setTheme("light")}
        onKeyDown={handleKeyDown}
        aria-pressed={resolvedTheme === "light"}
        aria-label="Select Light Mode"
        title="Light Mode (Press to activate)"
        className={`flex items-center justify-center rounded-full transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#888888] ${
          size === "sm" ? "w-7 h-7" : "w-8 h-8"
        } ${
          resolvedTheme === "light"
            ? "bg-[#111111] text-[#FFFFFF] shadow-xs"
            : "text-[#666666] hover:text-[#000000] hover:bg-[#F5F5F5] dark:text-[#A3A3A3] dark:hover:text-[#FFFFFF] dark:hover:bg-[#1F1F1F]"
        }`}
      >
        <Sun className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      </button>

      {/* Moon Button -> Selects Dark Mode */}
      <button
        type="button"
        onClick={() => setTheme("dark")}
        onKeyDown={handleKeyDown}
        aria-pressed={resolvedTheme === "dark"}
        aria-label="Select Dark Mode"
        title="Dark Mode (Press to activate)"
        className={`flex items-center justify-center rounded-full transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#888888] ${
          size === "sm" ? "w-7 h-7" : "w-8 h-8"
        } ${
          resolvedTheme === "dark"
            ? "bg-[#FFFFFF] text-[#000000] shadow-xs"
            : "text-[#666666] hover:text-[#000000] hover:bg-[#F5F5F5] dark:text-[#A3A3A3] dark:hover:text-[#FFFFFF] dark:hover:bg-[#1F1F1F]"
        }`}
      >
        <Moon className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      </button>
    </div>
  );
}

