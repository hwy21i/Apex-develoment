"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Calendar as CalendarIcon, Plus,
  Clock, MapPin, Users, X, Loader2,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";

type EventType = "Pour" | "Inspection" | "Delivery" | "Milestone" | "Meeting";

interface CalendarEvent {
  id: string;
  projectId: string;
  title: string;
  project: string;
  date: string;
  time: string;
  type: EventType;
  location: string;
  participants: string;
}

const EVENT_TYPES: EventType[] = ["Pour", "Inspection", "Delivery", "Milestone", "Meeting"];

const TYPE_COLORS: Record<string, string> = {
  Pour: "bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Inspection: "bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Delivery: "bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Meeting: "bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Milestone: "bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#000000] border border-[#000000] dark:border-[#FFFFFF]",
};

const EMPTY_FORM = {
  projectId: "",
  title: "",
  date: "",
  time: "",
  type: "Pour" as EventType,
  location: "",
  participants: "",
};

export default function ProjectCalendarPage() {
  const { records, projects, projectName, loading, error, reload, create } = useRecords("calendar");

  const events: CalendarEvent[] = records.map((r: OperationalRecord) => {
    const d = r.data || {};
    return {
      id: r._id,
      projectId: r.projectId,
      title: r.title || d.title || "Untitled activity",
      project: projectName(r.projectId),
      date: d.date || r.createdAt.slice(0, 10),
      time: d.time || "",
      type: (EVENT_TYPES.includes(d.type) ? d.type : "Meeting") as EventType,
      location: d.location || "",
      participants: d.participants || "",
    };
  });

  const [typeFilter, setTypeFilter] = useState("All");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = events.filter((e) => typeFilter === "All" || e.type === typeFilter);

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
      setFormError("Please enter an activity title.");
      return;
    }
    if (!form.date) {
      setFormError("Please pick a date.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await create({
        projectId: form.projectId,
        title: form.title.trim(),
        data: {
          date: form.date,
          time: form.time,
          type: form.type,
          location: form.location,
          participants: form.participants,
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to schedule activity");
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF]">Site Operations Calendar</h1>
            <p className="text-[#666666] dark:text-[#A3A3A3] text-sm mt-1">
              Concrete pours, consultant inspections, bulk deliveries, client meetings, and critical dates
            </p>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Schedule Site Activity
          </button>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          {["All", "Pour", "Inspection", "Delivery", "Meeting"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === t
                  ? "bg-black/5 dark:bg-white/10 text-white"
                  : "bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]"
              }`}
            >
              {t === "All" ? "All Operations" : `${t}s`}
            </button>
          ))}
        </div>

        {/* Timeline schedule list */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#666666] dark:text-[#A3A3A3]">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-6 text-center">
            <p className="text-sm text-[#000000] dark:text-[#FFFFFF] font-medium">{error}</p>
            <button onClick={() => reload()} className="mt-3 text-xs font-medium text-[#000000] dark:text-[#FFFFFF] hover:text-[#000000] dark:text-[#FFFFFF]">
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-12 text-center text-[#666666] dark:text-[#A3A3A3]">
            <CalendarIcon size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">
              {events.length === 0 ? "No site activities scheduled yet." : "No activities match this filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((event) => (
              <div
                key={event.id}
                className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-5 hover:border-[#D4D4D4] dark:border-[#303030] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${TYPE_COLORS[event.type]}`}>
                      {event.type}
                    </span>
                    <span className="text-xs text-[#666666] dark:text-[#A3A3A3] font-medium">{event.project}</span>
                  </div>
                  <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">{event.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#666666] dark:text-[#A3A3A3]">
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-[#666666] dark:text-[#A3A3A3]" /> {event.time || "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-[#666666] dark:text-[#A3A3A3]" /> {event.location || "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={13} className="text-[#666666] dark:text-[#A3A3A3]" /> {event.participants || "—"}
                    </span>
                  </div>
                </div>

                <div className="bg-[#FFFFFF] dark:bg-[#111111]/60 border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-4 py-3 text-center min-w-[120px]">
                  <p className="text-[11px] uppercase tracking-wider text-[#000000] dark:text-[#FFFFFF] font-bold">
                    {new Date(event.date).toLocaleDateString("en-ET", { month: "short" })}
                  </p>
                  <p className="text-2xl font-black text-white">
                    {new Date(event.date).getDate()}
                  </p>
                  <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3]">
                    {new Date(event.date).toLocaleDateString("en-ET", { weekday: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] pb-4">
              <h2 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">Schedule Site Activity</h2>
              <button onClick={() => setFormOpen(false)} className="text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Project</label>
                <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Title</label>
                <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="12th Floor Slab Concrete Pour" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Date</label>
                  <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Time</label>
                  <input className={inputCls} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="06:00 AM - 04:00 PM" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Activity type</label>
                <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as EventType })}>
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Location</label>
                <input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Participants</label>
                <input className={inputCls} value={form.participants} onChange={(e) => setForm({ ...form, participants: e.target.value })} placeholder="Structural Team & Ready-Mix Fleet" />
              </div>
            </div>

            {formError && <p className="text-xs text-[#000000] dark:text-[#FFFFFF]">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFormOpen(false)} className="bg-[#F5F5F5] dark:bg-[#1F1F1F] border border-[#D4D4D4] dark:border-[#303030] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] text-[#000000] dark:text-[#FFFFFF] px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={busy} className="bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {busy && <Loader2 size={14} className="animate-spin" />}
                Schedule Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
