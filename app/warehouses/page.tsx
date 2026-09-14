"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Warehouse, MapPin, User, Package,
  TrendingUp, CheckCircle, Clock, Eye, AlertCircle
} from "lucide-react";

interface WarehouseRecord {
  _id: string;
  code: string;
  name: string;
  type: "Central Hub" | "Site Storage" | "Transit Depot" | "Quarry Stockyard";
  location: string;
  manager: string;
  phone: string;
  capacityUtilization: number; // percentage
  skuCount: number;
  totalValuationETB: number;
  status: "Active" | "Maintenance" | "Decommissioned";
}

const MOCK_WAREHOUSES: WarehouseRecord[] = [
  {
    _id: "wh1",
    code: "WH-ADD-01",
    name: "Central Logistics Hub - Kaliti",
    type: "Central Hub",
    location: "Akaki Kality, Addis Ababa",
    manager: "Kassahun Bekele",
    phone: "+251-91-182-3490",
    capacityUtilization: 78,
    skuCount: 142,
    totalValuationETB: 24500000,
    status: "Active",
  },
  {
    _id: "wh2",
    code: "WH-BOLE-02",
    name: "Addis Heights Tower Site Store",
    type: "Site Storage",
    location: "Bole Sub-City, Site Block B",
    manager: "Solomon Worku",
    phone: "+251-92-345-6712",
    capacityUtilization: 85,
    skuCount: 48,
    totalValuationETB: 8900000,
    status: "Active",
  },
  {
    _id: "wh3",
    code: "WH-RING-03",
    name: "Ring Road Project Field Depot",
    type: "Site Storage",
    location: "Outer Ring Expressway Mile 14",
    manager: "Mulugeta Assefa",
    phone: "+251-93-456-7823",
    capacityUtilization: 62,
    skuCount: 35,
    totalValuationETB: 6400000,
    status: "Active",
  },
  {
    _id: "wh4",
    code: "WH-QRRY-04",
    name: "Gelam Aggregate & Crushed Stone Depot",
    type: "Quarry Stockyard",
    location: "Gelam, Oromia Special Zone",
    manager: "Tadesse Gemechu",
    phone: "+251-94-567-8934",
    capacityUtilization: 45,
    skuCount: 12,
    totalValuationETB: 3200000,
    status: "Active",
  },
];

const STATUS_BADGES: Record<string, string> = {
  Active: "bg-green-500/20 text-green-400 border border-green-500/30",
  Maintenance: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Decommissioned: "bg-red-500/20 text-red-400 border border-red-500/30",
};

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseRecord[]>(MOCK_WAREHOUSES);
  const [search, setSearch] = useState("");

  const filtered = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.code.toLowerCase().includes(search.toLowerCase()) ||
      w.location.toLowerCase().includes(search.toLowerCase()) ||
      w.manager.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n: number) =>
    `ETB ${n.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`;

  const totalInventory = warehouses.reduce((s, w) => s + w.totalValuationETB, 0);
  const totalSKUs = warehouses.reduce((s, w) => s + w.skuCount, 0);

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
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
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
            <p className="text-xl font-bold text-yellow-400 mt-1">
              {(warehouses.reduce((s, w) => s + w.capacityUtilization, 0) / warehouses.length).toFixed(0)}%
            </p>
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
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[w.status]}`}>
                  {w.status}
                </span>
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
                    style={{ width: `${w.capacityUtilization}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

