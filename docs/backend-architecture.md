# SynapseCore System Backend Architecture

## Runtime Shape

- Framework: Next.js App Router route handlers in `app/api`
- Language: TypeScript
- Data mode: in-memory mock database by default
- Real mode switch: `SYNAPSECORE_MODE=real`
- AI fallback rule: if `ZAI_API_URL`, `ZAI_API_KEY`, or `ZAI_MODEL` is missing, AI stays in mock mode even when real mode is requested
- Database fallback rule: if `DATABASE_URL` is missing, data stays in mock mode even when real mode is requested

## Contract Ownership

- Shared contract types live in `types/`
- Backend modules live in `src/modules/`
- Shared services live in `src/services/`
- Runtime config lives in `src/config/`
- Response helpers and auth helpers live in `src/utils/`
- Seed demo data lives in `mocks/synapse-data.ts`

## Endpoint Map

### Auth

- `POST /auth/login`
- `GET /auth/me`

### Dashboard

- `GET /dashboard/summary`
- `GET /dashboard/alerts`
- `GET /dashboard/activity`

### Projects

- `GET /projects`
- `GET /projects/:id`
- `POST /projects`
- `PATCH /projects/:id`

### Inputs

- `POST /inputs`
- `GET /inputs/:id`

### Phases

- `GET /projects/:id/phases`
- `POST /projects/:id/phases`
- `GET /phases/:id`
- `PATCH /phases/:id`

### AI

- `POST /ai/analyze-input`
- `POST /ai/create-project-from-input`
- `POST /ai/generate-phase-plan`
- `POST /ai/validate-phase-plan`
- `POST /ai/review-outcome`
- `POST /ai/recommend-approval`

### Execution

- `POST /phases/:id/execute-update`

### Approvals

- `GET /approvals`
- `POST /approvals/request`
- `POST /approvals/:id/decision`

### Reports

- `GET /reports/project/:id`
- `GET /reports/branch/:id`
- `GET /reports/risk`
- `GET /reports/validation`

## Workflow Logic

### Flow A: Input to Project

1. `POST /inputs` stores `project_input`
2. The same service generates and stores `ai_analysis`
3. `POST /ai/analyze-input` can re-run structured analysis for an existing input
4. `POST /ai/create-project-from-input` creates a `project` plus the first `phase`

### Flow B: Project to Plan

1. `POST /projects` creates the `project`
2. A first `phase` is created automatically
3. `POST /ai/generate-phase-plan` stores `plan`
4. `POST /ai/validate-phase-plan` stores `validation`
5. Validation moves project status to `validation_pending`

### Flow C: Execute to Improve

1. `POST /phases/:id/execute-update` stores `execution_update`
2. Outcome review runs inside the same module
3. If the review recommends it, the next `phase` is created automatically
4. Project and phase statuses move into `executing`, `completed`, `blocked`, or `escalated`

### Flow D: Approval

1. `POST /approvals/request` creates an `approval`
2. Project status moves to `approval_pending`
3. `POST /approvals/:id/decision` lets HQ approve, reject, revise, or escalate
4. Approval decisions update project and phase states together

## Access Rules

- HQ can view every project, approval, report, and dashboard metric
- Branch Office is filtered to its own `branch_id`
- HQ is required for approval decisions
- Branch Office can submit `project_input` and `execution_update`

## Mock Demo Coverage

The seed data covers:

- low stock with rising demand
- overstock risk
- negative product feedback trend
- urgent branch escalation
- approval request for restock or pricing action
- next phase generation after execution
- validation warning due to missing information

## Auth Convention for Demo

- Login returns `token: "demo:<user_id>"`
- Protected endpoints accept either:
  - `Authorization: Bearer demo:<user_id>`
  - `x-user-id: <user_id>`

If no auth header is provided in mock mode, the backend falls back to the HQ demo user so the demo still works.
