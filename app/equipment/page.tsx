"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Wrench,
  Plus,
  Search,
  Cog,
  AlertTriangle,
  HardHat,
  Calendar,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface EquipmentItem {
  _id: string;
  name: string;
  equipmentCode: string;
  category: string;
  assignedProject: string;
  hourlyOperatingRate: number;
  status: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "DAMAGED" | "RETIRED";
}

export default function EquipmentPage() {
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEquipment() {
      setLoading(true);
      try {
        const res = await fetch("/api/records/equipment");
        const json = await res.json();
        if (json.success && json.data?.items) {
          setEquipmentList(
            json.data.items.map((eq: any) => ({
              _id: eq._id,
              name: eq.title || "Caterpillar 320D Hydraulic Excavator",
              equipmentCode: eq.data?.equipmentCode || "EQ-EXC-001",
              category: eq.data?.category || "Earthmoving",
              assignedProject: eq.data?.assignedProject || "Addis Heights Tower (Site A)",
              hourlyOperatingRate: eq.data?.hourlyOperatingRate || 2400,
              status: eq.status || "IN_USE",
            }))
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchEquipment();
  }, []);

  const statusColors = {
    AVAILABLE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    IN_USE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    MAINTENANCE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    DAMAGED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    RETIRED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <Wrench className="w-4 h-4" /> Plant & Heavy Machinery Operations
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Heavy Equipment & Machinery
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Track machinery locations, project assignments, hourly rates, and maintenance intervals.
            </p>
          </div>

          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors shrink-0">
            <Plus className="w-4 h-4" /> Register Equipment
          </button>
        </div>

        {/* Equipment Register Table */}
        <div className="bg-[#141720] border border-[#232733] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#181B24] text-slate-400 uppercase tracking-wider font-mono text-[11px] border-b border-[#232733]">
                <tr>
                  <th className="px-5 py-3">Equipment Code</th>
                  <th className="px-5 py-3">Equipment Name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Current Assignment</th>
                  <th className="px-5 py-3">Operating Rate (ETB/Hr)</th>
                  <th className="px-5 py-3">Operating Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202432]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      Loading equipment registry...
                    </td>
                  </tr>
                ) : equipmentList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      No equipment records found. Click &quot;Register Equipment&quot; above.
                    </td>
                  </tr>
                ) : (
                  equipmentList.map((eq) => (
                    <tr key={eq._id} className="hover:bg-[#1A1E29] transition-colors">
                      <td className="px-5 py-3.5 font-mono font-semibold text-blue-400">
                        {eq.equipmentCode}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-white">
                        {eq.name}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {eq.category}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        {eq.assignedProject}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-white">
                        ETB {eq.hourlyOperatingRate.toLocaleString()} / hr
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            statusColors[eq.status] || statusColors.AVAILABLE
                          }`}
                        >
                          {eq.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

