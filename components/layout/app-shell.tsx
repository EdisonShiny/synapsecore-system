"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  List,
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

type PageSectionNavItem = {
  id: string;
  label: string;
};

function slugifySectionTitle(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "section";
}

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
    <section
      data-page-section="true"
      data-section-title={title}
      className="grid gap-4 scroll-mt-28"
    >
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
    <aside className="hidden rounded-2xl border border-synapse-border bg-synapse-card p-5 shadow-sm xl:block">
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
  const [pageSections, setPageSections] = useState<PageSectionNavItem[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [aiHealth, setAiHealth] = useState<SystemAiHealthPayload>({
    status: "checking",
    summary: "Checking AI status",
    detail: "Running a startup probe against the configured AI provider.",
    testedAt: null,
    configured: false,
    model: null
  });
  const contentRef = useRef<HTMLDivElement | null>(null);
  const sectionElementsRef = useRef<HTMLElement[]>([]);
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

  useEffect(() => {
    const containerElement = contentRef.current;

    if (!containerElement) {
      setPageSections([]);
      setActiveSectionId(null);
      return;
    }

    const contentElement: HTMLDivElement = containerElement;

    let frame = 0;

    function updateActiveSection() {
      const sections = sectionElementsRef.current;

      if (sections.length === 0) {
        setActiveSectionId(null);
        return;
      }

      const offset = 160;
      let nextActiveId = sections[0].id;

      for (const section of sections) {
        if (section.getBoundingClientRect().top <= offset) {
          nextActiveId = section.id;
          continue;
        }

        break;
      }

      setActiveSectionId(nextActiveId);
    }

    function refreshSections() {
      const sections = Array.from(
        contentElement.querySelectorAll<HTMLElement>("[data-page-section='true']")
      );
      const slugCounts = new Map<string, number>();

      sectionElementsRef.current = sections;

      const nextSections = sections.map((section, index) => {
        const label =
          section.dataset.sectionTitle?.trim() ||
          section.querySelector("h2")?.textContent?.trim() ||
          `Section ${index + 1}`;
        const slugBase = slugifySectionTitle(label);
        const slugCount = (slugCounts.get(slugBase) ?? 0) + 1;
        const generatedId = slugCount === 1 ? slugBase : `${slugBase}-${slugCount}`;
        const id = section.id || generatedId;

        slugCounts.set(slugBase, slugCount);
        section.id = id;

        return { id, label };
      });

      setPageSections(nextSections);
      updateActiveSection();
    }

    function queueRefresh() {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(refreshSections);
    }

    function queueActiveUpdate() {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateActiveSection);
    }

    const mutationObserver = new MutationObserver(queueRefresh);

    queueRefresh();
    mutationObserver.observe(contentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["data-page-section", "data-section-title", "id"]
    });
    window.addEventListener("resize", queueRefresh);
    window.addEventListener("scroll", queueActiveUpdate, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      mutationObserver.disconnect();
      window.removeEventListener("resize", queueRefresh);
      window.removeEventListener("scroll", queueActiveUpdate);
    };
  }, [pathname]);

  function isSelected(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function renderAiStatus() {
    const toneStyles: Record<Exclude<SystemAiHealthStatus, "checking">, string> = {
      "live-ready": "border-emerald-200 bg-emerald-50 text-emerald-700",
      "fallback-active": "border-amber-200 bg-amber-50 text-amber-700",
      "missing-config": "border-synapse-border bg-synapse-elevated text-synapse-muted"
    };

    if (aiHealth.status === "checking") {
      return (
        <div className="pointer-events-none select-none rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-700 shadow-sm">
          <div className="flex items-start gap-3">
            <Loader2 className="mt-0.5 h-4 w-4 animate-spin shrink-0" />
            <div>
              <p className="text-card-title">Checking AI status</p>
              <p className="mt-1 text-body text-blue-700/85">
                Running a startup probe against the configured provider.
              </p>
            </div>
          </div>
        </div>
      );
    }

    const Icon = aiHealth.status === "live-ready" ? CheckCircle2 : AlertTriangle;

    return (
      <div
        className={cn(
          "pointer-events-none select-none rounded-2xl border p-4 shadow-sm",
          toneStyles[aiHealth.status]
        )}
      >
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

  function scrollToSection(sectionId: string) {
    const section = sectionElementsRef.current.find((item) => item.id === sectionId);

    if (!section) {
      return;
    }

    setActiveSectionId(sectionId);
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function sidebarContent() {
    return (
      <>
        <div className="rounded-2xl border border-synapse-border bg-synapse-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl border border-synapse-border bg-white shadow-sm">
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
                "synapse-focus flex min-h-12 items-center gap-3 rounded-xl border px-4 text-body transition",
                isSelected(href)
                  ? "relative border-blue-100 bg-blue-50 text-blue-700 shadow-sm before:absolute before:left-0 before:top-2 before:h-8 before:w-1 before:rounded-r-full before:bg-synapse-primary"
                  : "border-transparent text-synapse-muted hover:border-slate-200 hover:bg-synapse-elevated hover:text-synapse-text"
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
              "synapse-focus flex min-h-12 items-center gap-3 rounded-xl border px-4 text-body transition",
              isSelected("/settings")
                ? "relative border-blue-100 bg-blue-50 text-blue-700 shadow-sm before:absolute before:left-0 before:top-2 before:h-8 before:w-1 before:rounded-r-full before:bg-synapse-primary"
                : "border-synapse-border bg-synapse-card text-synapse-muted shadow-sm hover:border-slate-300 hover:bg-synapse-elevated hover:text-synapse-text"
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
            <div>
              <p>Settings</p>
              <p className="text-meta text-synapse-muted">User profile and AI API config</p>
            </div>
          </Link>
          <div className="rounded-2xl border border-synapse-border bg-synapse-card p-4 shadow-sm">
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col gap-4 overflow-hidden border-r border-synapse-border bg-white p-4 lg:flex">
        {sidebarContent()}
      </aside>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm lg:hidden">
          <div className="flex h-full w-[86%] max-w-sm flex-col gap-4 border-r border-synapse-border bg-white p-4 shadow-soft">
            <button
              type="button"
              className="synapse-focus ml-auto rounded-xl border border-synapse-border bg-white p-2 shadow-sm"
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
        <header className="sticky top-0 z-30 border-b border-synapse-border bg-white px-4 py-4 md:px-6 xl:px-8">
          <div className="mx-auto flex w-full max-w-7xl items-start gap-4">
            <button
              type="button"
              className="synapse-focus rounded-xl border border-synapse-border bg-white p-2 text-synapse-muted shadow-sm lg:hidden"
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
              <div className="grid h-11 w-11 place-items-center rounded-full border border-synapse-border bg-white text-body font-semibold text-synapse-text shadow-sm">
                {initials}
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[96rem] px-4 py-6 md:px-6 xl:px-8">
          <div
            className={cn(
              "grid items-start gap-6 xl:gap-8",
              pageSections.length > 1 ? "xl:pr-[4.5rem]" : null
            )}
          >
            <div ref={contentRef} className="grid gap-6">
              {props.children}
              {drawer}
            </div>
            {pageSections.length > 1 ? (
              <aside className="pointer-events-none fixed right-4 top-32 z-20 hidden xl:block 2xl:right-8">
                <div className="group pointer-events-auto relative flex justify-end">
                  <div className="absolute right-0 top-0 w-[3.5rem] overflow-hidden rounded-2xl border border-synapse-border bg-white shadow-panel transition-all duration-200 ease-out group-hover:w-[18rem]">
                    <div className="flex min-h-[12rem] flex-col">
                      <div className="flex h-14 items-center justify-center gap-2 border-b border-synapse-border px-3 text-synapse-muted transition group-hover:justify-start group-hover:px-4">
                        <List className="h-4 w-4 shrink-0" />
                        <span className="hidden text-meta font-medium uppercase tracking-[0.08em] text-synapse-muted group-hover:inline">
                          Page navigation
                        </span>
                      </div>
                      <nav
                        aria-label="Section navigation"
                        className="max-h-[70vh] overflow-y-auto px-3 py-3 opacity-0 transition duration-150 group-hover:opacity-100"
                      >
                        <div className="relative pl-5">
                          <span
                            aria-hidden
                            className="absolute bottom-2 left-[7px] top-2 w-px bg-synapse-border"
                          />
                          <div className="grid gap-1">
                            {pageSections.map((section, index) => {
                              const isActive = section.id === activeSectionId;

                              return (
                                <button
                                  key={section.id}
                                  type="button"
                                  aria-current={isActive ? "location" : undefined}
                                  onClick={() => scrollToSection(section.id)}
                                  className={cn(
                                    "synapse-focus relative -ml-5 flex w-full items-start gap-3 rounded-xl py-2 pl-5 pr-2 text-left transition",
                                    isActive
                                      ? "bg-blue-50 text-blue-700"
                                      : "text-synapse-muted hover:bg-synapse-elevated hover:text-synapse-text"
                                  )}
                                >
                                  <span
                                    aria-hidden
                                    className={cn(
                                      "absolute left-[7px] top-3 h-6 w-0.5 rounded-full transition",
                                      isActive ? "bg-synapse-primary" : "bg-transparent"
                                    )}
                                  />
                                  <span className="min-w-8 shrink-0 text-body font-medium tabular-nums">
                                    {index + 1}.
                                  </span>
                                  <span className="line-clamp-2 text-body">{section.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </nav>
                    </div>
                  </div>
                </div>
              </aside>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
