# SynapseCore AI Prompts Integration Guide

## Overview

This guide explains how to use the 8 structured AI prompts that have been integrated into the SynapseCore System. These prompts follow a strict structure and are designed to be production-ready for workflow automation.

## Architecture

### Pipeline Stages (Prompts 1-6)

The workflow pipeline processes requests through 6 sequential stages:

```
Input Data
    ↓
Prompt 1: Intake (Extract & Normalize)
    ↓
Prompt 2: Validation (Verify & Validate)
    ↓
Prompt 3: Analysis (Deep Analysis & Insights)
    ↓
Prompt 4: Project Creation (Generate Specifications)
    ↓
Prompt 5: Decision Making (Render Decision)
    ↓
Prompt 6: Progression (Advance State & Execute)
```

### Request Approval Features (Prompts 7-8)

The request approval workflow uses specialized prompts:

```
Request Application
    ↓
Prompt 7: Approval Decision (Evaluate Authorization)
    ↓
[If escalation needed]
    ↓
Prompt 8: Escalation (Route & Manage)
```

## File Locations

- **Structured Prompts**: `/src/modules/ai/structured-prompts.ts`
- **Pipeline Prompts Integration**: `/src/modules/ai/prompts.ts`
- **Request Approval Integration**: `/src/modules/system/service.ts`

## Using Each Prompt

### Prompt 1: Intake
**Purpose**: Extract and normalize incoming request data

```typescript
import { PROMPT_1_INTAKE } from "@/src/modules/ai/structured-prompts";

// Use in API endpoints that receive raw data
const context = {
  inputData: rawRequestData,
  schema: expectedSchema
};

const systemPrompt = PROMPT_1_INTAKE.systemPrompt;
const userPrompt = PROMPT_1_INTAKE.userPromptTemplate(context);
```

**Expected Output**:
- Normalized request object
- Data completeness score (0-100)
- Status: COMPLETE | INCOMPLETE | MALFORMED
- List of missing fields

---

### Prompt 2: Validation
**Purpose**: Verify data against business rules

```typescript
import { PROMPT_2_VALIDATION } from "@/src/modules/ai/structured-prompts";

const context = {
  requestObject: intakeOutput,
  validationRules: businessRules,
  dataTypes: typeDefinitions
};

const systemPrompt = PROMPT_2_VALIDATION.systemPrompt;
const userPrompt = PROMPT_2_VALIDATION.userPromptTemplate(context);
```

**Expected Output**:
- Per-field validation results with error codes
- Cross-field violation detection
- Severity level assessment
- Overall validation status

---

### Prompt 3: Analysis
**Purpose**: Deep analytical evaluation

```typescript
import { PROMPT_3_ANALYSIS } from "@/src/modules/ai/structured-prompts";

const context = {
  validatedRequest: validationOutput,
  historicalData: precedents,
  constraints: systemConstraints
};

const systemPrompt = PROMPT_3_ANALYSIS.systemPrompt;
const userPrompt = PROMPT_3_ANALYSIS.userPromptTemplate(context);
```

**Expected Output**:
- Feasibility assessment with confidence score
- Complexity metrics (resource requirements, risk level)
- Pattern matching against historical data
- Decision factors with relevance scores

---

### Prompt 4: Project Creation
**Purpose**: Generate project specifications

```typescript
import { PROMPT_4_PROJECT_CREATION } from "@/src/modules/ai/structured-prompts";

const context = {
  analysisReport: analysisOutput,
  resources: availableResources,
  namingScheme: projectNamingRules
};

const systemPrompt = PROMPT_4_PROJECT_CREATION.systemPrompt;
const userPrompt = PROMPT_4_PROJECT_CREATION.userPromptTemplate(context);
```

**Expected Output**:
- Deterministic project_id (from request_id)
- Resource allocation details
- Configuration snapshot
- Access control matrix
- Next milestone

---

### Prompt 5: Decision Making
**Purpose**: Render deterministic approval/rejection decisions

```typescript
import { PROMPT_5_DECISION_MAKING } from "@/src/modules/ai/structured-prompts";

const context = {
  analysisReport: analysisOutput,
  decisionMatrix: approvalCriteria,
  policies: systemPolicies
};

const systemPrompt = PROMPT_5_DECISION_MAKING.systemPrompt;
const userPrompt = PROMPT_5_DECISION_MAKING.userPromptTemplate(context);
```

**Expected Output**:
- Decision type: APPROVE | REJECT | ESCALATE
- Confidence score (0-100)
- Justification with criteria evaluation
- Conditions or contingencies
- Execution instructions

---

### Prompt 6: Progression
**Purpose**: Advance workflow state

```typescript
import { PROMPT_6_PROGRESSION } from "@/src/modules/ai/structured-prompts";

const context = {
  decision: decisionOutput,
  currentState: workflowState,
  stateMachine: stateTransitions
};

const systemPrompt = PROMPT_6_PROGRESSION.systemPrompt;
const userPrompt = PROMPT_6_PROGRESSION.userPromptTemplate(context);
```

**Expected Output**:
- State transition validation
- Triggered actions with priority
- Audit trail entry
- Rollback capability assessment
- Dependent tasks

---

### Prompt 7: Approval Decision
**Purpose**: Evaluate request approval requirements

