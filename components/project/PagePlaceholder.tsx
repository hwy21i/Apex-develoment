"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface ProjectNavigationProps {
  projectId: string;
}

const navigationItems = [
  {
    name: "Overview",
    path: "overview",
  },
  {
    name: "Progress",
    path: "progress",
  },
  {
    name: "Tasks",
    path: "tasks",
  },
  {
    name: "Budget",
    path: "budget",
  },
  {
    name: "Expenses",
    path: "expenses",
  },
  {
    name: "Materials",
    path: "materials",
  },
  {
    name: "Procurement",
    path: "procurement",
  },
  {
    name: "Workforce",
    path: "workforce",
  },
  {
    name: "Timeline",
    path: "timeline",
  },
  {
    name: "Reports",
    path: "reports",
  },
  {
    name: "Documents",
    path: "documents",
  },
  {
    name: "Issues",
    path: "issues",
  },
  {
    name: "Safety",
    path: "safety",
  },
];

export default function ProjectNavigation({
  projectId,
}: ProjectNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="w-full overflow-x-auto border-b border-white/10 bg-[#11120d]">
      <div className="flex min-w-max">

        {navigationItems.map((item) => {
          const href = `/projects/${projectId}/${item.path}`;

          const isActive = pathname === href;

          return (
            <Link
              key={item.path}
              href={href}
              className={`
                relative px-5 py-4
                text-sm font-medium
                transition-colors
                ${
                  isActive
                    ? "text-[#4da3ff]"
                    : "text-[#9b978f] hover:text-white"
                }
              `}
            >
              {item.name}

              {isActive && (
                <span
                  className="
                    absolute
                    bottom-0
                    left-4
                    right-4
                    h-[2px]
                    bg-[#4da3ff]
                  "
                />
              )}
            </Link>
          );
        })}

      </div>
    </nav>
  );
}