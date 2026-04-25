"use client";

import { Paperclip, Search, UploadCloud, X } from "lucide-react";
import {
  type ChangeEvent,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  useId
} from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "synapse-focus w-full rounded-xl border border-synapse-border bg-white px-3 py-2.5 text-body text-synapse-text placeholder:text-slate-400 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:border-synapse-primary";

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

export function FileUploadBox({
  label = "Upload files",
  hint,
  files,
  accept,
  multiple = true,
  onFilesChange,
  onRemoveFile
}: {
  label?: string;
  hint?: string;
  files?: File[];
  accept?: string;
  multiple?: boolean;
  onFilesChange?: (files: File[]) => void;
  onRemoveFile?: (index: number) => void;
}) {
  const inputId = useId();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onFilesChange?.(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  return (
    <div className="grid gap-3">
      <label
        htmlFor={inputId}
        className="synapse-focus flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-synapse-border bg-white px-6 py-8 text-center shadow-sm transition hover:border-slate-300 hover:bg-synapse-elevated"
      >
        <UploadCloud className="h-8 w-8 text-synapse-secondary" />
        <span className="text-card-title text-synapse-text">{label}</span>
        <span className="max-w-sm text-body text-synapse-muted">
          {hint ?? "Drag and drop documents for project, validation, approval, or execution update."}
        </span>
        <span className="rounded-full border border-synapse-border bg-synapse-elevated px-3 py-1 text-meta text-synapse-muted shadow-sm">
          Choose files
        </span>
        <input
          id={inputId}
          className="sr-only"
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleChange}
        />
      </label>
      {files && files.length > 0 ? (
        <div className="grid gap-2 rounded-2xl border border-synapse-border bg-synapse-elevated p-3">
          <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Attached files</p>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${index}`}
              className="flex items-start justify-between gap-3 rounded-xl border border-synapse-border bg-white px-3 py-2 shadow-sm"
            >
              <div className="flex items-start gap-2">
                <Paperclip className="mt-0.5 h-4 w-4 text-synapse-muted" />
                <div className="grid gap-1">
                  <p className="text-body font-medium text-synapse-text">{file.name}</p>
                  <p className="text-meta text-synapse-muted">
                    {(file.size / 1024).toFixed(file.size >= 1024 * 1024 ? 0 : 1)} KB
                  </p>
                </div>
              </div>
              {onRemoveFile ? (
                <button
                  type="button"
                  className="synapse-focus rounded-full border border-synapse-border p-1 text-synapse-muted transition hover:border-synapse-primary hover:text-synapse-primary"
                  onClick={() => onRemoveFile(index)}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-synapse-border bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
      {children}
    </div>
  );
}
