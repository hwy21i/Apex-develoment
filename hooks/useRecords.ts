"use client";

import { useState, useEffect, useCallback } from "react";

export interface OperationalRecord {
  _id: string;
  projectId: string;
  kind: string;
  status?: string;
  title?: string;
  data: Record<string, any>;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectOption {
  _id: string;
  name: string;
  projectCode?: string;
}

export interface CreatePayload {
  projectId: string;
  title?: string;
  status?: string;
  data: Record<string, unknown>;
}

/**
 * Client hook for the generic Operational record store (`/api/records/[kind]`).
 * Loads the records for a kind plus the projects the caller can access (used to
 * resolve project names and populate create-form project pickers).
 */
export function useRecords(kind: string) {
  const [records, setRecords] = useState<OperationalRecord[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [recRes, projRes] = await Promise.all([
        fetch(`/api/records/${kind}`, { cache: "no-store" }),
        fetch(`/api/projects?limit=100`, { cache: "no-store" }),
      ]);
      const recJson = await recRes.json();
      if (!recRes.ok || !recJson.success) {
        throw new Error(recJson.error?.message || "Failed to load records");
      }
      setRecords(recJson.data.items || []);

      if (projRes.ok) {
        const projJson = await projRes.json();
        if (projJson.success) {
          setProjects(
            (projJson.data.items || []).map((p: any) => ({
              _id: p._id,
              name: p.name,
              projectCode: p.projectCode,
            }))
          );
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    load();
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

  return { records, projects, projectName, loading, error, reload: load, create, update };
}
