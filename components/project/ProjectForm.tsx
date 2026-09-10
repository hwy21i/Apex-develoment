"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import HierarchicalLocationSelector, {
  HierarchicalLocationValue,
} from "@/components/location/HierarchicalLocationSelector";

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
    <form
      onSubmit={submit}
      className="grid gap-6 rounded-xl border border-[#262C3D] bg-[#141720] p-6 shadow-2xl"
    >
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-300 font-medium"
        >
          {error}
        </p>
      )}

      {/* Primary Project Details */}
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Project Name"
          required
          value={form.name}
          onChange={(v) => update("name", v)}
          placeholder="e.g. Commercial Bank of Ethiopia HQ"
        />
        <Field
          label="Project Code"
          value={form.projectCode}
          onChange={(v) => update("projectCode", v)}
          placeholder="e.g. PRJ-CBE-001 (auto-generated if empty)"
        />
        <Field
          label="Client Name"
          required
          value={form.client}
          onChange={(v) => update("client", v)}
          placeholder="e.g. Commercial Bank of Ethiopia"
        />
        <label className="grid gap-1.5 text-xs text-slate-300">
          <span className="font-semibold uppercase tracking-wider text-slate-400">
            Initial Status
          </span>
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
            className="rounded-lg border border-[#3F434C] bg-[#1B1E24] px-3 py-2 text-white text-xs outline-none focus:border-blue-500"
          >
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
      </div>

      {/* Hierarchical Location Section */}
      <div className="p-4 rounded-xl bg-[#0E1016] border border-[#222736] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-blue-400 font-bold tracking-wider">
            Site Location Hierarchy (Country → Region → City → Site)
          </span>
        </div>
        <HierarchicalLocationSelector value={hierarchy} onChange={setHierarchy} />
      </div>

      {/* Financial & Schedule Metrics */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Field
          label="Start Date"
          required
          type="date"
          value={form.startDate}
          onChange={(v) => update("startDate", v)}
        />
        <Field
          label="Expected End Date"
          required
          type="date"
          value={form.expectedEndDate}
          onChange={(v) => update("expectedEndDate", v)}
        />
        <Field
          label="Total Budget (ETB)"
          required
          type="number"
          value={form.totalBudget}
          onChange={(v) => update("totalBudget", v)}
          placeholder="e.g. 150000000"
        />
        <Field
          label="Contract Value (ETB)"
          required
          type="number"
          value={form.contractValue}
          onChange={(v) => update("contractValue", v)}
          placeholder="e.g. 165000000"
        />
      </div>

      {/* Scope / Description */}
      <label className="grid gap-1.5 text-xs text-slate-300">
        <span className="font-semibold uppercase tracking-wider text-slate-400">
          Project Scope & Description
        </span>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={3}
          placeholder="Detailed engineering scope, architectural blueprints, phase objectives..."
          className="rounded-lg border border-[#3F434C] bg-[#1B1E24] px-3 py-2 text-white text-xs outline-none focus:border-blue-500"
        />
      </label>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          disabled={saving}
          className="rounded-lg bg-blue-600 hover:bg-blue-500 px-5 py-2 text-xs font-semibold text-white disabled:opacity-60 transition-colors shadow-md"
        >
          {saving ? "Creating Project..." : "Create Project"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5 text-xs text-slate-300">
      <span className="font-semibold uppercase tracking-wider text-slate-400">
        {label} {required && <span className="text-red-400">*</span>}
      </span>
      <input
        type={type}
        required={required}
        min={type === "number" ? 0 : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-[#3F434C] bg-[#1B1E24] px-3 py-2 text-white text-xs outline-none focus:border-blue-500"
      />
    </label>
  );
}
