"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ProjectSummary } from "@/types/project";

const phases = ["Planning", "Design", "Procurement", "Foundation", "Structure", "MEP", "Finishing", "Testing", "Handover", "Completed"];
const statuses = ["planning", "active", "on-hold", "completed", "cancelled"];
const healths = ["ON_TRACK", "AT_RISK", "DELAYED", "CRITICAL"];

export default function ProjectHeader({ project }: { project: ProjectSummary }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const manager = typeof project.projectManager === "string" ? project.projectManager : project.projectManager?.fullName || "Unassigned";
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setFeedback("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/projects/${project._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ progressPercentage: Number(form.get("progressPercentage")), currentPhase: form.get("currentPhase"), status: form.get("status"), healthStatus: form.get("healthStatus"), expectedEndDate: form.get("expectedEndDate") }) });
    const result = await response.json(); setSaving(false);
    if (!response.ok || !result.success) { setFeedback(result.error?.message || "Unable to update project."); return; }
    setOpen(false); router.refresh();
  };
  return <header className="border-b border-slate-800 bg-[#101218]"><div className="mx-auto max-w-7xl px-4 py-5 sm:px-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><Link href="/projects" className="text-sm text-slate-400 hover:text-white">← Back to Projects Portfolio</Link><p className="mt-4 text-xs font-medium uppercase tracking-[.18em] text-blue-400">{project.projectCode} · {project.currentPhase || "Planning"}</p><h1 className="mt-1 text-2xl font-semibold text-white">{project.name}</h1><p className="mt-2 text-sm text-slate-400">{project.client} · {project.location} · PM: {manager}</p><p className="mt-1 text-xs capitalize text-slate-500">{project.status.replace("-", " ")} · Starts {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(project.startDate))} · Finish {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(project.expectedEndDate))}</p></div><button onClick={() => setOpen(true)} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">Update Progress / Phase</button></div>{feedback && <p className="mt-3 text-sm text-red-300">{feedback}</p>}</div>{open && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4"><form onSubmit={save} className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#171a20] p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Update project status</h2><button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">×</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Overall progress"><input name="progressPercentage" type="number" min="0" max="100" defaultValue={project.progressPercentage} required /></Field><Field label="Project phase"><select name="currentPhase" defaultValue={project.currentPhase || "Planning"}>{phases.map((phase) => <option key={phase}>{phase}</option>)}</select></Field><Field label="Status"><select name="status" defaultValue={project.status}>{statuses.map((status) => <option key={status} value={status}>{status.replace("-", " ")}</option>)}</select></Field><Field label="Health"><select name="healthStatus" defaultValue={project.healthStatus || "ON_TRACK"}>{healths.map((status) => <option key={status}>{status.replace("_", " ")}</option>)}</select></Field><Field label="Target completion"><input name="expectedEndDate" type="date" defaultValue={new Date(project.expectedEndDate).toISOString().slice(0, 10)} required /></Field></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm">Cancel</button><button disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save update"}</button></div></form></div>}</header>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-sm text-slate-300">{label}<span className="[&>input]:w-full [&>input]:rounded-lg [&>input]:border [&>input]:border-slate-600 [&>input]:bg-slate-900 [&>input]:p-2 [&>select]:w-full [&>select]:rounded-lg [&>select]:border [&>select]:border-slate-600 [&>select]:bg-slate-900 [&>select]:p-2">{children}</span></label>; }
