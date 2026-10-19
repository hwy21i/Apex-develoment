"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Users,
  UserPlus,
  Search,
  HardHat,
  Briefcase,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Trash2,
} from "lucide-react";
import { useRecords } from "@/hooks/useRecords";

interface UserProfile {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  position?: string;
  isActive?: boolean;
}

interface LaborLogItem {
  _id: string;
  date: string;
  trade: string;
  headcount: number;
  totalHours: number;
  supervisor: string;
  notes?: string;
}

const TRADES = [
  "General Laborers / Helpers",
  "Masons & Bricklayers",
  "Carpenters & Formwork",
  "Steel Fixers / Rebar",
  "Plumbers & Pipefitters",
  "Electricians",
  "Heavy Equipment Operators",
  "Surveyors & Quality Control",
  "Site Safety Officers",
];

export default function ProjectWorkforcePage() {
  const params = useParams();
  const projectId = String(params?.projectId || "");

  const [activeTab, setActiveTab] = useState<"team" | "logs">("team");
  const [project, setProject] = useState<{
    _id: string;
    name: string;
    projectCode: string;
    projectManager?: UserProfile | string;
    teamMembers?: (UserProfile | string)[];
  } | null>(null);

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<Array<{ assignedTo?: { _id: string } | string; status: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Operational records store for site labor logs
  const {
    records: laborRecords,
    reload: reloadLaborLogs,
    create: createLaborRecord,
    remove: removeLaborRecord,
  } = useRecords("workforce", projectId);

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showLogLaborModal, setShowLogLaborModal] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State: Assign Member
  const [selectedUserId, setSelectedUserId] = useState("");

  // Form State: Site Labor Log
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [logTrade, setLogTrade] = useState(TRADES[0]);
  const [logHeadcount, setLogHeadcount] = useState("12");
  const [logHours, setLogHours] = useState("8");
  const [logSupervisor, setLogSupervisor] = useState("Site Foreman");
  const [logNotes, setLogNotes] = useState("");

  const loadProjectAndWorkforce = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [projRes, usersRes, tasksRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`, { cache: "no-store" }),
        fetch("/api/users?limit=100", { cache: "no-store" }),
        fetch(`/api/tasks?projectId=${encodeURIComponent(projectId)}`, { cache: "no-store" }),
      ]);

      const projJson = await projRes.json();
      if (projRes.ok && projJson.success) {
        setProject(projJson.data);
      }

      const usersJson = await usersRes.json();
      if (usersRes.ok && usersJson.success) {
        setAllUsers(usersJson.data.items || []);
      }

      const tasksJson = await tasksRes.json();
      if (tasksRes.ok && tasksJson.success) {
        setTasks(tasksJson.data.items || []);
      }
    } catch (e) {
      setFeedback({ type: "error", message: e instanceof Error ? e.message : "Error loading workforce" });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) loadProjectAndWorkforce();
    });
    return () => {
      ignore = true;
    };
  }, [loadProjectAndWorkforce]);

  // Project Manager object
  const managerProfile: UserProfile | null = useMemo(() => {
    if (!project?.projectManager) return null;
    if (typeof project.projectManager === "object") return project.projectManager as UserProfile;
    return allUsers.find((u) => u._id === project.projectManager) || null;
  }, [project, allUsers]);

  // Assigned Team Members objects
  const assignedTeam: UserProfile[] = useMemo(() => {
    if (!project?.teamMembers) return [];
    return project.teamMembers
      .map((member) => {
        if (typeof member === "object") return member as UserProfile;
        return allUsers.find((u) => u._id === member);
      })
      .filter((u): u is UserProfile => Boolean(u));
  }, [project, allUsers]);

  // Count active tasks per user
  const taskCountByUser = useMemo(() => {
    const map: Record<string, { total: number; active: number }> = {};
    tasks.forEach((t) => {
      const uId = typeof t.assignedTo === "object" ? t.assignedTo?._id : t.assignedTo;
      if (uId) {
        if (!map[uId]) map[uId] = { total: 0, active: 0 };
        map[uId].total += 1;
        if (t.status === "IN_PROGRESS" || t.status === "NOT_STARTED") {
          map[uId].active += 1;
        }
      }
    });
    return map;
  }, [tasks]);

  // Filter unassigned users for the assign modal
  const assignableUsers = useMemo(() => {
    const assignedIds = new Set(assignedTeam.map((u) => u._id));
    if (managerProfile) assignedIds.add(managerProfile._id);
    return allUsers.filter((u) => !assignedIds.has(u._id));
  }, [allUsers, assignedTeam, managerProfile]);

  // Labor Logs
  const laborLogs: LaborLogItem[] = useMemo(() => {
    return laborRecords.map((r) => {
      const d = r.data || {};
      return {
        _id: r._id,
        date: d.date || (r.createdAt ? r.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]),
        trade: d.trade || r.title || "Craft Workers",
        headcount: Number(d.headcount) || 0,
        totalHours: Number(d.totalHours) || 0,
        supervisor: d.supervisor || "Site Foreman",
        notes: d.notes,
      };
    });
  }, [laborRecords]);

  // Filtered Team
  const filteredTeam = useMemo(() => {
    if (!search) return assignedTeam;
    const q = search.toLowerCase();
    return assignedTeam.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        (u.department || "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [assignedTeam, search]);

  const handleAssignMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setFeedback({ type: "error", message: "Please select a user to assign." });
      return;
    }

    try {
      setSubmitting(true);
      const currentIds = assignedTeam.map((u) => u._id);
      if (!currentIds.includes(selectedUserId)) {
        currentIds.push(selectedUserId);
      }

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamMembers: currentIds }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback({ type: "success", message: "Team member assigned to project." });
        setShowAssignModal(false);
        setSelectedUserId("");
        loadProjectAndWorkforce();
      } else {
        setFeedback({ type: "error", message: json.error?.message || "Failed to assign member" });
      }
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error assigning member" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removingMemberId) return;

    try {
      setSubmitting(true);
      const updatedIds = assignedTeam.filter((u) => u._id !== removingMemberId).map((u) => u._id);

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamMembers: updatedIds }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setFeedback({ type: "success", message: "Member removed from project roster." });
        setShowRemoveMemberModal(false);
        setRemovingMemberId(null);
        loadProjectAndWorkforce();
      } else {
        setFeedback({ type: "error", message: json.error?.message || "Failed to remove member" });
      }
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error removing member" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogLabor = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = Number(logHeadcount);
    const hrs = Number(logHours);
    if (isNaN(count) || count <= 0) {
      setFeedback({ type: "error", message: "Please specify a valid worker count." });
      return;
    }

    try {
      setSubmitting(true);
      await createLaborRecord({
        projectId,
        title: `${logTrade} (${count} workers, ${hrs} hrs)`,
        status: "Logged",
        data: {
          date: logDate,
          trade: logTrade,
          headcount: count,
          totalHours: hrs * count,
          supervisor: logSupervisor.trim(),
          notes: logNotes.trim(),
        },
      });

      setFeedback({ type: "success", message: `Logged ${count} ${logTrade} for ${logDate}.` });
      setShowLogLaborModal(false);
      setLogNotes("");
      reloadLaborLogs();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to record labor log" });
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

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
              Human Resources & Site Crew
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#000000] dark:text-[#FFFFFF]">
            Project Workforce
          </h2>
          <p className="text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
            Site leadership, resident engineers, assigned team members, and daily labor headcount logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLogLaborModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors"
          >
            <HardHat className="w-3.5 h-3.5 mr-1.5" />
            Log Site Gang
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:opacity-90 transition-opacity shadow-sm"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Assign Member
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Assigned Staff</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">
            {assignedTeam.length + (managerProfile ? 1 : 0)}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Project Manager</p>
          <p className="text-sm font-bold text-[#000000] dark:text-[#FFFFFF] mt-2 truncate">
            {managerProfile?.fullName || "Unassigned"}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Active Task Assignments</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">
            {tasks.filter((t) => t.status !== "COMPLETED").length}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Labor Headcount Logs</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{laborLogs.length}</p>
        </div>
      </div>

      {/* Project Manager Spotlight Card */}
      {managerProfile && (
        <div className="p-5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] flex items-center justify-center font-mono font-bold text-base text-[#000000] dark:text-[#FFFFFF]">
              {managerProfile.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#000000] dark:text-[#FFFFFF]">
                  {managerProfile.fullName}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] bg-black/5 dark:bg-white/5">
                  Project Manager
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#666666] dark:text-[#A3A3A3] mt-1">
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {managerProfile.email}
                </span>
                {managerProfile.phone && (
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5" />
                    {managerProfile.phone}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {managerProfile.department || "Operations"}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-semibold text-[#666666] dark:text-[#A3A3A3]">
              Overall Direction & Governance
            </span>
          </div>
        </div>
      )}

      {/* Tabs and Search Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab("team")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "team"
                ? "bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]"
                : "text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
            }`}
          >
            Assigned Team Members ({assignedTeam.length})
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "logs"
                ? "bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]"
                : "text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
            }`}
          >
            Site Headcount & Labor Logs ({laborLogs.length})
          </button>
        </div>

        {activeTab === "team" && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team member..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Content Body */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
          <Loader2 className="w-7 h-7 animate-spin text-[#000000] dark:text-[#FFFFFF] mb-2" />
          <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Loading project workforce...</p>
        </div>
      ) : activeTab === "team" ? (
        filteredTeam.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
            <Users className="w-10 h-10 text-[#666666] dark:text-[#A3A3A3] mb-3" />
            <h3 className="text-base font-semibold text-[#000000] dark:text-[#FFFFFF]">No additional team members</h3>
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] max-w-sm mt-1 mb-5">
              Assign resident engineers, site supervisors, and technical specialists to this project.
            </p>
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Assign Team Member
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeam.map((member) => {
              const taskInfo = taskCountByUser[member._id] || { total: 0, active: 0 };
              return (
                <div
                  key={member._id}
                  className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] space-y-3 relative group hover:border-[#000000] dark:hover:border-[#FFFFFF] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] flex items-center justify-center font-mono font-bold text-xs text-[#000000] dark:text-[#FFFFFF]">
                        {member.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#000000] dark:text-[#FFFFFF]">{member.fullName}</h4>
                        <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3]">{member.role}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setRemovingMemberId(member._id);
                        setShowRemoveMemberModal(true);
                      }}
                      title="Unassign Member"
                      className="p-1 rounded-md text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1 text-[11px] text-[#666666] dark:text-[#A3A3A3] pt-1 border-t border-[#D4D4D4] dark:border-[#303030]">
                    <div className="flex items-center justify-between">
                      <span>Email:</span>
                      <span className="font-mono text-[#000000] dark:text-[#FFFFFF] truncate max-w-[170px]">
                        {member.email}
                      </span>
                    </div>
                    {member.department && (
                      <div className="flex items-center justify-between">
                        <span>Department:</span>
                        <span className="text-[#000000] dark:text-[#FFFFFF]">{member.department}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span>Active Tasks:</span>
                      <span className="font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">
                        {taskInfo.active} active ({taskInfo.total} total)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Labor Logs Tab */
        laborLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
            <HardHat className="w-10 h-10 text-[#666666] dark:text-[#A3A3A3] mb-3" />
            <h3 className="text-base font-semibold text-[#000000] dark:text-[#FFFFFF]">No labor logs recorded</h3>
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] max-w-sm mt-1 mb-5">
              Record daily craft trades and site gang headcounts for payroll and productivity verification.
            </p>
            <button
              onClick={() => setShowLogLaborModal(true)}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]"
            >
              <HardHat className="w-4 h-4 mr-1.5" />
              Log Site Gang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Trade / Crew</th>
                  <th className="py-3 px-4 font-semibold text-right">Headcount</th>
                  <th className="py-3 px-4 font-semibold text-right">Man-Hours</th>
                  <th className="py-3 px-4 font-semibold">Supervisor</th>
                  <th className="py-3 px-4 font-semibold">Notes / Sector</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                {laborLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors">
                    <td className="py-3 px-4 font-mono text-[#666666] dark:text-[#A3A3A3] whitespace-nowrap">
                      {log.date}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#000000] dark:text-[#FFFFFF]">{log.trade}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">
                      {log.headcount} workers
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#666666] dark:text-[#A3A3A3]">
                      {log.totalHours} hrs
                    </td>
                    <td className="py-3 px-4 text-[#666666] dark:text-[#A3A3A3]">{log.supervisor}</td>
                    <td className="py-3 px-4 text-[#666666] dark:text-[#A3A3A3]">{log.notes || "—"}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={async () => {
                          await removeLaborRecord(log._id);
                          reloadLaborLogs();
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

      {/* ASSIGN MEMBER MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
                <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">Assign Team Member</h3>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignMember} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Select User *
                </label>
                {assignableUsers.length === 0 ? (
                  <p className="text-xs text-[#666666] dark:text-[#A3A3A3] py-2">
                    All available system users are already assigned to this project.
                  </p>
                ) : (
                  <select
                    required
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  >
                    <option value="">Choose User...</option>
                    {assignableUsers.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.fullName} ({u.role}) - {u.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D4D4D4] dark:border-[#303030]">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] rounded-xl text-[#000000] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || assignableUsers.length === 0}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] rounded-xl hover:opacity-90 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  Assign to Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG LABOR MODAL */}
      {showLogLaborModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
              <div className="flex items-center space-x-2">
                <HardHat className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
                <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">Log Daily Site Crew</h3>
              </div>
              <button
                onClick={() => setShowLogLaborModal(false)}
                className="p-1 text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogLabor} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Trade / Craft *
                  </label>
                  <select
                    value={logTrade}
                    onChange={(e) => setLogTrade(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  >
                    {TRADES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Headcount (Workers) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={logHeadcount}
                    onChange={(e) => setLogHeadcount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Hours Worked / Person
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    required
                    value={logHours}
                    onChange={(e) => setLogHours(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Supervisor Name
                </label>
                <input
                  type="text"
                  value={logSupervisor}
                  onChange={(e) => setLogSupervisor(e.target.value)}
                  placeholder="e.g. Foreman Hailemariam"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Sector / Work Area Remarks
                </label>
                <input
                  type="text"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="Grid 1-4 formwork stripping..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D4D4D4] dark:border-[#303030]">
                <button
                  type="button"
                  onClick={() => setShowLogLaborModal(false)}
                  className="px-4 py-2 text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] rounded-xl text-[#000000] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] rounded-xl hover:opacity-90 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  Save Labor Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REMOVE MEMBER MODAL */}
      {showRemoveMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-2xl">
            <div className="flex items-center space-x-3 text-[#000000] dark:text-[#FFFFFF] mb-3">
              <div className="p-2 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-black/5 dark:bg-white/5">
                <Trash2 className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
              </div>
              <h3 className="text-base font-bold">Unassign Team Member</h3>
            </div>
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] leading-relaxed">
              Are you sure you want to remove this member from the project roster? Existing task history will be preserved.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowRemoveMemberModal(false);
                  setRemovingMemberId(null);
                }}
                className="px-4 py-2 text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] rounded-xl text-[#000000] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleRemoveMember}
                className="inline-flex items-center px-4 py-2 text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
