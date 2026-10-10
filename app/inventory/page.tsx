"use client";

import React, { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Boxes,
  Plus,
  X,
  Loader2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";

interface InventoryRecord {
  _id: string;
  materialName: string;
  sku: string;
  warehouseName: string;
  quantityOnHand: number;
  unitCost: number;
  totalValue: number;
  status: string;
}

const STATUSES = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "ON_ORDER"];

const STATUS_BADGES: Record<string, string> = {
  IN_STOCK: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  LOW_STOCK: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  OUT_OF_STOCK: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  ON_ORDER: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
};

function mapRecord(r: OperationalRecord): InventoryRecord {
  const d = r.data || {};
  const quantityOnHand = Number(d.quantityOnHand ?? d.quantity) || 0;
  const unitCost = Number(d.unitCost) || 0;
  return {
    _id: r._id,
    materialName: r.title || d.materialName || "Unnamed Material",
    sku: d.sku || "MAT-" + r._id.slice(-4).toUpperCase(),
    warehouseName: d.warehouseName || d.warehouse || "—",
    quantityOnHand,
    unitCost,
    totalValue: quantityOnHand * unitCost,
    status: r.status || "IN_STOCK",
  };
}

const EMPTY_FORM = {
  projectId: "",
  materialName: "",
  sku: "",
  warehouseName: "",
  quantityOnHand: "",
  unitCost: "",
  reorderLevel: "",
  status: "IN_STOCK",
};

export default function InventoryPage() {
  const { records, projects, loading, error, reload, create } = useRecords("inventory");
  const items = records.map(mapRecord);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      setFormError("Material name is required.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await create({
        projectId: form.projectId,
        title: form.materialName.trim(),
        status: form.status,
        data: {
          materialName: form.materialName.trim(),
          sku: form.sku,
          warehouseName: form.warehouseName,
          quantityOnHand: Number(form.quantityOnHand) || 0,
          unitCost: Number(form.unitCost) || 0,
          reorderLevel: Number(form.reorderLevel) || 0,
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to add stock item");
    } finally {
      setBusy(false);
    }
  };

  const totalValuation = items.reduce((s, it) => s + it.totalValue, 0);

  const inputCls =
    "w-full bg-[#141720] border border-[#262C3D] rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <Boxes className="w-4 h-4" /> Stock Control & Movements
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Warehouse Inventory & Valuations
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time stock valuation across site depots, central yards, and storage facilities.
            </p>
          </div>

          <button
            onClick={openForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Stock Item
          </button>
        </div>

        {/* Valuation Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#141720] border border-[#232733] rounded-xl p-5">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Total Stock Valuation
            </span>
            <div className="text-2xl font-bold text-white mt-1 font-mono">
              ETB {totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Live moving average cost</span>
          </div>

          <div className="bg-[#141720] border border-[#232733] rounded-xl p-5">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Stock Inbound (This Month)
            </span>
            <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono flex items-center gap-1">
              <TrendingUp className="w-5 h-5" /> ETB 6,200,000.00
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Via verified Goods Receipts</span>
          </div>

          <div className="bg-[#141720] border border-[#232733] rounded-xl p-5">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Site Issues (Consumed)
            </span>
            <div className="text-2xl font-bold text-blue-400 mt-1 font-mono flex items-center gap-1">
              <TrendingDown className="w-5 h-5" /> ETB 4,180,000.00
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Allocated to project cost</span>
          </div>
        </div>

        {/* Inventory Register */}
        <div className="bg-[#141720] border border-[#232733] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#181B24] text-slate-400 uppercase tracking-wider font-mono text-[11px] border-b border-[#232733]">
                <tr>
                  <th className="px-5 py-3">Material & SKU</th>
                  <th className="px-5 py-3">Warehouse / Depot</th>
                  <th className="px-5 py-3">Quantity on Hand</th>
                  <th className="px-5 py-3">Unit Cost (ETB)</th>
                  <th className="px-5 py-3">Total Value (ETB)</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202432]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading inventory records...
                      </span>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center">
                      <p className="text-slate-400">{error}</p>
                      <button
                        onClick={() => reload()}
                        className="mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      No stock items in storage. Click &quot;Add Stock Item&quot; above.
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr key={it._id} className="hover:bg-[#1A1E29] transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-white">
                        {it.materialName}
                        <span className="block font-mono text-blue-400 text-[11px] font-normal">
                          {it.sku}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        {it.warehouseName}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-white font-bold">
                        {it.quantityOnHand.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-300">
                        ETB {it.unitCost.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-emerald-400 font-bold">
                        ETB {it.totalValue.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            STATUS_BADGES[it.status] || STATUS_BADGES.IN_STOCK
                          }`}
                        >
                          {it.status.replace("_", " ")}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111420] border border-[#262C3D] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#232733] pb-4">
              <h2 className="text-base font-bold text-white">Add Stock Item</h2>
              <button onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Project</label>
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
                  <label className="text-[11px] text-slate-400 block mb-1">Material Name *</label>
                  <input
                    className={inputCls}
                    value={form.materialName}
                    onChange={(e) => setForm({ ...form, materialName: e.target.value })}
                    placeholder="e.g. OPC Cement 42.5N"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">SKU</label>
                  <input
                    className={inputCls}
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="MAT-CEM-001"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Warehouse / Depot</label>
                <input
                  className={inputCls}
                  value={form.warehouseName}
                  onChange={(e) => setForm({ ...form, warehouseName: e.target.value })}
                  placeholder="Central Logistics Yard"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Quantity on Hand</label>
                  <input
                    type="number"
                    min="0"
                    className={inputCls}
                    value={form.quantityOnHand}
                    onChange={(e) => setForm({ ...form, quantityOnHand: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Unit Cost (ETB)</label>
                  <input
                    type="number"
                    min="0"
                    className={inputCls}
                    value={form.unitCost}
                    onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Reorder Level</label>
                  <input
                    type="number"
                    min="0"
                    className={inputCls}
                    value={form.reorderLevel}
                    onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Status</label>
                <select
                  className={inputCls}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </div>
            </div>

            {formError && <p className="text-xs text-rose-300">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setFormOpen(false)}
                className="bg-[#1A1E29] hover:bg-[#232733] text-white px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Item
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
