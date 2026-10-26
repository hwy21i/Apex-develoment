"use client";

import React, { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus,
  Search,
  Building2,
  Eye,
  X,
  Loader2,
  Users2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";
import { formatCurrency } from "@/lib/formatters/currency";

interface Supplier {
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  rating: number;
  status: "Active" | "Pending" | "Blacklisted";
  tinNumber: string;
  paymentTerms: string;
  totalOrders: number;
  totalSpent: number;
}

const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    _id: "s1",
    name: "Addis Construction Supply Co.",
    contactPerson: "Solomon Tadesse",
    email: "sales@addisconstructionsupply.et",
    phone: "+251-11-234-5678",
    address: "Bole Sub-City, Woreda 03, Addis Ababa",
    category: "Cement & Aggregates",
    rating: 4.8,
    status: "Active",
    tinNumber: "0012345678",
    paymentTerms: "Net 30",
    totalOrders: 24,
    totalSpent: 12450000,
  },
  {
    _id: "s2",
    name: "Mugher Cement Enterprise",
    contactPerson: "Almaz Hailu",
    email: "orders@mugher.gov.et",
    phone: "+251-11-345-6789",
    address: "Akaki Kality, Addis Ababa",
    category: "Cement & Aggregates",
    rating: 4.6,
    status: "Active",
    tinNumber: "0098765432",
    paymentTerms: "Net 15",
    totalOrders: 18,
    totalSpent: 8750000,
  },
  {
    _id: "s3",
    name: "Abyssinia Steel Rolling Mills",
    contactPerson: "Dawit Mengistu",
    email: "commercial@abyssiniasteel.com",
    phone: "+251-11-456-7890",
    address: "Dukem Industrial Park, Oromia",
    category: "Steel & Rebar",
    rating: 4.9,
    status: "Active",
    tinNumber: "0045678901",
    paymentTerms: "Net 45",
    totalOrders: 31,
    totalSpent: 28900000,
  },
];

const CATEGORIES = [
  "All",
  "Cement & Aggregates",
  "Steel & Rebar",
  "Electrical & MEP",
  "Plumbing & Sanitation",
  "Finishing & Paints",
  "Plant & Equipment",
];

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Pending: "bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Blacklisted: "bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
};

