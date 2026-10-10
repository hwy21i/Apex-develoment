"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Plus, Search, Package, Loader2, X } from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";
import { useCurrentUser } from "@/components/auth/UserProvider";
import { formatCurrency } from "@/lib/formatters/currency";

type MovementType = "Inbound (GRN)" | "Outbound (Issue)" | "Inter-Site Transfer" | "Adjustment";
const MOVEMENT_TYPES: MovementType[] = ["Inbound (GRN)", "Outbound (Issue)", "Inter-Site Transfer", "Adjustment"];

interface StockMovement {
  _id: string;
  projectId: string;
  transactionRef: string;
  type: MovementType;
  materialName: string;
  sku: string;
  quantity: number;
  unit: string;
  fromLocation: string;
  toLocation: string;
  date: string;
  performedBy: string;
  valuationETB: number;
}

function mapRecord(r: OperationalRecord): StockMovement {
  const d = r.data || {};
  return {
    _id: r._id,
    projectId: r.projectId,
    transactionRef: d.transactionRef || r.title || r._id.slice(-6),
    type: (d.type as MovementType) || "Adjustment",
    materialName: d.materialName || "—",
    sku: d.sku || "—",
    quantity: Number(d.quantity) || 0,
    unit: d.unit || "",
    fromLocation: d.fromLocation || "—",
    toLocation: d.toLocation || "—",
    date: d.date || r.createdAt,
    performedBy: d.performedBy || "—",
    valuationETB: Number(d.valuationETB) || 0,
  };
}

export default function StockMovementsPage() {
  const { records, projects, loading, error, reload, create } = useRecords("inventory");
  const { user } = useCurrentUser();
  const movements = records.map(mapRecord);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    projectId: "",
    transactionRef: "",
    type: "Inbound (GRN)" as MovementType,
    materialName: "",
    sku: "",
    quantity: "",
    unit: "",
    fromLocation: "",
    toLocation: "",
    date: "",
    valuationETB: "",
  });

  const filtered = movements.filter((m) => {
    const matchSearch =
      m.materialName.toLowerCase().includes(search.toLowerCase()) ||
      m.transactionRef.toLowerCase().includes(search.toLowerCase()) ||
      m.sku.toLowerCase().includes(search.toLowerCase()) ||
      m.toLocation.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || m.type === typeFilter;
    return matchSearch && matchType;
  });

  const fmt = (n: number) => formatCurrency(n);

  const openForm = () => {
    setForm((f) => ({ ...f, projectId: projects[0]?._id || "" }));
    setFormError(null);
    setFormOpen(true);
  };

  const submit = async () => {
    if (!form.projectId) {
      setFormError("Please select a project.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await create({
        projectId: form.projectId,
        title: form.transactionRef || undefined,
        status: form.type,
        data: {
          transactionRef: form.transactionRef || undefined,
          type: form.type,
          materialName: form.materialName,
          sku: form.sku,
          quantity: Number(form.quantity) || 0,
          unit: form.unit,
          fromLocation: form.fromLocation,
          toLocation: form.toLocation,
          date: form.date || undefined,
          performedBy: user?.fullName || undefined,
          valuationETB: Number(form.valuationETB) || 0,
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to record movement");
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
            <h1 className="text-2xl font-bold text-white">Stock Movements &amp; Inventory Ledger</h1>
            <p className="text-gray-400 text-sm mt-1">
              Audit trail of all inbound deliveries, material site issues, and inter-warehouse transfers
            </p>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Record Movement
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Recorded Movements</p>
            <p className="text-xl font-bold text-white mt-1">{movements.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Inbound Shipments</p>
            <p className="text-xl font-bold text-green-400 mt-1">
              {movements.filter((m) => m.type.includes("Inbound")).length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Site Issues</p>
            <p className="text-xl font-bold text-blue-400 mt-1">
              {movements.filter((m) => m.type.includes("Outbound")).length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Transferred Material Value</p>
            <p className="text-xl font-bold text-purple-400 mt-1">
              {fmt(movements.reduce((s, m) => s + m.valuationETB, 0))}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by SKU, Material, Transaction Ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Movement Types</option>
            {MOVEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
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
              <button onClick={() => reload()} className="mt-3 text-xs font-medium text-blue-400 hover:text-blue-300">Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Package size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                {movements.length === 0 ? "No stock movements recorded yet." : "No movements match your filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900/50 border-b border-gray-700">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Ref &amp; Type</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Material &amp; SKU</th>
                    <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Quantity</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">From &amp; To Locations</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Authorized By</th>
                    <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filtered.map((m) => (
                    <tr key={m._id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-blue-400 text-xs font-semibold">{m.transactionRef}</span>
                        <p className="text-gray-400 text-xs mt-0.5">{m.type}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{m.materialName}</p>
                        <p className="font-mono text-gray-400 text-xs">{m.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white">
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.unit}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <p className="text-gray-400">From: <span className="text-gray-200">{m.fromLocation}</span></p>
                        <p className="text-gray-400">To: <span className="text-white font-medium">{m.toLocation}</span></p>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">
                        {m.date ? new Date(m.date).toLocaleDateString("en-ET") : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">{m.performedBy}</td>
                      <td className="px-4 py-3 text-right font-bold text-white">{fmt(m.valuationETB)}</td>
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
              <h2 className="text-lg font-bold text-white">Record Stock Movement</h2>
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
                  <label className="text-xs text-gray-400 block mb-1">Transaction ref</label>
                  <input className={inputCls} value={form.transactionRef} onChange={(e) => setForm({ ...form, transactionRef: e.target.value })} placeholder="TRN-STK-0001" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Movement type</label>
                  <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as MovementType })}>
                    {MOVEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Material name</label>
                  <input className={inputCls} value={form.materialName} onChange={(e) => setForm({ ...form, materialName: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">SKU</label>
                  <input className={inputCls} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Quantity</label>
                  <input type="number" className={inputCls} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Unit</label>
                  <input className={inputCls} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="bags / tons / m³" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">From location</label>
                  <input className={inputCls} value={form.fromLocation} onChange={(e) => setForm({ ...form, fromLocation: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">To location</label>
                  <input className={inputCls} value={form.toLocation} onChange={(e) => setForm({ ...form, toLocation: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Date</label>
                  <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Valuation (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.valuationETB} onChange={(e) => setForm({ ...form, valuationETB: e.target.value })} />
                </div>
              </div>
            </div>

            {formError && <p className="text-xs text-red-300">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFormOpen(false)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {busy && <Loader2 size={14} className="animate-spin" />}
                Save Movement
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
