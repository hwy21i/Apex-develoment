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
  "Company Wide": "bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  "HSE Safety Alert": "bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#000000] font-bold border border-[#000000] dark:border-[#FFFFFF]",
  "Procurement Notice": "bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  "HR Directive": "bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] border border-[#111111] dark:border-[#FFFFFF] font-semibold",
};

const PRIORITY_COLORS: Record<string, string> = {
  High: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Urgent: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
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
    "w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <Megaphone className="w-4 h-4" /> Operations Communications
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Company Announcements &amp; Bulletins
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Executive directives, HSE safety stand-downs, commercial memos, and site updates
            </p>
          </div>
          <button
            onClick={openForm}
            className="inline-flex items-center justify-center gap-2 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md shadow-black/10 transition-all hover:scale-[1.015] active:scale-[0.98] shrink-0"
          >
            <Plus size={16} />
            <span>Post Announcement</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
          <input
            type="text"
            placeholder="Search announcements and safety notices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF] placeholder-slate-400 dark:placeholder-[#A3A3A3] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] shadow-xs transition-colors"
          />
        </div>

        {/* Announcements list */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#888888] dark:text-[#888888]">
            <Loader2 size={24} className="animate-spin text-[#666666] dark:text-[#A3A3A3]" />
          </div>
        ) : error ? (
          <div className="glass-card border border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] rounded-2xl p-6 text-center">
            <p className="text-sm text-[#000000] dark:text-[#FFFFFF]">{error}</p>
            <button onClick={() => reload()} className="mt-3 text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] hover:underline">
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card border border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] rounded-2xl p-12 text-center text-[#888888] dark:text-[#888888]">
            <Megaphone size={32} className="mx-auto mb-2 opacity-40 text-[#666666] dark:text-[#A3A3A3]" />
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
                    ? "border-[#000000] dark:border-[#FFFFFF] shadow-md shadow-black/20 bg-[#FAFAFA] dark:bg-[#171717]"
                    : "border-[#D4D4D4] dark:border-[#303030] bg-white dark:bg-[#171717]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {a.isPinned && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#FAFAFA] dark:bg-[#111111] text-[#666666] dark:text-[#A3A3A3] font-bold border border-[#000000] dark:border-[#FFFFFF]">
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
                      <span className="text-xs text-[#666666] dark:text-[#A3A3A3] font-mono">
                        {new Date(a.publishDate).toLocaleDateString("en-ET")}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF]">{a.title}</h3>
                    <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] dark:text-[#FFFFFF]/90 leading-relaxed max-w-4xl whitespace-pre-wrap">{a.content}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] flex items-center justify-between text-xs text-[#666666] dark:text-[#A3A3A3]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <User size={13} className="text-[#666666] dark:text-[#A3A3A3]" /> {a.author}
                  </span>
                  <span className="font-semibold text-[#000000] dark:text-[#FFFFFF]">{projectName(a.projectId)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#303030]">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF]">Post Announcement</h2>
                  <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Broadcast directives or safety bulletins</p>
                </div>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="p-1.5 rounded-lg text-[#888888] dark:text-[#888888] hover:text-[#444444] dark:text-[#D4D4D4] dark:hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">Project *</label>
                <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">Title *</label>
                <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Announcement headline" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">Audience / Category</label>
                  <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">Priority</label>
                  <select className={inputCls} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">Publish date</label>
                <input type="date" className={inputCls} value={form.publishDate} onChange={(e) => setForm({ ...form, publishDate: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-[#000000] dark:text-[#FFFFFF] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                  className="rounded border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] text-[#666666] dark:text-[#A3A3A3] focus:ring-0"
                />
                Pin this announcement to top of list
              </label>
              <div>
                <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">Message</label>
                <textarea className={inputCls} rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Full announcement body..." />
              </div>
            </div>

            {formError && <p className="text-xs text-[#000000] dark:text-[#FFFFFF] font-medium font-medium">{formError}</p>}

            <div className="flex justify-end gap-2 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
              <button
                onClick={() => setFormOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs font-semibold hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold shadow-md shadow-black/10 transition-all disabled:opacity-60"
              >
                {busy && <Loader2 size={14} className="animate-spin text-[#FFFFFF] dark:text-[#000000]" />}
                Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
