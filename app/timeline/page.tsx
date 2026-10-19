"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";

interface TimelineItem {
  id: string;
  name: string;
  project: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: "Completed" | "In Progress" | "Pending" | "Delayed";
  phase: string;
  durationDays: number;
}

const MOCK_TIMELINE: TimelineItem[] = [
  {
    id: "tl1",
    name: "Site Geotechnical Borehole Survey & Excavation",
    project: "Addis Heights Tower",
    startDate: "2023-05-01",
    endDate: "2023-07-15",
    progress: 100,
    status: "Completed",
    phase: "Substructure Phase",
    durationDays: 75,
  },
  {
    id: "tl2",
    name: "Foundation Mat Slab & Basement Retaining Walls",
    project: "Addis Heights Tower",
    startDate: "2023-07-20",
    endDate: "2023-11-30",
    progress: 100,
    status: "Completed",
    phase: "Substructure Phase",
    durationDays: 133,
  },
  {
    id: "tl3",
    name: "Superstructure Columns & Slabs Level 1 to 15",
    project: "Addis Heights Tower",
    startDate: "2023-12-05",
    endDate: "2024-05-30",
    progress: 68,
    status: "In Progress",
    phase: "Superstructure Phase",
    durationDays: 177,
  },
  {
    id: "tl4",
    name: "Curtain Wall Glazing & Exterior Façade",
    project: "Addis Heights Tower",
    startDate: "2024-04-01",
    endDate: "2024-09-15",
    progress: 10,
    status: "In Progress",
    phase: "Envelope Phase",
    durationDays: 167,
  },
  {
    id: "tl5",
    name: "Earthwork Cut/Fill & Subgrade Road Stabilization",
    project: "Ring Road Expansion",
    startDate: "2023-09-01",
    endDate: "2024-02-28",
    progress: 75,
    status: "In Progress",
    phase: "Civil Earthwork",
    durationDays: 180,
  },
  {
    id: "tl6",
    name: "Precast Concrete Drainage Culverts Installation",
    project: "Ring Road Expansion",
    startDate: "2024-01-15",
    endDate: "2024-04-30",
    progress: 30,
    status: "Delayed",
    phase: "Hydraulics & Drainage",
    durationDays: 106,
  },
];

const STATUS_BADGES: Record<string, string> = {
  Completed: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  "In Progress": "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Pending: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Delayed: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
};

export default function MasterTimelinePage() {
  const [items] = useState<TimelineItem[]>(MOCK_TIMELINE);
  const [projectFilter, setProjectFilter] = useState("All");

  const projects = ["All", ...Array.from(new Set(MOCK_TIMELINE.map((t) => t.project)))];

  const filtered = items.filter((t) => projectFilter === "All" || t.project === projectFilter);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF]">Project Timeline & Master Gantt</h1>
            <p className="text-[#666666] dark:text-[#A3A3A3] text-sm mt-1">
              Cross-project master schedule, critical path phases, duration tracking, and completion milestones
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#666666] dark:text-[#A3A3A3]">Filter Project:</span>
          <div className="flex gap-2">
            {projects.map((p) => (
              <button
                key={p}
                onClick={() => setProjectFilter(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  projectFilter === p
                    ? "bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] font-bold shadow-xs"
                    : "bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Gantt / Timeline list */}
        <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="space-y-4">
            {filtered.map((task) => (
              <div
                key={task.id}
                className="bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4 space-y-3 transition-colors hover:border-[#000000] dark:hover:border-[#FFFFFF]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-[#F5F5F5] dark:bg-[#202020] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030] font-medium">
                        {task.phase}
                      </span>
                      <span className="text-xs text-[#666666] dark:text-[#A3A3A3]">{task.project}</span>
                    </div>
                    <h3 className="text-sm font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">{task.name}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#666666] dark:text-[#A3A3A3] font-mono">
                      {task.durationDays} days
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[task.status]}`}>
                      {task.status}
                    </span>
                  </div>
                </div>

                {/* Progress bar with dates */}
                <div>
                  <div className="flex items-center justify-between text-xs text-[#666666] dark:text-[#A3A3A3] mb-1">
                    <span>{new Date(task.startDate).toLocaleDateString("en-ET")}</span>
                    <span className="text-[#000000] dark:text-[#FFFFFF] font-semibold">{task.progress}%</span>
                    <span>{new Date(task.endDate).toLocaleDateString("en-ET")}</span>
                  </div>
                  <div className="w-full bg-[#E5E5E5] dark:bg-[#303030] rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-[#000000] dark:bg-[#FFFFFF]"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

