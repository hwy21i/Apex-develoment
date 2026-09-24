"use client";

import React from "react";
import Link from "next/link";

interface ApexLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
}

export function ApexLogo({
  size = 36,
  className = "",
  showText = false,
  subtitle = "Construction Project Management",
  href,
  onClick,
}: ApexLogoProps) {
  const content = (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      {/* Icon Tile - guaranteed fixed size, never compressed by flexbox */}
      <div
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
        className="rounded-xl overflow-hidden shadow-sm shadow-amber-500/20 bg-[#C9A15A] flex items-center justify-center shrink-0"
      >
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1"
        >
          {/* Construction "A" / rooftop structure */}
          <path
            d="M18 5L6 29H11.5L14.2 23H21.8L24.5 29H30L18 5Z"
            fill="#111317"
            fillOpacity="0.95"
          />
          <path
            d="M18 12L15.3 18.5H20.7L18 12Z"
            fill="#C9A15A"
          />
          <rect
            x="11"
            y="21"
            width="14"
            height="2.5"
            rx="1.25"
            fill="#111317"
            fillOpacity="0.85"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col min-w-0 leading-tight">
          <div className="flex items-center gap-1">
            <span className="text-sm font-extrabold tracking-wider uppercase text-slate-900 dark:text-white">
              Apex
            </span>
            <span className="text-sm font-extrabold tracking-wider uppercase text-[#C9A15A]">
              Build
            </span>
          </div>
          {subtitle && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider truncate uppercase">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="inline-flex items-center outline-none">
        {content}
      </Link>
    );
  }

  return content;
}

export default ApexLogo;
