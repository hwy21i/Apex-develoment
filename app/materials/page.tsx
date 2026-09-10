"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Boxes,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  ArrowDownUp,
  RefreshCw,
  Warehouse,
  Truck,
  CheckCircle2,
} from "lucide-react";

interface MaterialItem {
  _id: string;
  name: string;
  sku: string;
  category: string;
  unitOfMeasure: string;
  minimumStockLevel: number;
  currentStock: number;
  unitCost: number;
  status: string;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  // New material form
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Cement & Aggregates");
  const [unitOfMeasure, setUnitOfMeasure] = useState("bags");
  const [minimumStockLevel, setMinimumStockLevel] = useState("20");
  const [currentStock, setCurrentStock] = useState("100");
  const [unitCost, setUnitCost] = useState("750");

  async function fetchMaterials() {
    setLoading(true);
    try {
      const res = await fetch("/api/records/materials");
      const json = await res.json();
      if (json.success && json.data?.items) {
        // Map operational records or defaults
        setMaterials(
          json.data.items.map((item: any) => ({
            _id: item._id,
            name: item.title || item.data?.name || "Material Item",
            sku: item.data?.sku || "SKU-" + item._id.slice(-4).toUpperCase(),
            category: item.data?.category || "Cement & Aggregates",
            unitOfMeasure: item.data?.unitOfMeasure || "units",
            minimumStockLevel: item.data?.minimumStockLevel || 10,
            currentStock: item.data?.currentStock ?? 50,
            unitCost: item.data?.unitCost || 0,
            status: item.status || "ACTIVE",
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMaterials();
  }, []);

  const categories = [
    "ALL",
    "Cement & Aggregates",
    "Steel & Rebar",
    "Masonry & Bricks",
    "Plumbing & Pipes",
    "Electrical & Lighting",
    "Timber & Formwork",
    "Finishing & Paints",
  ];

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "ALL" || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <Boxes className="w-4 h-4" /> Materials & Inventory Catalog
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Materials Master Catalog
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Live stock levels, reorder thresholds, unit prices (ETB), and category tracking.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Material
          </button>
        </div>

        {/* Toolbar & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by SKU, material name, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#141720] border border-[#262C3D] text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            {categories.slice(0, 5).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  categoryFilter === cat
                    ? "bg-blue-600 text-white font-semibold"
                    : "bg-[#141720] text-slate-400 hover:text-white border border-[#262C3D]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Materials Table */}
        <div className="bg-[#141720] border border-[#232733] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#181B24] text-slate-400 uppercase tracking-wider font-mono text-[11px] border-b border-[#232733]">
                <tr>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Material Name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">UOM</th>
                  <th className="px-5 py-3">Unit Cost (ETB)</th>
                  <th className="px-5 py-3">In Stock</th>
                  <th className="px-5 py-3">Min Alert</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202432]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                      Loading materials catalog...
                    </td>
                  </tr>
                ) : filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                      No materials match your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredMaterials.map((m) => {
                    const isLowStock = m.currentStock <= m.minimumStockLevel;
                    return (
                      <tr key={m._id} className="hover:bg-[#1A1E29] transition-colors">
                        <td className="px-5 py-3.5 font-mono text-blue-400 font-semibold">
                          {m.sku}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-white">
                          {m.name}
                        </td>
                        <td className="px-5 py-3.5 text-slate-400">{m.category}</td>
                        <td className="px-5 py-3.5 font-mono">{m.unitOfMeasure}</td>
                        <td className="px-5 py-3.5 font-mono text-slate-200">
                          ETB {m.unitCost.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 font-bold">
                          <span
                            className={
                              isLowStock
                                ? "text-amber-400 flex items-center gap-1 font-mono"
                                : "text-emerald-400 font-mono"
                            }
                          >
                            {isLowStock && <AlertTriangle className="w-3.5 h-3.5" />}
                            {m.currentStock.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-500">
                          {m.minimumStockLevel}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

