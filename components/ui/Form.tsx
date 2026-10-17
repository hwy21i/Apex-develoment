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
      className={`bg-[#FFFFFF] dark:bg-[#1F1F1F] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-2xl p-5 sm:p-7 shadow-xs space-y-6 transition-colors ${className}`}
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
      <div className="border-b border-[#E5E7EB] dark:border-[#2A2A2A] pb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-[#111827] dark:text-[#FFFFFF]" />}
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#111827] dark:text-[#FFFFFF]">
            {title}
          </h3>
        </div>
        {subtitle && (
          <p className="text-xs text-[#6B7280] dark:text-[#A1A1A1] mt-0.5">
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
      <label className="block text-xs font-semibold text-[#111827] dark:text-[#FFFFFF]">
        {label} {required && <span className="text-[#EF4444]">*</span>}
      </label>
      {children}
      {helper && !error && (
        <p className="text-[11px] text-[#6B7280] dark:text-[#A1A1A1]">{helper}</p>
      )}
      {error && <p className="text-[11px] text-[#EF4444] font-medium">{error}</p>}
    </div>
  );
}

export function FormInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full min-h-[42px] bg-[#F9FAFB] dark:bg-[#141414] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-xl px-3.5 py-2 text-xs text-[#111827] dark:text-[#FFFFFF] placeholder-[#9CA3AF] dark:placeholder-[#777777] outline-none focus:border-[#111827] dark:focus:border-[#FFFFFF] transition-all ${className}`}
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
      className={`w-full min-h-[42px] bg-[#F9FAFB] dark:bg-[#141414] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-xl px-3.5 py-2 text-xs text-[#111827] dark:text-[#FFFFFF] outline-none focus:border-[#111827] dark:focus:border-[#FFFFFF] transition-all cursor-pointer ${className}`}
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
      className={`w-full bg-[#F9FAFB] dark:bg-[#141414] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-xl px-3.5 py-2.5 text-xs text-[#111827] dark:text-[#FFFFFF] placeholder-[#9CA3AF] dark:placeholder-[#777777] outline-none focus:border-[#111827] dark:focus:border-[#FFFFFF] transition-all resize-y ${className}`}
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
      className={`pt-4 border-t border-[#E5E7EB] dark:border-[#2A2A2A] flex flex-col-reverse sm:flex-row items-center justify-end gap-3 ${className}`}
    >
      {children}
    </div>
  );
}
