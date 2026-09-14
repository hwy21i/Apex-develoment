"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Layers, AlertTriangle, TrendingDown,
  Calendar, CheckCircle, Package, BarChart3, FileSpreadsheet
} from "lucide-react";

interface MaterialUsageLog {
  _id: string;
  usageRef: string;
  projectName: string;
  wbsActivity: string;
  materialName: string;
  plannedQty: number;
  actualQtyUsed: number;
  wasteQty: number;
  wastePct: number;
  unit: string;
  loggedDate: string;
  recordedBy: string;
  status: "Normal" | "Excess Waste" | "Efficient";
}

const MOCK_USAGE: MaterialUsageLog[] = [
  {
    _id: "u1",
    usageRef: "USG-2024-0190",
    projectName: "Addis Heights Tower",
    wbsActivity: "Level 8 Columns Concrete Casting",
    materialName: "Portland Cement (50kg bags)",
    plannedQty: 420,
    actualQtyUsed: 435,
    wasteQty: 15,
    wastePct: 3.5,
    unit: "bags",
    loggedDate: "2024-02-05",
    recordedBy: "Solomon Worku (Site Eng)",
    status: "Normal",
  },
  {
    _id: "u2",
    usageRef: "USG-2024-0191",
    projectName: "Addis Heights Tower",
    wbsActivity: "Level 8 Slab Rebar Bending & Fixing",
    materialName: "Steel Rebar 16mm",
    plannedQty: 18,
    actualQtyUsed: 20.5,
    wasteQty: 2.5,
    wastePct: 13.8,
    unit: "tons",
    loggedDate: "2024-02-04",
    recordedBy: "Girma Mengistu (Lead Fixer)",
    status: "Excess Waste",
  },
  {
    _id: "u3",
    usageRef: "USG-2024-0192",
    projectName: "Ring Road Expansion",
    wbsActivity: "Sub-base Layer Compaction Km 12-14",
    materialName: "Crushed Stone 20mm",
    plannedQty: 120,
    actualQtyUsed: 121,
    wasteQty: 1,
    wastePct: 0.8,
    unit: "m³",
    loggedDate: "2024-02-06",
    recordedBy: "Tigist Alemu (Inspector)",
    status: "Efficient",
  },
];

const STATUS_BADGES: Record<string, string> = {
  Normal: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  "Excess Waste": "bg-red-500/20 text-red-400 border border-red-500/30",
  Efficient: "bg-green-500/20 text-green-400 border border-green-500/30",
};

export default function MaterialUsagePage() {
  const [logs, setLogs] = useState<MaterialUsageLog[]>(MOCK_USAGE);
  const [search, setSearch] = useState("");

  const filtered = logs.filter(
    (l) =>
      l.materialName.toLowerCase().includes(search.toLowerCase()) ||
      l.projectName.toLowerCase().includes(search.toLowerCase()) ||
      l.wbsActivity.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Material Usage & Scrap Analysis</h1>
            <p className="text-gray-400 text-sm mt-1">
              Field consumption tracking, theoretical vs actual variance, and scrap mitigation
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Log Site Consumption
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Activities Logged</p>
            <p className="text-xl font-bold text-white mt-1">{logs.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Normal Consumption</p>
            <p className="text-xl font-bold text-blue-400 mt-1">
              {logs.filter((l) => l.status === "Normal").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Flagged Excess Waste</p>
            <p className="text-xl font-bold text-red-400 mt-1">
              {logs.filter((l) => l.status === "Excess Waste").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Average Scrap Rate</p>
            <p className="text-xl font-bold text-yellow-400 mt-1">
              {(logs.reduce((s, l) => s + l.wastePct, 0) / logs.length).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by material, project, activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Log # & Project</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">WBS Activity</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Material</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Planned Qty</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Actual Used</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Scrap / Waste</th>
                  <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((l) => (
                  <tr key={l._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-blue-400 text-xs font-semibold">{l.usageRef}</span>
                      <p className="text-white font-medium">{l.projectName}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{l.wbsActivity}</td>
                    <td className="px-4 py-3 text-white font-medium">{l.materialName}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{l.plannedQty} {l.unit}</td>
                    <td className="px-4 py-3 text-right font-bold text-white">{l.actualQtyUsed} {l.unit}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${l.wastePct > 5 ? "text-red-400" : "text-gray-300"}`}>
                      +{l.wasteQty} {l.unit} ({l.wastePct}%)
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[l.status]}`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

