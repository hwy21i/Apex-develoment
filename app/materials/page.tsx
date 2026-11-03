"use client";

import React, { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  RefreshCw,
  Layers,
  TrendingDown,
  Coins,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters/currency";

interface MaterialItem {
  _id: string;
  name: string;
  sku: string;
  category: string;
  unitOfMeasure: string;
  minimumStockLevel: number;
  currentStock: number;
  unitCost: number;
  gradeOrSpec?: string;
  description?: string;
  status: string;
}

interface ProjectOption {
  _id: string;
  name: string;
}

const CATEGORIES = [
  "ALL",
  "Cement & Aggregates",
  "Steel & Rebar",
  "Masonry & Bricks",
  "Plumbing & Pipes",
  "Electrical & Lighting",
  "Timber & Formwork",
  "Finishing & Paints",
  "Safety Gear",
  "Hardware & Fasteners",
  "Other",
];

const STANDARD_UNITS = [
  { value: "bags", label: "Bags (bags)" },
  { value: "tonne", label: "Tonne / Metric Ton (tonne)" },
  { value: "tons", label: "Tons (tons)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "m3", label: "Cubic Meters (m³)" },
  { value: "m2", label: "Square Meters (m²)" },
  { value: "m", label: "Linear Meters (m)" },
  { value: "pcs", label: "Pieces / Units (pcs)" },
  { value: "liters", label: "Liters (L)" },
  { value: "boxes", label: "Boxes (boxes)" },
  { value: "rolls", label: "Rolls (rolls)" },
];

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Add Material Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formGradeOrSpec, setFormGradeOrSpec] = useState("");
  const [formCategory, setFormCategory] = useState("Cement & Aggregates");
  const [formUnitOfMeasure, setFormUnitOfMeasure] = useState("bags");
  const [formMinStock, setFormMinStock] = useState("50");
  const [formCurrentStock, setFormCurrentStock] = useState("100");
  const [formUnitCost, setFormUnitCost] = useState("950");
  const [formDescription, setFormDescription] = useState("");

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [matRes, projRes] = await Promise.all([
        fetch("/api/materials?limit=100", { cache: "no-store" }),
        fetch("/api/projects?limit=50", { cache: "no-store" }),
      ]);

      const matJson = await matRes.json();
      if (!matRes.ok || !matJson.success) {
        throw new Error(matJson.error?.message || "Failed to load materials catalog.");
      }

      setMaterials(matJson.data?.items || []);

      if (projRes.ok) {
        const projJson = await projRes.json();
        if (projJson.success && projJson.data?.items) {
          setProjects(projJson.data.items);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load materials catalog.";
      setFetchError(msg);
      setFeedback({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) {
        fetchMaterials();
      }
    });
    return () => {
      ignore = true;
    };
  }, [fetchMaterials]);

  // Form Submission
  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFeedback({ type: "error", message: "Material name is required." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const payload = {
        name: formName.trim(),
        sku: formSku.trim() || undefined,
        category: formCategory,
        unitOfMeasure: formUnitOfMeasure.trim() || "pcs",
        minimumStockLevel: Number(formMinStock) || 0,
        currentStock: Number(formCurrentStock) || 0,
        unitCost: Number(formUnitCost) || 0,
        gradeOrSpec: formGradeOrSpec.trim() || undefined,
        description: formDescription.trim() || undefined,
        status: "ACTIVE",
      };

      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to register material");
      }

      setFeedback({ type: "success", message: `Material "${formName}" registered successfully!` });
      setShowAddModal(false);
      setFormName("");
      setFormSku("");
      setFormGradeOrSpec("");
      setFormDescription("");
      await fetchMaterials();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error saving material record.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMaterials = materials.filter((m) => {
    const term = search.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(term) ||
      m.sku.toLowerCase().includes(term) ||
      m.category.toLowerCase().includes(term) ||
      (m.gradeOrSpec && m.gradeOrSpec.toLowerCase().includes(term));
    const matchesCategory =
      categoryFilter === "ALL" || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalSKUs = materials.length;
  const lowStockCount = materials.filter((m) => m.currentStock <= m.minimumStockLevel).length;
  const totalValuation = materials.reduce((acc, m) => acc + (m.currentStock * m.unitCost), 0);
  const activeCategoriesCount = new Set(materials.map((m) => m.category)).size;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <Boxes className="w-4 h-4" /> Materials &amp; Supply Chain Catalog
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Materials Master Catalog
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Track multi-unit measurement, engineering specifications, stock thresholds, and ETB valuation.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fetchMaterials()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] transition-colors"
              title="Refresh catalog"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="erp-btn-md bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Material</span>
            </button>
          </div>
        </div>

        {/* Inventory KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] shadow-xs">
            <div className="flex items-center justify-between text-[#666666] dark:text-[#A3A3A3] text-xs font-mono uppercase tracking-wider mb-2">
              <span>Catalog SKUs</span>
              <Boxes className="w-4 h-4" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] font-mono">
              {totalSKUs}
            </div>
            <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3] mt-0.5">Master items registered</p>
          </div>

          <div className="p-4 rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] shadow-xs">
            <div className="flex items-center justify-between text-[#666666] dark:text-[#A3A3A3] text-xs font-mono uppercase tracking-wider mb-2">
              <span>Reorder Warnings</span>
              <TrendingDown className="w-4 h-4" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] font-mono">
              {lowStockCount}
            </div>
            <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3] mt-0.5">Stock at or below minimum</p>
          </div>

          <div className="p-4 rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] shadow-xs">
            <div className="flex items-center justify-between text-[#666666] dark:text-[#A3A3A3] text-xs font-mono uppercase tracking-wider mb-2">
              <span>Stock Valuation</span>
              <Coins className="w-4 h-4" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] font-mono truncate">
              {formatCurrency(totalValuation, true)}
            </div>
            <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3] mt-0.5">Total inventory at cost</p>
          </div>

          <div className="p-4 rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] shadow-xs">
            <div className="flex items-center justify-between text-[#666666] dark:text-[#A3A3A3] text-xs font-mono uppercase tracking-wider mb-2">
              <span>Categories</span>
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] font-mono">
              {activeCategoriesCount}
            </div>
            <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3] mt-0.5">Active trade divisions</p>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-200 ${
              feedback.type === "success"
                ? "bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] border border-[#111111] dark:border-[#FFFFFF] font-semibold"
                : "bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#000000] font-bold border border-[#000000] dark:border-[#FFFFFF]"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Toolbar & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] dark:text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search by SKU, material name, category, or engineering spec..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] focus:ring-1 focus:ring-0 transition-all shadow-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  categoryFilter === cat
                    ? "bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] font-bold shadow-xs"
                    : "bg-white dark:bg-[#111111] text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Materials Table Card */}
        <div className="glass-card border border-[#D4D4D4] dark:border-[#303030] rounded-2xl overflow-hidden shadow-xs bg-[#FFFFFF] dark:bg-[#111111]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider font-mono text-[10px] border-b border-[#D4D4D4] dark:border-[#303030]">
                <tr>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Material Name &amp; Spec</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">UOM</th>
                  <th className="px-5 py-3">Unit Cost (ETB)</th>
                  <th className="px-5 py-3">Current Stock</th>
                  <th className="px-5 py-3">Min. Threshold</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-[#666666] dark:text-[#A3A3A3]">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#666666] dark:text-[#A3A3A3]" />
                        <span>Loading materials catalog...</span>
                      </div>
                    </td>
                  </tr>
                ) : fetchError ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <div className="max-w-md mx-auto space-y-3">
                        <AlertTriangle className="w-8 h-8 text-[#666666] dark:text-[#A3A3A3] mx-auto" />
                        <p className="text-sm font-bold text-[#000000] dark:text-[#FFFFFF]">
                          Unable to Load Materials Catalog
                        </p>
                        <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">{fetchError}</p>
                        <button
                          onClick={() => fetchMaterials()}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry Loading</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-[#666666] dark:text-[#A3A3A3]">
                      No materials match your criteria. Click &quot;Add Material&quot; to register new items.
                    </td>
                  </tr>
                ) : (
                  filteredMaterials.map((m) => {
                    const isLowStock = m.currentStock <= m.minimumStockLevel;
                    return (
                      <tr
                        key={m._id}
                        className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors"
                      >
                        <td className="px-5 py-3.5 font-mono text-[#666666] dark:text-[#A3A3A3] font-bold">
                          {m.sku}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-[#000000] dark:text-[#FFFFFF]">
                            {m.name}
                          </div>
                          {m.gradeOrSpec && (
                            <div className="text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3] mt-0.5">
                              Spec: {m.gradeOrSpec}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-[#666666] dark:text-[#A3A3A3]">
                          {m.category}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[#666666] dark:text-[#A3A3A3]">
                          {m.unitOfMeasure}
                        </td>
                        <td className="px-5 py-3.5 font-mono font-semibold text-[#000000] dark:text-[#FFFFFF]">
                          {formatCurrency(m.unitCost, true)}
                        </td>
                        <td className="px-5 py-3.5 font-bold font-mono">
                          <span
                            className={
                              isLowStock
                                ? "text-[#000000] dark:text-[#FFFFFF] flex items-center gap-1 font-bold"
                                : "text-[#000000] dark:text-[#FFFFFF]"
                            }
                          >
                            {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-[#000000] dark:text-[#FFFFFF]" />}
                            {m.currentStock.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[#666666] dark:text-[#A3A3A3]">
                          {m.minimumStockLevel}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono border ${
                              isLowStock
                                ? "bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#000000] border-transparent"
                                : "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border-[#D4D4D4] dark:border-[#303030]"
                            }`}
                          >
                            {isLowStock ? "REORDER" : "IN STOCK"}
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

        {/* Modal: Add Material Dialog */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain p-4 sm:p-6 flex items-center justify-center bg-black/70 backdrop-blur-xs animate-v18-backdrop">
            <div className="my-auto max-h-[88vh] flex flex-col overflow-hidden w-full erp-modal-md v18-card bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl shadow-2xl animate-v18-modal">
              <div className="flex items-center justify-between p-6 pb-4 border-b border-[#D4D4D4] dark:border-[#303030] shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#303030]">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
                      Register New Material
                    </h2>
                    <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">
                      Add items with unit of measure, quality specifications, and ETB unit pricing
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg text-[#888888] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#1F1F1F] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMaterial} className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 py-4 space-y-4 pr-2">
                <div>
                  <label className="block text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] mb-1">
                    Material Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Portland Pozzolana Cement (50kg)"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] mb-1">
                      SKU / Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., MAT-CEM-001 (auto if empty)"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] mb-1">
                      Grade / Engineering Spec
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Grade 60, C-25, 42.5R"
                      value={formGradeOrSpec}
                      onChange={(e) => setFormGradeOrSpec(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] mb-1">
                      Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                    >
                      {CATEGORIES.filter((c) => c !== "ALL").map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] mb-1">
                      Unit of Measure *
                    </label>
                    <select
                      value={formUnitOfMeasure}
                      onChange={(e) => setFormUnitOfMeasure(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                    >
                      {STANDARD_UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] mb-1">
                      Initial Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formCurrentStock}
                      onChange={(e) => setFormCurrentStock(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] mb-1">
                      Min Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formMinStock}
                      onChange={(e) => setFormMinStock(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] mb-1">
                      Unit Cost (ETB) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formUnitCost}
                      onChange={(e) => setFormUnitCost(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                    />
                  </div>
                </div>

                </div>

                <div className="flex items-center justify-end gap-3 p-6 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs font-semibold hover:bg-[#E5E5E5] dark:hover:bg-[#1F1F1F] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold shadow-md shadow-black/10 transition-all disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#FFFFFF] dark:text-[#000000]" />
                        <span>Saving Material...</span>
                      </>
                    ) : (
                      <span>Save Material</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
