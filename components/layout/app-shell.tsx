"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FolderKanban,
  GitBranchPlus,
  Inbox,
  Loader2,
  LogOut,
  PanelLeft,
  Settings,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RoleBadge } from "@/components/ui/badges";
import { SecondaryButton } from "@/components/ui/buttons";
import { apiRequest } from "@/src/client/api";
import type { DemoSession } from "@/src/client/session";
import type { OfficeRole, SystemAiHealthPayload, SystemAiHealthStatus } from "@/types/system";

const navItems = (_role: OfficeRole) =>
  [
    { label: "Projects", icon: FolderKanban, href: "/projects" },
    { label: "Workflows", icon: GitBranchPlus, href: "/workflows" },
    { label: "Requests", icon: Inbox, href: "/requests" },
    { label: "Database", icon: Database, href: "/database" }
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
  const legacyRole = !isCurrentProps ? props.role : undefined;
  const legacySession = useMemo(
    () =>
      ({
        token: "legacy-shell",
        user: {
          id: "legacy-user",
          name: legacyRole === "HQ" ? "HQ User" : "Branch User",
          officeName: legacyRole === "HQ" ? "HQ Workspace" : "Branch Workspace",
          role: legacyRole ?? "HQ",
          branch_id: legacyRole === "HQ" ? null : "legacy-branch",
          location: "Workspace",
          address: "",
          email: "",
          personInChargeName: legacyRole === "HQ" ? "HQ User" : "Branch User",
          position: "Legacy View",
          contactNumber: "",
          createdAt: "",
          updatedAt: ""
        }
      } as DemoSession),
    [legacyRole]
  );
  const session = isCurrentProps ? props.session : legacySession;
  const title = isCurrentProps ? props.title : props.pageTitle;
  const description = isCurrentProps
    ? props.description
    : "Legacy page wrapper retained for compatibility with older draft screens.";
  const signOut = isCurrentProps ? props.signOut : () => undefined;
  const drawer = isCurrentProps ? null : props.drawer;
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aiHealth, setAiHealth] = useState<SystemAiHealthPayload>({
    status: "checking",
    summary: "Checking AI status",
    detail: "Running a startup probe against the configured AI provider.",
    testedAt: null,
    configured: false,
    model: null
  });
  const initials =
    session.user.role === "HQ" ? "HQ" : session.user.officeName.slice(0, 2).toUpperCase();

  const navigation = navItems(session.user.role);

  useEffect(() => {
    let active = true;

    async function loadAiHealth() {
      try {
        const data = await apiRequest<SystemAiHealthPayload>("/api/settings/ai-health", {
          session
        });

        if (active) {
          setAiHealth(data);
        }
      } catch (error) {
        if (active) {
          setAiHealth({
            status: "fallback-active",
            summary: "Fallback pipeline active",
            detail:
              error instanceof Error
                ? error.message
                : "Could not confirm live AI availability, so the app should be treated as fallback mode.",
            testedAt: null,
            configured: false,
            model: null
          });
        }
      }
    }

    void loadAiHealth();

    return () => {
      active = false;
    };
  }, [session]);

  function isSelected(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function renderAiStatus() {
    const toneStyles: Record<Exclude<SystemAiHealthStatus, "checking">, string> = {
      "live-ready": "border-emerald-200 bg-emerald-50 text-emerald-800",
      "fallback-active": "border-amber-200 bg-amber-50 text-amber-800",
      "missing-config": "border-slate-200 bg-slate-100 text-slate-700"
    };

    if (aiHealth.status === "checking") {
      return (
        <div className="rounded-[24px] border border-blue-200 bg-blue-50 p-4 text-blue-800 shadow-sm">
          <div className="flex items-start gap-3">
            <Loader2 className="mt-0.5 h-4 w-4 animate-spin shrink-0" />
            <div>
              <p className="text-card-title">Checking AI status</p>
              <p className="mt-1 text-body text-blue-700">
                Running a startup probe against the configured provider.
              </p>
            </div>
          </div>
        </div>
      );
    }

    const Icon = aiHealth.status === "live-ready" ? CheckCircle2 : AlertTriangle;

    return (
      <div className={cn("rounded-[24px] border p-4 shadow-sm", toneStyles[aiHealth.status])}>
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-card-title">{aiHealth.summary}</p>
            <p className="mt-1 text-body">{aiHealth.detail}</p>
            {aiHealth.model ? (
              <p className="mt-2 text-meta opacity-80">Configured model: {aiHealth.model}</p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  function sidebarContent() {
    return (
      <>
        <div className="rounded-[26px] border border-white/50 bg-white/75 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-[18px] border border-white/70 bg-slate-950 shadow-sm">
              <Image
                src="/synapsecore-logo.png"
                alt="SynapseCore logo"
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-card-title text-synapse-text">SynapseCore</p>
              <p className="truncate text-meta text-synapse-muted">HQ and branch workflow service</p>
            </div>
          </div>
        </div>
        <nav className="grid gap-2" aria-label="Primary navigation">
          {navigation.map(({ label, icon: Icon, href }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "synapse-focus flex min-h-12 items-center gap-3 rounded-2xl border px-4 text-body transition",
                isSelected(href)
                  ? "border-blue-200 bg-blue-50 text-synapse-primary shadow-sm"
                  : "border-transparent text-synapse-muted hover:border-synapse-border hover:bg-white hover:text-synapse-text"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto grid gap-3">
          {renderAiStatus()}
          <Link
            href="/settings"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "synapse-focus flex min-h-12 items-center gap-3 rounded-2xl border px-4 text-body transition",
              isSelected("/settings")
                ? "border-blue-200 bg-blue-50 text-synapse-primary shadow-sm"
                : "border-transparent bg-white/80 text-synapse-muted hover:border-synapse-border hover:bg-white hover:text-synapse-text"
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
            <div>
              <p>Settings</p>
              <p className="text-meta text-synapse-muted">User profile and AI API config</p>
            </div>
          </Link>
          <div className="rounded-[24px] border border-white/50 bg-white/80 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-card-title text-synapse-text">{session.user.personInChargeName}</p>
                <p className="mt-1 text-body text-synapse-muted">{session.user.officeName}</p>
              </div>
              <RoleBadge role={session.user.role} />
            </div>
            <p className="mt-3 text-meta text-synapse-muted">
              {session.user.location} / {session.user.position}
            </p>
          </div>
          <SecondaryButton className="w-full" onClick={signOut} icon={<LogOut className="h-4 w-4" />}>
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
              <RoleBadge role={session.user.role} />
              <div className="grid h-11 w-11 place-items-center rounded-full border border-synapse-border bg-white text-body font-semibold shadow-sm">
                {initials}
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:px-6 xl:px-8">
          {props.children}
          {drawer}
        </main>
      </div>
    </div>
  );
}
