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
      {/* Architectural Geometric Stencil "A" Emblem Tile - Pure Monochrome */}
      <div
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
        className="rounded-xl overflow-hidden shadow-xs bg-[#000000] dark:bg-[#111111] border border-[#303030] flex items-center justify-center shrink-0 relative group transition-colors duration-200"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1.5 relative z-1"
        >
          {/* Upper Triangular Apex Cap */}
          <polygon
            points="50,12 36,40 43,40 50,26 57,40 64,40"
            className="fill-[#FFFFFF] transition-colors"
          />
          {/* Lower Left Leg */}
          <polygon
            points="34,44 42,44 26,86 16,86"
            className="fill-[#FFFFFF] transition-colors"
          />
          {/* Lower Right Leg */}
          <polygon
            points="66,44 58,44 74,86 84,86"
            className="fill-[#FFFFFF] transition-colors"
          />
          {/* Suspended Curved Chevron Crossbar - Pure White Monochrome */}
          <path
            d="M34,60 C42,66 58,66 66,60 C66,67 58,74 50,74 C42,74 34,67 34,60 Z"
            className="fill-[#FFFFFF] transition-colors"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col min-w-0 leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-extrabold tracking-wider uppercase text-[#000000] dark:text-[#FFFFFF]">
              Apex
            </span>
            <span className="text-sm font-extrabold tracking-wider uppercase text-[#666666] dark:text-[#A3A3A3]">
              ERP
            </span>
          </div>
          {subtitle && (
            <span className="text-[9.5px] text-[#666666] dark:text-[#A3A3A3] font-mono tracking-wider truncate uppercase">
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
