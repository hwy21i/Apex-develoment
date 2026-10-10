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
  Active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
  "On Leave": "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
  Suspended: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30",
  Inactive: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30",
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
    "w-full bg-slate-50 dark:bg-[#1C1F24] border border-slate-200 dark:border-[#2F333A] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#C9A15A]";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#C9A15A] font-mono text-xs font-bold uppercase tracking-wider mb-1">
              <Users className="w-4 h-4" /> Site Labor & Force Management
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1E22] dark:text-[#F4F4F5] tracking-tight">
              Daily Labor &amp; Craft Workers
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7078] dark:text-[#A7ABB3] mt-1">
              Field trades, daily wage rates, safety certification, and site assignments
            </p>
          </div>
          <button
            onClick={openForm}
            className="inline-flex items-center justify-center gap-2 bg-[#C9A15A] hover:bg-[#B8924B] text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all hover:scale-[1.015] active:scale-[0.98] shrink-0"
          >
            <Plus size={16} />
            <span>Register Worker</span>
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card border border-slate-200 dark:border-[#2F333A] rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Registered Trades</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{workers.length}</p>
          </div>
          <div className="glass-card border border-slate-200 dark:border-[#2F333A] rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active On Site</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {workers.filter((w) => w.status === "Active").length}
            </p>
          </div>
          <div className="glass-card border border-slate-200 dark:border-[#2F333A] rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Safety Certified</p>
            <p className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">
              {workers.filter((w) => w.safetyCertified).length} / {workers.length}
            </p>
          </div>
          <div className="glass-card border border-slate-200 dark:border-[#2F333A] rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avg Daily Wage Rate</p>
            <p className="text-2xl font-extrabold text-[#C9A15A] mt-1">{fmt(avgWage)}</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by worker name, ID, project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#16181D] border border-slate-200 dark:border-[#2F333A] rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#C9A15A] shadow-xs transition-colors"
            />
          </div>
          <select
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
            className="bg-white dark:bg-[#16181D] border border-slate-200 dark:border-[#2F333A] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#C9A15A]"
          >
            {trades.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Workers table */}
        <div className="glass-card border border-slate-200 dark:border-[#2F333A] rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 size={24} className="animate-spin text-[#C9A15A]" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-rose-500">{error}</p>
              <button onClick={() => reload()} className="mt-3 text-xs font-semibold text-[#C9A15A] hover:underline">
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Users size={32} className="mx-auto mb-2 opacity-40 text-[#C9A15A]" />
              <p className="text-sm">
                {workers.length === 0 ? "No workers registered yet." : "No workers match your filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-[#121418]/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-200 dark:border-[#2F333A]">
                  <tr>
                    <th className="px-5 py-3">Worker ID &amp; Name</th>
                    <th className="px-5 py-3">Trade / Skill</th>
                    <th className="px-5 py-3">Site Assignment</th>
                    <th className="px-5 py-3">Phone &amp; Emergency</th>
                    <th className="px-5 py-3 text-right">Daily Wage</th>
                    <th className="px-5 py-3 text-center">Safety PPE</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#2F333A]">
                  {filtered.map((w) => (
                    <tr key={w._id} className="hover:bg-slate-50/70 dark:hover:bg-[#1A1D24]/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[#C9A15A] text-xs font-bold">{w.workerId}</span>
                        <p className="text-slate-900 dark:text-white font-bold">{w.fullName}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300 font-medium">{w.trade}</td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">{projectName(w.projectId)}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{w.phone}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px]">{w.emergencyContact}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">{fmt(w.dailyWageETB)} / day</td>
                      <td className="px-5 py-3.5 text-center">
                        {w.safetyCertified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                            <CheckCircle size={14} /> Certified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium text-xs">
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
                          className="text-[#C9A15A] hover:underline p-1 text-xs font-semibold inline-flex items-center gap-1"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#16181D] border border-slate-200 dark:border-[#2F333A] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#2F333A] pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{viewing.fullName}</h2>
                <p className="text-[#C9A15A] text-xs font-mono font-bold">{viewing.workerId} · {viewing.trade}</p>
              </div>
              <button
                onClick={() => setViewing(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div><dt className="text-slate-400 font-medium">Site Assignment</dt><dd className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">{projectName(viewing.projectId)}</dd></div>
              <div><dt className="text-slate-400 font-medium">Daily Wage</dt><dd className="text-[#C9A15A] font-mono font-bold mt-0.5">{fmt(viewing.dailyWageETB)} / day</dd></div>
              <div><dt className="text-slate-400 font-medium">Phone</dt><dd className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">{viewing.phone}</dd></div>
              <div><dt className="text-slate-400 font-medium">Emergency Contact</dt><dd className="text-slate-800 dark:text-slate-200 mt-0.5">{viewing.emergencyContact}</dd></div>
              <div><dt className="text-slate-400 font-medium">Safety Certification</dt><dd className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">{viewing.safetyCertified ? "Certified" : "Pending"}</dd></div>
              <div><dt className="text-slate-400 font-medium">Join Date</dt><dd className="text-slate-800 dark:text-slate-200 mt-0.5">{viewing.joinDate ? new Date(viewing.joinDate).toLocaleDateString("en-ET") : "—"}</dd></div>
              <div><dt className="text-slate-400 font-medium">Status</dt><dd className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">{viewing.status}</dd></div>
            </dl>
            <div className="pt-3 border-t border-slate-100 dark:border-[#2F333A] flex justify-end">
              <button
                onClick={() => setViewing(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1C1F24] hover:bg-slate-200 dark:hover:bg-[#252A34] text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#16181D] border border-slate-200 dark:border-[#2F333A] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#2F333A] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#C9A15A]/15 text-[#C9A15A]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Register Worker</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Add field craft labor or site operative</p>
                </div>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Project / site assignment *</label>
                <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Worker ID</label>
                  <input className={inputCls} value={form.workerId} onChange={(e) => setForm({ ...form, workerId: e.target.value })} placeholder="WRK-1001" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Full name *</label>
                  <input className={inputCls} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Worker full name" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Trade / role</label>
                  <input className={inputCls} value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })} placeholder="Mason, Carpenter, Welder..." />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Daily wage (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.dailyWageETB} onChange={(e) => setForm({ ...form, dailyWageETB: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Phone</label>
                  <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+251-9X-XXX-XXXX" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Emergency contact</label>
                  <input className={inputCls} value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} placeholder="Contact name & number" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Join date</label>
                  <input type="date" className={inputCls} value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Safety certified</label>
                  <select className={inputCls} value={form.safetyCertified} onChange={(e) => setForm({ ...form, safetyCertified: e.target.value })}>
                    <option value="false">Pending</option>
                    <option value="true">Certified</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Status</label>
                  <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {formError && <p className="text-xs text-rose-500 font-medium">{formError}</p>}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#2F333A]">
              <button
                onClick={() => setFormOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#2F333A] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C9A15A] hover:bg-[#B8924B] text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all disabled:opacity-60"
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
