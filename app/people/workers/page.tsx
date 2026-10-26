"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, CheckCircle, Clock, Eye,
  Loader2, X, Users,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";
import { formatCurrency } from "@/lib/formatters/currency";

interface SiteWorker {
  _id: string;
  workerId: string;
  fullName: string;
  trade: string; // Mason, Carpenter, Electrician, Steel Fixer, Welder, General Laborer
  projectId: string;
  dailyWageETB: number;
  phone: string;
  emergencyContact: string;
  status: string;
  safetyCertified: boolean;
  joinDate: string;
}

const STATUS_BADGES: Record<string, string> = {
  Active: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  "On Leave": "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Suspended: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Inactive: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
};

const STATUSES = ["Active", "On Leave", "Suspended", "Inactive"];

function mapRecord(r: OperationalRecord): SiteWorker {
  const d = r.data || {};
  return {
    _id: r._id,
    workerId: d.workerId || `WRK-${r._id.slice(-4).toUpperCase()}`,
    fullName: d.fullName || r.title || "—",
    trade: d.trade || d.role || "General Laborer",
    projectId: r.projectId,
    dailyWageETB: Number(d.dailyWageETB ?? d.dailyRate) || 0,
    phone: d.phone || "—",
    emergencyContact: d.emergencyContact || "—",
    status: r.status || d.status || "Active",
    safetyCertified: Boolean(d.safetyCertified),
    joinDate: d.joinDate || (r.createdAt ? r.createdAt.slice(0, 10) : ""),
  };
}

const EMPTY_FORM = {
  projectId: "",
  workerId: "",
  fullName: "",
  trade: "",
  phone: "",
  emergencyContact: "",
  dailyWageETB: "",
  joinDate: "",
  safetyCertified: "false",
  status: "Active",
};

