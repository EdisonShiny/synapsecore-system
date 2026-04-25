# HIGHLIGHTS
## 10-minute Pitching Video With Demo (MP4)
[Google Drive for video](https://drive.google.com/drive/folders/1ExDAWW5rVA183hwlQHl4nhWWiCzY1f5Y?usp=drive_link)

# TEAM: IT WORKS ON MY MACHINE
- TEAM CODE: 106
- TEAM MEMBERS: EDISON KONG BANG JEAN (LEADER), DARREN WONGH CHEE LIANG, GOH JUN TECK, LIU YOU ZHENG, LIEW TIAN EN
- PROJECT NAME: Synapsecore System

# All submissions
## Documentation
[Product Requirement Documentation (PRD)](Product%20Requirement%20Documentation%20(PRD)_SynapseCore%20System.pdf)

[System Analysis Documentation (SAD)](System%20Analysis%20Documentation%20(SAD)_SynapseCore%20System.pdf)

[Testing Analysis Documentation (QATD)](Testing%20Analysis%20Documentation%20(QATD)_SynapseCore%20System.pdf)

## Pick Desk Slides
[Pitch Deck](PICK%20DECK_SynapseCore%20System.pdf)

## 10-minute Pitching Video With Demo (MP4)
[Google Drive for video](https://drive.google.com/drive/folders/1ExDAWW5rVA183hwlQHl4nhWWiCzY1f5Y?usp=drive_link)

# SynapseCore System

SynapseCore System is a website for HQ and Branch Office coordination through AI-assisted workflows, requests, approvals, project phases, planning insight, and structured demo data.

## Overview
- role-based login for `HQ` and `Branch Office`
- workflow creation and workflow execution
- AI-assisted project generation with validation and retry handling
- request submission, rejection
- HQ approval decisions for requests and workflow-created projects
- project phase progression and phase report generation
- planning and validation insight
- database browsing and editing

## Tech Stack

- Next.js 15
- React 18
- TypeScript
- Tailwind CSS

## Getting Started

Install dependencies:

```bash
npm install
```

Start the app locally:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/login
```

Before starting testing or running the website, you must insert your API key first (for privacy reasons, we do not provide our own API key):
- Log in as HQ and access the HQ Dashboard
- Go to Settings and locate API Configuration
- Enter your API key in the “AI API Key” field
- Wait until the Live AI status on the left side turns green (this means the AI is ready)
- You can now start using all features of the website

## Main App Routes

Core routes:

- `/login`
- `/projects`
- `/projects/pending`
- `/projects/archived`
- `/projects/[id]`
- `/workflows`
- `/workflows/[id]`
- `/requests`
- `/plan-validate`
- `/database`
- `/settings`

Supporting routes currently redirect:

- `/dashboard` -> `/projects`
- `/application` -> `/workflows`
- `/approvals` -> `/application`
- `/reports` -> `/issues`
- `/issues` -> `/requests`

Also present:

- `/ai-workflow`
- `/validation-center`

## Main Functional Areas

### Authentication

- Sign in with office email and role
- Create office accounts
- Persist demo session in local storage

### Workflows

- Create reusable workflows from prompt presets
- Edit workflow configuration
- Run workflows with text, attachments, checked links, and selected database context
- Review workflow run history and created projects

### Projects

- View active, pending, and archived projects
- Open project details
- Review project phase history
- Submit outcome input to progress approved projects
- Generate phase report PDF

### Requests and Approvals

- Branch Office can submit requests
- Rejected requests can be reapplied
- HQ can approve or reject request applications
- HQ can separately approve or reject workflow-created projects

### Plan and Validate

- Submit planning notes and supporting files
- Review branch-level and overall planning insight
- Inspect AI transparency output

### Database

- Browse structured company data
- Edit supported fields
- Add and update custom entries

### Settings

- Update office profile details
- Configure live AI endpoint, key, model, and web search option
- Clear workflow data with confirmation

## Project Structure

- `app/`: Next.js App Router pages and API route handlers
- `components/`: shared UI, layout, domain cards, and app pages
- `src/modules/system/`: main workflow, project, request, approval, and settings logic
- `src/modules/ai/`: prompt, schema, validation, and AI module contracts
- `src/services/`: AI runtime, store, and supporting services
- `types/`: shared application contracts
- `data/`: local system data
- `docs/`: architecture and integration notes

## Important Files

- `src/modules/system/service.ts`
  - core system logic for workflows, projects, requests, approvals, and phase progression

- `src/modules/ai/prompts.ts`
  - AI system prompts and user prompt templates

- `src/modules/ai/schemas.ts`
  - strict output schemas for AI modules

- `src/modules/ai/validation.ts`
  - strict validation, confidence handling, and retry strategy

- `src/services/ai-engine.ts`
  - AI runtime and deterministic mock fallback behavior

- `components/system/`
  - main route-level UI for login, projects, workflows, requests, settings, and database

- `docs/backend-architecture.md`
  - backend route and flow overview

- `docs/ai-logic-integration.md`
  - AI integration notes and mock/live behavior

## API Surface

The app includes route handlers under `app/api` for:

- auth
- workflows
- projects
- requests
- phases
- reports
- dashboard
- settings
- database
- AI workflow actions

See [docs/backend-architecture.md](docs/backend-architecture.md) for the route map and workflow flows.

## Notes

- This repository currently does not include a root CI workflow.
- The project is best tested manually through the browser plus `build` and `lint` checks.
- Mock mode is the safest default for demos and documentation.
