"use client";

import React, { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Wrench,
  Plus,
  Search,
  X,
  Loader2,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";

type EquipmentStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "DAMAGED" | "RETIRED";

interface EquipmentItem {
  _id: string;
  name: string;
  equipmentCode: string;
  category: string;
  assignedProject: string;
  hourlyOperatingRate: number;
  status: EquipmentStatus;
}

const STATUSES: EquipmentStatus[] = ["AVAILABLE", "IN_USE", "MAINTENANCE", "DAMAGED", "RETIRED"];

function mapRecord(r: OperationalRecord, projectName: (id: string) => string): EquipmentItem {
  const d = r.data || {};
  return {
    _id: r._id,
    name: r.title || d.equipmentName || "Unregistered Equipment",
    equipmentCode: d.equipmentCode || "EQ-" + r._id.slice(-4).toUpperCase(),
    category: d.category || "General",
    assignedProject: projectName(r.projectId),
    hourlyOperatingRate: Number(d.hourlyOperatingRate) || 0,
    status: (STATUSES.includes(r.status as EquipmentStatus) ? (r.status as EquipmentStatus) : "IN_USE"),
  };
}

const EMPTY_FORM = {
  projectId: "",
  name: "",
  equipmentCode: "",
  category: "",
  hourlyOperatingRate: "",
  status: "AVAILABLE" as EquipmentStatus,
};

export default function EquipmentPage() {
  const { records, projects, projectName, loading, error, reload, create } = useRecords("equipment");
  const equipmentList = records.map((r) => mapRecord(r, projectName));

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = equipmentList.filter((eq) => {
    const matchSearch =
      eq.name.toLowerCase().includes(search.toLowerCase()) ||
      eq.equipmentCode.toLowerCase().includes(search.toLowerCase()) ||
      eq.category.toLowerCase().includes(search.toLowerCase()) ||
      eq.assignedProject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || eq.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openForm = () => {
    setForm({ ...EMPTY_FORM, projectId: projects[0]?._id || "" });
    setFormError(null);
    setFormOpen(true);
  };

  const submit = async () => {
    if (!form.projectId) {
      setFormError("Please select a project.");
      return;
    }
    if (!form.name.trim()) {
      setFormError("Equipment name is required.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await create({
        projectId: form.projectId,
        title: form.name.trim(),
        status: form.status,
        data: {
          equipmentName: form.name.trim(),
          equipmentCode: form.equipmentCode,
          category: form.category,
          hourlyOperatingRate: Number(form.hourlyOperatingRate) || 0,
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to register equipment");
    } finally {
      setBusy(false);
    }
  };

  const statusColors: Record<EquipmentStatus, string> = {
    AVAILABLE: "bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] border border-[#111111] dark:border-[#FFFFFF] font-semibold",
    IN_USE: "bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
    MAINTENANCE: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
    DAMAGED: "bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#000000] font-bold border border-[#000000] dark:border-[#FFFFFF]",
    RETIRED: "bg-[#888888]/15 text-[#666666] dark:text-[#A3A3A3] dark:text-[#888888] dark:text-[#888888] border border-[#888888]/30",
  };

  const inputCls =
    "w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <Wrench className="w-4 h-4" /> Plant &amp; Heavy Machinery Operations
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Heavy Equipment &amp; Machinery
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Track machinery locations, project assignments, hourly rates, and maintenance intervals
            </p>
          </div>

          <button
            onClick={openForm}
            className="inline-flex items-center justify-center gap-2 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all hover:scale-[1.015] active:scale-[0.98] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Register Equipment</span>
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-semibold uppercase tracking-wider">Total Fleet Units</p>
            <p className="text-2xl font-black text-[#000000] dark:text-[#FFFFFF] mt-1">{equipmentList.length}</p>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-semibold uppercase tracking-wider">Available Units</p>
            <p className="text-2xl font-black text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] mt-1">
              {equipmentList.filter((e) => e.status === "AVAILABLE").length}
            </p>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-semibold uppercase tracking-wider">In Operation / On Site</p>
            <p className="text-2xl font-black text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] mt-1">
              {equipmentList.filter((e) => e.status === "IN_USE").length}
            </p>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-semibold uppercase tracking-wider">In Maintenance / Repair</p>
            <p className="text-2xl font-black text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] mt-1">
              {equipmentList.filter((e) => e.status === "MAINTENANCE" || e.status === "DAMAGED").length}
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search by equipment code, name, category, or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] shadow-xs transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] shadow-xs"
          >
            <option value="ALL">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        {/* Equipment Register Table */}
        <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider font-mono text-[10px] border-b border-[#D4D4D4] dark:border-[#303030]">
                <tr>
                  <th className="px-5 py-3.5">Equipment Code</th>
                  <th className="px-5 py-3.5">Equipment Name</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Current Assignment</th>
                  <th className="px-5 py-3.5 text-right">Operating Rate (ETB/Hr)</th>
                  <th className="px-5 py-3.5 text-center">Operating Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3]">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#666666] dark:text-[#A3A3A3]" /> Loading equipment registry...
                      </span>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center">
                      <p className="text-sm text-[#000000] dark:text-[#FFFFFF]">{error}</p>
                      <button
                        onClick={() => reload()}
                        className="mt-2 text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] hover:underline"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3]">
                      <Wrench className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#666666] dark:text-[#A3A3A3]" />
                      <p className="text-sm">{equipmentList.length === 0 ? "No equipment records found. Click \"Register Equipment\" above." : "No equipment matches your filter."}</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((eq) => (
                    <tr key={eq._id} className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] dark:hover:bg-[#1F1F1F]/20 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#666666] dark:text-[#A3A3A3]">
                        {eq.equipmentCode}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-[#000000] dark:text-[#FFFFFF]">
                        {eq.name}
                      </td>
                      <td className="px-5 py-3.5 text-[#666666] dark:text-[#A3A3A3] dark:text-[#A3A3A3]">
                        {eq.category}
                      </td>
                      <td className="px-5 py-3.5 text-[#000000] dark:text-[#FFFFFF] font-medium">
                        {eq.assignedProject}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-[#000000] dark:text-[#FFFFFF] text-right">
                        ETB {eq.hourlyOperatingRate.toLocaleString()} / hr
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
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

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#303030]">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">Register Equipment</h2>
                  <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Plant machinery and heavy asset intake</p>
                </div>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="p-1.5 rounded-lg text-[#888888] dark:text-[#888888] hover:text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] dark:hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#1F1F1F] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] block mb-1">Assigned Project *</label>
                <select
                  className={inputCls}
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                >
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] block mb-1">Equipment Name *</label>
                  <input
                    className={inputCls}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Caterpillar 320D Excavator"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] block mb-1">Equipment Code</label>
                  <input
                    className={inputCls}
                    value={form.equipmentCode}
                    onChange={(e) => setForm({ ...form, equipmentCode: e.target.value })}
                    placeholder="EQ-EXC-001"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] block mb-1">Category</label>
                  <input
                    className={inputCls}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Earthmoving"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] block mb-1">Operating Rate (ETB/Hr)</label>
                  <input
                    type="number"
                    min="0"
                    className={inputCls}
                    value={form.hourlyOperatingRate}
                    onChange={(e) => setForm({ ...form, hourlyOperatingRate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] block mb-1">Operating Status</label>
                <select
                  className={inputCls}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as EquipmentStatus })}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </div>
            </div>

            {formError && <p className="text-xs text-[#000000] dark:text-[#FFFFFF] font-medium font-medium">{formError}</p>}

            <div className="flex justify-end gap-2 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
              <button
                onClick={() => setFormOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs font-semibold hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#1F1F1F] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold shadow-md transition-all disabled:opacity-60"
              >
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Equipment
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
