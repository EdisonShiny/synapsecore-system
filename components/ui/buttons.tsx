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
        "bg-synapse-primary text-white shadow-soft hover:bg-blue-500 active:bg-blue-700",
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
        "border border-synapse-border bg-synapse-elevated text-synapse-text hover:border-synapse-secondary hover:text-white active:bg-synapse-card",
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
        "bg-synapse-error text-white hover:bg-red-500 active:bg-red-700",
        className
      )}
      {...props}
    />
  );
}
