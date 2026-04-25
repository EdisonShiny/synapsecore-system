"use client";

import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  icon?: ReactNode;
};

const baseButton =
  "synapse-focus inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-body font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

function ButtonBase({ children, className, disabled, loading, icon, ...props }: ButtonProps) {
  return (
    <button className={className} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      <span>{children}</span>
    </button>
  );
}

export function PrimaryButton({ className, ...props }: ButtonProps) {
  return (
    <ButtonBase
      className={cn(
        baseButton,
        "bg-synapse-primary text-white shadow-sm hover:bg-blue-600 active:bg-blue-700",
        className
      )}
      {...props}
    />
  );
}

export function SecondaryButton({ className, ...props }: ButtonProps) {
  return (
    <ButtonBase
      className={cn(
        baseButton,
        "border border-slate-300 bg-white text-synapse-text shadow-sm hover:border-slate-400 hover:bg-synapse-elevated active:bg-slate-200",
        className
      )}
      {...props}
    />
  );
}

export function DangerButton({ className, ...props }: ButtonProps) {
  return (
    <ButtonBase
      className={cn(
        baseButton,
        "bg-synapse-error text-white shadow-sm hover:bg-red-600 active:bg-red-700",
        className
      )}
      {...props}
    />
  );
}
