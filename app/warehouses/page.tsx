"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Warehouse as WarehouseIcon, MapPin, Eye, X, Loader2,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";
import { formatCurrency } from "@/lib/formatters/currency";

interface WarehouseRecord {
  _id: string;
  projectId: string;
  code: string;
  name: string;
  type: string;
  location: string;
  manager: string;
  phone: string;
  capacityUtilization: number; // percentage
  skuCount: number;
  totalValuationETB: number;
  status: string;
}

const STATUS_BADGES: Record<string, string> = {
  Active: "bg-green-500/20 text-green-400 border border-green-500/30",
  Maintenance: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Decommissioned: "bg-red-500/20 text-red-400 border border-red-500/30",
};

const TYPES = ["Central Hub", "Site Storage", "Transit Depot", "Quarry Stockyard"];
const STATUSES = ["Active", "Maintenance", "Decommissioned"];

function mapRecord(r: OperationalRecord): WarehouseRecord {
  const d = r.data || {};
  return {
    _id: r._id,
    projectId: r.projectId,
    code: d.code || r._id.slice(-6),
    name: r.title || d.name || "Unnamed facility",
    type: d.type || "Site Storage",
    location: d.location || "—",
    manager: d.manager || d.custodian || "—",
    phone: d.phone || "—",
    capacityUtilization: Number(d.capacityUtilization ?? d.capacity ?? 0) || 0,
    skuCount: Number(d.skuCount) || 0,
    totalValuationETB: Number(d.totalValuationETB ?? d.valuation ?? 0) || 0,
    status: r.status || d.status || "Active",
  };
}

const EMPTY_FORM = {
  projectId: "",
  code: "",
  name: "",
  type: "Site Storage",
  location: "",
  manager: "",
  phone: "",
  capacityUtilization: "",
  skuCount: "",
  totalValuationETB: "",
  status: "Active",
};

export default function WarehousesPage() {
  const { records, projects, projectName, loading, error, reload, create } = useRecords("warehouses");
  const warehouses = records.map(mapRecord);

  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<WarehouseRecord | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.code.toLowerCase().includes(search.toLowerCase()) ||
      w.location.toLowerCase().includes(search.toLowerCase()) ||
      w.manager.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n: number) => formatCurrency(n);

  const totalInventory = warehouses.reduce((s, w) => s + w.totalValuationETB, 0);
  const totalSKUs = warehouses.reduce((s, w) => s + w.skuCount, 0);
  const avgUtilization = warehouses.length
    ? warehouses.reduce((s, w) => s + w.capacityUtilization, 0) / warehouses.length
    : 0;

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
      setFormError("Please enter a facility name.");
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
          code: form.code || undefined,
          name: form.name.trim(),
          type: form.type,
          location: form.location,
          manager: form.manager,
          phone: form.phone,
          capacityUtilization: Number(form.capacityUtilization) || 0,
          skuCount: Number(form.skuCount) || 0,
          totalValuationETB: Number(form.totalValuationETB) || 0,
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to add warehouse");
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
            <h1 className="text-2xl font-bold text-white">Warehouses & Storage Facilities</h1>
            <p className="text-gray-400 text-sm mt-1">
              Central materials hubs, on-site storage yards, inventory capacity, and valuations
            </p>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Add Warehouse
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Storage Facilities</p>
            <p className="text-xl font-bold text-white mt-1">{warehouses.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total SKU Inventory Lines</p>
            <p className="text-xl font-bold text-blue-400 mt-1">{totalSKUs}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Stock Valuation</p>
            <p className="text-xl font-bold text-green-400 mt-1">{fmt(totalInventory)}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Avg Capacity Utilization</p>
            <p className="text-xl font-bold text-yellow-400 mt-1">{avgUtilization.toFixed(0)}%</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search warehouse by name, code, manager, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Warehouse list */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center">
            <p className="text-sm text-red-300">{error}</p>
            <button onClick={() => reload()} className="mt-3 text-xs font-medium text-blue-400 hover:text-blue-300">
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center text-gray-400">
            <WarehouseIcon size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">
              {warehouses.length === 0 ? "No storage facilities registered yet." : "No warehouses match your search."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((w) => (
              <div
                key={w._id}
                className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold">
                        {w.code}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded">
                        {w.type}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-2">{w.name}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <MapPin size={12} /> {w.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[w.status] || STATUS_BADGES.Active}`}>
                      {w.status}
                    </span>
                    <button onClick={() => setViewing(w)} className="text-blue-400 hover:text-blue-300 p-1" title="View details">
                      <Eye size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-700 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-gray-400">Warehouse Manager</p>
                    <p className="text-white font-medium mt-0.5">{w.manager}</p>
                    <p className="text-gray-500">{w.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Total Stock Value</p>
                    <p className="text-green-400 font-bold mt-0.5 text-sm">{fmt(w.totalValuationETB)}</p>
                    <p className="text-gray-400">{w.skuCount} active SKUs</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">Capacity Utilization</span>
                    <span className="text-white font-medium">{w.capacityUtilization}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        w.capacityUtilization > 80
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min(w.capacityUtilization, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-700 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{viewing.name}</h2>
                <p className="text-gray-400 text-xs font-mono">{viewing.code} · {projectName(viewing.projectId)}</p>
              </div>
              <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-gray-400 text-xs">Facility type</dt><dd className="text-white">{viewing.type}</dd></div>
              <div><dt className="text-gray-400 text-xs">Status</dt><dd className="text-white">{viewing.status}</dd></div>
              <div><dt className="text-gray-400 text-xs">Location</dt><dd className="text-white">{viewing.location}</dd></div>
              <div><dt className="text-gray-400 text-xs">Manager / Custodian</dt><dd className="text-white">{viewing.manager}</dd></div>
              <div><dt className="text-gray-400 text-xs">Phone</dt><dd className="text-white">{viewing.phone}</dd></div>
              <div><dt className="text-gray-400 text-xs">Capacity utilization</dt><dd className="text-white">{viewing.capacityUtilization}%</dd></div>
              <div><dt className="text-gray-400 text-xs">Active SKUs</dt><dd className="text-white">{viewing.skuCount}</dd></div>
              <div><dt className="text-gray-400 text-xs">Stock valuation</dt><dd className="text-white font-bold">{fmt(viewing.totalValuationETB)}</dd></div>
            </dl>
            <div className="flex justify-end">
              <button onClick={() => setViewing(null)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-700 pb-4">
              <h2 className="text-lg font-bold text-white">Add Warehouse</h2>
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
                  <label className="text-xs text-gray-400 block mb-1">Facility code</label>
                  <input className={inputCls} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="WH-ADD-01" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Facility type</label>
                  <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Name</label>
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Central Logistics Hub" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Location</label>
                <input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Manager / Custodian</label>
                  <input className={inputCls} value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Phone</label>
                  <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+251-..." />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Capacity (%)</label>
                  <input type="number" min="0" max="100" className={inputCls} value={form.capacityUtilization} onChange={(e) => setForm({ ...form, capacityUtilization: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">SKU lines</label>
                  <input type="number" min="0" className={inputCls} value={form.skuCount} onChange={(e) => setForm({ ...form, skuCount: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Stock value (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.totalValuationETB} onChange={(e) => setForm({ ...form, totalValuationETB: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Status</label>
                <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {formError && <p className="text-xs text-red-300">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFormOpen(false)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {busy && <Loader2 size={14} className="animate-spin" />}
                Add Warehouse
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
