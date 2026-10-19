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
          if (projJson.data.items.length > 0) {
            setFormProjectId((prev) => prev || projJson.data.items[0]._id);
          }
        }
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to load materials catalog." });
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
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <Boxes className="w-4 h-4" /> Materials &amp; Inventory Catalog
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Materials Master Catalog
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Live stock levels, reorder thresholds, unit prices (ETB), and category tracking across construction sites.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs sm:text-sm font-bold shadow-md shadow-black/10 transition-all hover:scale-[1.015] active:scale-[0.98] shrink-0"
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
              placeholder="Search by SKU, material name, category..."
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
                    : "bg-white dark:bg-[#111111] text-[#666666] dark:text-[#A3A3A3] dark:text-[#A3A3A3] hover:text-[#000000] dark:text-[#FFFFFF] dark:hover:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Materials Table Card */}
        <div className="glass-card border border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFA] dark:bg-[#171717]/80 dark:bg-[#111111] text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider font-mono text-[10px] border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
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
              <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030] dark:divide-[#303030]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-[#666666] dark:text-[#A3A3A3]">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#666666] dark:text-[#A3A3A3]" />
                        <span>Loading materials catalog...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-[#666666] dark:text-[#A3A3A3]">
                      No materials match your criteria. Click &quot;Add Material&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  filteredMaterials.map((m) => {
                    const isLowStock = m.currentStock <= m.minimumStockLevel;
                    return (
                      <tr
                        key={m._id}
                        className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] dark:hover:bg-[#1F1F1F]/30 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-mono text-[#666666] dark:text-[#A3A3A3] font-bold">
                          {m.sku}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-[#000000] dark:text-[#FFFFFF]">
                          {m.name}
                        </td>
                        <td className="px-5 py-3.5 text-[#666666] dark:text-[#A3A3A3] dark:text-[#A3A3A3]">
                          {m.category}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[#666666] dark:text-[#A3A3A3] dark:text-[#A3A3A3]">
                          {m.unitOfMeasure}
                        </td>
                        <td className="px-5 py-3.5 font-mono font-semibold text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF]">
                          {formatCurrency(m.unitCost, true)}
                        </td>
                        <td className="px-5 py-3.5 font-bold">
                          <span
                            className={
                              isLowStock
                                ? "text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] flex items-center gap-1 font-mono"
                                : "text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] font-mono"
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
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isLowStock
                                ? "bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]"
                                : "bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]"
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
            <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#303030]">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
                      Add Material to Catalog
                    </h2>
                    <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">
                      Register site building materials and inventory SKU
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg text-[#888888] dark:text-[#888888] hover:text-[#444444] dark:text-[#D4D4D4] dark:hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#1F1F1F] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMaterial} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] mb-1">
                    Material Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Portland Cement Type I"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] mb-1">
                      SKU / Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., CEM-001 (auto if empty)"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] mb-1">
                      Target Project / Site *
                    </label>
                    <select
                      required
                      value={formProjectId}
                      onChange={(e) => setFormProjectId(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
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
                    <label className="block text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] mb-1">
                      Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
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
                      Unit of Measure
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., bags, tons, pcs, m³"
                      value={formUnitOfMeasure}
                      onChange={(e) => setFormUnitOfMeasure(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                    />
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
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
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
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] mb-1">
                      Unit Cost (ETB)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formUnitCost}
                      onChange={(e) => setFormUnitCost(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs font-semibold hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#1F1F1F] transition-colors"
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
