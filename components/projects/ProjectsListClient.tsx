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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] dark:text-[#777777]" />
          <input
            type="text"
            placeholder="Search projects by name, code, client, or site location..."
            value={localQuery || globalQuery}
            onChange={(e) => {
              setLocalQuery(e.target.value);
              setGlobalQuery(e.target.value);
            }}
            className="w-full bg-[#FFFFFF] dark:bg-[#1F1F1F] border border-[#E5E7EB] dark:border-[#2A2A2A] text-[#111827] dark:text-[#FFFFFF] placeholder-[#9CA3AF] dark:placeholder-[#777777] text-xs rounded-xl pl-9 pr-8 py-2.5 outline-none focus:border-[#111827] dark:focus:border-[#FFFFFF] transition-all shadow-2xs"
          />
          {(localQuery || globalQuery) && (
            <button
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827] dark:text-[#777777] dark:hover:text-[#FFFFFF] p-0.5 rounded-full"
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
                  ? "bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] font-bold shadow-2xs"
                  : "bg-[#FFFFFF] dark:bg-[#1F1F1F] text-[#6B7280] dark:text-[#A1A1A1] hover:text-[#111827] dark:hover:text-[#FFFFFF] border border-[#E5E7EB] dark:border-[#2A2A2A]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid or Empty State */}
      {filteredProjects.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[#E5E7EB] dark:border-[#2A2A2A] bg-[#FFFFFF] dark:bg-[#1F1F1F] p-12 text-center shadow-xs">
          <Building2 className="w-10 h-10 text-[#9CA3AF] dark:text-[#777777] mx-auto mb-3" />
          <h2 className="text-base font-semibold text-[#111827] dark:text-[#FFFFFF]">
            {effectiveQuery ? `No projects matching "${effectiveQuery}"` : "No projects found"}
          </h2>
          <p className="mt-1 text-xs text-[#6B7280] dark:text-[#A1A1A1] max-w-sm mx-auto">
            {effectiveQuery
              ? "Try adjusting your search terms or clearing your filters."
              : "Create the first project to start managing site execution."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {effectiveQuery && (
              <button
                onClick={handleClear}
                className="px-4 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A] text-xs font-semibold text-[#111827] dark:text-[#FFFFFF] hover:bg-[#F3F4F6] dark:hover:bg-[#252525]"
              >
                Clear Search
              </button>
            )}
            {canCreate && (
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] text-xs font-bold hover:opacity-90 transition-opacity shadow-xs"
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
                className="group rounded-2xl border border-[#E5E7EB] dark:border-[#2A2A2A] bg-[#FFFFFF] dark:bg-[#1F1F1F] p-5 transition-all hover:-translate-y-1 hover:border-[#111827] dark:hover:border-[#FFFFFF] flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-mono text-[#6B7280] dark:text-[#A1A1A1] font-bold">
                        {project.projectCode}
                      </span>
                      <h2 className="mt-1 text-base font-bold text-[#111827] dark:text-[#FFFFFF] group-hover:underline transition-all">
                        {project.name}
                      </h2>
                    </div>
                    <StatusBadge value={project.healthStatus || project.status} />
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-[#6B7280] dark:text-[#A1A1A1]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#9CA3AF] dark:text-[#777777] shrink-0" />
                      <span className="truncate">{project.location || "Addis Ababa, Ethiopia"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#9CA3AF] dark:text-[#777777] shrink-0" />
                      <span>
                        Budget:{" "}
                        <strong className="text-[#111827] dark:text-[#FFFFFF]">
                          {formattedBudget}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#E5E7EB] dark:border-[#2A2A2A]">
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-[#6B7280] dark:text-[#A1A1A1] font-medium">Progress</span>
                    <span className="text-[#111827] dark:text-[#FFFFFF] font-mono font-bold">
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
