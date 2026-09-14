"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, ArrowRightLeft, ArrowDownLeft, ArrowUpRight,
  Package, Calendar, CheckCircle, Clock, Filter, Eye
} from "lucide-react";

interface StockMovement {
  _id: string;
  transactionRef: string;
  type: "Inbound (GRN)" | "Outbound (Issue)" | "Inter-Site Transfer" | "Adjustment";
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

const MOCK_MOVEMENTS: StockMovement[] = [
  {
    _id: "sm1",
    transactionRef: "TRN-STK-0091",
    type: "Inbound (GRN)",
    materialName: "Portland Cement (50kg bags)",
    sku: "MAT-CEM-001",
    quantity: 500,
    unit: "bags",
    fromLocation: "Supplier Delivery",
    toLocation: "Addis Heights Main Store",
    date: "2024-02-06",
    performedBy: "Solomon Worku",
    valuationETB: 750000,
  },
  {
    _id: "sm2",
    transactionRef: "TRN-STK-0092",
    type: "Outbound (Issue)",
    materialName: "Steel Rebar 16mm",
    sku: "MAT-STL-016",
    quantity: 12,
    unit: "tons",
    fromLocation: "Central Logistics Hub",
    toLocation: "Addis Heights Tower (Floor 12 Deck)",
    date: "2024-02-05",
    performedBy: "Kassahun Bekele",
    valuationETB: 360000,
  },
  {
    _id: "sm3",
    transactionRef: "TRN-STK-0093",
    type: "Inter-Site Transfer",
    materialName: "Crushed Stone 20mm",
    sku: "MAT-AGG-020",
    quantity: 50,
    unit: "m³",
    fromLocation: "Ring Road Project Field Depot",
    toLocation: "Bole Business Park Site",
    date: "2024-02-04",
    performedBy: "Mulugeta Assefa",
    valuationETB: 75000,
  },
  {
    _id: "sm4",
    transactionRef: "TRN-STK-0094",
    type: "Adjustment",
    materialName: "Bitumen 80/100",
    sku: "MAT-BIT-080",
    quantity: -2,
    unit: "tons",
    fromLocation: "Ring Road Project Field Depot",
    toLocation: "Storage Shrinkage & Evaporation",
    date: "2024-02-01",
    performedBy: "Abebe Kebede (Audit)",
    valuationETB: 19000,
  },
];

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>(MOCK_MOVEMENTS);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const filtered = movements.filter((m) => {
    const matchSearch =
      m.materialName.toLowerCase().includes(search.toLowerCase()) ||
      m.transactionRef.toLowerCase().includes(search.toLowerCase()) ||
      m.sku.toLowerCase().includes(search.toLowerCase()) ||
      m.toLocation.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || m.type === typeFilter;
    return matchSearch && matchType;
  });

  const fmt = (n: number) =>
    `ETB ${n.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Stock Movements & Inventory Ledger</h1>
            <p className="text-gray-400 text-sm mt-1">
              Audit trail of all inbound deliveries, material site issues, and inter-warehouse transfers
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
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
            <option value="Inbound (GRN)">Inbound (GRN)</option>
            <option value="Outbound (Issue)">Outbound (Issue)</option>
            <option value="Inter-Site Transfer">Inter-Site Transfer</option>
            <option value="Adjustment">Adjustment</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Ref & Type</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Material & SKU</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Quantity</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">From & To Locations</th>
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
                      {new Date(m.date).toLocaleDateString("en-ET")}
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{m.performedBy}</td>
                    <td className="px-4 py-3 text-right font-bold text-white">{fmt(m.valuationETB)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

