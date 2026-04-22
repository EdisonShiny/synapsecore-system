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
- `src/modules/ai`: disconnected AI logic module with prompts, schemas, validation helpers, pipeline metadata, examples, and mock fallback responses.
- `components/layout`: `AppSidebar`, `TopHeader`, `PageContainer`, `SectionBlock`, `DetailDrawer`, `AppShell`.
- `components/ui`: buttons, badges, table shell, filters, fields, upload, alerts, modal, tabs, progress, confidence meter.
- `components/domain`: KPI, chart, ai_analysis, validation, approval, branch, activity, timeline, report patterns.
- `components/states`: `EmptyState`, `LoadingState`, `ErrorState`.
- `features/page-templates.tsx`: sample structures for Login, Dashboard, project list, create project, project detail, AI plan, validation center, approvals, reports, and settings.

## AI Logic Module

The AI reasoning layer in `src/modules/ai` is now wired into the backend AI endpoints with strict prompt, schema, validation, and retry handling. The runtime stays deterministic in mock mode until a real Z.AI configuration is provided.

Key files:

- `src/modules/ai/prompts.ts`: strict system prompts and user prompt templates for each AI module.
- `src/modules/ai/schemas.ts`: JSON-schema-style output contracts for strict AI responses.
- `src/modules/ai/validation.ts`: strict JSON validation, confidence handling, human-review gating, and retry strategy.
- `src/services/ai-engine.ts`: AI execution runtime, deterministic fallback generation, and entity mapping.
- `src/modules/ai/pipeline.ts`: module-to-endpoint pipeline metadata.
- `src/modules/ai/examples.ts`: example request and response pairs for the demo flow.
- `docs/ai-logic-integration.md`: integration guide for backend, frontend, and demo-mode editors.

When integrating the real provider later, configure the Z.AI environment variables and keep frontend components consuming validated `/ai/*` endpoint responses instead of importing prompt text directly.

## Runtime Modes

- `SYNAPSECORE_MODE=mock`: deterministic demo mode with no external AI dependency.
- `SYNAPSECORE_MODE=real`: enables the real AI request path.
- `ZAI_API_URL`: OpenAI-compatible chat/completions endpoint to call in real mode.
- `ZAI_API_KEY`: provider key for the Z.AI runtime.
- `ZAI_MODEL`: model id used for the request.
- `DATABASE_URL`: optional future real database connection string.

If any required AI runtime variable is missing, the app falls back to mock AI automatically.

## App Routes

- `/login`
- `/dashboard`
- `/projects`
- `/projects/create`
- `/projects/[id]`
- `/ai-workflow`
- `/validation-center`
- `/approvals`
- `/reports`
- `/settings`

## Shared Contract

Use these entity names exactly in data models and labels: `project`, `phase`, `plan`, `validation`, `approval`, `execution_update`, `ai_analysis`, `branch`, `HQ`.

Allowed roles are only `HQ` and `Branch Office`.

## Commands

```bash
npm install
npm run dev
npm run typecheck
```
