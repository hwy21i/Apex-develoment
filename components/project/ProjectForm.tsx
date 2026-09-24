"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Calendar, DollarSign, MapPin, FileText, CheckCircle2 } from "lucide-react";
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

const initialForm = {
  name: "",
  projectCode: "",
  client: "",
  description: "",
  startDate: "",
  expectedEndDate: "",
  contractValue: "",
  totalBudget: "",
  status: "planning",
};

export default function ProjectForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [hierarchy, setHierarchy] = useState<HierarchicalLocationValue>({
    countryId: "",
    regionId: "",
    cityId: "",
    district: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (key: keyof typeof initialForm, value: string) =>
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
      locationParts.length > 0 ? locationParts.join(", ") : "Addis Ababa, Ethiopia";

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          location: locationString,
          contractValue: Number(form.contractValue || 0),
          totalBudget: Number(form.totalBudget),
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || "Unable to create project");
      }

      router.push(`/projects/${payload.data._id}/overview`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormCard onSubmit={submit}>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-300 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 p-4 text-xs text-rose-800 dark:text-rose-300 font-medium"
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
        <div className="md:col-span-2 p-4 rounded-xl bg-slate-50 dark:bg-[#1C1F24] border border-slate-200 dark:border-[#2F333A] space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C9A15A] block">
            Hierarchical Location (Country → Region → City → Site Address)
          </span>
          <HierarchicalLocationSelector value={hierarchy} onChange={setHierarchy} />
        </div>

        <FormField label="Scope & Description" fullWidth>
          <FormTextarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            placeholder="Detailed engineering scope, structural blueprints, architectural objectives..."
          />
        </FormField>
      </FormSection>

      {/* ─── ACTIONS ─── */}
      <FormActions>
        <button
          type="button"
          onClick={() => router.back()}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#2F333A] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#C9A15A] hover:bg-[#B8924B] text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
        >
          {saving ? (
            <span>Saving Project...</span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Project</span>
            </>
          )}
        </button>
      </FormActions>
    </FormCard>
  );
}
