"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Trash2,
  ArrowUpRight,
  Clock,
  Check,
  Ban,
  FileText,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters/currency";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";

interface ExpenseItem {
  _id: string;
  expenseNumber: string;
  category: "Materials" | "Labor" | "Subcontractor" | "Equipment" | "Overhead & Permits" | "Contingency";
  amount: number;
  date: string;
  payee: string;
  paymentMethod: "BANK_TRANSFER" | "CASH" | "CHECK" | "CREDIT_LINE";
  receiptNumber?: string;
  description: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "PAID" | "REJECTED";
  recordedBy: string;
  notes?: string;
}

const CATEGORIES = [
  "ALL",
  "Materials",
  "Labor",
  "Subcontractor",
  "Equipment",
  "Overhead & Permits",
  "Contingency",
];

const PAYMENT_METHODS = ["BANK_TRANSFER", "CASH", "CHECK", "CREDIT_LINE"];

export default function ProjectExpensesPage() {
  const params = useParams();
  const projectId = String(params?.projectId || "");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Operational records store for expenses
  const {
    records: expenseRecords,
    loading,
    reload: reloadExpenses,
    create: createExpenseRecord,
    update: updateExpenseRecord,
    remove: removeExpenseRecord,
  } = useRecords("expenses", projectId);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formExpenseNum, setFormExpenseNum] = useState("");
  const [formCategory, setFormCategory] = useState<ExpenseItem["category"]>("Materials");
  const [formPayee, setFormPayee] = useState("");
  const [formAmount, setFormAmount] = useState("25000");
  const [formPaymentMethod, setFormPaymentMethod] = useState<ExpenseItem["paymentMethod"]>("BANK_TRANSFER");
  const [formReceiptNum, setFormReceiptNum] = useState("");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<ExpenseItem["status"]>("PENDING_APPROVAL");

  // Transform records into typed expense items
  const expenses: ExpenseItem[] = useMemo(() => {
    return expenseRecords.map((r) => {
      const d = r.data || {};
      const amount = Number(d.amount ?? d.totalAmount) || 0;
      return {
        _id: r._id,
        expenseNumber: d.expenseNumber || r.title || `EXP-${r._id.slice(-5).toUpperCase()}`,
        category: (d.category as ExpenseItem["category"]) || "Materials",
        amount,
        date: d.date || (r.createdAt ? r.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]),
        payee: d.payee || "Vendor / Contractor",
        paymentMethod: (d.paymentMethod as ExpenseItem["paymentMethod"]) || "BANK_TRANSFER",
        receiptNumber: d.receiptNumber,
        description: d.description || r.title || "Project expenditure",
        status: (r.status as ExpenseItem["status"]) || (d.status as ExpenseItem["status"]) || "PENDING_APPROVAL",
        recordedBy: d.recordedBy || "Site Accountant",
        notes: d.notes,
      };
    });
  }, [expenseRecords]);

  // Derived Statistics
  const stats = useMemo(() => {
    const totalCount = expenses.length;
    const totalAmount = expenses.reduce((acc, e) => acc + e.amount, 0);
    const paidAndApproved = expenses
      .filter((e) => e.status === "APPROVED" || e.status === "PAID")
      .reduce((acc, e) => acc + e.amount, 0);
    const pendingAmount = expenses
      .filter((e) => e.status === "PENDING_APPROVAL")
      .reduce((acc, e) => acc + e.amount, 0);
    const avgAmount = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;

    return { totalCount, totalAmount, paidAndApproved, pendingAmount, avgAmount };
  }, [expenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (categoryFilter !== "ALL" && e.category !== categoryFilter) return false;
      if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.expenseNumber.toLowerCase().includes(q) ||
          e.payee.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          (e.receiptNumber || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [expenses, categoryFilter, statusFilter, search]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPayee.trim()) {
      setFeedback({ type: "error", message: "Payee / Vendor is required." });
      return;
    }
    const amtNum = Number(formAmount);
    if (isNaN(amtNum) || amtNum <= 0) {
      setFeedback({ type: "error", message: "Please enter a valid expense amount." });
      return;
    }

    try {
      setSubmitting(true);
      const voucherNum =
        formExpenseNum.trim().toUpperCase() || `EXP-${Date.now().toString().slice(-6)}`;

      await createExpenseRecord({
        projectId,
        title: `${voucherNum}: ${formPayee.trim()} - ${formatCurrency(amtNum)}`,
        status: formStatus,
        data: {
          expenseNumber: voucherNum,
          category: formCategory,
          payee: formPayee.trim(),
          amount: amtNum,
          paymentMethod: formPaymentMethod,
          receiptNumber: formReceiptNum.trim(),
          date: formDate,
          description: formDescription.trim() || `Payment to ${formPayee.trim()} for ${formCategory}`,
          status: formStatus,
          recordedBy: "Site Finance",
        },
      });

      setFeedback({ type: "success", message: `Expense voucher ${voucherNum} recorded.` });
      setShowAddModal(false);
      setFormExpenseNum("");
      setFormPayee("");
      setFormDescription("");
      setFormReceiptNum("");
      reloadExpenses();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error creating expense" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (expense: ExpenseItem, newStatus: ExpenseItem["status"]) => {
    try {
      await updateExpenseRecord(expense._id, {
        status: newStatus,
        data: { status: newStatus },
      });
      setFeedback({ type: "success", message: `Voucher ${expense.expenseNumber} marked as ${newStatus}.` });
      reloadExpenses();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error updating status" });
    }
  };

  const handleDeleteExpense = async () => {
    if (!deletingId) return;
    try {
      setSubmitting(true);
      await removeExpenseRecord(deletingId);
      setFeedback({ type: "success", message: "Expense voucher removed." });
      setShowDeleteModal(false);
      setDeletingId(null);
      reloadExpenses();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error deleting expense" });
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

      {/* Header and Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
              Cost Control
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#000000] dark:text-[#FFFFFF]">
            Project Expenses
          </h2>
          <p className="text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
            Vendor invoices, material payments, labor payroll disbursements, and site expense vouchers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/finance/expenses"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors"
          >
            Corporate Finance View
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Record Expense
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Total Incurred</p>
          <p className="text-xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">
            {formatCurrency(stats.totalAmount)}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Approved & Paid</p>
          <p className="text-xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">
            {formatCurrency(stats.paidAndApproved)}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Pending Review</p>
          <p className="text-xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">
            {formatCurrency(stats.pendingAmount)}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Total Vouchers</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.totalCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Average Voucher</p>
          <p className="text-xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">
            {formatCurrency(stats.avgAmount)}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search voucher #, payee, description or receipt..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {(search || categoryFilter !== "ALL" || statusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setCategoryFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="px-2 py-1.5 text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
          <Loader2 className="w-7 h-7 animate-spin text-[#000000] dark:text-[#FFFFFF] mb-2" />
          <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Loading project expenses...</p>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
          <Receipt className="w-10 h-10 text-[#666666] dark:text-[#A3A3A3] mb-3" />
          <h3 className="text-base font-semibold text-[#000000] dark:text-[#FFFFFF]">No expenses recorded</h3>
          <p className="text-xs text-[#666666] dark:text-[#A3A3A3] max-w-sm mt-1 mb-5">
            {search || categoryFilter !== "ALL" || statusFilter !== "ALL"
              ? "No expenses match your search or filter settings."
              : "No expense vouchers have been posted to this project yet."}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Record First Expense
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
                <th className="py-3 px-4 font-semibold">Voucher / Payee</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Payment</th>
                <th className="py-3 px-4 font-semibold text-right">Amount (ETB)</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
              {filteredExpenses.map((exp) => (
                <tr key={exp._id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#000000] dark:text-[#FFFFFF]">{exp.payee}</div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3]">
                      <span>{exp.expenseNumber}</span>
                      {exp.receiptNumber && <span>· Ref: {exp.receiptNumber}</span>}
                    </div>
                    {exp.description && (
                      <div className="text-[11px] text-[#666666] dark:text-[#A3A3A3] mt-0.5 line-clamp-1 max-w-sm">
                        {exp.description}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#666666] dark:text-[#A3A3A3]">{exp.category}</td>
                  <td className="py-3 px-4 font-mono text-[#666666] dark:text-[#A3A3A3] whitespace-nowrap">
                    {exp.date}
                  </td>
                  <td className="py-3 px-4 font-mono text-[10px] text-[#666666] dark:text-[#A3A3A3]">
                    {exp.paymentMethod.replace("_", " ")}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">
                    {formatCurrency(exp.amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] bg-black/5 dark:bg-white/5">
                      {exp.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {exp.status === "PENDING_APPROVAL" && (
                        <>
                          <button
                            onClick={() => handleStatusChange(exp, "APPROVED")}
                            title="Approve Expense"
                            className="p-1 rounded-md border border-[#D4D4D4] dark:border-[#303030] hover:bg-black/5 dark:hover:bg-white/5 text-[#000000] dark:text-[#FFFFFF]"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(exp, "REJECTED")}
                            title="Reject Expense"
                            className="p-1 rounded-md border border-[#D4D4D4] dark:border-[#303030] hover:bg-black/5 dark:hover:bg-white/5 text-[#666666] dark:text-[#A3A3A3]"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {exp.status === "APPROVED" && (
                        <button
                          onClick={() => handleStatusChange(exp, "PAID")}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold border border-[#D4D4D4] dark:border-[#303030] hover:bg-black/5 dark:hover:bg-white/5 text-[#000000] dark:text-[#FFFFFF]"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setDeletingId(exp._id);
                          setShowDeleteModal(true);
                        }}
                        className="p-1 rounded-md border border-[#D4D4D4] dark:border-[#303030] text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
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
      )}

      {/* RECORD EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
                <h3 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">Record Project Expense</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Payee / Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  value={formPayee}
                  onChange={(e) => setFormPayee(e.target.value)}
                  placeholder="e.g. National Cement SC / Awash Steel Corp"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Cost Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ExpenseItem["category"])}
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
                    Amount (ETB) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as ExpenseItem["paymentMethod"])}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Receipt / Tax Invoice #
                  </label>
                  <input
                    type="text"
                    value={formReceiptNum}
                    onChange={(e) => setFormReceiptNum(e.target.value)}
                    placeholder="e.g. INV-2026-884"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Approval State
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ExpenseItem["status"])}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  >
                    <option value="PENDING_APPROVAL">Pending Approval</option>
                    <option value="APPROVED">Approved Immediately</option>
                    <option value="PAID">Paid / Settled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Description / Purpose
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Items supplied, delivery note reference, milestone billing..."
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
                  Record Expense
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
              <h3 className="text-base font-bold">Remove Expense Voucher</h3>
            </div>
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] leading-relaxed">
              Are you sure you want to remove this expense record? This will adjust project cost utilization.
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
                onClick={handleDeleteExpense}
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
