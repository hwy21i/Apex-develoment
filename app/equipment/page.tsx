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
    AVAILABLE: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
    IN_USE: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30",
    MAINTENANCE: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
    DAMAGED: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30",
    RETIRED: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30",
  };

  const inputCls =
    "w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] placeholder-slate-400 dark:placeholder-[#AAB7B7]/50 focus:outline-none focus:border-[#C0C8CA]";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#C0C8CA] font-mono text-xs font-bold uppercase tracking-wider mb-1">
              <Wrench className="w-4 h-4" /> Plant &amp; Heavy Machinery Operations
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#D4D8DD] tracking-tight">
              Heavy Equipment &amp; Machinery
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#AAB7B7] mt-1">
              Track machinery locations, project assignments, hourly rates, and maintenance intervals
            </p>
          </div>

          <button
            onClick={openForm}
            className="inline-flex items-center justify-center gap-2 bg-[#C0C8CA] hover:bg-white text-[#1A2D42] font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all hover:scale-[1.015] active:scale-[0.98] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Register Equipment</span>
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs text-slate-500 dark:text-[#AAB7B7] font-semibold uppercase tracking-wider">Total Fleet Units</p>
            <p className="text-2xl font-black text-slate-900 dark:text-[#D4D8DD] mt-1">{equipmentList.length}</p>
          </div>
          <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs text-slate-500 dark:text-[#AAB7B7] font-semibold uppercase tracking-wider">Available Units</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {equipmentList.filter((e) => e.status === "AVAILABLE").length}
            </p>
          </div>
          <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs text-slate-500 dark:text-[#AAB7B7] font-semibold uppercase tracking-wider">In Operation / On Site</p>
            <p className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">
              {equipmentList.filter((e) => e.status === "IN_USE").length}
            </p>
          </div>
          <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs text-slate-500 dark:text-[#AAB7B7] font-semibold uppercase tracking-wider">In Maintenance / Repair</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {equipmentList.filter((e) => e.status === "MAINTENANCE" || e.status === "DAMAGED").length}
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#AAB7B7]" />
            <input
              type="text"
              placeholder="Search by equipment code, name, category, or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] placeholder-slate-400 dark:placeholder-[#AAB7B7]/50 outline-none focus:border-[#C0C8CA] shadow-xs transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] focus:outline-none focus:border-[#C0C8CA] shadow-xs"
          >
            <option value="ALL">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        {/* Equipment Register Table */}
        <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#2E4156]/40 text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider font-mono text-[10px] border-b border-slate-200 dark:border-[#AAB7B7]/25">
                <tr>
                  <th className="px-5 py-3.5">Equipment Code</th>
                  <th className="px-5 py-3.5">Equipment Name</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Current Assignment</th>
                  <th className="px-5 py-3.5 text-right">Operating Rate (ETB/Hr)</th>
                  <th className="px-5 py-3.5 text-center">Operating Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2E4156]/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400 dark:text-[#AAB7B7]">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#C0C8CA]" /> Loading equipment registry...
                      </span>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center">
                      <p className="text-sm text-rose-500">{error}</p>
                      <button
                        onClick={() => reload()}
                        className="mt-2 text-xs font-semibold text-[#C0C8CA] hover:underline"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400 dark:text-[#AAB7B7]">
                      <Wrench className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#C0C8CA]" />
                      <p className="text-sm">{equipmentList.length === 0 ? "No equipment records found. Click \"Register Equipment\" above." : "No equipment matches your filter."}</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((eq) => (
                    <tr key={eq._id} className="hover:bg-slate-50 dark:hover:bg-[#2E4156]/20 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#C0C8CA]">
                        {eq.equipmentCode}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-[#D4D8DD]">
                        {eq.name}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-[#AAB7B7]">
                        {eq.category}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 dark:text-[#D4D8DD] font-medium">
                        {eq.assignedProject}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-[#D4D8DD] text-right">
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
          <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#2E4156] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#2E4156] text-[#C0C8CA] border border-[#AAB7B7]/25">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-[#D4D8DD]">Register Equipment</h2>
                  <p className="text-xs text-slate-500 dark:text-[#AAB7B7]">Plant machinery and heavy asset intake</p>
                </div>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-[#AAB7B7] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2E4156] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7] block mb-1">Assigned Project *</label>
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
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7] block mb-1">Equipment Name *</label>
                  <input
                    className={inputCls}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Caterpillar 320D Excavator"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7] block mb-1">Equipment Code</label>
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
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7] block mb-1">Category</label>
                  <input
                    className={inputCls}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Earthmoving"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7] block mb-1">Operating Rate (ETB/Hr)</label>
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
                <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7] block mb-1">Operating Status</label>
                <select
                  className={inputCls}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as EquipmentStatus })}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </div>
            </div>

            {formError && <p className="text-xs text-rose-500 font-medium">{formError}</p>}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#2E4156]">
              <button
                onClick={() => setFormOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#AAB7B7]/25 text-slate-700 dark:text-[#D4D8DD] text-xs font-semibold hover:bg-slate-100 dark:hover:bg-[#2E4156] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C0C8CA] hover:bg-white text-[#1A2D42] text-xs font-bold shadow-md transition-all disabled:opacity-60"
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
