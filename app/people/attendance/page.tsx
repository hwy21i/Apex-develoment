"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Search, Loader2, X, Users, Plus,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";
import { useCurrentUser } from "@/components/auth/UserProvider";

interface AttendanceRecord {
  _id: string;
  workerName: string;
  trade: string;
  projectId: string;
  site: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: string;
  hoursWorked: number;
  overtimeHours: number;
  recordedBy: string;
}

const STATUS_BADGES: Record<string, string> = {
  Present: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Late: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Absent: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  "Half Day": "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Excused: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
};

const STATUSES = ["Present", "Late", "Absent", "Half Day", "Excused"];

function mapRecord(r: OperationalRecord): AttendanceRecord {
  const d = r.data || {};
  return {
    _id: r._id,
    workerName: d.workerName || r.title || "—",
    trade: d.trade || "—",
    projectId: r.projectId,
    site: d.site || "",
    date: d.date || (r.createdAt ? r.createdAt.slice(0, 10) : ""),
    checkIn: d.checkIn || "--",
    checkOut: d.checkOut || "--",
    status: r.status || d.status || "Present",
    hoursWorked: Number(d.hoursWorked ?? d.hours) || 0,
    overtimeHours: Number(d.overtimeHours) || 0,
    recordedBy: d.recordedBy || r.createdBy || "—",
  };
}

const EMPTY_FORM = {
  projectId: "",
  workerName: "",
  trade: "",
  site: "",
  date: "",
  checkIn: "",
  checkOut: "",
  hoursWorked: "",
  overtimeHours: "",
  status: "Present",
};

export default function PeopleAttendancePage() {
  const { records: rawRecords, projects, projectName, loading, error, reload, create } =
    useRecords("attendance");
  const { user } = useCurrentUser();
  const records = rawRecords.map(mapRecord);

  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const dayRecords = selectedDate ? records.filter((r) => r.date === selectedDate) : records;

  const filtered = dayRecords.filter(
    (r) =>
      r.workerName.toLowerCase().includes(search.toLowerCase()) ||
      (r.site || projectName(r.projectId)).toLowerCase().includes(search.toLowerCase()) ||
      r.trade.toLowerCase().includes(search.toLowerCase())
  );

  const presentCount = dayRecords.filter((r) => r.status === "Present" || r.status === "Late").length;
  const totalOvertime = dayRecords.reduce((s, r) => s + r.overtimeHours, 0);
  const attendanceRate = dayRecords.length > 0 ? (presentCount / dayRecords.length) * 100 : 0;

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
    setBusy(true);
    setFormError(null);
    try {
      await create({
        projectId: form.projectId,
        title: form.workerName || undefined,
        status: form.status,
        data: {
          workerName: form.workerName,
          trade: form.trade,
          site: form.site,
          date: form.date || undefined,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          hoursWorked: Number(form.hoursWorked) || 0,
          overtimeHours: Number(form.overtimeHours) || 0,
          recordedBy: user?.fullName || "",
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to record attendance");
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
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF]">Daily Muster Roll & Attendance</h1>
            <p className="text-[#666666] dark:text-[#A3A3A3] text-sm mt-1">
              Biometric logs, daily site roll call, overtime hours, and shift management
            </p>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Clock Worker In
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Total Shift Headcount</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">{dayRecords.length}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">On Duty Today</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">{presentCount}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Shift Overtime Logged</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">{totalOvertime} hrs</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Attendance Rate</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">
              {attendanceRate.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search by worker name, trade, project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl pl-9 pr-4 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
            />
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
          />
        </div>

        {/* Attendance table */}
        <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-[#666666] dark:text-[#A3A3A3]">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-[#000000] dark:text-[#FFFFFF] font-medium">{error}</p>
              <button onClick={() => reload()} className="mt-3 text-xs font-medium text-[#000000] dark:text-[#FFFFFF] hover:text-[#000000] dark:text-[#FFFFFF]">
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-[#666666] dark:text-[#A3A3A3]">
              <Users size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                {records.length === 0 ? "No attendance records logged yet." : "No attendance records match your filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border-b border-[#D4D4D4] dark:border-[#303030]">
                  <tr>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Worker & Trade</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Site Location</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Clock In</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Clock Out</th>
                    <th className="text-center text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Reg. Hours</th>
                    <th className="text-center text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">OT Hours</th>
                    <th className="text-center text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                  {filtered.map((r) => (
                    <tr key={r._id} className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-[#000000] dark:text-[#FFFFFF] font-medium">{r.workerName}</p>
                        <p className="text-[#666666] dark:text-[#A3A3A3] text-xs mt-0.5">{r.trade}</p>
                      </td>
                      <td className="px-4 py-3 text-[#333333] dark:text-[#D4D4D4] text-xs">{r.site || projectName(r.projectId)}</td>
                      <td className="px-4 py-3 font-mono text-[#333333] dark:text-[#D4D4D4] text-xs">{r.checkIn}</td>
                      <td className="px-4 py-3 font-mono text-[#333333] dark:text-[#D4D4D4] text-xs">{r.checkOut}</td>
                      <td className="px-4 py-3 text-center text-[#000000] dark:text-[#FFFFFF] font-medium">{r.hoursWorked}</td>
                      <td className="px-4 py-3 text-center text-[#000000] dark:text-[#FFFFFF] font-bold">
                        {r.overtimeHours > 0 ? `+${r.overtimeHours}` : "0"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[r.status] || STATUS_BADGES.Present}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] pb-4">
              <h2 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">Clock Worker In</h2>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Worker name</label>
                  <input className={inputCls} value={form.workerName} onChange={(e) => setForm({ ...form, workerName: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Trade</label>
                  <input className={inputCls} value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })} placeholder="Mason, Carpenter, Welder..." />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Site location</label>
                  <input className={inputCls} value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Date</label>
                  <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Check in</label>
                  <input type="time" className={inputCls} value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Check out</label>
                  <input type="time" className={inputCls} value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Regular hours</label>
                  <input type="number" min="0" step="0.5" className={inputCls} value={form.hoursWorked} onChange={(e) => setForm({ ...form, hoursWorked: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">OT hours</label>
                  <input type="number" min="0" step="0.5" className={inputCls} value={form.overtimeHours} onChange={(e) => setForm({ ...form, overtimeHours: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Status</label>
                  <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3]">
                Recorded by: <span className="text-[#666666] dark:text-[#A3A3A3]">{user?.fullName || "Unknown user"}</span>
              </p>
            </div>

            {formError && <p className="text-xs text-[#000000] dark:text-[#FFFFFF]">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFormOpen(false)} className="bg-[#F5F5F5] dark:bg-[#1F1F1F] border border-[#D4D4D4] dark:border-[#303030] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] text-[#000000] dark:text-[#FFFFFF] px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={busy} className="bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {busy && <Loader2 size={14} className="animate-spin" />}
                Save Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
