import { ProjectSummary } from "@/types/project";

export default function ProjectModuleEmpty({ title, description, project }: { title: string; description: string; project: ProjectSummary }) {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#666666] dark:text-[#A3A3A3] font-mono">
        {project.projectCode}
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-[#000000] dark:text-[#FFFFFF]">{title}</h2>
      <p className="mt-2 text-sm text-[#666666] dark:text-[#A3A3A3]">{description}</p>
      <div className="mt-7 rounded-xl border border-dashed border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-8">
        <h3 className="font-medium text-[#000000] dark:text-[#FFFFFF]">No {title.toLowerCase()} records yet</h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#666666] dark:text-[#A3A3A3]">
          Records created for this project will appear here. This workspace is scoped to {project.name} and will never mix records from another project.
        </p>
      </div>
    </section>
  );
}
