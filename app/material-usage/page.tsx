"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Package, X, Loader2,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";

interface MaterialUsageLog {
  _id: string;
  usageRef: string;
  projectId: string;
  wbsActivity: string;
  materialName: string;
  plannedQty: number;
  actualQtyUsed: number;
  wasteQty: number;
  wastePct: number;
  unit: string;
  loggedDate: string;
  recordedBy: string;
  notes?: string;
  status: "Normal" | "Excess Waste" | "Efficient";
}

const STATUS_BADGES: Record<string, string> = {
  Normal: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  "Excess Waste": "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Efficient: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
};

function deriveStatus(plannedQty: number, wastePct: number): MaterialUsageLog["status"] {
  if (wastePct > 5) return "Excess Waste";
  if (plannedQty > 0 && wastePct <= 1) return "Efficient";
  return "Normal";
}

function mapRecord(r: OperationalRecord): MaterialUsageLog {
  const d = r.data || {};
  const plannedQty = Number(d.plannedQty) || 0;
  const actualQtyUsed = Number(d.actualQtyUsed ?? d.quantity) || 0;
  const rawWaste = d.wasteQty !== undefined ? Number(d.wasteQty) || 0 : Math.max(actualQtyUsed - plannedQty, 0);
  const wastePct =
    d.wastePct !== undefined
      ? Number(d.wastePct) || 0
      : plannedQty > 0
        ? Math.round((rawWaste / plannedQty) * 1000) / 10
        : 0;
  const storedStatus = (r.status || d.status) as MaterialUsageLog["status"] | undefined;
  return {
    _id: r._id,
    usageRef: d.usageRef || r.title || r._id.slice(-6),
    projectId: r.projectId,
    wbsActivity: d.wbsActivity || d.purpose || "—",
    materialName: d.materialName || r.title || "—",
    plannedQty,
    actualQtyUsed,
    wasteQty: rawWaste,
    wastePct,
    unit: d.unit || "",
    loggedDate: d.loggedDate || d.usedDate || r.createdAt,
    recordedBy: d.recordedBy || d.issuedTo || "—",
    notes: d.notes,
    status:
      storedStatus && STATUS_BADGES[storedStatus]
        ? storedStatus
        : deriveStatus(plannedQty, wastePct),
  };
}

const EMPTY_FORM = {
  projectId: "",
  usageRef: "",
  materialName: "",
  wbsActivity: "",
  unit: "",
  plannedQty: "",
  actualQtyUsed: "",
  loggedDate: "",
  recordedBy: "",
  notes: "",
};

