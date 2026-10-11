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
];

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Add Material Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formProjectId, setFormProjectId] = useState("");
  const [formCategory, setFormCategory] = useState("Cement & Aggregates");
  const [formUnitOfMeasure, setFormUnitOfMeasure] = useState("bags");
  const [formMinStock, setFormMinStock] = useState("50");
  const [formCurrentStock, setFormCurrentStock] = useState("100");
  const [formUnitCost, setFormUnitCost] = useState("950");

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const [matRes, projRes] = await Promise.all([
        fetch("/api/records/materials", { cache: "no-store" }),
        fetch("/api/projects?limit=50", { cache: "no-store" }),
      ]);

      const matJson = await matRes.json();
      if (matRes.ok && matJson.success && matJson.data?.items) {
        setMaterials(
          matJson.data.items.map((item: { _id: string; title?: string; status?: string; data?: Record<string, unknown> }) => ({
            _id: item._id,
            name: (item.title || item.data?.name || "Material Item") as string,
            sku: (item.data?.sku || "SKU-" + item._id.slice(-4).toUpperCase()) as string,
            category: (item.data?.category || "Cement & Aggregates") as string,
            unitOfMeasure: (item.data?.unitOfMeasure || "units") as string,
            minimumStockLevel: Number(item.data?.minimumStockLevel) || 10,
            currentStock: Number(item.data?.currentStock ?? 50),
            unitCost: Number(item.data?.unitCost) || 0,
            status: item.status || "ACTIVE",
          }))
        );
      }

      if (projRes.ok) {
        const projJson = await projRes.json();
        if (projJson.success && projJson.data?.items) {
          setProjects(projJson.data.items);
          if (projJson.data.items.length > 0 && !formProjectId) {
            setFormProjectId(projJson.data.items[0]._id);
          }
        }
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to load materials catalog." });
    } finally {
      setLoading(false);
    }
  }, [formProjectId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Form Submission
  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFeedback({ type: "error", message: "Material name is required." });
      return;
    }
    if (!formProjectId) {
      setFeedback({ type: "error", message: "Please select an assigned project site." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const payload = {
        projectId: formProjectId,
        title: formName.trim(),
        status: "ACTIVE",
        data: {
          name: formName.trim(),
          sku: formSku.trim() || `SKU-${Date.now().toString().slice(-5)}`,
          category: formCategory,
          unitOfMeasure: formUnitOfMeasure.trim() || "units",
          minimumStockLevel: Number(formMinStock) || 0,
          currentStock: Number(formCurrentStock) || 0,
          unitCost: Number(formUnitCost) || 0,
        },
      };

      const res = await fetch("/api/records/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to add material");
      }

      setFeedback({ type: "success", message: `Material "${formName}" registered successfully!` });
      setShowAddModal(false);
      setFormName("");
      setFormSku("");
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
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.sku.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase());
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
            <div className="flex items-center gap-2 text-[#C0C8CA] font-mono text-xs font-bold uppercase tracking-wider mb-1">
              <Boxes className="w-4 h-4" /> Materials &amp; Inventory Catalog
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1E22] dark:text-[#D4D8DD] tracking-tight">
              Materials Master Catalog
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7078] dark:text-[#AAB7B7] mt-1">
              Live stock levels, reorder thresholds, unit prices (ETB), and category tracking across construction sites.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#C0C8CA] hover:bg-white text-[#1A2D42] text-xs sm:text-sm font-bold shadow-md shadow-black/10 transition-all hover:scale-[1.015] active:scale-[0.98] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Material</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-200 ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400"
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAB7B7]" />
            <input
              type="text"
              placeholder="Search by SKU, material name, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#1A2D42]/80 border border-slate-200 dark:border-[#AAB7B7]/25 text-slate-900 dark:text-[#D4D8DD] placeholder-slate-400 dark:placeholder-[#AAB7B7]/50 text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-[#C0C8CA] focus:ring-1 focus:ring-[#C0C8CA]/30 transition-all shadow-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  categoryFilter === cat
                    ? "bg-[#C0C8CA] text-[#1A2D42] font-bold shadow-xs"
                    : "bg-white dark:bg-[#1A2D42]/80 text-slate-600 dark:text-[#AAB7B7] hover:text-slate-900 dark:hover:text-[#D4D8DD] border border-slate-200 dark:border-[#AAB7B7]/25"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Materials Table Card */}
        <div className="glass-card border border-slate-200 dark:border-[#AAB7B7]/20 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-[#1A2D42]/90 text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider font-mono text-[10px] border-b border-slate-200 dark:border-[#AAB7B7]/20">
                <tr>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Material Name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">UOM</th>
                  <th className="px-5 py-3">Unit Cost (ETB)</th>
                  <th className="px-5 py-3">Current Stock</th>
                  <th className="px-5 py-3">Min. Threshold</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#AAB7B7]/15">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#C0C8CA]" />
                        <span>Loading materials catalog...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                      No materials match your criteria. Click &quot;Add Material&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  filteredMaterials.map((m) => {
                    const isLowStock = m.currentStock <= m.minimumStockLevel;
                    return (
                      <tr
                        key={m._id}
                        className="hover:bg-slate-50/70 dark:hover:bg-[#2E4156]/30 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-mono text-[#C0C8CA] font-bold">
                          {m.sku}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-[#D4D8DD]">
                          {m.name}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-[#AAB7B7]">
                          {m.category}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-600 dark:text-[#AAB7B7]">
                          {m.unitOfMeasure}
                        </td>
                        <td className="px-5 py-3.5 font-mono font-semibold text-slate-800 dark:text-[#D4D8DD]">
                          {formatCurrency(m.unitCost, true)}
                        </td>
                        <td className="px-5 py-3.5 font-bold">
                          <span
                            className={
                              isLowStock
                                ? "text-amber-600 dark:text-amber-400 flex items-center gap-1 font-mono"
                                : "text-emerald-600 dark:text-emerald-400 font-mono"
                            }
                          >
                            {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                            {m.currentStock.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-500 dark:text-[#AAB7B7]">
                          {m.minimumStockLevel}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isLowStock
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#AAB7B7]/20">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#2E4156] text-[#C0C8CA] border border-[#AAB7B7]/20">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-[#D4D8DD]">
                      Add Material to Catalog
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#AAB7B7]">
                      Register site building materials and inventory SKU
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2E4156] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMaterial} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D8DD] mb-1">
                    Material Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Portland Cement Type I"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#2E4156]/50 border border-slate-200 dark:border-[#AAB7B7]/25 text-slate-900 dark:text-[#D4D8DD] placeholder-slate-400 dark:placeholder-[#AAB7B7]/50 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#C0C8CA]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D8DD] mb-1">
                      SKU / Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., CEM-001 (auto if empty)"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#2E4156]/50 border border-slate-200 dark:border-[#AAB7B7]/25 text-slate-900 dark:text-[#D4D8DD] placeholder-slate-400 dark:placeholder-[#AAB7B7]/50 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#C0C8CA]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D8DD] mb-1">
                      Target Project / Site *
                    </label>
                    <select
                      required
                      value={formProjectId}
                      onChange={(e) => setFormProjectId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#2E4156]/50 border border-slate-200 dark:border-[#AAB7B7]/25 text-slate-900 dark:text-[#D4D8DD] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#C0C8CA]"
                    >
                      {projects.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D8DD] mb-1">
                      Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#2E4156]/50 border border-slate-200 dark:border-[#AAB7B7]/25 text-slate-900 dark:text-[#D4D8DD] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#C0C8CA]"
                    >
                      {CATEGORIES.filter((c) => c !== "ALL").map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D8DD] mb-1">
                      Unit of Measure
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., bags, tons, pcs, m³"
                      value={formUnitOfMeasure}
                      onChange={(e) => setFormUnitOfMeasure(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#2E4156]/50 border border-slate-200 dark:border-[#AAB7B7]/25 text-slate-900 dark:text-[#D4D8DD] placeholder-slate-400 dark:placeholder-[#AAB7B7]/50 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#C0C8CA]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D8DD] mb-1">
                      Initial Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formCurrentStock}
                      onChange={(e) => setFormCurrentStock(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#2E4156]/50 border border-slate-200 dark:border-[#AAB7B7]/25 text-slate-900 dark:text-[#D4D8DD] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#C0C8CA]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D8DD] mb-1">
                      Min Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formMinStock}
                      onChange={(e) => setFormMinStock(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#2E4156]/50 border border-slate-200 dark:border-[#AAB7B7]/25 text-slate-900 dark:text-[#D4D8DD] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#C0C8CA]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#D4D8DD] mb-1">
                      Unit Cost (ETB)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formUnitCost}
                      onChange={(e) => setFormUnitCost(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#2E4156]/50 border border-slate-200 dark:border-[#AAB7B7]/25 text-slate-900 dark:text-[#D4D8DD] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#C0C8CA]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#AAB7B7]/20">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#AAB7B7]/25 text-slate-700 dark:text-[#D4D8DD] text-xs font-semibold hover:bg-slate-100 dark:hover:bg-[#2E4156] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C0C8CA] hover:bg-white text-[#1A2D42] text-xs font-bold shadow-md shadow-black/10 transition-all disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#1A2D42]" />
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
