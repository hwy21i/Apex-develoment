"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ProjectSummary } from "@/types/project";
import { Edit, Archive, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";

const PHASES = [
  "Planning",
  "Design",
  "Procurement",
  "Foundation",
  "Structure",
  "MEP",
  "Finishing",
  "Testing",
  "Handover",
  "Completed",
];
const STATUSES = ["planning", "active", "on-hold", "completed", "cancelled"];
const HEALTHS = ["ON_TRACK", "AT_RISK", "DELAYED", "CRITICAL"];

export default function ProjectHeader({ project }: { project: ProjectSummary }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const manager =
    typeof project.projectManager === "string"
      ? project.projectManager
      : project.projectManager?.fullName || "Unassigned";

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setFeedback("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/projects/${project._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          progressPercentage: Number(form.get("progressPercentage")),
          currentPhase: form.get("currentPhase"),
          status: form.get("status"),
          healthStatus: form.get("healthStatus"),
          expectedEndDate: form.get("expectedEndDate"),
        }),
      });
      const result = await response.json();
      setSaving(false);
      if (!response.ok || !result.success) {
        setFeedback(result.error?.message || "Unable to update project.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setSaving(false);
      setFeedback("Network error updating project.");
    }
  };

  const handleArchive = async () => {
    try {
      setArchiving(true);
      const res = await fetch(`/api/projects/${project._id}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        setShowArchiveModal(false);
        router.push("/projects");
        router.refresh();
      } else {
        setFeedback(json.error?.message || "Unable to archive project.");
      }
    } catch {
      setFeedback("Error archiving project.");
    } finally {
      setArchiving(false);
    }
  };

  return (
    <header className="rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] shadow-sm">
      <div className="mx-auto max-w-7xl px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Projects</span>
            </Link>

            <p className="mt-3 text-xs font-bold uppercase tracking-[.18em] text-[#666666] dark:text-[#A3A3A3] font-mono">
              {project.projectCode} · {project.currentPhase || "Planning"}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              {project.name}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3]">
              {project.client} · {project.location} · Lead PM: <span className="text-[#000000] dark:text-[#FFFFFF] font-medium">{manager}</span>
            </p>
            <p className="mt-1 text-xs capitalize text-[#666666] dark:text-[#A3A3A3] font-mono">
              Status: {project.status.replace("-", " ")} · Starts{" "}
              {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(project.startDate))} · Finish{" "}
              {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(project.expectedEndDate))}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/projects/${project._id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] px-3.5 py-2 text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Project</span>
            </Link>

            <button
              onClick={() => setShowArchiveModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] px-3 py-2 text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors cursor-pointer"
              title="Archive this project"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive</span>
            </button>

            <button
              onClick={() => setOpen(true)}
              className="erp-btn-md bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:opacity-90 shadow-xs cursor-pointer"
            >
              Update Progress / Phase
            </button>
          </div>
        </div>

        {feedback && (
          <p className="mt-3 text-xs text-[#000000] dark:text-[#FFFFFF] font-mono p-2.5 rounded-lg bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030]">
            {feedback}
          </p>
        )}
      </div>

      {/* ─── UPDATE PROGRESS MODAL ─── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-v18-backdrop">
          <form
            onSubmit={save}
            className="v18-card animate-v18-modal w-full erp-modal-md rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#D4D4D4] dark:border-[#303030]">
              <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">Update Project Status & Phase</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Overall Progress (%)">
                <input
                  name="progressPercentage"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={project.progressPercentage}
                  required
                />
              </Field>

              <Field label="Active Phase">
                <select name="currentPhase" defaultValue={project.currentPhase || "Planning"}>
                  {PHASES.map((phase) => (
                    <option key={phase}>{phase}</option>
                  ))}
                </select>
              </Field>

              <Field label="Status">
                <select name="status" defaultValue={project.status}>
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.replace("-", " ")}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Health Rating">
                <select name="healthStatus" defaultValue={project.healthStatus || "ON_TRACK"}>
                  {HEALTHS.map((status) => (
                    <option key={status}>{status.replace("_", " ")}</option>
                  ))}
                </select>
              </Field>

              <div className="sm:col-span-2">
                <Field label="Target Completion Date">
                  <input
                    name="expectedEndDate"
                    type="date"
                    defaultValue={new Date(project.expectedEndDate).toISOString().slice(0, 10)}
                    required
                  />
                </Field>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#D4D4D4] dark:border-[#303030]">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-[#D4D4D4] dark:border-[#303030] px-4 py-2 text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className="rounded-xl bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 text-xs font-bold disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── ARCHIVE CONFIRMATION MODAL ─── */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-v18-backdrop">
          <div className="v18-card animate-v18-modal w-full erp-modal-sm rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-[#000000] dark:text-[#FFFFFF]">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold">Archive Project: {project.name}</h3>
            </div>
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] leading-relaxed">
              Archiving sets the project status to cancelled and removes it from active operations while safely preserving all historical financial, materials, and task records.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleArchive}
                disabled={archiving}
                className="px-4 py-2 rounded-xl bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {archiving ? "Archiving..." : "Confirm Archive"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
      {label}
      <span className="[&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-[#D4D4D4] dark:[&>input]:border-[#303030] [&>input]:bg-[#FFFFFF] dark:[&>input]:bg-[#000000] [&>input]:text-[#000000] dark:[&>input]:text-[#FFFFFF] [&>input]:p-2.5 [&>input]:text-xs [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-[#D4D4D4] dark:[&>select]:border-[#303030] [&>select]:bg-[#FFFFFF] dark:[&>select]:bg-[#000000] [&>select]:text-[#000000] dark:[&>select]:text-[#FFFFFF] [&>select]:p-2.5 [&>select]:text-xs">
        {children}
      </span>
    </label>
  );
}
