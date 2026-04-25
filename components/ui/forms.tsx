"use client";

import { AlertTriangle, CheckCircle2, Link2, LoaderCircle, Paperclip, Search, UploadCloud, X } from "lucide-react";
import {
  type ChangeEvent,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  useId,
  useState
} from "react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/src/client/api";
import type { DemoSession } from "@/src/client/session";
import type { WebLinkCheckResult } from "@/types/system";

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

export function WebLinkInputBox({
  session,
  label = "Attach links",
  hint,
  links,
  onChange
}: {
  session: DemoSession | null;
  label?: string;
  hint?: string;
  links: WebLinkCheckResult[];
  onChange: (links: WebLinkCheckResult[]) => void;
}) {
  const inputId = useId();
  const [draftUrl, setDraftUrl] = useState("");
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function handleAddLink() {
    const nextUrl = draftUrl.trim();

    if (!session || !nextUrl) {
      return;
    }

    setChecking(true);
    setFeedback("");

    try {
      const data = await apiRequest<{ link: WebLinkCheckResult }>("/api/web-links/check", {
        method: "POST",
        session,
        json: { url: nextUrl }
      });

      const nextLink = data.link;
      onChange(
        [...links.filter((link) => link.normalizedUrl !== nextLink.normalizedUrl), nextLink]
      );
      setFeedback(nextLink.detail);
      setDraftUrl("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to check this link.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="grid gap-3">
      <FieldFrame
        label={label}
        hint={
          hint ??
          "Add one or more links. Each link is checked immediately, and blocked links must be removed before submission."
        }
      >
        <div className="grid gap-3 rounded-2xl border border-synapse-border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-synapse-muted" />
              <input
                id={inputId}
                className={cn(fieldBase, "pl-9")}
                placeholder="https://example.com/article"
                value={draftUrl}
                onChange={(event) => setDraftUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleAddLink();
                  }
                }}
              />
            </div>
            <button
              type="button"
              className="synapse-focus inline-flex items-center justify-center rounded-xl bg-synapse-primary px-4 py-2.5 text-body font-medium text-white shadow-sm transition hover:bg-synapse-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              disabled={checking || !draftUrl.trim()}
              onClick={() => void handleAddLink()}
            >
              {checking ? (
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Checking
                </span>
              ) : (
                "Add link"
              )}
            </button>
          </div>
          {feedback ? (
            <p
              className={cn(
                "text-meta",
                feedback.toLowerCase().includes("allow")
                  ? "text-synapse-secondary"
                  : "text-synapse-error"
              )}
            >
              {feedback}
            </p>
          ) : null}
        </div>
      </FieldFrame>

      {links.length > 0 ? (
        <div className="grid gap-2 rounded-2xl border border-synapse-border bg-synapse-elevated p-3">
          <p className="text-meta uppercase tracking-[0.08em] text-synapse-muted">Attached links</p>
          {links.map((link, index) => (
            <div
              key={`${link.normalizedUrl}-${index}`}
              className="flex items-start justify-between gap-3 rounded-xl border border-synapse-border bg-white px-3 py-3 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-body font-medium text-synapse-text">{link.title || link.url}</p>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-meta font-medium",
                      link.status === "allowed"
                        ? "bg-emerald-100 text-emerald-700"
                        : link.status === "blocked"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                    )}
                  >
                    {link.status === "allowed" ? "Allowed" : link.status === "blocked" ? "Blocked" : "Error"}
                  </span>
                </div>
                <a
                  href={link.normalizedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block truncate text-body text-synapse-secondary underline-offset-2 hover:underline"
                >
                  {link.normalizedUrl}
                </a>
                <div className="mt-2 flex items-start gap-2 text-body text-synapse-muted">
                  {link.status === "allowed" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  )}
                  <p>{link.detail}</p>
                </div>
              </div>
              <button
                type="button"
                className="synapse-focus rounded-full border border-synapse-border p-1 text-synapse-muted transition hover:border-synapse-primary hover:text-synapse-primary"
                onClick={() => onChange(links.filter((_, currentIndex) => currentIndex !== index))}
                aria-label={`Remove ${link.normalizedUrl}`}
              >
                <X className="h-4 w-4" />
              </button>
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
