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
    "w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF]">Stock Movements &amp; Inventory Ledger</h1>
            <p className="text-[#666666] dark:text-[#A3A3A3] text-sm mt-1">
              Audit trail of all inbound deliveries, material site issues, and inter-warehouse transfers
            </p>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Record Movement
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Total Recorded Movements</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">{movements.length}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Inbound Shipments</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">
              {movements.filter((m) => m.type.includes("Inbound")).length}
            </p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Site Issues</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">
              {movements.filter((m) => m.type.includes("Outbound")).length}
            </p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Transferred Material Value</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">
              {fmt(movements.reduce((s, m) => s + m.valuationETB, 0))}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search by SKU, Material, Transaction Ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl pl-9 pr-4 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
          >
            <option value="All">All Movement Types</option>
            {MOVEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
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
              <button onClick={() => reload()} className="mt-3 text-xs font-medium text-[#000000] dark:text-[#FFFFFF] hover:text-[#000000] dark:text-[#FFFFFF]">Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-[#666666] dark:text-[#A3A3A3]">
              <Package size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                {movements.length === 0 ? "No stock movements recorded yet." : "No movements match your filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border-b border-[#D4D4D4] dark:border-[#303030]">
                  <tr>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Ref &amp; Type</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Material &amp; SKU</th>
                    <th className="text-right text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Quantity</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">From &amp; To Locations</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Authorized By</th>
                    <th className="text-right text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                  {filtered.map((m) => (
                    <tr key={m._id} className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-[#000000] dark:text-[#FFFFFF] text-xs font-semibold">{m.transactionRef}</span>
                        <p className="text-[#666666] dark:text-[#A3A3A3] text-xs mt-0.5">{m.type}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[#000000] dark:text-[#FFFFFF] font-medium">{m.materialName}</p>
                        <p className="font-mono text-[#666666] dark:text-[#A3A3A3] text-xs">{m.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white">
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.unit}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <p className="text-[#666666] dark:text-[#A3A3A3]">From: <span className="text-[#000000] dark:text-[#FFFFFF]">{m.fromLocation}</span></p>
                        <p className="text-[#666666] dark:text-[#A3A3A3]">To: <span className="text-[#000000] dark:text-[#FFFFFF] font-medium">{m.toLocation}</span></p>
                      </td>
                      <td className="px-4 py-3 text-[#333333] dark:text-[#D4D4D4] text-xs">
                        {m.date ? new Date(m.date).toLocaleDateString("en-ET") : "—"}
                      </td>
                      <td className="px-4 py-3 text-[#333333] dark:text-[#D4D4D4] text-xs">{m.performedBy}</td>
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
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] pb-4">
              <h2 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">Record Stock Movement</h2>
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
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Transaction ref</label>
                  <input className={inputCls} value={form.transactionRef} onChange={(e) => setForm({ ...form, transactionRef: e.target.value })} placeholder="TRN-STK-0001" />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Movement type</label>
                  <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as MovementType })}>
                    {MOVEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Material name</label>
                  <input className={inputCls} value={form.materialName} onChange={(e) => setForm({ ...form, materialName: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">SKU</label>
                  <input className={inputCls} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Quantity</label>
                  <input type="number" className={inputCls} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Unit</label>
                  <input className={inputCls} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="bags / tons / m³" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">From location</label>
                  <input className={inputCls} value={form.fromLocation} onChange={(e) => setForm({ ...form, fromLocation: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">To location</label>
                  <input className={inputCls} value={form.toLocation} onChange={(e) => setForm({ ...form, toLocation: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Date</label>
                  <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Valuation (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.valuationETB} onChange={(e) => setForm({ ...form, valuationETB: e.target.value })} />
                </div>
              </div>
            </div>

            {formError && <p className="text-xs text-[#000000] dark:text-[#FFFFFF]">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFormOpen(false)} className="bg-[#F5F5F5] dark:bg-[#1F1F1F] border border-[#D4D4D4] dark:border-[#303030] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] text-[#000000] dark:text-[#FFFFFF] px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={busy} className="bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
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
