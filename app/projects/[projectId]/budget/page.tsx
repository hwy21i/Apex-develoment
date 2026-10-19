"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  DollarSign,
  Plus,
  Search,
  PieChart,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Trash2,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCurrency } from "@/lib/formatters/currency";
import { useRecords } from "@/hooks/useRecords";

interface BudgetLineItem {
  _id: string;
  costCode: string;
  category: "Materials" | "Labor" | "Subcontractor" | "Equipment" | "Overhead & Permits" | "Contingency";
  allocatedAmount: number;
  revisedAmount: number;
  spentAmount: number;
  committedAmount: number;
  remainingAmount: number;
  variancePct: number;
  status: "On Track" | "Near Limit" | "Exceeded";
  fiscalYear: string;
  notes?: string;
}

const CATEGORIES = [
  "Materials",
  "Labor",
  "Subcontractor",
  "Equipment",
  "Overhead & Permits",
  "Contingency",
] as const;

export default function ProjectBudgetPage() {
  const params = useParams();
  const projectId = String(params?.projectId || "");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Load project overview for top-level budget figures
  const [projectData, setProjectData] = useState<{
    totalBudget: number;
    revisedBudget: number;
    amountSpent: number;
    committedCost: number;
    remainingBudget: number;
    name: string;
  } | null>(null);

  const loadProjectInfo = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.success) {
        const p = json.data;
        setProjectData({
          name: p.name,
          totalBudget: Number(p.totalBudget) || 0,
          revisedBudget: Number(p.revisedBudget ?? p.totalBudget) || 0,
          amountSpent: Number(p.amountSpent) || 0,
          committedCost: Number(p.committedCost) || 0,
          remainingBudget:
            Number(p.remainingBudget ?? (p.revisedBudget ?? p.totalBudget) - (p.amountSpent || 0)) || 0,
        });
      }
    } catch {}
  }, [projectId]);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) loadProjectInfo();
    });
    return () => {
      ignore = true;
    };
  }, [loadProjectInfo]);

  // Operational records store for budget line items
  const {
    records: budgetRecords,
    loading,
    reload: reloadBudgets,
    create: createBudgetRecord,
    remove: removeBudgetRecord,
  } = useRecords("budgets", projectId);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReviseProjectModal, setShowReviseProjectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State: Add Budget Item
  const [formCostCode, setFormCostCode] = useState("");
  const [formCategory, setFormCategory] = useState<BudgetLineItem["category"]>("Materials");
  const [formAllocated, setFormAllocated] = useState("500000");
  const [formFiscalYear, setFormFiscalYear] = useState("2026");
  const [formNotes, setFormNotes] = useState("");

  // Form State: Revise Project Total Budget
  const [formRevisedTotal, setFormRevisedTotal] = useState("");

  // Transform records into typed budget items
  const budgetItems: BudgetLineItem[] = useMemo(() => {
    return budgetRecords.map((r) => {
      const d = r.data || {};
      const allocatedAmount = Number(d.allocatedAmount ?? d.totalAmount) || 0;
      const revisedAmount = Number(d.revisedAmount ?? allocatedAmount) || allocatedAmount;
      const spentAmount = Number(d.spentAmount) || 0;
      const committedAmount = Number(d.committedAmount) || 0;
      const effectiveAlloc = revisedAmount > 0 ? revisedAmount : allocatedAmount;
      const remainingAmount = effectiveAlloc - spentAmount - committedAmount;
      const variancePct =
        effectiveAlloc > 0 ? Math.round(((spentAmount + committedAmount) / effectiveAlloc) * 1000) / 10 : 0;

      let status: BudgetLineItem["status"] = "On Track";
      if (variancePct > 100) status = "Exceeded";
      else if (variancePct >= 80) status = "Near Limit";

      return {
        _id: r._id,
        costCode: d.costCode || r.title || `CC-${r._id.slice(-4).toUpperCase()}`,
        category: (d.category as BudgetLineItem["category"]) || "Materials",
        allocatedAmount,
        revisedAmount,
        spentAmount,
        committedAmount,
        remainingAmount,
        variancePct,
        status,
        fiscalYear: d.fiscalYear || "2026",
        notes: d.notes,
      };
    });
  }, [budgetRecords]);

  // Category Summaries
  const categoryStats = useMemo(() => {
    const map: Record<
      string,
      { allocated: number; revised: number; spent: number; committed: number }
    > = {};
    CATEGORIES.forEach((cat) => {
      map[cat] = { allocated: 0, revised: 0, spent: 0, committed: 0 };
    });

    budgetItems.forEach((item) => {
      if (map[item.category]) {
        map[item.category].allocated += item.allocatedAmount;
        map[item.category].revised += item.revisedAmount;
        map[item.category].spent += item.spentAmount;
        map[item.category].committed += item.committedAmount;
      }
    });

    return map;
  }, [budgetItems]);

  // Overall totals
  const overallAllocated = useMemo(() => {
    const itemsTotal = budgetItems.reduce((acc, i) => acc + (i.revisedAmount || i.allocatedAmount), 0);
    return projectData?.revisedBudget || projectData?.totalBudget || itemsTotal;
  }, [budgetItems, projectData]);

  const overallSpent = useMemo(() => {
    return projectData?.amountSpent || budgetItems.reduce((acc, i) => acc + i.spentAmount, 0);
  }, [budgetItems, projectData]);

  const overallCommitted = useMemo(() => {
    return projectData?.committedCost || budgetItems.reduce((acc, i) => acc + i.committedAmount, 0);
  }, [budgetItems, projectData]);

  const overallRemaining = overallAllocated - overallSpent - overallCommitted;
  const overallUtilization =
    overallAllocated > 0 ? Math.min(100, Math.round(((overallSpent + overallCommitted) / overallAllocated) * 100)) : 0;

  // Filtered items
  const filteredItems = useMemo(() => {
    return budgetItems.filter((item) => {
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          item.costCode.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.notes || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [budgetItems, categoryFilter, search]);

  const handleAddBudgetItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCostCode.trim()) {
      setFeedback({ type: "error", message: "Cost code is required." });
      return;
    }

    try {
      setSubmitting(true);
      const allocatedNum = Number(formAllocated) || 0;

      await createBudgetRecord({
        projectId,
        title: `${formCostCode.trim()} - ${formCategory}`,
        status: "On Track",
        data: {
          costCode: formCostCode.trim(),
          category: formCategory,
          allocatedAmount: allocatedNum,
          revisedAmount: allocatedNum,
          spentAmount: 0,
          committedAmount: 0,
          fiscalYear: formFiscalYear,
          notes: formNotes.trim(),
        },
      });

      setFeedback({ type: "success", message: `Budget line "${formCostCode}" added successfully.` });
      setShowAddModal(false);
      setFormCostCode("");
      setFormNotes("");
      reloadBudgets();
      loadProjectInfo();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error adding budget line" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviseProjectBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const newBudget = Number(formRevisedTotal);
    if (isNaN(newBudget) || newBudget < 0) {
      setFeedback({ type: "error", message: "Please enter a valid non-negative revised budget." });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisedBudget: newBudget }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback({ type: "success", message: "Project budget revised successfully." });
        setShowReviseProjectModal(false);
        loadProjectInfo();
      } else {
        setFeedback({ type: "error", message: json.error?.message || "Failed to update project budget" });
      }
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error updating project budget" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deletingId) return;
    try {
      setSubmitting(true);
      await removeBudgetRecord(deletingId);
      setFeedback({ type: "success", message: "Budget allocation removed." });
      setShowDeleteModal(false);
      setDeletingId(null);
      reloadBudgets();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to delete line item" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
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

      {/* Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
              Commercial Management
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#000000] dark:text-[#FFFFFF]">
            Project Budget & Allocations
          </h2>
          <p className="text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
            Cost breakdown structure, WBS allocations, commitment control, and expenditure variance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setFormRevisedTotal(String(projectData?.revisedBudget || projectData?.totalBudget || ""));
              setShowReviseProjectModal(true);
            }}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
            Revise Budget
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Cost Code
          </button>
        </div>
      </div>

      {/* Top Commercial KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Approved Budget</p>
          <p className="text-xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">
            {formatCurrency(overallAllocated)}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Actual Incurred</p>
          <p className="text-xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">
            {formatCurrency(overallSpent)}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Committed Orders</p>
          <p className="text-xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">
            {formatCurrency(overallCommitted)}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Remaining Balance</p>
          <p className="text-xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">
            {formatCurrency(overallRemaining)}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <div className="flex justify-between items-center">
            <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Absorption Rate</p>
            <span className="text-xs font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">{overallUtilization}%</span>
          </div>
          <div className="mt-2">
            <ProgressBar value={overallUtilization} />
          </div>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="p-5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#D4D4D4] dark:border-[#303030]">
          <div className="flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-[#000000] dark:text-[#FFFFFF]" />
            <h3 className="text-sm font-bold text-[#000000] dark:text-[#FFFFFF]">Budget Distribution by Category</h3>
          </div>
          <span className="text-xs font-mono text-[#666666] dark:text-[#A3A3A3]">ETB (Ethiopian Birr)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => {
            const data = categoryStats[cat];
            const alloc = data.revised || data.allocated;
            const consumed = data.spent + data.committed;
            const pct = alloc > 0 ? Math.min(100, Math.round((consumed / alloc) * 100)) : 0;

            return (
              <div
                key={cat}
                className="p-3.5 rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#000000] dark:text-[#FFFFFF]">{cat}</span>
                  <span className="text-[11px] font-mono font-semibold text-[#666666] dark:text-[#A3A3A3]">
                    {pct}% Used
                  </span>
                </div>
                <ProgressBar value={pct} />
                <div className="flex justify-between items-center text-[11px] font-mono text-[#666666] dark:text-[#A3A3A3] pt-1">
                  <span>Spent: {formatCurrency(data.spent)}</span>
                  <span>Cap: {formatCurrency(alloc)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Cost Codes Table */}
      <div className="space-y-3">
        <div className="p-3.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cost code, category or notes..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
            <Loader2 className="w-7 h-7 animate-spin text-[#000000] dark:text-[#FFFFFF] mb-2" />
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Loading project budget allocations...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
            <DollarSign className="w-10 h-10 text-[#666666] dark:text-[#A3A3A3] mb-3" />
            <h3 className="text-base font-semibold text-[#000000] dark:text-[#FFFFFF]">No cost codes defined</h3>
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] max-w-sm mt-1 mb-5">
              Add cost codes and WBS budget line items to enforce financial control and variance alerts.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add First Cost Code
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
                  <th className="py-3 px-4 font-semibold">Cost Code</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold text-right">Allocated</th>
                  <th className="py-3 px-4 font-semibold text-right">Revised</th>
                  <th className="py-3 px-4 font-semibold text-right">Spent</th>
                  <th className="py-3 px-4 font-semibold text-right">Committed</th>
                  <th className="py-3 px-4 font-semibold text-right">Remaining</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                {filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#000000] dark:text-[#FFFFFF]">{item.costCode}</div>
                      {item.notes && (
                        <div className="text-[10px] text-[#666666] dark:text-[#A3A3A3] truncate max-w-xs">
                          {item.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#666666] dark:text-[#A3A3A3]">{item.category}</td>
                    <td className="py-3 px-4 text-right font-mono text-[#666666] dark:text-[#A3A3A3]">
                      {formatCurrency(item.allocatedAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-[#000000] dark:text-[#FFFFFF]">
                      {formatCurrency(item.revisedAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">
                      {formatCurrency(item.spentAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#666666] dark:text-[#A3A3A3]">
                      {formatCurrency(item.committedAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <span
                        className={`font-bold ${
                          item.remainingAmount < 0
                            ? "text-[#000000] dark:text-[#FFFFFF] underline"
                            : "text-[#000000] dark:text-[#FFFFFF]"
                        }`}
                      >
                        {formatCurrency(item.remainingAmount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] bg-black/5 dark:bg-white/5">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setDeletingId(item._id);
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
        )}
      </div>

      {/* ADD COST CODE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
                <h3 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">Add Cost Code Allocation</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBudgetItem} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Cost Code / WBS Item *
                </label>
                <input
                  type="text"
                  required
                  value={formCostCode}
                  onChange={(e) => setFormCostCode(e.target.value)}
                  placeholder="e.g. 03-300 Cast-in-Place Concrete"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as BudgetLineItem["category"])}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Fiscal Year
                  </label>
                  <input
                    type="text"
                    value={formFiscalYear}
                    onChange={(e) => setFormFiscalYear(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Allocated Amount (ETB) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formAllocated}
                  onChange={(e) => setFormAllocated(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Scope Notes
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Rate basis, tender estimate ref..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D4D4D4] dark:border-[#303030]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                  Save Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVISE TOTAL PROJECT BUDGET MODAL */}
      {showReviseProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
                <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">Revise Total Project Budget</h3>
              </div>
              <button
                onClick={() => setShowReviseProjectModal(false)}
                className="p-1 text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviseProjectBudget} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Revised Total Budget (ETB)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formRevisedTotal}
                  onChange={(e) => setFormRevisedTotal(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                />
                <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3] mt-1.5">
                  Original contract budget: {formatCurrency(projectData?.totalBudget || 0)}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D4D4D4] dark:border-[#303030]">
                <button
                  type="button"
                  onClick={() => setShowReviseProjectModal(false)}
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
                  Confirm Revision
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
              <h3 className="text-base font-bold">Remove Cost Allocation</h3>
            </div>
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] leading-relaxed">
              Are you sure you want to remove this cost code allocation? This may affect variance tracking.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingId(null);
                }}
                className="px-4 py-2 text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] rounded-xl text-[#000000] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteItem}
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
