"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Wrench, X, Loader2,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";
import { formatCurrency } from "@/lib/formatters/currency";

interface MaintenanceRecord {
  _id: string;
  projectId: string;
  maintenanceCode: string;
  assetCode: string;
  equipmentName: string;
  serviceType: string;
  serviceDate: string;
  nextServiceDue: string;
  costETB: number;
  serviceProvider: string;
  status: string;
  description: string;
  partsReplaced: string;
}

const STATUS_BADGES: Record<string, string> = {
  Completed: "bg-green-500/20 text-green-400 border border-green-500/30",
  "In Progress": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Scheduled: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
};

const SERVICE_TYPES = [
  "Routine 250hr Service",
  "Major 1000hr Overhaul",
  "Emergency Breakdown",
  "Safety Inspection",
];
const STATUSES = ["Scheduled", "In Progress", "Completed"];

function mapRecord(r: OperationalRecord): MaintenanceRecord {
  const d = r.data || {};
  return {
    _id: r._id,
    projectId: r.projectId,
    maintenanceCode: d.maintenanceCode || r.title || r._id.slice(-6),
    assetCode: d.assetCode || "—",
    equipmentName: d.equipmentName || d.asset || r.title || "—",
    serviceType: d.serviceType || d.maintenanceType || "Routine 250hr Service",
    serviceDate: d.serviceDate || r.createdAt,
    nextServiceDue: d.nextServiceDue || "",
    costETB: Number(d.costETB ?? d.cost) || 0,
    serviceProvider: d.serviceProvider || d.technician || "—",
    status: r.status || d.status || "Scheduled",
    description: d.description || d.notes || "",
    partsReplaced: d.partsReplaced || "",
  };
}

const EMPTY_FORM = {
  projectId: "",
  maintenanceCode: "",
  assetCode: "",
  equipmentName: "",
  serviceType: "Routine 250hr Service",
  serviceDate: "",
  nextServiceDue: "",
  costETB: "",
  serviceProvider: "",
  status: "Scheduled",
  description: "",
  partsReplaced: "",
};

export default function EquipmentMaintenancePage() {
  const { records, projects, loading, error, reload, create } = useRecords("maintenance");
  const maintenanceLogs = records.map(mapRecord);

  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = maintenanceLogs.filter(
    (r) =>
      r.equipmentName.toLowerCase().includes(search.toLowerCase()) ||
      r.assetCode.toLowerCase().includes(search.toLowerCase()) ||
      r.serviceType.toLowerCase().includes(search.toLowerCase()) ||
      r.maintenanceCode.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n: number) => formatCurrency(n);

  const totalSpent = maintenanceLogs.reduce((s, r) => s + r.costETB, 0);

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
    if (!form.equipmentName.trim()) {
      setFormError("Please enter the equipment name.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await create({
        projectId: form.projectId,
        title: form.maintenanceCode || undefined,
        status: form.status,
        data: {
          maintenanceCode: form.maintenanceCode || undefined,
          assetCode: form.assetCode,
          equipmentName: form.equipmentName.trim(),
          serviceType: form.serviceType,
          serviceDate: form.serviceDate || undefined,
          nextServiceDue: form.nextServiceDue || undefined,
          costETB: Number(form.costETB) || 0,
          serviceProvider: form.serviceProvider,
          description: form.description,
          partsReplaced: form.partsReplaced,
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to log maintenance");
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
            <h1 className="text-2xl font-bold text-white">Equipment Maintenance & Service Logs</h1>
            <p className="text-gray-400 text-sm mt-1">
              Preventive service schedules, breakdown repairs, OEM parts replacement, and inspection certifications
            </p>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Log Maintenance
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Work Orders</p>
            <p className="text-xl font-bold text-white mt-1">{maintenanceLogs.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Completed Service</p>
            <p className="text-xl font-bold text-green-400 mt-1">
              {maintenanceLogs.filter((r) => r.status === "Completed").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Current In-Shop / Overhaul</p>
            <p className="text-xl font-bold text-yellow-400 mt-1">
              {maintenanceLogs.filter((r) => r.status === "In Progress").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Maintenance Spend</p>
            <p className="text-xl font-bold text-blue-400 mt-1">{fmt(totalSpent)}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by equipment, asset code, service type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Maintenance records table */}
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
              <Wrench size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                {maintenanceLogs.length === 0 ? "No maintenance work orders logged yet." : "No records match your search."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900/50 border-b border-gray-700">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Log # & Equipment</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Service Type</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Service Date</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Next Due Date</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Provider / Shop</th>
                    <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Cost</th>
                    <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filtered.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-blue-400 text-xs font-semibold">{r.maintenanceCode}</span>
                        <p className="text-white font-medium">{r.equipmentName}</p>
                        <p className="font-mono text-gray-500 text-xs">{r.assetCode}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white text-xs font-medium">{r.serviceType}</p>
                        <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{r.description}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">
                        {new Date(r.serviceDate).toLocaleDateString("en-ET")}
                      </td>
                      <td className="px-4 py-3 text-blue-400 text-xs font-medium">
                        {r.nextServiceDue ? new Date(r.nextServiceDue).toLocaleDateString("en-ET") : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">{r.serviceProvider}</td>
                      <td className="px-4 py-3 text-right font-bold text-white">{fmt(r.costETB)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[r.status] || STATUS_BADGES.Scheduled}`}>
                          {r.status}
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
              <h2 className="text-lg font-bold text-white">Log Maintenance</h2>
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
                  <label className="text-xs text-gray-400 block mb-1">Work order #</label>
                  <input className={inputCls} value={form.maintenanceCode} onChange={(e) => setForm({ ...form, maintenanceCode: e.target.value })} placeholder="MNT-2026-0001" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Asset code</label>
                  <input className={inputCls} value={form.assetCode} onChange={(e) => setForm({ ...form, assetCode: e.target.value })} placeholder="EQ-EXC-04" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Equipment name</label>
                <input className={inputCls} value={form.equipmentName} onChange={(e) => setForm({ ...form, equipmentName: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Service type</label>
                  <select className={inputCls} value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}>
                    {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Status</label>
                  <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Service date</label>
                  <input type="date" className={inputCls} value={form.serviceDate} onChange={(e) => setForm({ ...form, serviceDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Next service due</label>
                  <input type="date" className={inputCls} value={form.nextServiceDue} onChange={(e) => setForm({ ...form, nextServiceDue: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Cost (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.costETB} onChange={(e) => setForm({ ...form, costETB: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Technician / service provider</label>
                  <input className={inputCls} value={form.serviceProvider} onChange={(e) => setForm({ ...form, serviceProvider: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Description / notes</label>
                <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Parts replaced</label>
                <input className={inputCls} value={form.partsReplaced} onChange={(e) => setForm({ ...form, partsReplaced: e.target.value })} />
              </div>
            </div>

            {formError && <p className="text-xs text-red-300">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFormOpen(false)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {busy && <Loader2 size={14} className="animate-spin" />}
                Save Work Order
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
