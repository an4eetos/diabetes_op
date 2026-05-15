import type { ReactNode } from "react";

interface PanelProps {
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export default function Panel({ title, description, children, actions, className = "" }: PanelProps) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || description || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-base font-bold text-slate-950">{title}</h2>}
            {description && <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