```typescript
import { PROMPT_7_APPROVAL_DECISION } from "@/src/modules/ai/structured-prompts";

const context = {
  request: requestDetails,
  requestor: requestorProfile,
  approvalPolicy: policyRules,
  precedents: historicalApprovals
};

const systemPrompt = PROMPT_7_APPROVAL_DECISION.systemPrompt;
const userPrompt = PROMPT_7_APPROVAL_DECISION.userPromptTemplate(context);
```

**Expected Output**:
- Approval decision: APPROVED | DENIED | CONDITIONAL_APPROVAL
- Required authorization level
- Approver assignment (deterministic)
- Policy compliance assessment
- Approval conditions and scope

---

### Prompt 8: Escalation
**Purpose**: Manage escalation workflows

```typescript
import { PROMPT_8_ESCALATION } from "@/src/modules/ai/structured-prompts";

const context = {
  request: requestOrDecision,
  escalationPolicy: escPolicy,
  stakeholders: stakeholderRegistry,
  history: escalationHistory
};

const systemPrompt = PROMPT_8_ESCALATION.systemPrompt;
const userPrompt = PROMPT_8_ESCALATION.userPromptTemplate(context);
```

**Expected Output**:
- Escalation trigger identification
- Escalation path (step-by-step routing)
- Communication package for stakeholders
- Escalation status tracking
- Resolution outcome

---

## Integration Points

### 1. API Workflows
Located in `/app/api/workflows/route.ts`:
```typescript
POST /api/workflows
{
  "name": "My Workflow",
  "description": "Description",
  "config": {
    "reportPrompt": "Prompt 1 or custom",
    "extractorPrompt": "Prompt 2 or custom",
    "validatorPrompt": "Prompt 2 or custom",
    "projectBuilderPrompt": "Prompt 4 or custom",
    "phaseProgressPrompt": "Prompt 6 or custom",
    "phaseBuilderPrompt": "Prompt 6 or custom"
  }
}
```

### 2. Request Applications
Located in `/app/api/requests/route.ts`:
```typescript
POST /api/requests
{
  "projectId": "optional",
  "projectTitle": "Project Name",
  "applicationText": "Request details",
  "attachments": [],
  "selectedDatabasePaths": []
}
```
This endpoint uses Prompt 7 (Approval Decision) and Prompt 8 (Escalation) internally.

---

## Testing the Prompts

### 1. Create a Test Workflow
```bash
curl -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Structured Prompts",
    "description": "Testing the 8 prompts",
    "config": {
      "reportPrompt": "Extract key operational insights from the input. Focus on issue type, business impact, and required outcomes.",
      "extractorPrompt": "Extract the most important grounded facts without exaggeration.",
      "validatorPrompt": "Validate whether extracted facts are grounded in the provided input.",
      "projectBuilderPrompt": "Generate project candidates based on validated extraction.",
      "phaseProgressPrompt": "Review phase progress and determine next steps.",
      "phaseBuilderPrompt": "Generate the next project phase if needed."
    }
  }'
```

### 2. Run the Workflow
```bash
curl -X POST http://localhost:3000/api/workflows/{workflowId}/execute \
  -H "Content-Type: application/json" \
  -d '{
    "unstructuredInput": "We need to process 1000 orders that arrived yesterday. Current system can only handle 500/day.",
    "attachments": [],
    "selectedDatabasePaths": []
  }'
```

### 3. Submit a Request
```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "{projectId}",
    "projectTitle": "Order Processing Expansion",
    "applicationText": "Requesting approval for infrastructure upgrade to handle volume.",
    "attachments": [],
    "selectedDatabasePaths": []
  }'
```

---

## Key Features of the Prompts

### Deterministic Output
- Prompts are designed to produce consistent, reproducible output
- All prompts return strict JSON format
- No markdown, code fences, or explanations in output

### Grounding
- Prompts prevent hallucination by requiring all facts to be grounded in input
- Explicit instruction to flag unsupported claims
- Assumption tracking

### Constraints & Rules
- Strict enforcement of authorization hierarchies
- Escalation trigger identification
- Cross-field validation
- Resource availability checking

### Audit Trails
- All prompts include audit trail generation
- Immutable records of decisions
- Traceability for compliance

### Production Ready
- Error handling instructions
- Rollback capability assessment
- Condition and contingency tracking
- Severity level classification

---

## Prompt Customization

You can customize prompts when creating workflows. The structured prompts are templates that can be enhanced:

```typescript
const customReportPrompt = `
${PROMPT_1_INTAKE.systemPrompt}

ADDITIONAL RULES FOR THIS ORGANIZATION:
- Include compliance tags for each field
- Flag any mention of external vendors
- Prioritize customer impact assessment
`;
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Prompt returns prose instead of JSON | Ensure "Return strict JSON only" is in system prompt |
| Missing required fields in output | Check that all fields are listed in OUTPUT REQUIREMENTS |
| Inconsistent decisions for identical input | Verify deterministic ID generation, check decision matrix |
| Escalation not triggering | Verify escalation policy triggers are correctly specified |
| Authorization gap not detected | Check approver vs. required authorization level comparison |

---

## Next Steps

1. Test each prompt individually with sample data
2. Integrate prompts into your custom workflows
3. Monitor output quality and adjust rules as needed
4. Set up monitoring/logging for decision audit trails
5. Configure escalation policies and approver matrices

