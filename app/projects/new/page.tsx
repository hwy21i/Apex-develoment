import ProjectForm from "@/components/project/ProjectForm";
import AppShell from "@/components/layout/AppShell";
import { Building2 } from "lucide-react";

export default function NewProjectPage() {
  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" /> Project Onboarding
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Create Construction Project
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure site specifications, hierarchical location, initial budget, and execution schedule.
          </p>
        </div>

        <ProjectForm />
      </div>
    </AppShell>
  );
}
