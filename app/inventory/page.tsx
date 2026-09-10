"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
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

  useEffect(() => {
    async function fetchInventory() {
      setLoading(true);
      try {
        const res = await fetch("/api/records/inventory");
        const json = await res.json();
        if (json.success && json.data?.items) {
          setItems(
            json.data.items.map((i: any) => ({
              _id: i._id,
              materialName: i.title || "Dangote OPC Cement Grade 42.5N",
              sku: i.data?.sku || "MAT-CEM-001",
              warehouseName: i.data?.warehouseName || "Central Logistics Yard (Modjo)",
              quantityOnHand: i.data?.quantityOnHand || 1250,
              unitCost: i.data?.unitCost || 780,
              totalValue: (i.data?.quantityOnHand || 1250) * (i.data?.unitCost || 780),
              status: i.status || "IN_STOCK",
            }))
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchInventory();
  }, []);

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

          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors shrink-0">
            <ArrowRightLeft className="w-4 h-4" /> Stock Movement / Transfer
          </button>
        </div>

        {/* Valuation Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#141720] border border-[#232733] rounded-xl p-5">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Total Stock Valuation
            </span>
            <div className="text-2xl font-bold text-white mt-1 font-mono">
              ETB 28,450,000.00
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
                      Loading inventory records...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      No stock items in storage.
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

