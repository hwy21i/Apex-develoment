import { ProjectSummary } from "@/types/project";

export default function ProjectModuleEmpty({ title, description, project }: { title: string; description: string; project: ProjectSummary }) {
  return <section><p className="text-xs font-semibold uppercase tracking-[.18em] text-blue-400">{project.projectCode}</p><h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2><p className="mt-2 text-sm text-slate-400">{description}</p><div className="mt-7 rounded-xl border border-dashed border-slate-700 bg-[#171a20] p-8"><h3 className="font-medium text-slate-100">No {title.toLowerCase()} records yet</h3><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Records created for this project will appear here. This workspace is scoped to {project.name} and will never mix records from another project.</p></div></section>;
}
