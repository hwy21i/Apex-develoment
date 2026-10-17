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
  subtitle = "Construction ERP",
  href,
  onClick,
}: ApexLogoProps) {
  const content = (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      {/* Architectural Geometric "A" Symbol Tile */}
      <div
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
        className="rounded-xl overflow-hidden shadow-xs bg-[#111111] dark:bg-[#FFFFFF] border border-[#E5E7EB] dark:border-[#2A2A2A] flex items-center justify-center shrink-0 relative group transition-colors duration-200"
      >
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1.5 relative z-1"
        >
          {/* Outer architectural "A" / truss structure */}
          <path
            d="M18 5L6 29H11.6L14.4 23.2H21.6L24.4 29H30L18 5Z"
            className="fill-[#FFFFFF] dark:fill-[#111111] transition-colors"
          />
          {/* Inner negative space */}
          <path
            d="M18 12L15.4 18H20.6L18 12Z"
            className="fill-[#111111] dark:fill-[#FFFFFF] transition-colors"
          />
          {/* Structural horizontal tie-beam */}
          <rect
            x="11"
            y="21"
            width="14"
            height="2.2"
            rx="1.1"
            className="fill-[#E5E7EB] dark:fill-[#2A2A2A] transition-colors"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col min-w-0 leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-extrabold tracking-wider uppercase text-[#111827] dark:text-[#FFFFFF]">
              Apex
            </span>
            <span className="text-sm font-extrabold tracking-wider uppercase text-[#6B7280] dark:text-[#A1A1A1]">
              ERP
            </span>
          </div>
          {subtitle && (
            <span className="text-[9.5px] text-[#9CA3AF] dark:text-[#777777] font-mono tracking-wider truncate uppercase">
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
