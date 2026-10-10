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
  Normal: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  "Excess Waste": "bg-red-500/20 text-red-400 border border-red-500/30",
  Efficient: "bg-green-500/20 text-green-400 border border-green-500/30",
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
    "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500";

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
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
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
            <p className="text-xl font-bold text-yellow-400 mt-1">{avgScrap.toFixed(1)}%</p>
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
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-red-300">{error}</p>
              <button onClick={() => reload()} className="mt-3 text-xs font-medium text-blue-400 hover:text-blue-300">
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Package size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                {logs.length === 0 ? "No site consumption logged yet." : "No usage logs match your search."}
              </p>
            </div>
          ) : (
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
                        <p className="text-white font-medium">{projectName(l.projectId)}</p>
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
          )}
        </div>
      </div>

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-700 pb-4">
              <h2 className="text-lg font-bold text-white">Log Site Consumption</h2>
              <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Project</label>
                <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Log #</label>
                  <input className={inputCls} value={form.usageRef} onChange={(e) => setForm({ ...form, usageRef: e.target.value })} placeholder="USG-2026-0001" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Usage date</label>
                  <input type="date" className={inputCls} value={form.loggedDate} onChange={(e) => setForm({ ...form, loggedDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Material name</label>
                <input className={inputCls} value={form.materialName} onChange={(e) => setForm({ ...form, materialName: e.target.value })} placeholder="Portland Cement (50kg bags)" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">WBS activity / purpose</label>
                <input className={inputCls} value={form.wbsActivity} onChange={(e) => setForm({ ...form, wbsActivity: e.target.value })} placeholder="Level 8 Columns Concrete Casting" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Unit</label>
                  <input className={inputCls} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="bags / tons / m³" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Planned qty</label>
                  <input type="number" min="0" className={inputCls} value={form.plannedQty} onChange={(e) => setForm({ ...form, plannedQty: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Actual qty used</label>
                  <input type="number" min="0" className={inputCls} value={form.actualQtyUsed} onChange={(e) => setForm({ ...form, actualQtyUsed: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Issued to / recorded by</label>
                <input className={inputCls} value={form.recordedBy} onChange={(e) => setForm({ ...form, recordedBy: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Notes</label>
                <textarea className={inputCls} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>

            {formError && <p className="text-xs text-red-300">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFormOpen(false)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
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
