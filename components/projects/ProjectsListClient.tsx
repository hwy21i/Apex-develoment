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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] dark:text-[#A3A3A3]" />
          <input
            type="text"
            placeholder="Search projects by name, code, client, or site location..."
            value={localQuery || globalQuery}
            onChange={(e) => {
              setLocalQuery(e.target.value);
              setGlobalQuery(e.target.value);
            }}
            className="w-full bg-[#FFFFFF] dark:bg-[#1F1F1F] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] text-xs rounded-xl pl-9 pr-8 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] transition-all shadow-2xs"
          />
          {(localQuery || globalQuery) && (
            <button
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#000000] dark:text-[#A3A3A3] dark:hover:text-[#FFFFFF] p-0.5 rounded-full"
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
                  ? "bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] font-bold shadow-2xs"
                  : "bg-[#FFFFFF] dark:bg-[#1F1F1F] text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid or Empty State */}
      {filteredProjects.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#1F1F1F] p-12 text-center shadow-xs">
          <Building2 className="w-10 h-10 text-[#666666] dark:text-[#A3A3A3] mx-auto mb-3" />
          <h2 className="text-base font-semibold text-[#000000] dark:text-[#FFFFFF]">
            {effectiveQuery ? `No projects matching "${effectiveQuery}"` : "No projects found"}
          </h2>
          <p className="mt-1 text-xs text-[#666666] dark:text-[#A3A3A3] max-w-sm mx-auto">
            {effectiveQuery
              ? "Try adjusting your search terms or clearing your filters."
              : "Create the first project to start managing site execution."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {effectiveQuery && (
              <button
                onClick={handleClear}
                className="px-4 py-2 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] hover:bg-[#FAFAFA] dark:hover:bg-[#171717]"
              >
                Clear Search
              </button>
            )}
            {canCreate && (
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold hover:opacity-90 transition-opacity shadow-xs"
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
            const rawBudget = Number(project.totalBudget ?? (project as unknown as { budget?: number }).budget ?? 0);
            const formattedBudget =
              rawBudget >= 1000000
                ? `ETB ${(rawBudget / 1000000).toFixed(2)}M`
                : `ETB ${rawBudget.toLocaleString()}`;

            return (
              <Link
                key={project._id}
                href={`/projects/${project._id}/overview`}
                className="group rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#1F1F1F] p-5 transition-all hover:-translate-y-1 hover:border-[#000000] dark:hover:border-[#FFFFFF] flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-mono text-[#666666] dark:text-[#A3A3A3] font-bold">
                        {project.projectCode}
                      </span>
                      <h2 className="mt-1 text-base font-bold text-[#000000] dark:text-[#FFFFFF] group-hover:underline transition-all">
                        {project.name}
                      </h2>
                    </div>
                    <StatusBadge value={project.healthStatus || project.status} />
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-[#666666] dark:text-[#A3A3A3]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#666666] dark:text-[#A3A3A3] shrink-0" />
                      <span className="truncate">{project.location || "Addis Ababa, Ethiopia"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#666666] dark:text-[#A3A3A3] shrink-0" />
                      <span>
                        Budget:{" "}
                        <strong className="text-[#000000] dark:text-[#FFFFFF]">
                          {formattedBudget}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#D4D4D4] dark:border-[#303030]">
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-[#666666] dark:text-[#A3A3A3] font-medium">Progress</span>
                    <span className="text-[#000000] dark:text-[#FFFFFF] font-mono font-bold">
                      {project.progressPercentage}%
                    </span>
                  </div>
                  <ProgressBar value={project.progressPercentage} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
