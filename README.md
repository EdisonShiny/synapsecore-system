# synapsecore-system

AI workflow system for HQ and Branch coordination

## SynapseCore System Design System

Dark-theme-first React/Next.js + TypeScript + Tailwind foundation for the SynapseCore System hackathon frontend.

## Use

Import reusable pieces from the component barrel:

```tsx
import { AppShell, KpiCard, DataTableShell, PrimaryButton } from "@/components";
```

Page templates live in:

```tsx
import { DashboardTemplate, ProjectListTemplate } from "@/features/page-templates";
```

## Structure

- `tailwind.config.ts`: exact SynapseCore System theme colors, typography, spacing, radius, and shadow extensions.
- `lib/theme.ts`: token reference for teammates who need colors or conventions outside Tailwind classes.
- `types/synapse.ts`: shared entity, role, status, approval, confidence, and phase types.
- `components/layout`: `AppSidebar`, `TopHeader`, `PageContainer`, `SectionBlock`, `DetailDrawer`, `AppShell`.
- `components/ui`: buttons, badges, table shell, filters, fields, upload, alerts, modal, tabs, progress, confidence meter.
- `components/domain`: KPI, chart, ai_analysis, validation, approval, branch, activity, timeline, report patterns.
- `components/states`: `EmptyState`, `LoadingState`, `ErrorState`.
- `features/page-templates.tsx`: sample structures for Login, Dashboard, project list, create project, project detail, AI plan, validation center, approvals, reports, and settings.

## Shared Contract

Use these entity names exactly in data models and labels: `project`, `phase`, `plan`, `validation`, `approval`, `execution_update`, `ai_analysis`, `branch`, `HQ`.

Allowed roles are only `HQ` and `Branch Office`.

## Commands

```bash
npm install
npm run dev
npm run typecheck
```
