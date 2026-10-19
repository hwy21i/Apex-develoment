"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Package,
  Layers,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Trash2,
  ArrowDownRight,
  TrendingDown,
  Edit,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters/currency";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";

interface MaterialItem {
  _id: string;
  name: string;
  sku: string;
  category: string;
  unitOfMeasure: string;
  quantity: number;
  minimumStockLevel: number;
  unitCost: number;
  totalCost: number;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  notes?: string;
}

interface MaterialUsageItem {
  _id: string;
  materialName: string;
  wbsActivity: string;
  plannedQty: number;
  actualQtyUsed: number;
  wasteQty: number;
  wastePct: number;
  unit: string;
  loggedDate: string;
  recordedBy: string;
  notes?: string;
  status: "Normal" | "Excess Waste" | "Efficient";
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

const UNITS = ["bags", "tons", "kg", "m3", "m2", "meters", "pieces", "liters", "rolls"];

export default function ProjectMaterialsPage() {
  const params = useParams();
  const projectId = String(params?.projectId || "");

  const [activeTab, setActiveTab] = useState<"catalog" | "usage">("catalog");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Load project materials and usage records
  const {
    records: materialRecords,
    loading: loadingMaterials,
    reload: reloadMaterials,
    create: createMaterialRecord,
    update: updateMaterialRecord,
    remove: removeMaterialRecord,
  } = useRecords("materials", projectId);

  const {
    records: usageRecords,
    loading: loadingUsage,
    reload: reloadUsage,
    create: createUsageRecord,
    remove: removeUsageRecord,
  } = useRecords("material-usage", projectId);

  // Modals
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [showLogUsageModal, setShowLogUsageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<{ id: string; type: "material" | "usage" } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Material Form State
  const [matName, setMatName] = useState("");
  const [matSku, setMatSku] = useState("");
  const [matCategory, setMatCategory] = useState("Cement & Aggregates");
  const [matUnit, setMatUnit] = useState("bags");
  const [matQty, setMatQty] = useState("100");
  const [matMinStock, setMatMinStock] = useState("20");
  const [matUnitCost, setMatUnitCost] = useState("850");
  const [matNotes, setMatNotes] = useState("");

  // Usage Form State
  const [usageMaterialName, setUsageMaterialName] = useState("");
  const [usageSelectedMatId, setUsageSelectedMatId] = useState("");
  const [usageActivity, setUsageActivity] = useState("");
  const [usagePlannedQty, setUsagePlannedQty] = useState("50");
  const [usageActualQty, setUsageActualQty] = useState("52");
  const [usageWasteQty, setUsageWasteQty] = useState("2");
  const [usageUnit, setUsageUnit] = useState("bags");
  const [usageNotes, setUsageNotes] = useState("");

  // Transform records into typed items
  const materials: MaterialItem[] = useMemo(() => {
    return materialRecords.map((r) => {
      const d = r.data || {};
      const quantity = Number(d.quantity ?? d.currentStock) || 0;
      const minLevel = Number(d.minimumStockLevel ?? d.minStock) || 10;
      const unitCost = Number(d.unitCost) || 0;
      let status: MaterialItem["status"] = "IN_STOCK";
      if (quantity <= 0) status = "OUT_OF_STOCK";
      else if (quantity <= minLevel) status = "LOW_STOCK";

      return {
        _id: r._id,
        name: r.title || d.name || "Material",
        sku: d.sku || `MAT-${r._id.slice(-4).toUpperCase()}`,
        category: d.category || "Cement & Aggregates",
        unitOfMeasure: d.unitOfMeasure || "pieces",
        quantity,
        minimumStockLevel: minLevel,
        unitCost,
        totalCost: quantity * unitCost,
        status,
        notes: d.notes,
      };
    });
  }, [materialRecords]);

  const usageLogs: MaterialUsageItem[] = useMemo(() => {
    return usageRecords.map((r) => {
      const d = r.data || {};
      const planned = Number(d.plannedQty) || 0;
      const actual = Number(d.actualQtyUsed ?? d.quantity) || 0;
      const waste = d.wasteQty !== undefined ? Number(d.wasteQty) : Math.max(actual - planned, 0);
      const wastePct = planned > 0 ? Math.round((waste / planned) * 1000) / 10 : 0;
      let status: MaterialUsageItem["status"] = "Normal";
      if (wastePct > 5) status = "Excess Waste";
      else if (planned > 0 && wastePct <= 1) status = "Efficient";

      return {
        _id: r._id,
        materialName: d.materialName || r.title || "Material",
        wbsActivity: d.wbsActivity || d.activity || "Construction Phase",
        plannedQty: planned,
        actualQtyUsed: actual,
        wasteQty: waste,
        wastePct,
        unit: d.unit || "units",
        loggedDate: d.loggedDate || (r.createdAt ? r.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]),
        recordedBy: d.recordedBy || "Site Engineer",
        notes: d.notes,
        status,
      };
    });
  }, [usageRecords]);

  // Derived Statistics
  const stats = useMemo(() => {
    const totalMaterials = materials.length;
    const totalValue = materials.reduce((acc, m) => acc + m.totalCost, 0);
    const lowStockCount = materials.filter((m) => m.status === "LOW_STOCK" || m.status === "OUT_OF_STOCK").length;
    const totalLogs = usageLogs.length;
    const avgWastePct =
      totalLogs > 0 ? Math.round((usageLogs.reduce((acc, u) => acc + u.wastePct, 0) / totalLogs) * 10) / 10 : 0;

    return { totalMaterials, totalValue, lowStockCount, totalLogs, avgWastePct };
  }, [materials, usageLogs]);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
      }
      return true;
    });
  }, [materials, categoryFilter, search]);

  // Filtered usage logs
  const filteredUsageLogs = useMemo(() => {
    return usageLogs.filter((item) => {
      if (search) {
        const q = search.toLowerCase();
        return (
          item.materialName.toLowerCase().includes(q) ||
          item.wbsActivity.toLowerCase().includes(q) ||
          (item.notes || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [usageLogs, search]);

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matName.trim()) {
      setFeedback({ type: "error", message: "Material name is required." });
      return;
    }

    try {
      setSubmitting(true);
      const qtyNum = Number(matQty) || 0;
      const minNum = Number(matMinStock) || 0;
      const costNum = Number(matUnitCost) || 0;

      await createMaterialRecord({
        projectId,
        title: matName.trim(),
        status: qtyNum <= 0 ? "OUT_OF_STOCK" : qtyNum <= minNum ? "LOW_STOCK" : "IN_STOCK",
        data: {
          name: matName.trim(),
          sku: matSku.trim().toUpperCase() || `MAT-${Date.now().toString().slice(-4)}`,
          category: matCategory,
          unitOfMeasure: matUnit,
          quantity: qtyNum,
          currentStock: qtyNum,
          minimumStockLevel: minNum,
          unitCost: costNum,
          totalCost: qtyNum * costNum,
          notes: matNotes.trim(),
        },
      });

      setFeedback({ type: "success", message: `Material "${matName}" allocated to project.` });
      setShowAddMaterialModal(false);
      setMatName("");
      setMatSku("");
      setMatNotes("");
      reloadMaterials();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error saving material" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalMatName = usageMaterialName.trim();
    if (!finalMatName) {
      setFeedback({ type: "error", message: "Material name is required." });
      return;
    }

    try {
      setSubmitting(true);
      const planned = Number(usagePlannedQty) || 0;
      const actual = Number(usageActualQty) || 0;
      const waste = Number(usageWasteQty) || Math.max(actual - planned, 0);
      const wastePct = planned > 0 ? Math.round((waste / planned) * 1000) / 10 : 0;

      let status = "Normal";
      if (wastePct > 5) status = "Excess Waste";
      else if (planned > 0 && wastePct <= 1) status = "Efficient";

      await createUsageRecord({
        projectId,
        title: `${finalMatName} (${actual} ${usageUnit})`,
        status,
        data: {
          materialName: finalMatName,
          wbsActivity: usageActivity.trim() || "Site Operations",
          plannedQty: planned,
          actualQtyUsed: actual,
          wasteQty: waste,
          wastePct,
          unit: usageUnit,
          loggedDate: new Date().toISOString().split("T")[0],
          recordedBy: "Site Engineer",
          notes: usageNotes.trim(),
        },
      });

      // If tied to an existing material item, deduct stock
      if (usageSelectedMatId) {
        const targetMat = materials.find((m) => m._id === usageSelectedMatId);
        if (targetMat) {
          const newQty = Math.max(targetMat.quantity - actual, 0);
          await updateMaterialRecord(usageSelectedMatId, {
            status: newQty <= 0 ? "OUT_OF_STOCK" : newQty <= targetMat.minimumStockLevel ? "LOW_STOCK" : "IN_STOCK",
            data: {
              quantity: newQty,
              currentStock: newQty,
              totalCost: newQty * targetMat.unitCost,
            },
          });
          reloadMaterials();
        }
      }

      setFeedback({ type: "success", message: `Logged ${actual} ${usageUnit} of ${finalMatName}.` });
      setShowLogUsageModal(false);
      setUsageActivity("");
      setUsageNotes("");
      reloadUsage();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error logging usage" });
    } finally {
      setSubmitting(false);
    }
  };

  const openUsageModalWithMaterial = (mat: MaterialItem) => {
    setUsageSelectedMatId(mat._id);
    setUsageMaterialName(mat.name);
    setUsageUnit(mat.unitOfMeasure);
    setUsagePlannedQty("50");
    setUsageActualQty("50");
    setUsageWasteQty("0");
    setShowLogUsageModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRecord) return;
    try {
      setSubmitting(true);
      if (deletingRecord.type === "material") {
        await removeMaterialRecord(deletingRecord.id);
        setFeedback({ type: "success", message: "Material removed from site inventory." });
        reloadMaterials();
      } else {
        await removeUsageRecord(deletingRecord.id);
        setFeedback({ type: "success", message: "Usage record deleted." });
        reloadUsage();
      }
      setShowDeleteModal(false);
      setDeletingRecord(null);
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to delete record" });
    } finally {
      setSubmitting(false);
    }
  };

  const loading = loadingMaterials || loadingUsage;

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-sm transition-all ${
            feedback.type === "success"
              ? "bg-[#FAFAFA] dark:bg-[#111111] border-[#000000] dark:border-[#FFFFFF] text-[#000000] dark:text-[#FFFFFF]"
              : "bg-[#FAFAFA] dark:bg-[#111111] border-[#303030] text-[#000000] dark:text-[#FFFFFF]"
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[#000000] dark:text-[#FFFFFF]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#666666] dark:text-[#A3A3A3]" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-md text-[#666666] dark:text-[#A3A3A3]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
              Inventory & Site Logistics
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#000000] dark:text-[#FFFFFF]">
            Project Materials
          </h2>
          <p className="text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
            Track site stock levels, material issue tickets, concrete & steel consumption, and waste percentages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setUsageSelectedMatId("");
              setUsageMaterialName(materials.length > 0 ? materials[0].name : "");
              setUsageUnit(materials.length > 0 ? materials[0].unitOfMeasure : "bags");
              setShowLogUsageModal(true);
            }}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors"
          >
            <ArrowDownRight className="w-3.5 h-3.5 mr-1.5" />
            Log Consumption
          </button>
          <button
            onClick={() => setShowAddMaterialModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Allocate Material
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Allocated Items</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.totalMaterials}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Site Inventory Value</p>
          <p className="text-xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">
            {formatCurrency(stats.totalValue)}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Low Stock Items</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.lowStockCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Usage Entries</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.totalLogs}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Average Waste</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.avgWastePct}%</p>
        </div>
      </div>

      {/* Tabs & Search Filter Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "catalog"
                ? "bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]"
                : "text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
            }`}
          >
            Site Stock Catalog ({materials.length})
          </button>
          <button
            onClick={() => setActiveTab("usage")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "usage"
                ? "bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]"
                : "text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
            }`}
          >
            Consumption & Waste Logs ({usageLogs.length})
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none"
            />
          </div>

          {activeTab === "catalog" && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
          <Loader2 className="w-7 h-7 animate-spin text-[#000000] dark:text-[#FFFFFF] mb-2" />
          <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Loading project materials and logs...</p>
        </div>
      ) : activeTab === "catalog" ? (
        filteredMaterials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
            <Boxes className="w-10 h-10 text-[#666666] dark:text-[#A3A3A3] mb-3" />
            <h3 className="text-base font-semibold text-[#000000] dark:text-[#FFFFFF]">No materials allocated</h3>
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] max-w-sm mt-1 mb-5">
              {search || categoryFilter !== "ALL"
                ? "No materials match your active search or category filters."
                : "No materials are currently registered for this construction site. Allocate the first material item."}
            </p>
            <button
              onClick={() => setShowAddMaterialModal(true)}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Allocate First Material
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
                  <th className="py-3 px-4 font-semibold">Material / Item</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold text-right">Available Stock</th>
                  <th className="py-3 px-4 font-semibold text-right">Min Level</th>
                  <th className="py-3 px-4 font-semibold text-right">Unit Cost</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Value</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                {filteredMaterials.map((item) => (
                  <tr key={item._id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#000000] dark:text-[#FFFFFF]">{item.name}</div>
                      <div className="text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3]">{item.sku}</div>
                    </td>
                    <td className="py-3 px-4 text-[#666666] dark:text-[#A3A3A3]">{item.category}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">
                      {item.quantity.toLocaleString()} {item.unitOfMeasure}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#666666] dark:text-[#A3A3A3]">
                      {item.minimumStockLevel.toLocaleString()} {item.unitOfMeasure}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#666666] dark:text-[#A3A3A3]">
                      {formatCurrency(item.unitCost)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">
                      {formatCurrency(item.totalCost)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] bg-black/5 dark:bg-white/5">
                        {item.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openUsageModalWithMaterial(item)}
                          className="px-2 py-1 rounded-md text-[11px] font-medium border border-[#D4D4D4] dark:border-[#303030] hover:bg-black/5 dark:hover:bg-white/5 text-[#000000] dark:text-[#FFFFFF] transition-colors"
                        >
                          Issue
                        </button>
                        <button
                          onClick={() => {
                            setDeletingRecord({ id: item._id, type: "material" });
                            setShowDeleteModal(true);
                          }}
                          className="p-1 rounded-md border border-[#D4D4D4] dark:border-[#303030] text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Usage Logs Tab */
        filteredUsageLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
            <TrendingDown className="w-10 h-10 text-[#666666] dark:text-[#A3A3A3] mb-3" />
            <h3 className="text-base font-semibold text-[#000000] dark:text-[#FFFFFF]">No usage logs recorded</h3>
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] max-w-sm mt-1 mb-5">
              Record daily material consumption against project activities to monitor waste and productivity.
            </p>
            <button
              onClick={() => {
                setUsageSelectedMatId("");
                setUsageMaterialName(materials.length > 0 ? materials[0].name : "");
                setShowLogUsageModal(true);
              }}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Log First Usage
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Material</th>
                  <th className="py-3 px-4 font-semibold">Activity / Phase</th>
                  <th className="py-3 px-4 font-semibold text-right">Planned Qty</th>
                  <th className="py-3 px-4 font-semibold text-right">Actual Used</th>
                  <th className="py-3 px-4 font-semibold text-right">Waste (Qty / %)</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                {filteredUsageLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors">
                    <td className="py-3 px-4 font-mono text-[#666666] dark:text-[#A3A3A3] whitespace-nowrap">
                      {log.loggedDate}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#000000] dark:text-[#FFFFFF]">{log.materialName}</td>
                    <td className="py-3 px-4 text-[#666666] dark:text-[#A3A3A3]">{log.wbsActivity}</td>
                    <td className="py-3 px-4 text-right font-mono text-[#666666] dark:text-[#A3A3A3]">
                      {log.plannedQty.toLocaleString()} {log.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">
                      {log.actualQtyUsed.toLocaleString()} {log.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <span className="font-semibold text-[#000000] dark:text-[#FFFFFF]">
                        {log.wasteQty} {log.unit}
                      </span>{" "}
                      <span className="text-[10px] text-[#666666] dark:text-[#A3A3A3]">({log.wastePct}%)</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] bg-black/5 dark:bg-white/5">
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setDeletingRecord({ id: log._id, type: "usage" });
                          setShowDeleteModal(true);
                        }}
                        className="p-1 rounded-md border border-[#D4D4D4] dark:border-[#303030] text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ALLOCATE MATERIAL MODAL */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
                <h3 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">Allocate Material to Site</h3>
              </div>
              <button
                onClick={() => setShowAddMaterialModal(false)}
                className="p-1 text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Material Name *
                </label>
                <input
                  type="text"
                  required
                  value={matName}
                  onChange={(e) => setMatName(e.target.value)}
                  placeholder="e.g. Portland Cement Grade 42.5R"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Category
                  </label>
                  <select
                    value={matCategory}
                    onChange={(e) => setMatCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  >
                    {CATEGORIES.filter((c) => c !== "ALL").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Unit of Measure
                  </label>
                  <select
                    value={matUnit}
                    onChange={(e) => setMatUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Initial Stock Qty
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={matQty}
                    onChange={(e) => setMatQty(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Min Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matMinStock}
                    onChange={(e) => setMatMinStock(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Unit Cost (ETB)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matUnitCost}
                    onChange={(e) => setMatUnitCost(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    SKU / Reference Code
                  </label>
                  <input
                    type="text"
                    value={matSku}
                    onChange={(e) => setMatSku(e.target.value)}
                    placeholder="Auto-generated if blank"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Storage Location / Notes
                  </label>
                  <input
                    type="text"
                    value={matNotes}
                    onChange={(e) => setMatNotes(e.target.value)}
                    placeholder="Warehouse Bay 4, Yard A..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D4D4D4] dark:border-[#303030]">
                <button
                  type="button"
                  onClick={() => setShowAddMaterialModal(false)}
                  className="px-4 py-2 text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] rounded-xl text-[#000000] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG USAGE MODAL */}
      {showLogUsageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
              <div className="flex items-center space-x-2">
                <ArrowDownRight className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
                <h3 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">Record Material Consumption</h3>
              </div>
              <button
                onClick={() => setShowLogUsageModal(false)}
                className="p-1 text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogUsage} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Select Material *
                </label>
                {materials.length > 0 ? (
                  <select
                    value={usageSelectedMatId}
                    onChange={(e) => {
                      setUsageSelectedMatId(e.target.value);
                      const m = materials.find((mat) => mat._id === e.target.value);
                      if (m) {
                        setUsageMaterialName(m.name);
                        setUsageUnit(m.unitOfMeasure);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  >
                    <option value="">Custom / Direct Entry</option>
                    {materials.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} (Stock: {m.quantity} {m.unitOfMeasure})
                      </option>
                    ))}
                  </select>
                ) : null}

                {(!usageSelectedMatId || materials.length === 0) && (
                  <input
                    type="text"
                    required
                    value={usageMaterialName}
                    onChange={(e) => setUsageMaterialName(e.target.value)}
                    placeholder="Enter material name..."
                    className="mt-2 w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  WBS Activity / Phase
                </label>
                <input
                  type="text"
                  required
                  value={usageActivity}
                  onChange={(e) => setUsageActivity(e.target.value)}
                  placeholder="e.g. Substructure Concrete Pouring (Column Grid 4-8)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Planned Qty
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={usagePlannedQty}
                    onChange={(e) => setUsagePlannedQty(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Actual Used *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={usageActualQty}
                    onChange={(e) => setUsageActualQty(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Waste / Offcut
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={usageWasteQty}
                    onChange={(e) => setUsageWasteQty(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Unit
                  </label>
                  <select
                    value={usageUnit}
                    onChange={(e) => setUsageUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Remarks / Waste Reason
                  </label>
                  <input
                    type="text"
                    value={usageNotes}
                    onChange={(e) => setUsageNotes(e.target.value)}
                    placeholder="Batch #, spillage, re-bend scrap..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D4D4D4] dark:border-[#303030]">
                <button
                  type="button"
                  onClick={() => setShowLogUsageModal(false)}
                  className="px-4 py-2 text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] rounded-xl text-[#000000] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  Record Consumption
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-2xl">
            <div className="flex items-center space-x-3 text-[#000000] dark:text-[#FFFFFF] mb-3">
              <div className="p-2 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-black/5 dark:bg-white/5">
                <Trash2 className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
              </div>
              <h3 className="text-base font-bold">Confirm Deletion</h3>
            </div>
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] leading-relaxed">
              Are you sure you want to remove this record? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingRecord(null);
                }}
                className="px-4 py-2 text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] rounded-xl text-[#000000] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteConfirm}
                className="inline-flex items-center px-4 py-2 text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
