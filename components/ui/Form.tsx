"use client";

import React from "react";

export function FormCard({
  children,
  className = "",
  onSubmit,
}: {
  children: React.ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className={`bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl p-5 sm:p-7 shadow-xs space-y-6 transition-colors ${className}`}
    >
      {children}
    </form>
  );
}

export function FormSection({
  title,
  subtitle,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-4 pt-2 first:pt-0 ${className}`}>
      <div className="border-b border-slate-100 dark:border-[#2E4156] pb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-[#C0C8CA]" />}
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#D4D8DD]">
            {title}
          </h3>
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-[#AAB7B7] mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">{children}</div>
    </div>
  );
}

export function FormField({
  label,
  required,
  error,
  helper,
  children,
  className = "",
  fullWidth = false,
}: {
  label: string;
  required?: boolean;
  error?: string;
  helper?: string;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${fullWidth ? "md:col-span-2" : ""} ${className}`}>
      <label className="block text-xs font-semibold text-slate-700 dark:text-[#AAB7B7]">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {helper && !error && (
        <p className="text-[11px] text-slate-500 dark:text-[#AAB7B7]">{helper}</p>
      )}
      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

export function FormInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full min-h-[42px] bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-[#D4D8DD] placeholder-slate-400 dark:placeholder-[#AAB7B7]/50 outline-none focus:border-[#C0C8CA] focus:bg-white dark:focus:bg-[#1A2D42] focus:ring-2 focus:ring-[#C0C8CA]/20 transition-all ${className}`}
      {...props}
    />
  );
}

export function FormSelect({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full min-h-[42px] bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-[#D4D8DD] outline-none focus:border-[#C0C8CA] focus:bg-white dark:focus:bg-[#1A2D42] focus:ring-2 focus:ring-[#C0C8CA]/20 transition-all cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function FormTextarea({
  className = "",
  rows = 3,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={`w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] placeholder-slate-400 dark:placeholder-[#AAB7B7]/50 outline-none focus:border-[#C0C8CA] focus:bg-white dark:focus:bg-[#1A2D42] focus:ring-2 focus:ring-[#C0C8CA]/20 transition-all resize-y ${className}`}
      {...props}
    />
  );
}

export function FormActions({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`pt-4 border-t border-slate-100 dark:border-[#2E4156] flex flex-col-reverse sm:flex-row items-center justify-end gap-3 ${className}`}
    >
      {children}
    </div>
  );
}

