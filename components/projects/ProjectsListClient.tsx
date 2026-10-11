"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  MapPin,
  DollarSign,
  Search,
  X,
  Filter,
} from "lucide-react";
import { ProjectSummary } from "@/types/project";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useSearch } from "@/components/layout/AppShell";

interface ProjectsListClientProps {
  initialProjects: ProjectSummary[];
  canCreate: boolean;
}

export default function ProjectsListClient({
  initialProjects,
  canCreate,
}: ProjectsListClientProps) {
  const { searchQuery: globalQuery, setSearchQuery: setGlobalQuery } = useSearch();
  const [localQuery, setLocalQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Effective query is either the in-page search or the global header search
  const effectiveQuery = (localQuery || globalQuery || "").trim().toLowerCase();

  const filteredProjects = useMemo(() => {
    return initialProjects.filter((p) => {
      const matchesSearch =
        !effectiveQuery ||
        p.name.toLowerCase().includes(effectiveQuery) ||
        (p.projectCode && p.projectCode.toLowerCase().includes(effectiveQuery)) ||
        (p.client && p.client.toLowerCase().includes(effectiveQuery)) ||
        (p.location && p.location.toLowerCase().includes(effectiveQuery));

      const status = (p.healthStatus || p.status || "").toUpperCase();
      const matchesStatus =
        statusFilter === "ALL" ||
        status.includes(statusFilter) ||
        (statusFilter === "ACTIVE" && (status === "ACTIVE" || status === "IN PROGRESS"));

      return matchesSearch && matchesStatus;
    });
  }, [initialProjects, effectiveQuery, statusFilter]);

  const handleClear = () => {
    setLocalQuery("");
    setGlobalQuery("");
    setStatusFilter("ALL");
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAB7B7]" />
          <input
            type="text"
            placeholder="Search projects by name, code, client, or site location..."
            value={localQuery || globalQuery}
            onChange={(e) => {
              setLocalQuery(e.target.value);
              setGlobalQuery(e.target.value);
            }}
            className="w-full bg-white dark:bg-[#1A2D42]/80 border border-slate-200 dark:border-[#AAB7B7]/25 text-slate-900 dark:text-[#D4D8DD] placeholder-slate-400 dark:placeholder-[#AAB7B7]/50 text-xs rounded-xl pl-9 pr-8 py-2.5 outline-none focus:border-[#C0C8CA] focus:ring-1 focus:ring-[#C0C8CA]/30 transition-all shadow-xs"
          />
          {(localQuery || globalQuery) && (
            <button
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-[#D4D8DD] p-0.5 rounded-full"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "ACTIVE", "PLANNING", "COMPLETED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? "bg-[#C0C8CA] text-[#1A2D42] font-bold shadow-xs"
                  : "bg-white dark:bg-[#1A2D42]/80 text-slate-600 dark:text-[#AAB7B7] hover:text-slate-900 dark:hover:text-[#D4D8DD] border border-slate-200 dark:border-[#AAB7B7]/25"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid or Empty State */}
      {filteredProjects.length === 0 ? (
        <section className="glass-card rounded-2xl border border-dashed border-slate-300 dark:border-[#AAB7B7]/30 p-12 text-center shadow-xs">
          <Building2 className="w-10 h-10 text-[#AAB7B7] mx-auto mb-3" />
          <h2 className="text-base font-semibold text-slate-800 dark:text-[#D4D8DD]">
            {effectiveQuery ? `No projects matching "${effectiveQuery}"` : "No projects found"}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-[#AAB7B7] max-w-sm mx-auto">
            {effectiveQuery
              ? "Try adjusting your search terms or clearing your filters."
              : "Create the first project to start managing site execution."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {effectiveQuery && (
              <button
                onClick={handleClear}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#AAB7B7]/25 text-xs font-semibold text-slate-700 dark:text-[#D4D8DD] hover:bg-slate-100 dark:hover:bg-[#2E4156]"
              >
                Clear Search
              </button>
            )}
            {canCreate && (
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C0C8CA] text-[#1A2D42] text-xs font-bold shadow-md shadow-black/10 hover:bg-white transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Project</span>
              </Link>
            )}
          </div>
        </section>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => {
            const formattedBudget =
              project.totalBudget >= 1000000
                ? `ETB ${(project.totalBudget / 1000000).toFixed(2)}M`
                : `ETB ${project.totalBudget.toLocaleString()}`;

            return (
              <Link
                key={project._id}
                href={`/projects/${project._id}/overview`}
                className="group glass-card rounded-2xl border border-slate-200 dark:border-[#AAB7B7]/25 bg-white dark:bg-[#2E4156]/30 p-5 transition-all hover:-translate-y-1 hover:border-[#C0C8CA] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-mono text-[#C0C8CA] font-bold">
                        {project.projectCode}
                      </span>
                      <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-[#D4D8DD] group-hover:text-[#C0C8CA] transition-colors">
                        {project.name}
                      </h2>
                    </div>
                    <StatusBadge value={project.healthStatus || project.status} />
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-[#AAB7B7]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#AAB7B7] shrink-0" />
                      <span className="truncate">{project.location || "Addis Ababa, Ethiopia"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#AAB7B7] shrink-0" />
                      <span>
                        Budget:{" "}
                        <strong className="text-slate-800 dark:text-[#D4D8DD]">
                          {formattedBudget}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-[#AAB7B7]/20">
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-slate-500 dark:text-[#AAB7B7] font-medium">Progress</span>
                    <span className="text-[#C0C8CA] font-mono font-bold">
                      {project.progressPercentage}%
                    </span>
                  </div>
                  <ProgressBar
                    value={project.progressPercentage}
                    tone={
                      project.progressPercentage > 75
                        ? "emerald"
                        : project.progressPercentage > 30
                        ? "amber"
                        : "sky"
                    }
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
