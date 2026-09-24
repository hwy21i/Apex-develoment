"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Globe,
  DollarSign,
  Shield,
  CheckCircle,
  Save,
} from "lucide-react";
import {
  FormCard,
  FormSection,
  FormField,
  FormInput,
  FormActions,
} from "@/components/ui/Form";

export default function SystemSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "Apex Construction & Engineering Plc",
    taxRegistrationNumber: "0018942315",
    currencyCode: "ETB",
    currencySymbol: "Br",
    vatRatePct: 15,
    withholdingTaxPct: 2,
    retentionRatePct: 5,
    fiscalYearStart: "July 8 (Hamle 1)",
    defaultLanguage: "English (US) / Amharic",
    twoFactorEnforced: true,
    sessionTimeoutMinutes: 60,
    notificationEmails: "admin@construction-erp.et, finance@construction-erp.et",
  });

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              System Global Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Company legal entity data, Ethiopian Birr financial parameters, tax rates, and security enforcement
            </p>
          </div>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 px-3.5 py-1.5 rounded-xl font-semibold shrink-0">
              <CheckCircle size={14} /> Settings Saved
            </span>
          )}
        </div>

        <FormCard onSubmit={handleSave}>
          {/* Corporate Identity */}
          <FormSection
            title="Corporate Identity & Legal Entity"
            subtitle="Registered company profile in Ethiopia"
            icon={Globe}
          >
            <FormField label="Company Legal Name" required>
              <FormInput
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </FormField>

            <FormField label="TIN / Tax Registration Number" required>
              <FormInput
                type="text"
                value={formData.taxRegistrationNumber}
                onChange={(e) => setFormData({ ...formData, taxRegistrationNumber: e.target.value })}
                className="font-mono"
              />
            </FormField>
          </FormSection>

          {/* Financial & Tax Parameters */}
          <FormSection
            title="Ethiopian Financial & Fiscal Parameters"
            subtitle="Base currency and tax withholdings"
            icon={DollarSign}
          >
            <FormField label="Base Currency">
              <FormInput
                type="text"
                value={`${formData.currencyCode} (${formData.currencySymbol})`}
                disabled
                className="opacity-75 font-semibold cursor-not-allowed"
              />
            </FormField>

            <FormField label="VAT Rate (%)">
              <FormInput
                type="number"
                value={formData.vatRatePct}
                onChange={(e) => setFormData({ ...formData, vatRatePct: Number(e.target.value) })}
              />
            </FormField>

            <FormField label="Withholding Tax Rate (%)">
              <FormInput
                type="number"
                value={formData.withholdingTaxPct}
                onChange={(e) => setFormData({ ...formData, withholdingTaxPct: Number(e.target.value) })}
              />
            </FormField>

            <FormField label="Default Retention Hold (%)">
              <FormInput
                type="number"
                value={formData.retentionRatePct}
                onChange={(e) => setFormData({ ...formData, retentionRatePct: Number(e.target.value) })}
              />
            </FormField>

            <FormField label="Fiscal Calendar">
              <FormInput
                type="text"
                value={formData.fiscalYearStart}
                onChange={(e) => setFormData({ ...formData, fiscalYearStart: e.target.value })}
              />
            </FormField>
          </FormSection>

          {/* Security & Access */}
          <FormSection
            title="Security Policies & Session Timeout"
            subtitle="Access protection for managers and engineers"
            icon={Shield}
          >
            <FormField label="Session Inactivity Timeout (Minutes)">
              <FormInput
                type="number"
                value={formData.sessionTimeoutMinutes}
                onChange={(e) => setFormData({ ...formData, sessionTimeoutMinutes: Number(e.target.value) })}
              />
            </FormField>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="twoFactor"
                checked={formData.twoFactorEnforced}
                onChange={(e) => setFormData({ ...formData, twoFactorEnforced: e.target.checked })}
                className="w-4 h-4 rounded text-[#C9A15A] border-slate-300 dark:border-slate-700 focus:ring-[#C9A15A]"
              />
              <label htmlFor="twoFactor" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                Enforce Two-Factor Authentication (2FA) for Managers & Admins
              </label>
            </div>
          </FormSection>

          <FormActions>
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#C9A15A] hover:bg-[#B8924B] text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
            >
              <Save size={15} />
              Save Configuration
            </button>
          </FormActions>
        </FormCard>
      </div>
    </AppShell>
  );
}
