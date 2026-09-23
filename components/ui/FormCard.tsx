import type { ReactNode } from "react";

export function FormCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`erp-form-card ${className}`}>{children}</div>;
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-t border-slate-200 pt-5 first:border-t-0 first:pt-0 dark:border-[#2F333A]">
      <div>
        <h2 className="font-mono text-xs font-bold uppercase tracking-[.14em] text-slate-700 dark:text-slate-200">{title}</h2>
        {description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {children}
    </section>
  );
}
