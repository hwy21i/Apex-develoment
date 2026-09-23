import ProjectForm from "@/components/project/ProjectForm";
import AppShell from "@/components/layout/AppShell";
import { Building2 } from "lucide-react";

export default function NewProjectPage() {
  return (
    <AppShell>
      <div className="erp-form-page mx-auto max-w-5xl space-y-6">
        <div>
          <div className="flex items-center gap-2 text-blue-700 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" /> Project Onboarding
          </div>
          <h1 className="font-slab text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Create Construction Project
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Configure site specifications, hierarchical location, initial budget, and execution schedule.
          </p>
        </div>

        <ProjectForm />
      </div>
    </AppShell>
  );
}