export default function MaterialUsagePage() {
  const { records, projects, projectName, loading, error, reload, create } = useRecords("materials");
  const logs = records.map(mapRecord);

  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = logs.filter(
    (l) =>
      l.materialName.toLowerCase().includes(search.toLowerCase()) ||
      projectName(l.projectId).toLowerCase().includes(search.toLowerCase()) ||
      l.wbsActivity.toLowerCase().includes(search.toLowerCase())
  );

  const avgScrap = logs.length ? logs.reduce((s, l) => s + l.wastePct, 0) / logs.length : 0;

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
    if (!form.materialName.trim()) {
      setFormError("Please enter a material name.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const plannedQty = Number(form.plannedQty) || 0;
      const actualQtyUsed = Number(form.actualQtyUsed) || 0;
      const wasteQty = Math.max(actualQtyUsed - plannedQty, 0);
      const wastePct = plannedQty > 0 ? Math.round((wasteQty / plannedQty) * 1000) / 10 : 0;
      await create({
        projectId: form.projectId,
        title: form.usageRef || undefined,
        status: deriveStatus(plannedQty, wastePct),
        data: {
          usageRef: form.usageRef || undefined,
          materialName: form.materialName.trim(),
          wbsActivity: form.wbsActivity,
          unit: form.unit,
          plannedQty,
          actualQtyUsed,
          wasteQty,
          wastePct,
          loggedDate: form.loggedDate || undefined,
          recordedBy: form.recordedBy || undefined,
          notes: form.notes || undefined,
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to log consumption");
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF]">Material Usage & Scrap Analysis</h1>
            <p className="text-[#666666] dark:text-[#A3A3A3] text-sm mt-1">
              Field consumption tracking, theoretical vs actual variance, and scrap mitigation
            </p>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Log Site Consumption
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Total Activities Logged</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">{logs.length}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Normal Consumption</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">
              {logs.filter((l) => l.status === "Normal").length}
            </p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Flagged Excess Waste</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">
              {logs.filter((l) => l.status === "Excess Waste").length}
            </p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Average Scrap Rate</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">{avgScrap.toFixed(1)}%</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
          <input
            type="text"
            placeholder="Search by material, project, activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl pl-9 pr-4 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
          />
        </div>

        {/* Table */}
        <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-[#666666] dark:text-[#A3A3A3]">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-[#000000] dark:text-[#FFFFFF] font-medium">{error}</p>
              <button onClick={() => reload()} className="mt-3 text-xs font-medium text-[#000000] dark:text-[#FFFFFF] hover:text-[#000000] dark:text-[#FFFFFF]">
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-[#666666] dark:text-[#A3A3A3]">
              <Package size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                {logs.length === 0 ? "No site consumption logged yet." : "No usage logs match your search."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border-b border-[#D4D4D4] dark:border-[#303030]">
                  <tr>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Log # & Project</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">WBS Activity</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Material</th>
                    <th className="text-right text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Planned Qty</th>
                    <th className="text-right text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Actual Used</th>
                    <th className="text-right text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Scrap / Waste</th>
                    <th className="text-center text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                  {filtered.map((l) => (
                    <tr key={l._id} className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-[#000000] dark:text-[#FFFFFF] text-xs font-semibold">{l.usageRef}</span>
                        <p className="text-[#000000] dark:text-[#FFFFFF] font-medium">{projectName(l.projectId)}</p>
                      </td>
                      <td className="px-4 py-3 text-[#333333] dark:text-[#D4D4D4] text-xs">{l.wbsActivity}</td>
                      <td className="px-4 py-3 text-[#000000] dark:text-[#FFFFFF] font-medium">{l.materialName}</td>
                      <td className="px-4 py-3 text-right text-[#333333] dark:text-[#D4D4D4]">{l.plannedQty} {l.unit}</td>
                      <td className="px-4 py-3 text-right font-bold text-white">{l.actualQtyUsed} {l.unit}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${l.wastePct > 5 ? "text-[#000000] dark:text-[#FFFFFF]" : "text-[#333333] dark:text-[#D4D4D4]"}`}>
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
          )}
        </div>
      </div>

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] pb-4">
              <h2 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">Log Site Consumption</h2>
              <button onClick={() => setFormOpen(false)} className="text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Project</label>
                <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Log #</label>
                  <input className={inputCls} value={form.usageRef} onChange={(e) => setForm({ ...form, usageRef: e.target.value })} placeholder="USG-2026-0001" />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Usage date</label>
                  <input type="date" className={inputCls} value={form.loggedDate} onChange={(e) => setForm({ ...form, loggedDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Material name</label>
                <input className={inputCls} value={form.materialName} onChange={(e) => setForm({ ...form, materialName: e.target.value })} placeholder="Portland Cement (50kg bags)" />
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">WBS activity / purpose</label>
                <input className={inputCls} value={form.wbsActivity} onChange={(e) => setForm({ ...form, wbsActivity: e.target.value })} placeholder="Level 8 Columns Concrete Casting" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Unit</label>
                  <input className={inputCls} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="bags / tons / m³" />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Planned qty</label>
                  <input type="number" min="0" className={inputCls} value={form.plannedQty} onChange={(e) => setForm({ ...form, plannedQty: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Actual qty used</label>
                  <input type="number" min="0" className={inputCls} value={form.actualQtyUsed} onChange={(e) => setForm({ ...form, actualQtyUsed: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Issued to / recorded by</label>
                <input className={inputCls} value={form.recordedBy} onChange={(e) => setForm({ ...form, recordedBy: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Notes</label>
                <textarea className={inputCls} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>

            {formError && <p className="text-xs text-[#000000] dark:text-[#FFFFFF]">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFormOpen(false)} className="bg-[#F5F5F5] dark:bg-[#1F1F1F] border border-[#D4D4D4] dark:border-[#303030] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] text-[#000000] dark:text-[#FFFFFF] px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={busy} className="bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {busy && <Loader2 size={14} className="animate-spin" />}
                Save Log
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
