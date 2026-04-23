"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellDot,
  BrainCircuit,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  ReceiptText,
  Settings,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/src/client/api";
import { RoleBadge, StatusBadge } from "@/components/ui/badges";
import { SecondaryButton } from "@/components/ui/buttons";
import type { DemoSession } from "@/src/client/session";
import type { DashboardPayload, OfficeRole } from "@/types/system";

const navItems = (role: OfficeRole) =>
  [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: role === "HQ" ? "Approval" : "Application", icon: ReceiptText, href: "/application" },
    { label: "Plan & Validate", icon: BrainCircuit, href: "/plan-validate" },
    { label: "Report Issues", icon: BellDot, href: "/issues" },
    { label: "Settings", icon: Settings, href: "/settings" }
  ] as const;

type CurrentShellProps = {
  session: DemoSession;
  title: string;
  description?: string;
  signOut: () => void;
  children: React.ReactNode;
};

type LegacyShellProps = {
  pageTitle: string;
  role?: OfficeRole;
  activeItem?: string;
  drawer?: React.ReactNode;
  children: React.ReactNode;
};

export function PageContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-6", className)}>{children}</div>;
}

export function SectionBlock({
  title,
  description,
  action,
  children
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-section-title text-synapse-text">{title}</h2>
          {description ? <p className="mt-1 text-body text-synapse-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DetailDrawer({
  open,
  title,
  children
}: {
  open?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <aside className="hidden rounded-[24px] border border-synapse-border bg-white/90 p-5 shadow-panel xl:block">
      <h2 className="mb-4 text-section-title text-synapse-text">{title}</h2>
      {children}
    </aside>
  );
}

export function AppShell(props: CurrentShellProps | LegacyShellProps) {
  const isCurrentProps = "session" in props;
  const session = isCurrentProps
    ? props.session
    : ({
        token: "legacy-shell",
        user: {
          id: "legacy-user",
          name: props.role === "HQ" ? "HQ User" : "Branch User",
          officeName: props.role === "HQ" ? "HQ Workspace" : "Branch Workspace",
          role: props.role ?? "HQ",
          branch_id: props.role === "HQ" ? null : "legacy-branch",
          location: "Workspace",
          address: "",
          email: "",
          personInChargeName: props.role === "HQ" ? "HQ User" : "Branch User",
          position: "Legacy View",
          contactNumber: "",
          createdAt: "",
          updatedAt: ""
        }
      } as DemoSession);
  const title = isCurrentProps ? props.title : props.pageTitle;
  const description = isCurrentProps
    ? props.description
    : "Legacy page wrapper retained for compatibility with older draft screens.";
  const signOut = isCurrentProps ? props.signOut : () => undefined;
  const drawer = isCurrentProps ? null : props.drawer;
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const initials =
    session.user.role === "HQ" ? "HQ" : session.user.officeName.slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!isCurrentProps) {
      return;
    }

    let active = true;

    async function loadSummary() {
      try {
        const data = await apiRequest<{ summary: DashboardPayload }>("/api/dashboard/summary", {
          session
        });

        if (active) {
          setNotificationCount(data.summary.unreadIssues);
        }
      } catch {
        if (active) {
          setNotificationCount(0);
        }
      }
    }

    void loadSummary();
    const timer = window.setInterval(() => {
      void loadSummary();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [isCurrentProps, session]);

  const navigation = navItems(session.user.role);

  function sidebarContent() {
    return (
      <>
        <div className="rounded-[26px] border border-white/50 bg-white/75 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-synapse-primary text-lg font-semibold text-white shadow-sm">
              SC
            </div>
            <div className="min-w-0">
              <p className="truncate text-card-title text-synapse-text">SynapseCore</p>
              <p className="truncate text-meta text-synapse-muted">HQ and Branch coordination</p>
            </div>
          </div>
        </div>
        <nav className="grid gap-2" aria-label="Primary navigation">
          {navigation.map(({ label, icon: Icon, href }) => {
            const selected = pathname === href;

            return (
              <Link
                key={label}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "synapse-focus flex min-h-12 items-center gap-3 rounded-2xl border px-4 text-body transition",
                  selected
                    ? "border-blue-200 bg-blue-50 text-synapse-primary shadow-sm"
                    : "border-transparent text-synapse-muted hover:border-synapse-border hover:bg-white hover:text-synapse-text"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-[24px] border border-white/50 bg-white/80 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-card-title text-synapse-text">{session.user.officeName}</p>
              <p className="mt-1 text-body text-synapse-muted">{session.user.location}</p>
            </div>
            <RoleBadge role={session.user.role} />
          </div>
          <p className="mt-3 text-meta text-synapse-muted">
            {session.user.personInChargeName} · {session.user.position}
          </p>
          <SecondaryButton
            className="mt-4 w-full"
            onClick={signOut}
            icon={<LogOut className="h-4 w-4" />}
          >
            Sign out
          </SecondaryButton>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-synapse-page text-synapse-text">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col gap-4 overflow-hidden border-r border-white/40 bg-white/55 p-4 backdrop-blur-xl lg:flex">
        {sidebarContent()}
      </aside>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm lg:hidden">
          <div className="flex h-full w-[86%] max-w-sm flex-col gap-4 bg-synapse-page p-4 shadow-soft">
            <button
              type="button"
              className="synapse-focus ml-auto rounded-2xl border border-synapse-border bg-white p-2"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent()}
          </div>
        </div>
      ) : null}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/50 bg-white/70 px-4 py-4 backdrop-blur-xl md:px-6 xl:px-8">
          <div className="mx-auto flex w-full max-w-7xl items-start gap-4">
            <button
              type="button"
              className="synapse-focus rounded-2xl border border-synapse-border bg-white p-2 text-synapse-muted lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <PanelLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-page-title text-synapse-text">{title}</h1>
              <p className="mt-1 text-body text-synapse-muted">
                {description ?? "A role-specific internal workspace for HQ and Branch Office coordination."}
              </p>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              {notificationCount > 0 ? (
                <StatusBadge tone="warning">
                  {notificationCount} unread issue{notificationCount > 1 ? "s" : ""}
                </StatusBadge>
              ) : null}
              <RoleBadge role={session.user.role} />
              <div className="grid h-11 w-11 place-items-center rounded-full border border-synapse-border bg-white text-body font-semibold shadow-sm">
                {initials}
              </div>
            </div>
          </div>
        </header>
        {notificationCount > 0 ? (
          <div className="pointer-events-none fixed right-4 top-24 z-40 lg:right-8">
            <div className="pointer-events-auto rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-soft">
              <p className="text-body font-semibold text-amber-900">Urgent issue notification</p>
              <p className="mt-1 text-body text-amber-800">
                {notificationCount} issue thread{notificationCount > 1 ? "s need" : " needs"} attention.
              </p>
            </div>
          </div>
        ) : null}
        <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:px-6 xl:px-8">
          {props.children}
          {drawer}
        </main>
      </div>
    </div>
  );
}