export default function WorkersRosterPage() {
  const { records, projects, projectName, loading, error, reload, create } = useRecords("workers");
  const workers = records.map(mapRecord);

  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState("All");
  const [viewing, setViewing] = useState<SiteWorker | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const trades = ["All", ...Array.from(new Set(workers.map((w) => w.trade)))];

  const filtered = workers.filter((w) => {
    const matchSearch =
      w.fullName.toLowerCase().includes(search.toLowerCase()) ||
      w.workerId.toLowerCase().includes(search.toLowerCase()) ||
      projectName(w.projectId).toLowerCase().includes(search.toLowerCase());
    const matchTrade = tradeFilter === "All" || w.trade === tradeFilter;
    return matchSearch && matchTrade;
  });

  const fmt = (n: number) => formatCurrency(n);

  const avgWage = workers.length > 0
    ? workers.reduce((s, w) => s + w.dailyWageETB, 0) / workers.length
    : 0;

  const openForm = () => {
    setForm({ ...EMPTY_FORM, projectId: projects[0]?._id || "" });
    setFormError(null);
    setFormOpen(true);
  };

  const submit = async () => {
    if (!form.projectId) {
      setFormError("Please select a project.");
      return;
    }
    if (!form.fullName.trim()) {
      setFormError("Worker full name is required.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await create({
        projectId: form.projectId,
        title: form.fullName.trim(),
        status: form.status,
        data: {
          workerId: form.workerId || undefined,
          fullName: form.fullName.trim(),
          trade: form.trade || "General Laborer",
          phone: form.phone,
          emergencyContact: form.emergencyContact,
          dailyWageETB: Number(form.dailyWageETB) || 0,
          joinDate: form.joinDate || undefined,
          safetyCertified: form.safetyCertified === "true",
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to register worker");
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <Users className="w-4 h-4" /> Site Labor &amp; Force Management
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Daily Labor &amp; Craft Workers
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Field trades, daily wage rates, safety certification, and site assignments
            </p>
          </div>
          <button
            onClick={openForm}
            className="erp-btn-md bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] shrink-0"
          >
            <Plus size={16} />
            <span>Register Worker</span>
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-semibold uppercase tracking-wider">Total Registered Trades</p>
            <p className="text-2xl font-black text-[#000000] dark:text-[#FFFFFF] mt-1">{workers.length}</p>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-semibold uppercase tracking-wider">Active On Site</p>
            <p className="text-2xl font-black text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] mt-1">
              {workers.filter((w) => w.status === "Active").length}
            </p>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-semibold uppercase tracking-wider">Safety Certified</p>
            <p className="text-2xl font-black text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] mt-1">
              {workers.filter((w) => w.safetyCertified).length} / {workers.length}
            </p>
          </div>
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-semibold uppercase tracking-wider">Avg Daily Wage Rate</p>
            <p className="text-2xl font-black text-[#666666] dark:text-[#A3A3A3] mt-1">{fmt(avgWage)}</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search by worker name, ID, project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] shadow-xs transition-colors"
            />
          </div>
          <select
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
            className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] shadow-xs"
          >
            {trades.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Workers table */}
        <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3]">
              <Loader2 size={24} className="animate-spin text-[#666666] dark:text-[#A3A3A3]" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-[#000000] dark:text-[#FFFFFF]">{error}</p>
              <button onClick={() => reload()} className="mt-3 text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] hover:underline">
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3]">
              <Users size={32} className="mx-auto mb-2 opacity-40 text-[#666666] dark:text-[#A3A3A3]" />
              <p className="text-sm">
                {workers.length === 0 ? "No workers registered yet." : "No workers match your filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider font-mono text-[10px] border-b border-[#D4D4D4] dark:border-[#303030]">
                  <tr>
                    <th className="px-5 py-3.5">Worker ID &amp; Name</th>
                    <th className="px-5 py-3.5">Trade / Skill</th>
                    <th className="px-5 py-3.5">Site Assignment</th>
                    <th className="px-5 py-3.5">Phone &amp; Emergency</th>
                    <th className="px-5 py-3.5 text-right">Daily Wage</th>
                    <th className="px-5 py-3.5 text-center">Safety PPE</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                  {filtered.map((w) => (
                    <tr key={w._id} className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] dark:hover:bg-[#1F1F1F]/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[#666666] dark:text-[#A3A3A3] text-xs font-bold">{w.workerId}</span>
                        <p className="text-[#000000] dark:text-[#FFFFFF] font-bold">{w.fullName}</p>
                      </td>
                      <td className="px-5 py-3.5 text-[#000000] dark:text-[#FFFFFF] font-medium">{w.trade}</td>
                      <td className="px-5 py-3.5 text-[#666666] dark:text-[#A3A3A3] dark:text-[#A3A3A3]">{projectName(w.projectId)}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF] font-medium">{w.phone}</p>
                        <p className="text-[#666666] dark:text-[#A3A3A3] text-[11px]">{w.emergencyContact}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">{fmt(w.dailyWageETB)} / day</td>
                      <td className="px-5 py-3.5 text-center">
                        {w.safetyCertified ? (
                          <span className="inline-flex items-center gap-1 text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] font-medium text-xs">
                            <CheckCircle size={14} /> Certified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] font-medium text-xs">
                            <Clock size={14} /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_BADGES[w.status] || STATUS_BADGES.Active}`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setViewing(w)}
                          className="text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:text-[#FFFFFF] p-1 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          title="View Dossier"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View dossier modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-v18-backdrop">
          <div className="v18-card animate-v18-modal bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full erp-modal-md p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] pb-3">
              <div>
                <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">{viewing.fullName}</h2>
                <p className="text-[#666666] dark:text-[#A3A3A3] text-xs font-mono font-bold">{viewing.workerId} · {viewing.trade}</p>
              </div>
              <button
                onClick={() => setViewing(null)}
                className="p-1.5 rounded-lg text-[#888888] dark:text-[#888888] hover:text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] dark:hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#1F1F1F] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] font-medium">Site Assignment</dt><dd className="text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF] font-semibold mt-0.5">{projectName(viewing.projectId)}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] font-medium">Daily Wage</dt><dd className="text-[#666666] dark:text-[#A3A3A3] font-mono font-bold mt-0.5">{fmt(viewing.dailyWageETB)} / day</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] font-medium">Phone</dt><dd className="text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF] font-semibold mt-0.5">{viewing.phone}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] font-medium">Emergency Contact</dt><dd className="text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF] mt-0.5">{viewing.emergencyContact}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] font-medium">Safety Certification</dt><dd className="text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF] font-semibold mt-0.5">{viewing.safetyCertified ? "Certified" : "Pending"}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] font-medium">Join Date</dt><dd className="text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF] mt-0.5">{viewing.joinDate ? new Date(viewing.joinDate).toLocaleDateString("en-ET") : "—"}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] font-medium">Status</dt><dd className="text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF] font-semibold mt-0.5">{viewing.status}</dd></div>
            </dl>
            <div className="pt-3 border-t border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] flex justify-end">
              <button
                onClick={() => setViewing(null)}
                className="px-4 py-2.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#1F1F1F] text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-v18-backdrop">
          <div className="v18-card animate-v18-modal bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full erp-modal-md p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#303030]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">Register Worker</h2>
                  <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Add field craft labor or site operative</p>
                </div>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="p-1.5 rounded-lg text-[#888888] dark:text-[#888888] hover:text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] dark:hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#1F1F1F] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] block mb-1">Project / site assignment *</label>
                <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] block mb-1">Worker ID</label>
                  <input className={inputCls} value={form.workerId} onChange={(e) => setForm({ ...form, workerId: e.target.value })} placeholder="WRK-1001" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] block mb-1">Full name *</label>
                  <input className={inputCls} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Worker full name" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] block mb-1">Trade / role</label>
                  <input className={inputCls} value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })} placeholder="Mason, Carpenter, Welder..." />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] block mb-1">Daily wage (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.dailyWageETB} onChange={(e) => setForm({ ...form, dailyWageETB: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] block mb-1">Phone</label>
                  <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+251-9X-XXX-XXXX" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] block mb-1">Emergency contact</label>
                  <input className={inputCls} value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} placeholder="Contact name & number" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] block mb-1">Join date</label>
                  <input type="date" className={inputCls} value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] block mb-1">Safety certified</label>
                  <select className={inputCls} value={form.safetyCertified} onChange={(e) => setForm({ ...form, safetyCertified: e.target.value })}>
                    <option value="false">Pending</option>
                    <option value="true">Certified</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] block mb-1">Status</label>
                  <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {formError && <p className="text-xs text-[#000000] dark:text-[#FFFFFF] font-medium font-medium">{formError}</p>}

            <div className="flex justify-end gap-2 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
              <button
                onClick={() => setFormOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs font-semibold hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#1F1F1F] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold shadow-md transition-all disabled:opacity-60"
              >
                {busy && <Loader2 size={14} className="animate-spin" />}
                Register Worker
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
