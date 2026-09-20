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
  return <header className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="mx-auto max-w-7xl px-5 py-5 sm:px-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><Link href="/projects" className="text-sm font-semibold text-amber-700 hover:text-amber-800">← Back to Projects</Link><p className="mt-4 text-xs font-bold uppercase tracking-[.18em] text-amber-700">{project.projectCode} · {project.currentPhase || "Planning"}</p><h1 className="mt-1 text-2xl font-semibold text-slate-950">{project.name}</h1><p className="mt-2 text-sm text-slate-600">{project.client} · {project.location} · PM: {manager}</p><p className="mt-1 text-xs capitalize text-slate-500">{project.status.replace("-", " ")} · Starts {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(project.startDate))} · Finish {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(project.expectedEndDate))}</p></div><button onClick={() => setOpen(true)} className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400">Update Progress / Phase</button></div>{feedback && <p className="mt-3 text-sm text-rose-600">{feedback}</p>}</div>{open && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"><form onSubmit={save} className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">Update project status</h2><button type="button" onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-900">×</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Overall progress"><input name="progressPercentage" type="number" min="0" max="100" defaultValue={project.progressPercentage} required /></Field><Field label="Project phase"><select name="currentPhase" defaultValue={project.currentPhase || "Planning"}>{phases.map((phase) => <option key={phase}>{phase}</option>)}</select></Field><Field label="Status"><select name="status" defaultValue={project.status}>{statuses.map((status) => <option key={status} value={status}>{status.replace("-", " ")}</option>)}</select></Field><Field label="Health"><select name="healthStatus" defaultValue={project.healthStatus || "ON_TRACK"}>{healths.map((status) => <option key={status}>{status.replace("_", " ")}</option>)}</select></Field><Field label="Target completion"><input name="expectedEndDate" type="date" defaultValue={new Date(project.expectedEndDate).toISOString().slice(0, 10)} required /></Field></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700">Cancel</button><button disabled={saving} className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{saving ? "Saving…" : "Save update"}</button></div></form></div>}</header>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-sm text-slate-600">{label}<span className="[&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2">{children}</span></label>; }