export default function SuppliersDirectoryPage() {
  const { records, projects, loading, reload, create } = useRecords("suppliers");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Add Supplier Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Cement & Aggregates");
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTinNumber, setFormTinNumber] = useState("");
  const [formPaymentTerms, setFormPaymentTerms] = useState("Net 30");
  const [formAddress, setFormAddress] = useState("Addis Ababa, Ethiopia");

  // Map database operational records into Supplier structure or fallback
  const suppliers: Supplier[] =
    records.length > 0
      ? records.map((r: OperationalRecord) => {
          const d = r.data || {};
          return {
            _id: r._id,
            name: r.title || (d.name as string) || "Unnamed Vendor",
            contactPerson: (d.contactPerson as string) || "Sales Office",
            email: (d.email as string) || "info@vendor.et",
            phone: (d.phone as string) || "+251-11-000-0000",
            address: (d.address as string) || "Addis Ababa",
            category: (d.category as string) || "Cement & Aggregates",
            rating: Number(d.rating) || 4.7,
            status: ((r.status as string) || (d.status as string) || "Active") as "Active" | "Pending" | "Blacklisted",
            tinNumber: (d.tinNumber as string) || "0000000000",
            paymentTerms: (d.paymentTerms as string) || "Net 30",
            totalOrders: Number(d.totalOrders) || 12,
            totalSpent: Number(d.totalSpent) || 3500000,
          };
        })
      : DEFAULT_SUPPLIERS;

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      s.tinNumber.includes(search);
    const matchesCategory =
      categoryFilter === "All" || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFeedback({ type: "error", message: "Company name is required." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const targetProjectId = projects[0]?._id || "000000000000000000000000";
      await create({
        projectId: targetProjectId,
        title: formName.trim(),
        status: "Active",
        data: {
          name: formName.trim(),
          category: formCategory,
          contactPerson: formContactPerson.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim(),
          tinNumber: formTinNumber.trim(),
          paymentTerms: formPaymentTerms,
          address: formAddress.trim(),
          rating: 4.8,
          totalOrders: 1,
          totalSpent: 0,
        },
      });

      setFeedback({ type: "success", message: `Supplier "${formName}" registered successfully!` });
      setShowAddModal(false);
      setFormName("");
      setFormContactPerson("");
      setFormPhone("");
      setFormEmail("");
      setFormTinNumber("");
      reload();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to register supplier.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <Users2 className="w-4 h-4" /> Procurement &amp; Supply Chain
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Suppliers Directory
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Qualified vendors, certified material providers, and trade contractors with verified TIN records.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="erp-btn-md bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
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
                <AlertCircle className="w-4 h-4 shrink-0" />
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-semibold uppercase tracking-wider">Total Vendors</p>
            <p className="text-2xl font-black text-[#000000] dark:text-[#FFFFFF] mt-1">{suppliers.length}</p>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-semibold uppercase tracking-wider">Active Vendors</p>
            <p className="text-2xl font-black text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] mt-1">
              {suppliers.filter((s) => s.status === "Active").length}
            </p>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-semibold uppercase tracking-wider">Total Procurement Value</p>
            <p className="text-2xl font-black text-[#666666] dark:text-[#A3A3A3] mt-1 truncate">
              {formatCurrency(suppliers.reduce((sum, s) => sum + s.totalSpent, 0), true)}
            </p>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-semibold uppercase tracking-wider">Avg. Rating</p>
            <p className="text-2xl font-black text-[#000000] dark:text-[#FFFFFF] mt-1">
              {(suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length).toFixed(1)} / 5.0
            </p>
          </div>
        </div>

        {/* Toolbar & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search by supplier name, contact person, TIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] transition-all shadow-xs"
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
                    : "bg-white dark:bg-[#111111] text-[#666666] dark:text-[#A3A3A3] dark:text-[#FFFFFF] hover:text-[#000000] dark:text-[#FFFFFF] dark:hover:text-[#000000] dark:hover:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] dark:hover:bg-[#1F1F1F]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table of suppliers */}
        <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider font-mono text-[10px] border-b border-[#D4D4D4] dark:border-[#303030]">
                <tr>
                  <th className="px-5 py-3.5">Vendor / Enterprise</th>
                  <th className="px-5 py-3.5">Trade Category</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5">TIN Number</th>
                  <th className="px-5 py-3.5">Terms</th>
                  <th className="px-5 py-3.5">Total Volume</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                {loading && records.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-[#666666] dark:text-[#A3A3A3]">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#666666] dark:text-[#A3A3A3]" />
                        <span>Synchronizing vendor directory...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-[#666666] dark:text-[#A3A3A3]">
                      No suppliers found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((s) => (
                    <tr
                      key={s._id}
                      className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] dark:hover:bg-[#1F1F1F]/20 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-[#000000] dark:text-[#FFFFFF] flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#666666] dark:text-[#A3A3A3] shrink-0" />
                          <span>{s.name}</span>
                        </div>
                        <span className="text-[11px] text-[#666666] dark:text-[#A3A3A3] block mt-0.5">
                          {s.address}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[#666666] dark:text-[#A3A3A3] dark:text-[#A3A3A3]">
                        {s.category}
                      </td>
                      <td className="px-5 py-3.5 text-[#000000] dark:text-[#FFFFFF]">
                        <div>{s.contactPerson}</div>
                        <span className="text-[11px] text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3]">{s.phone}</span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[#666666] dark:text-[#A3A3A3] dark:text-[#A3A3A3]">
                        {s.tinNumber}
                      </td>
                      <td className="px-5 py-3.5 text-[#666666] dark:text-[#A3A3A3] dark:text-[#FFFFFF]">
                        {s.paymentTerms}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF]">
                        {formatCurrency(s.totalSpent, true)}
                        <span className="block text-[10px] text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3] font-normal">
                          {s.totalOrders} Purchase Orders
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            STATUS_STYLES[s.status] || STATUS_STYLES.Active
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelected(s)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: View Details Dialog */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between pb-3 border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#303030]">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
                      {selected.name}
                    </h2>
                    <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">{selected.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-lg text-[#888888] dark:text-[#888888] hover:text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] dark:hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#1F1F1F] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#666666] dark:text-[#A3A3A3] block font-medium">Contact Person</span>
                  <span className="font-semibold text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF]">
                    {selected.contactPerson}
                  </span>
                </div>
                <div>
                  <span className="text-[#666666] dark:text-[#A3A3A3] block font-medium">Telephone</span>
                  <span className="font-semibold text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF]">
                    {selected.phone}
                  </span>
                </div>
                <div>
                  <span className="text-[#666666] dark:text-[#A3A3A3] block font-medium">Email Address</span>
                  <span className="font-semibold text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF]">
                    {selected.email}
                  </span>
                </div>
                <div>
                  <span className="text-[#666666] dark:text-[#A3A3A3] block font-medium">TIN Number</span>
                  <span className="font-mono font-semibold text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF]">
                    {selected.tinNumber}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#666666] dark:text-[#A3A3A3] block font-medium">Physical Address</span>
                  <span className="text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF]">{selected.address}</span>
                </div>
                <div>
                  <span className="text-[#666666] dark:text-[#A3A3A3] block font-medium">Payment Terms</span>
                  <span className="font-semibold text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF]">
                    {selected.paymentTerms}
                  </span>
                </div>
                <div>
                  <span className="text-[#666666] dark:text-[#A3A3A3] block font-medium">Total Spend (ETB)</span>
                  <span className="font-bold text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF]">
                    {formatCurrency(selected.totalSpent, true)} ({selected.totalOrders} Orders)
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] flex justify-end">
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#1F1F1F] text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Supplier Dialog */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-v18-backdrop">
            <div className="v18-card animate-v18-modal bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full erp-modal-md shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#303030]">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
                      Register Vendor / Supplier
                    </h2>
                    <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">
                      Add a qualified supplier to procurement records
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg text-[#888888] dark:text-[#888888] hover:text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] dark:hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#1F1F1F] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSupplier} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] mb-1">
                    Company / Trade Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Ethio Cement & Industrial Supply Plc"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] mb-1">
                      Material Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                    >
                      {CATEGORIES.filter((c) => c !== "All").map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Ato Solomon Bekele"
                      value={formContactPerson}
                      onChange={(e) => setFormContactPerson(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+251-11-..."
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="sales@company.et"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] mb-1">
                      TIN Number
                    </label>
                    <input
                      type="text"
                      placeholder="0012345678"
                      value={formTinNumber}
                      onChange={(e) => setFormTinNumber(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] mb-1">
                      Payment Terms
                    </label>
                    <select
                      value={formPaymentTerms}
                      onChange={(e) => setFormPaymentTerms(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                    >
                      <option value="Net 15">Net 15</option>
                      <option value="Net 30">Net 30</option>
                      <option value="Net 45">Net 45</option>
                      <option value="Advance / COD">Advance / COD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] mb-1">
                    Physical Address / Sub-City
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
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
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold shadow-md transition-all disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Supplier...</span>
                      </>
                    ) : (
                      <span>Save Supplier</span>
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
