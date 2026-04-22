"use client";

import { Search, UploadCloud } from "lucide-react";
import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "synapse-focus w-full rounded-xl border border-synapse-border bg-white px-3 py-2.5 text-body text-synapse-text placeholder:text-synapse-muted shadow-sm transition hover:border-synapse-primary/60 focus:border-synapse-primary";

type FieldFrameProps = {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
};

type FieldLabelProps = Omit<FieldFrameProps, "children">;

function FieldFrame({ label, hint, error, children }: FieldFrameProps) {
  return (
    <label className="grid gap-2 text-body">
      <span className="font-medium text-synapse-text">{label}</span>
      {children}
      {error ? (
        <span className="text-meta text-synapse-error">{error}</span>
      ) : hint ? (
        <span className="text-meta text-synapse-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function SearchInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-synapse-muted" />
      <input
        className={cn(fieldBase, "pl-9", className)}
        placeholder="Search project, branch, approval"
        {...props}
      />
    </div>
  );
}

export function FormField({
  label,
  hint,
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & FieldLabelProps) {
  return (
    <FieldFrame label={label} hint={hint} error={error}>
      <input className={cn(fieldBase, error && "border-synapse-error", className)} {...props} />
    </FieldFrame>
  );
}

export function SelectField({
  label,
  hint,
  error,
  children,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & FieldLabelProps) {
  return (
    <FieldFrame label={label} hint={hint} error={error}>
      <select className={cn(fieldBase, error && "border-synapse-error", className)} {...props}>
        {children}
      </select>
    </FieldFrame>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldLabelProps) {
  return (
    <FieldFrame label={label} hint={hint} error={error}>
      <textarea
        className={cn(fieldBase, "min-h-32 resize-y", error && "border-synapse-error", className)}
        {...props}
      />
    </FieldFrame>
  );
}

export function FileUploadBox({ label = "Upload files", hint }: { label?: string; hint?: string }) {
  return (
    <label className="synapse-focus flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-synapse-border bg-white px-6 py-8 text-center transition hover:border-synapse-primary hover:bg-synapse-elevated">
      <UploadCloud className="h-8 w-8 text-synapse-secondary" />
      <span className="text-card-title text-synapse-text">{label}</span>
      <span className="max-w-sm text-body text-synapse-muted">
        {hint ?? "Drag and drop documents for project, validation, approval, or execution_update."}
      </span>
      <input className="sr-only" type="file" multiple />
    </label>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-synapse-border bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
      {children}
    </div>
  );
}
