"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  CheckCircle2,
  User,
  FileText,
} from "lucide-react";
import HierarchicalLocationSelector, {
  HierarchicalLocationValue,
} from "@/components/location/HierarchicalLocationSelector";
import {
  FormCard,
  FormSection,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormActions,
} from "@/components/ui/Form";
import { ProjectSummary } from "@/types/project";

interface ManagerOption {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

interface ProjectFormProps {
  initialProject?: ProjectSummary;
}

export default function ProjectForm({ initialProject }: ProjectFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialProject);

  const [form, setForm] = useState({
    name: initialProject?.name || "",
    projectCode: initialProject?.projectCode || "",
    client: initialProject?.client || "",
    description: initialProject?.description || "",
    startDate: initialProject?.startDate
      ? new Date(initialProject.startDate).toISOString().slice(0, 10)
      : "",
    expectedEndDate: initialProject?.expectedEndDate
      ? new Date(initialProject.expectedEndDate).toISOString().slice(0, 10)
      : "",
    contractValue: initialProject?.contractValue
      ? String(initialProject.contractValue)
      : "",
    totalBudget: initialProject?.totalBudget
      ? String(initialProject.totalBudget)
      : "",
    status: initialProject?.status || "planning",
    projectManager: typeof initialProject?.projectManager === "string"
      ? initialProject.projectManager
      : initialProject?.projectManager?._id || "",
    notes: (initialProject as { notes?: string })?.notes || "",
  });

  const [hierarchy, setHierarchy] = useState<HierarchicalLocationValue>({
    countryId: "",
    regionId: "",
    cityId: "",
    district: "",
    address: initialProject?.location || "",
  });

  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadManagers() {
      try {
        const res = await fetch("/api/users?limit=100", { cache: "no-store" });
        const json = await res.json();
        if (res.ok && json.success && Array.isArray(json.data?.items)) {
          setManagers(
            json.data.items.filter(
              (u: ManagerOption) =>
                u.role === "Project Manager" || u.role === "Admin" || u.role === "Site Engineer"
            )
          );
        }
      } catch {}
    }
    loadManagers();
  }, []);

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    // Format location string hierarchically: "Address, District, City, Country"
    const locationParts = [
      hierarchy.address,
      hierarchy.district,
      hierarchy.cityName,
      hierarchy.regionName,
      hierarchy.countryName,
    ].filter(Boolean);

    const locationString =
      locationParts.length > 0
        ? locationParts.join(", ")
        : form.description
        ? initialProject?.location || "Addis Ababa, Ethiopia"
        : "Addis Ababa, Ethiopia";

    try {
      const endpoint = isEditing ? `/api/projects/${initialProject?._id}` : "/api/projects";
      const method = isEditing ? "PATCH" : "POST";

      const payload = {
        name: form.name.trim(),
        projectCode: form.projectCode.trim() || undefined,
        client: form.client.trim(),
        description: form.description.trim(),
        location: locationString,
        startDate: form.startDate,
        expectedEndDate: form.expectedEndDate,
        contractValue: Number(form.contractValue || 0),
        totalBudget: Number(form.totalBudget),
        status: form.status,
        projectManager: form.projectManager || undefined,
        notes: form.notes.trim() || undefined,
      };

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error?.message || `Unable to ${isEditing ? "update" : "create"} project`);
      }

      const targetId = isEditing ? initialProject?._id : resJson.data._id;
      router.push(`/projects/${targetId}/overview`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormCard onSubmit={submit}>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-[#000000] dark:border-[#FFFFFF] bg-[#FAFAFA] dark:bg-[#171717] p-4 text-xs text-[#000000] dark:text-[#FFFFFF] font-medium"
        >
          {error}
        </div>
      )}

      {/* ─── 1. PROJECT INFORMATION ─── */}
      <FormSection
        title="Project Information"
        subtitle="Basic site identifiers and commissioning client"
        icon={Building2}
      >
        <FormField label="Project Name" required>
          <FormInput
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Addis Heights Mixed-Use Tower"
          />
        </FormField>

        <FormField label="Project Code" helper="Auto-generated if left empty">
          <FormInput
            value={form.projectCode}
            onChange={(e) => update("projectCode", e.target.value)}
            placeholder="e.g. PRJ-AH-001"
            disabled={isEditing}
          />
        </FormField>

        <FormField label="Client Name" required>
          <FormInput
            required
            value={form.client}
            onChange={(e) => update("client", e.target.value)}
            placeholder="e.g. Commercial Bank of Ethiopia"
          />
        </FormField>

        <FormField label="Project Manager">
          <FormSelect
            value={form.projectManager}
            onChange={(e) => update("projectManager", e.target.value)}
          >
            <option value="">Select Project Manager...</option>
            {managers.map((m) => (
              <option key={m._id} value={m._id}>
                {m.fullName} ({m.role})
              </option>
            ))}
          </FormSelect>
        </FormField>

        <FormField label="Project Status">
          <FormSelect
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
          >
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </FormSelect>
        </FormField>
      </FormSection>

      {/* ─── 2. SCHEDULE ─── */}
      <FormSection
        title="Schedule & Timeline"
        subtitle="Execution milestones and completion targets"
        icon={Calendar}
      >
        <FormField label="Start Date" required>
          <FormInput
            required
            type="date"
            value={form.startDate}
            onChange={(e) => update("startDate", e.target.value)}
          />
        </FormField>

        <FormField label="Expected Completion Date" required>
          <FormInput
            required
            type="date"
            value={form.expectedEndDate}
            onChange={(e) => update("expectedEndDate", e.target.value)}
          />
        </FormField>
      </FormSection>

      {/* ─── 3. BUDGET & FINANCIALS ─── */}
      <FormSection
        title="Budget & Financials"
        subtitle="Approved capital expenditure in Ethiopian Birr (ETB)"
        icon={DollarSign}
      >
        <FormField label="Total Budget (ETB)" required>
          <FormInput
            required
            type="number"
            min={0}
            value={form.totalBudget}
            onChange={(e) => update("totalBudget", e.target.value)}
            placeholder="e.g. 150000000"
          />
        </FormField>

        <FormField label="Contract Value (ETB)" required>
          <FormInput
            required
            type="number"
            min={0}
            value={form.contractValue}
            onChange={(e) => update("contractValue", e.target.value)}
            placeholder="e.g. 165000000"
          />
        </FormField>
      </FormSection>

      {/* ─── 4. LOCATION & SCOPE ─── */}
      <FormSection
        title="Site Location & Details"
        subtitle="Hierarchical geographical assignment and technical specifications"
        icon={MapPin}
      >
        <div className="md:col-span-2 p-4 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] block">
            Hierarchical Location (Country → Region → City → Site Address)
          </span>
          <HierarchicalLocationSelector value={hierarchy} onChange={setHierarchy} />
        </div>

        <FormField label="Engineering Scope & Objectives" fullWidth>
          <FormTextarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            placeholder="Detailed engineering scope, structural blueprints, architectural objectives..."
          />
        </FormField>

        <FormField label="Project Notes & Special Conditions" fullWidth>
          <FormTextarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={2}
            placeholder="Permit numbers, site access caveats, soil study references..."
          />
        </FormField>
      </FormSection>

      {/* ─── ACTIONS ─── */}
      <FormActions>
        <button
          type="button"
          onClick={() => router.back()}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F] transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] font-bold text-xs shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {saving ? (
            <span>Saving Project...</span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? "Save Project Changes" : "Save Project"}</span>
            </>
          )}
        </button>
      </FormActions>
    </FormCard>
  );
}