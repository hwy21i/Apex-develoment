"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Search, Package, Calendar, Clock, Filter, Plus
} from "lucide-react";

interface PopulatedRef {
  name?: string;
  code?: string;
  sku?: string;
  unitOfMeasure?: string;
  fullName?: string;
}

interface InventoryTransaction {
  _id: string;
  transactionType: string;
  materialId?: PopulatedRef | string;
  warehouseId?: PopulatedRef | string;
  toWarehouseId?: PopulatedRef | string;
  projectId?: PopulatedRef | string;
  quantity: number;
  totalValue: number;
  referenceDocNumber?: string;
  performedBy?: PopulatedRef | string;
  createdAt: string;
}

interface StockMovement {
  _id: string;
  transactionRef: string;
  type: "Inbound" | "Outbound" | "Transfer" | "Adjustment";
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

const displayType = (type: string): StockMovement["type"] => {
  if (["PURCHASE_RECEIPT", "OPENING_STOCK", "MATERIAL_RETURN", "TRANSFER_IN"].includes(type)) return "Inbound";
  if (["MATERIAL_ISSUE", "TRANSFER_OUT"].includes(type)) return "Outbound";
  if (type === "STOCK_ADJUSTMENT") return "Adjustment";
  return "Transfer";
};

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/inventory-transactions", { cache: "no-store" });
        const json = await response.json();
        if (!response.ok || !json.success) {
          if (active) setError(json.error?.message || "Unable to load stock movement history.");
          return;
        }
        const transactions = (json.data?.items || []) as InventoryTransaction[];
        if (active) {
          setMovements(transactions.map((transaction) => {
            const material = typeof transaction.materialId === "object" ? transaction.materialId : undefined;
            const project = typeof transaction.projectId === "object" ? transaction.projectId : undefined;
            const toWarehouse = typeof transaction.toWarehouseId === "object" ? transaction.toWarehouseId : undefined;
            const warehouse = typeof transaction.warehouseId === "object" ? transaction.warehouseId : undefined;
            const performer = typeof transaction.performedBy === "object" ? transaction.performedBy : undefined;
            const type = displayType(transaction.transactionType);
            return {
              _id: transaction._id,
              transactionRef: transaction.referenceDocNumber || transaction._id,
              type,
              materialName: material?.name || "Unnamed material",
              sku: material?.sku || "—",
              quantity: transaction.quantity,
              unit: material?.unitOfMeasure || "units",
              fromLocation: warehouse?.name || "—",
              toLocation: toWarehouse?.name || project?.name || (type === "Outbound" ? "Project issue" : "—"),
              date: transaction.createdAt,
              performedBy: performer?.fullName || "—",
              valuationETB: transaction.totalValue,
            };
          }));
          setError("");
        }
      } catch {
        if (active) setError("Unable to connect to the inventory service.");
      } finally {
        if (active) setLoading(false);
      }
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [reload]);

  const filtered = movements.filter((movement) => {
    const matchesSearch = `${movement.materialName} ${movement.transactionRef} ${movement.sku} ${movement.fromLocation} ${movement.toLocation}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (typeFilter === "All" || movement.type === typeFilter);
  });

  const fmt = (value: number) => `ETB ${value.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Stock Movements & Inventory Ledger</h1>
            <p className="mt-1 text-sm text-gray-400">Audit trail of recorded deliveries, material issues, and warehouse transfers.</p>
          </div>
          <button type="button" disabled title="Movement recording is unavailable until a transaction workflow is implemented." className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white opacity-50">
            <Plus size={16} aria-hidden="true" /> Record Movement
          </button>
        </div>

        {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-900/70 bg-red-950/30 p-4 text-sm text-red-200"><span>{error}</span><button type="button" onClick={() => setReload((value) => value + 1)} className="rounded-lg border border-red-800 px-3 py-2 font-medium hover:bg-red-950/60">Retry</button></div>}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-4"><p className="text-xs text-gray-400">Recorded Movements</p><p className="mt-1 text-xl font-bold text-white">{loading ? "—" : movements.length}</p></div>
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-4"><p className="text-xs text-gray-400">Inbound</p><p className="mt-1 text-xl font-bold text-green-400">{loading ? "—" : movements.filter((movement) => movement.type === "Inbound").length}</p></div>
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-4"><p className="text-xs text-gray-400">Outbound</p><p className="mt-1 text-xl font-bold text-blue-400">{loading ? "—" : movements.filter((movement) => movement.type === "Outbound").length}</p></div>
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-4"><p className="text-xs text-gray-400">Recorded Movement Value</p><p className="mt-1 text-lg font-bold text-purple-400">{loading ? "—" : fmt(movements.reduce((total, movement) => total + movement.valuationETB, 0))}</p></div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input aria-label="Search stock movements" type="search" placeholder="Search material, SKU, reference, or location..." value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="relative">
            <Filter size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <select aria-label="Filter movement type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-9 pr-8 text-sm text-white focus:border-blue-500 focus:outline-none sm:w-auto">
              <option value="All">All movement types</option><option value="Inbound">Inbound</option><option value="Outbound">Outbound</option><option value="Transfer">Transfer</option><option value="Adjustment">Adjustment</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-gray-700 bg-gray-900/50"><tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Reference & Type</th><th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Material & SKU</th><th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Quantity</th><th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Locations</th><th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Date</th><th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Recorded By</th><th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Value</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400"><span className="inline-flex items-center gap-2"><Clock size={16} className="animate-pulse" aria-hidden="true" /> Loading movement history…</span></td></tr>
                  : filtered.length === 0 ? <tr><td colSpan={7} className="px-4 py-12 text-center"><Package size={26} className="mx-auto mb-2 text-gray-500" aria-hidden="true" /><p className="font-medium text-white">{error ? "Movement history unavailable" : search || typeFilter !== "All" ? "No matching movements" : "No stock movements recorded yet"}</p><p className="mt-1 text-sm text-gray-400">{error ? "Retry when the inventory service is available." : "Recorded inventory transactions will appear here."}</p></td></tr>
                  : filtered.map((movement) => <tr key={movement._id} className="transition-colors hover:bg-gray-700/30">
                    <td className="px-4 py-3"><span className="font-mono text-xs font-semibold text-blue-400">{movement.transactionRef}</span><p className="mt-0.5 text-xs text-gray-400">{movement.type}</p></td>
                    <td className="px-4 py-3"><p className="font-medium text-white">{movement.materialName}</p><p className="font-mono text-xs text-gray-400">{movement.sku}</p></td>
                    <td className="px-4 py-3 text-right font-bold text-white">{movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity} {movement.unit}</td>
                    <td className="px-4 py-3 text-xs"><p className="text-gray-400">From: <span className="text-gray-200">{movement.fromLocation}</span></p><p className="text-gray-400">To: <span className="font-medium text-white">{movement.toLocation}</span></p></td>
                    <td className="px-4 py-3 text-xs text-gray-300"><span className="inline-flex items-center gap-1"><Calendar size={13} aria-hidden="true" />{new Date(movement.date).toLocaleDateString("en-ET")}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-300">{movement.performedBy}</td>
                    <td className="px-4 py-3 text-right font-bold text-white">{fmt(movement.valuationETB)}</td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
