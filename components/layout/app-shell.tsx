"use client";

import {
  BarChart3,
  Bell,
  Bot,
  CheckSquare,
  FileText,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/synapse";
import { RoleBadge } from "@/components/ui/badges";
import { SearchInput } from "@/components/ui/forms";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Projects", icon: FileText },
  { label: "AI Workflow", icon: Bot },
  { label: "Validation Center", icon: ShieldCheck },
  { label: "Approvals", icon: CheckSquare },
  { label: "Reports", icon: BarChart3 },
  { label: "Settings", icon: Settings }
] as const;

export function AppSidebar({
  activeItem = "Dashboard",
  collapsed = false
}: {
  activeItem?: (typeof navItems)[number]["label"];
  collapsed?: boolean;
}) {
  return (
    <aside className={cn("hidden min-h-screen border-r border-synapse-border bg-synapse-elevated p-4 lg:block", collapsed ? "w-20" : "w-72")}>
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-synapse-primary text-card-title text-white">SC</div>
        {!collapsed ? (
          <div>
            <p className="text-card-title text-synapse-text">SynapseCore System</p>
            <p className="text-meta text-synapse-muted">HQ and branch workflow</p>
          </div>
        ) : null}
      </div>
      <nav className="grid gap-2" aria-label="Primary navigation">
        {navItems.map(({ label, icon: Icon }) => {
          const selected = label === activeItem;
          return (
            <button
              key={label}
              className={cn(
                "synapse-focus flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-body transition",
                selected
                  ? "bg-synapse-primary text-white shadow-panel"
                  : "text-synapse-muted hover:bg-synapse-card hover:text-synapse-text"
              )}
              type="button"
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed ? <span>{label}</span> : null}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export function TopHeader({
  pageTitle,
  role = "HQ",
  avatarInitials = "HQ"
}: {
  pageTitle: string;
  role?: UserRole;
  avatarInitials?: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-synapse-border bg-synapse-page/90 px-4 py-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-4">
        <button className="synapse-focus rounded-xl border border-synapse-border bg-synapse-elevated p-2 text-synapse-muted hover:text-white lg:hidden" type="button" aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-page-title text-synapse-text">{pageTitle}</h1>
        </div>
        <div className="hidden w-full max-w-md md:block">
          <SearchInput aria-label="Search" />
        </div>
        <button className="synapse-focus rounded-xl border border-synapse-border bg-synapse-elevated p-2 text-synapse-muted hover:text-white" type="button" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </button>
        <RoleBadge role={role} />
        <div className="grid h-10 w-10 place-items-center rounded-full border border-synapse-border bg-synapse-card text-body font-semibold text-synapse-text">
          {avatarInitials}
        </div>
      </div>
      <div className="mt-3 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-synapse-muted" />
          <input className="synapse-focus w-full rounded-xl border border-synapse-border bg-synapse-elevated py-2.5 pl-9 pr-3 text-body text-synapse-text" placeholder="Search" />
        </div>
      </div>
    </header>
  );
}

export function PageContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return <main className={cn("mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:px-6", className)}>{children}</main>;
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
  if (!open) return null;

  return (
    <aside className="hidden w-96 border-l border-synapse-border bg-synapse-elevated p-5 xl:block">
      <h2 className="mb-4 text-section-title text-synapse-text">{title}</h2>
      {children}
    </aside>
  );
}

export function AppShell({
  pageTitle,
  role = "HQ",
  activeItem,
  drawer,
  children
}: {
  pageTitle: string;
  role?: UserRole;
  activeItem?: Parameters<typeof AppSidebar>[0]["activeItem"];
  drawer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-synapse-page text-synapse-text">
      <AppSidebar activeItem={activeItem} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader pageTitle={pageTitle} role={role} avatarInitials={role === "HQ" ? "HQ" : "BO"} />
        <div className="flex min-w-0 flex-1">
          <PageContainer>{children}</PageContainer>
          {drawer}
        </div>
      </div>
    </div>
  );
}
