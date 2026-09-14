"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Flag, CheckCircle, Clock, AlertTriangle,
  Calendar, Layers, ArrowUpRight, CheckSquare
} from "lucide-react";

interface MilestoneItem {
  _id: string;
  milestoneCode: string;
  title: string;
  projectName: string;
  targetDate: string;
  completionDate?: string;
  weightPct: number;
  linkedPaymentIPC?: string;
  status: "Completed" | "In Progress" | "Upcoming" | "Delayed";
  description: string;
}

const MOCK_MILESTONES: MilestoneItem[] = [
  {
    _id: "m1",
    milestoneCode: "MLS-AH-01",
    title: "Deep Piling & Raft Foundation Concrete Pour",
    projectName: "Addis Heights Tower",
    targetDate: "2023-08-30",
    completionDate: "2023-08-25",
    weightPct: 15,
    linkedPaymentIPC: "IPC-01",
    status: "Completed",
    description: "Completion of 120 reinforced concrete friction piles and 2.5m thick raft slab foundation",
  },
  {
    _id: "m2",
    milestoneCode: "MLS-AH-02",
    title: "Basement 3 to Ground Floor Superstructure",
    projectName: "Addis Heights Tower",
    targetDate: "2023-12-15",
    completionDate: "2023-12-20",
    weightPct: 20,
    linkedPaymentIPC: "IPC-03",
    status: "Completed",
    description: "Retaining walls, underground water tanks, and ground level podium deck casting",
  },
  {
    _id: "m3",
    milestoneCode: "MLS-AH-03",
    title: "Floors 1-15 Concrete Frame Top-Out",
    projectName: "Addis Heights Tower",
    targetDate: "2024-04-30",
    weightPct: 30,
    linkedPaymentIPC: "IPC-06",
    status: "In Progress",
    description: "Cast-in-place columns, post-tensioned floor slabs up to level 15",
  },
  {
    _id: "m4",
    milestoneCode: "MLS-RR-01",
    title: "Section 1 Earthwork & Bridge Culverts (Km 0-10)",
    projectName: "Ring Road Expansion",
    targetDate: "2024-02-15",
    weightPct: 25,
    linkedPaymentIPC: "IPC-02",
    status: "Delayed",
    description: "Heavy embankment cut/fill, 6 box culverts installation and subgrade stabilization",
  },
  {
    _id: "m5",
    milestoneCode: "MLS-BBP-01",
    title: "Warehouse Pre-engineered Steel Erection",
    projectName: "Bole Business Park",
    targetDate: "2024-05-15",
    weightPct: 35,
    linkedPaymentIPC: "IPC-02",
    status: "Upcoming",
    description: "Steel portal frame rigging, crane rail installation, and roofing insulation panels",
  },
];

const STATUS_BADGES: Record<string, string> = {
  Completed: "bg-green-500/20 text-green-400 border border-green-500/30",
  "In Progress": "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  Upcoming: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  Delayed: "bg-red-500/20 text-red-400 border border-red-500/30",
};

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<MilestoneItem[]>(MOCK_MILESTONES);
  const [search, setSearch] = useState("");

  const filtered = milestones.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.milestoneCode.toLowerCase().includes(search.toLowerCase()) ||
      m.projectName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Project Milestones & Deliverables</h1>
            <p className="text-gray-400 text-sm mt-1">
              Critical path deliverables, contractual completion gates, and client sign-off triggers
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Define Milestone
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Milestones</p>
            <p className="text-xl font-bold text-white mt-1">{milestones.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Achieved & Signed Off</p>
            <p className="text-xl font-bold text-green-400 mt-1">
              {milestones.filter((m) => m.status === "Completed").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Currently In Progress</p>
            <p className="text-xl font-bold text-blue-400 mt-1">
              {milestones.filter((m) => m.status === "In Progress").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Delayed Critical Milestones</p>
            <p className="text-xl font-bold text-red-400 mt-1">
              {milestones.filter((m) => m.status === "Delayed").length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search milestones by title, project, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Milestones list */}
        <div className="space-y-3">
          {filtered.map((m) => (
            <div
              key={m._id}
              className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold">
                      {m.milestoneCode}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">{m.projectName}</span>
                    {m.linkedPaymentIPC && (
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-medium">
                        Unlocks: {m.linkedPaymentIPC}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white">{m.title}</h3>
                  <p className="text-xs text-gray-400 max-w-3xl">{m.description}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Target Date</p>
                    <p className="text-sm font-semibold text-white">
                      {new Date(m.targetDate).toLocaleDateString("en-ET")}
                    </p>
                    <p className="text-[11px] text-blue-400">{m.weightPct}% of Contract</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_BADGES[m.status]}`}>
                    {m.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

