"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export interface ProjectNavigationProps {
  projectId: string;
  className?: string;
}

export interface NavItem {
  label: string;
  href: (id: string) => string;
  exact?: boolean;
  matchSegment?: string;
  icon?: React.ReactNode;
}

export const PROJECT_NAV_ITEMS: NavItem[] = [
  {
    label: "Overview",
    href: (id) => `/projects/${id}/overview`,
    exact: true,
    matchSegment: "",
  },
  {
    label: "Phases",
    href: (id) => `/projects/${id}/phases`,
    matchSegment: "phases",
  },
  {
    label: "Progress",
    href: (id) => `/projects/${id}/progress`,
    matchSegment: "progress",
  },
  {
    label: "Tasks",
    href: (id) => `/projects/${id}/tasks`,
    matchSegment: "tasks",
  },
  {
    label: "Budget",
    href: (id) => `/projects/${id}/budget`,
    matchSegment: "budget",
  },
  {
    label: "Expenses",
    href: (id) => `/projects/${id}/expenses`,
    matchSegment: "expenses",
  },
  {
    label: "Materials",
    href: (id) => `/projects/${id}/materials`,
    matchSegment: "materials",
  },
  {
    label: "Procurement",
    href: (id) => `/projects/${id}/procurement`,
    matchSegment: "procurement",
  },
  {
    label: "Workforce",
    href: (id) => `/projects/${id}/workforce`,
    matchSegment: "workforce",
  },
  {
    label: "Timeline",
    href: (id) => `/projects/${id}/timeline`,
    matchSegment: "timeline",
  },
  {
    label: "Reports",
    href: (id) => `/projects/${id}/reports`,
    matchSegment: "reports",
  },
  {
    label: "Documents",
    href: (id) => `/projects/${id}/documents`,
    matchSegment: "documents",
  },
  {
    label: "Issues",
    href: (id) => `/projects/${id}/issues`,
    matchSegment: "issues",
  },
  {
    label: "Safety",
    href: (id) => `/projects/${id}/safety`,
    matchSegment: "safety",
  },
];

export default function ProjectNavigation({
  projectId,
  className = "",
}: ProjectNavigationProps) {
  const pathname = usePathname();

  const isItemActive = (item: NavItem): boolean => {
    if (!pathname) return false;

    const baseProjectPath = `/projects/${projectId}`;
    const normalizedPath = pathname.replace(/\/$/, "");

    if (item.exact) {
      // Overview is active on /projects/[projectId] or /projects/[projectId]/overview
      return (
        normalizedPath === baseProjectPath ||
        normalizedPath === `${baseProjectPath}/overview`
      );
    }

    const itemPath = `${baseProjectPath}/${item.matchSegment}`;
    return (
      normalizedPath === itemPath ||
      normalizedPath.startsWith(`${itemPath}/`)
    );
  };

  return (
    <nav
      aria-label="Project Navigation"
      className={`w-full bg-[#FAFAFA] dark:bg-[#111111] border-b border-[#D4D4D4] dark:border-[#303030] select-none ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 overflow-x-auto whitespace-nowrap scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none]">
          <div className="flex items-center space-x-1 sm:space-x-1.5 py-2">
            {PROJECT_NAV_ITEMS.map((item) => {
              const active = isItemActive(item);
              const targetHref = item.href(projectId);

              return (
                <Link
                  key={item.label}
                  href={targetHref}
                  className={`relative flex items-center px-3.5 py-2 rounded-md text-[13px] font-medium tracking-wide transition-all duration-150 group ${
                    active
                      ? "text-[#000000] dark:text-[#FFFFFF] bg-black/5 dark:bg-white/10 font-semibold shadow-2xs"
                      : "text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <span>{item.label}</span>

                  {/* Active bottom accent bar indicator */}
                  {active && (
                    <span
                      className="absolute inset-x-3 -bottom-[10px] h-[2px] bg-[#000000] dark:bg-[#FFFFFF] rounded-full"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
