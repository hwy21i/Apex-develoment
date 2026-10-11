"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Megaphone, Plus, Search, User, Pin, X, Loader2,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";
import { useCurrentUser } from "@/components/auth/UserProvider";

interface Announcement {
  _id: string;
  projectId: string;
  title: string;
  category: string;
  author: string;
  publishDate: string;
  isPinned: boolean;
  priority: string;
  content: string;
}

const CATEGORIES = ["Company Wide", "HSE Safety Alert", "Procurement Notice", "HR Directive"];
const PRIORITIES = ["Normal", "High", "Urgent"];

const CATEGORY_COLORS: Record<string, string> = {
  "Company Wide": "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30",
  "HSE Safety Alert": "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30",
  "Procurement Notice": "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30",
  "HR Directive": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
};

const PRIORITY_COLORS: Record<string, string> = {
  High: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
  Urgent: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30",
};

function mapRecord(r: OperationalRecord): Announcement {
  const d = r.data || {};
  return {
    _id: r._id,
    projectId: r.projectId,
    title: r.title || d.title || "Untitled announcement",
    category: d.category || "Company Wide",
    author: d.author || "—",
    publishDate: d.publishDate || r.createdAt,
    isPinned: Boolean(d.isPinned),
    priority: d.priority || "Normal",
    content: d.content || d.message || "",
  };
}

const EMPTY_FORM = {
  projectId: "",
  title: "",
  category: "Company Wide",
  priority: "Normal",
  publishDate: "",
  isPinned: false,
  content: "",
};

export default function AnnouncementsPage() {
  const { records, projects, projectName, loading, error, reload, create } = useRecords("announcements");
  const { user } = useCurrentUser();
  const announcements = records.map(mapRecord);

  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase()) ||
      projectName(a.projectId).toLowerCase().includes(search.toLowerCase())
  );

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
    if (!form.title.trim()) {
      setFormError("Please enter a title.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await create({
        projectId: form.projectId,
        title: form.title.trim(),
        data: {
          category: form.category,
          priority: form.priority,
          publishDate: form.publishDate || undefined,
          isPinned: form.isPinned,
          content: form.content,
          author: user?.fullName || undefined,
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to post announcement");
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] placeholder-slate-400 dark:placeholder-[#AAB7B7]/50 focus:outline-none focus:border-[#C0C8CA]";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#C0C8CA] font-mono text-xs font-bold uppercase tracking-wider mb-1">
              <Megaphone className="w-4 h-4" /> Operations Communications
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1E22] dark:text-[#D4D8DD] tracking-tight">
              Company Announcements &amp; Bulletins
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7078] dark:text-[#AAB7B7] mt-1">
              Executive directives, HSE safety stand-downs, commercial memos, and site updates
            </p>
          </div>
          <button
            onClick={openForm}
            className="inline-flex items-center justify-center gap-2 bg-[#C0C8CA] hover:bg-white text-[#1A2D42] font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md shadow-black/10 transition-all hover:scale-[1.015] active:scale-[0.98] shrink-0"
          >
            <Plus size={16} />
            <span>Post Announcement</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAB7B7]" />
          <input
            type="text"
            placeholder="Search announcements and safety notices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#1A2D42]/80 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] placeholder-slate-400 dark:placeholder-[#AAB7B7]/50 outline-none focus:border-[#C0C8CA] shadow-xs transition-colors"
          />
        </div>

        {/* Announcements list */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 size={24} className="animate-spin text-[#C0C8CA]" />
          </div>
        ) : error ? (
          <div className="glass-card border border-slate-200 dark:border-[#AAB7B7]/20 rounded-2xl p-6 text-center">
            <p className="text-sm text-rose-500">{error}</p>
            <button onClick={() => reload()} className="mt-3 text-xs font-semibold text-[#C0C8CA] hover:underline">
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card border border-slate-200 dark:border-[#AAB7B7]/20 rounded-2xl p-12 text-center text-slate-400">
            <Megaphone size={32} className="mx-auto mb-2 opacity-40 text-[#C0C8CA]" />
            <p className="text-sm">
              {announcements.length === 0 ? "No announcements posted yet." : "No announcements match your search."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((a) => (
              <div
                key={a._id}
                className={`glass-card border rounded-2xl p-5 transition-all hover:scale-[1.005] ${
                  a.isPinned
                    ? "border-[#C0C8CA]/60 shadow-md shadow-cyan-950/20 bg-[#2E4156]/50"
                    : "border-slate-200 dark:border-[#AAB7B7]/25 bg-white dark:bg-[#2E4156]/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {a.isPinned && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#1A2D42] text-[#C0C8CA] font-bold border border-[#C0C8CA]/40">
                          <Pin size={11} /> Pinned
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${CATEGORY_COLORS[a.category] || CATEGORY_COLORS["Company Wide"]}`}>
                        {a.category}
                      </span>
                      {a.priority !== "Normal" && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${PRIORITY_COLORS[a.priority] || ""}`}>
                          {a.priority}
                        </span>
                      )}
                      <span className="text-xs text-[#AAB7B7] font-mono">
                        {new Date(a.publishDate).toLocaleDateString("en-ET")}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-[#D4D8DD]">{a.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-[#D4D8DD]/90 leading-relaxed max-w-4xl whitespace-pre-wrap">{a.content}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#AAB7B7]/20 flex items-center justify-between text-xs text-slate-500 dark:text-[#AAB7B7]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <User size={13} className="text-[#C0C8CA]" /> {a.author}
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-[#D4D8DD]">{projectName(a.projectId)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#AAB7B7]/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#2E4156] text-[#C0C8CA] border border-[#AAB7B7]/20">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-[#D4D8DD]">Post Announcement</h2>
                  <p className="text-xs text-slate-500 dark:text-[#AAB7B7]">Broadcast directives or safety bulletins</p>
                </div>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2E4156] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-[#D4D8DD] block mb-1">Project *</label>
                <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-[#D4D8DD] block mb-1">Title *</label>
                <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Announcement headline" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#D4D8DD] block mb-1">Audience / Category</label>
                  <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#D4D8DD] block mb-1">Priority</label>
                  <select className={inputCls} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-[#D4D8DD] block mb-1">Publish date</label>
                <input type="date" className={inputCls} value={form.publishDate} onChange={(e) => setForm({ ...form, publishDate: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-[#D4D8DD] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                  className="rounded border-slate-300 dark:border-[#AAB7B7]/40 text-[#C0C8CA] focus:ring-[#C0C8CA]"
                />
                Pin this announcement to top of list
              </label>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-[#D4D8DD] block mb-1">Message</label>
                <textarea className={inputCls} rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Full announcement body..." />
              </div>
            </div>

            {formError && <p className="text-xs text-rose-500 font-medium">{formError}</p>}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#AAB7B7]/20">
              <button
                onClick={() => setFormOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#AAB7B7]/25 text-slate-700 dark:text-[#D4D8DD] text-xs font-semibold hover:bg-slate-100 dark:hover:bg-[#2E4156] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C0C8CA] hover:bg-white text-[#1A2D42] text-xs font-bold shadow-md shadow-black/10 transition-all disabled:opacity-60"
              >
                {busy && <Loader2 size={14} className="animate-spin text-[#1A2D42]" />}
                Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
