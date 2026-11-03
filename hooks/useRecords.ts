"use client";

import { useState, useEffect, useCallback } from "react";
import { getCached, setCached } from "@/lib/client-cache";

export interface OperationalRecord {
  _id: string;
  projectId: string;
  kind: string;
  status?: string;
  title?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectOption {
  _id: string;
  name: string;
  projectCode?: string;
  budget?: number;
  totalBudget?: number;
  amountSpent?: number;
  committedCost?: number;
  remainingBudget?: number;
}

export interface CreatePayload {
  projectId: string;
  title?: string;
  status?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

// Module-level in-memory cache so subsequent pages have projects available on initial render (0ms delay)
const moduleProjectsCache = new Map<string, ProjectOption[]>();

/**
 * Client hook for the generic Operational record store (`/api/records/[kind]`).
 * Loads the records for a kind plus the projects the caller can access (used to
 * resolve project names and populate create-form project pickers).
 */
export function useRecords(kind: string, projectId?: string) {
  const cacheKeyRecords = `records_${kind}_${projectId || "all"}`;
  const initialCachedRecords = getCached<OperationalRecord[]>(cacheKeyRecords);
  const initialCachedProjects = moduleProjectsCache.get("all") || getCached<ProjectOption[]>("all_projects") || [];

  const [records, setRecords] = useState<OperationalRecord[]>(initialCachedRecords || []);
  const [projects, setProjects] = useState<ProjectOption[]>(initialCachedProjects);
  const [loading, setLoading] = useState<boolean>(!initialCachedRecords);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const recUrl = projectId
        ? `/api/records/${kind}?projectId=${encodeURIComponent(projectId)}`
        : `/api/records/${kind}`;
      const [recRes, projRes] = await Promise.all([
        fetch(recUrl, { cache: "no-store" }),
        fetch(`/api/projects?limit=100`, { cache: "no-store" }),
      ]);
      const recJson = await recRes.json();
      if (!recRes.ok || !recJson.success) {
        throw new Error(recJson.error?.message || "Failed to load records");
      }
      const loadedRecords = recJson.data?.items || [];
      setRecords(loadedRecords);
      setCached(cacheKeyRecords, loadedRecords, 30_000);

      if (projRes.ok) {
        const projJson = await projRes.json();
        if (projJson.success || projJson.data) {
          const projectList =
            projJson?.data?.items ||
            projJson?.data?.projects ||
            (Array.isArray(projJson?.data) ? projJson.data : []);

          const mapped: ProjectOption[] = projectList.map(
            (p: {
              _id?: string;
              id?: string;
              name?: string;
              title?: string;
              projectCode?: string;
              budget?: number;
              totalBudget?: number;
              amountSpent?: number;
              committedCost?: number;
              remainingBudget?: number;
            }) => ({
              _id: p._id || p.id || "",
              name: p.name || p.title || "Unnamed Project",
              projectCode: p.projectCode,
              budget: Number(p.budget ?? p.totalBudget ?? 0),
              totalBudget: Number(p.totalBudget ?? p.budget ?? 0),
              amountSpent: Number(p.amountSpent ?? 0),
              committedCost: Number(p.committedCost ?? 0),
              remainingBudget: Number(
                p.remainingBudget ??
                  Math.max(
                    0,
                    Number(p.budget ?? p.totalBudget ?? 0) -
                      Number(p.amountSpent ?? 0) -
                      Number(p.committedCost ?? 0)
                  )
              ),
            })
          );

          moduleProjectsCache.set("all", mapped);
          setCached("all_projects", mapped, 60_000);
          setProjects(mapped);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [cacheKeyRecords, kind, projectId]);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) {
        load();
      }
    });
    return () => {
      ignore = true;
    };
  }, [load]);

  const projectName = useCallback(
    (id: string) => projects.find((p) => p._id === id)?.name || "—",
    [projects]
  );

  const create = useCallback(
    async (payload: CreatePayload) => {
      const res = await fetch(`/api/records/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to create record");
      }
      await load();
      return json.data;
    },
    [kind, load]
  );

  const update = useCallback(
    async (recordId: string, patch: { status?: string; title?: string; data?: Record<string, unknown> }) => {
      const res = await fetch(`/api/records/${kind}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId, ...patch }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to update record");
      }
      await load();
      return json.data;
    },
    [kind, load]
  );

  const remove = useCallback(
    async (recordId: string) => {
      const res = await fetch(`/api/records/${kind}?recordId=${encodeURIComponent(recordId)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to delete record");
      }
      await load();
      return json.data;
    },
    [kind, load]
  );

  return { records, projects, projectName, loading, error, reload: load, create, update, remove };
}
