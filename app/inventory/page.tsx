"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import {
  Boxes,
  Plus,
  Search,
  ArrowRightLeft,
  Warehouse,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

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

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchInventory() {
      setLoading(true);
      try {
        const res = await fetch("/api/records/inventory");
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.error?.message || "Unable to load inventory records.");
          return;
        }
        const records = (json.data?.items || []) as Array<{ _id: string; title?: string; status?: string; data?: { name?: string; sku?: string; warehouseName?: string; quantityOnHand?: number; unitCost?: number } }>;
        setItems(records.map((item) => {
          const quantityOnHand = Number(item.data?.quantityOnHand ?? 0);
          const unitCost = Number(item.data?.unitCost ?? 0);
          return {
            _id: item._id,
            materialName: item.title || item.data?.name || "Unnamed material",
            sku: item.data?.sku || "—",
            warehouseName: item.data?.warehouseName || "—",
            quantityOnHand,
            unitCost,
            totalValue: quantityOnHand * unitCost,
            status: item.status || "UNKNOWN",
          };
        }));
        setError("");
      } catch {
        setError("Unable to connect to the inventory service.");
      } finally {
        setLoading(false);
      }
    }
    fetchInventory();
  }, []);

  const filteredItems = items.filter((item) => `${item.materialName} ${item.sku} ${item.warehouseName}`.toLowerCase().includes(search.toLowerCase()));
  const totalValuation = items.reduce((total, item) => total + item.totalValue, 0);

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

          <Link href="/stock-movements" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors shrink-0">
            <ArrowRightLeft className="w-4 h-4" /> Stock Movement / Transfer
          </Link>
        </div>

        {/* Valuation Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#141720] border border-[#232733] rounded-xl p-5">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Loaded Inventory Value
            </span>
            <div className="text-2xl font-bold text-white mt-1 font-mono">
              ETB {totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Live moving average cost</span>
          </div>

          <div className="bg-[#141720] border border-[#232733] rounded-xl p-5">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Stock Inbound (This Month)
            </span>
            <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono flex items-center gap-1">
              <TrendingUp className="w-5 h-5" /> —
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Via verified Goods Receipts</span>
          </div>

          <div className="bg-[#141720] border border-[#232733] rounded-xl p-5">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Site Issues (Consumed)
            </span>
            <div className="text-2xl font-bold text-blue-400 mt-1 font-mono flex items-center gap-1">
              <TrendingDown className="w-5 h-5" /> —
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Allocated to project cost</span>
          </div>
        </div>

        <div className="relative max-w-md">
          <label htmlFor="inventory-search" className="sr-only">Search inventory</label>
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" aria-hidden="true" />
          <input id="inventory-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search materials, SKU, warehouse…" className="w-full rounded-lg border border-[#262C3D] bg-[#141720] py-2 pl-9 pr-3 text-xs text-slate-200 outline-none focus:border-blue-500" />
        </div>
        {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}

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
                      Loading inventory records...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      {items.length === 0 ? "No inventory records are available." : "No inventory records match your search."}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((it) => (
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
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {it.status}
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
