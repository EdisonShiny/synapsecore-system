# SynapseCore System AI Logic Integration

This document defines the AI reasoning layer for SynapseCore System. The AI behaves as a structured workflow reasoning engine, not a chatbot. Every real or mock AI response must be strict JSON with one required root key.

## Module Roots

| Workflow stage | Module root | Endpoint |
| --- | --- | --- |
| Input | `input_understanding` | `POST /ai/analyze-input` |
| Project | `project_identification` | `POST /ai/create-project-from-input` |
| Phase -> Plan | `phase_plan_generation` | `POST /ai/generate-phase-plan` |
| Validate | `validation` | `POST /ai/validate-phase-plan` |
| Approval | `approval_recommendation` | `POST /ai/recommend-approval` |
| Execute -> Improve | `outcome_review` | `POST /ai/review-outcome` |

## Prompt Files

Use [prompts.ts](../src/modules/ai/prompts.ts) to retrieve the strict system prompt and user prompt template for each module.

```ts
import { getPromptPair } from "./src/modules/ai";

const prompt = getPromptPair("input_understanding");
const messages = [
  { role: "system", content: prompt.system },
  {
    role: "user",
    content: prompt.userTemplate({
      userRole: "Branch Office",
      inputData: {
        source_type: "manual_form",
        raw_text: "Branch reports low stock and rising demand."
      }
    })
  }
];
```

## Output Schemas

Use [schemas.ts](../src/modules/ai/schemas.ts) for JSON-schema-style contracts. These schemas intentionally use only shared names and shared enum values from the merge contract.

Example root shape:

```json
{
  "input_understanding": {
    "issue_type": "low stock with rising demand",
    "business_area": "inventory",
    "branch": "Kuala Lumpur Central Branch",
    "urgency": "high",
    "summary": "Branch reports low stock with rising customer demand.",
    "risks": ["Potential stockout before next replenishment."],
    "opportunities": ["Restock can capture rising demand."],
    "missing_information": ["Current stock quantity"],
    "confidence_score": 82,
    "suggest_project_creation": true
  }
}
```

## Pipeline

1. Normalize input in backend before sending to AI. Preserve original `raw_text`.
2. Run `input_understanding` to create structured ai_analysis fields.
3. Run `project_identification` to decide whether a project should be created.
4. Run `phase_plan_generation` for the current phase.
5. Run `validation` before approval or execution.
6. Run `approval_recommendation` when an approval request is needed.
7. Run `outcome_review` after an `execution_update` and generate a next phase when needed.

The importable pipeline map is in [pipeline.ts](../src/modules/ai/pipeline.ts).

## Validation Strategy

Use [validation.ts](../src/modules/ai/validation.ts) after every LLM call.

Validation checks:

- Output is one JSON object.
- No markdown code fences.
- Root key exactly matches the expected module.
- Required fields are present.
- Unexpected fields are rejected.
- Shared enum values are enforced.
- Confidence and groundedness scores must be 0 to 100.
- Human review is required when confidence is low, groundedness is below 70, validation blocks proceed, or approval recommendation is not `approved`.

```ts
import { validateAiOutput } from "./src/modules/ai";

const result = validateAiOutput(llmText, "validation");

if (!result.valid) {
  // Use retry strategy or fallback mock response.
}
```

## Retry Strategy

Use `RETRY_STRATEGY` from [validation.ts](../src/modules/ai/validation.ts).

Retry flow:

1. First LLM call returns text.
2. Validate with `validateAiOutput`.
3. If invalid, call the LLM repair prompt with the invalid output, validation errors, and required schema.
4. Validate the repaired output.
5. If still invalid after 2 repair attempts, use mock fallback for the matching scenario.
6. If confidence is low but JSON is valid, keep the output but mark it for human review.

## Fallback Demo Mode

Use [mock-responses.ts](../src/modules/ai/mock-responses.ts) when:

- LLM API is unavailable.
- LLM returns invalid JSON after retries.
- Network access fails.
- Demo mode is enabled.
- The team wants deterministic hackathon demo behavior.

Supported demo scenarios:

- low stock with rising demand
- overstock risk
- negative product feedback trend
- urgent branch escalation
- approval request for restock or pricing action
- outcome submitted after execution, requiring next phase generation
- validation warning due to missing information

## Example Flow

Use [examples.ts](../src/modules/ai/examples.ts) for request and response pairs covering the main demo story:

Branch Office input -> ai_analysis -> project identification -> phase plan -> validation warning -> approval recommendation -> execution outcome review -> next phase.

## Backend Response Envelope

All endpoint responses should wrap AI output inside the shared API envelope.
Use [api-envelope.ts](../src/modules/ai/api-envelope.ts) if the backend wants a small helper.

```json
{
  "success": true,
  "message": "AI analysis generated successfully",
  "data": {
    "input_understanding": {
      "issue_type": "low stock with rising demand",
      "business_area": "inventory",
      "branch": "Kuala Lumpur Central Branch",
      "urgency": "high",
      "summary": "Branch reports low stock with rising customer demand.",
      "risks": ["Potential stockout before next replenishment."],
      "opportunities": ["Restock can capture rising demand."],
      "missing_information": ["Current stock quantity"],
      "confidence_score": 82,
      "suggest_project_creation": true
    }
  }
}
```

## Integration Notes

- Real mode requires an LLM API.
- Mock mode requires no external service.
- Optional news API and OCR/parser services should only be used when live news or uploaded documents are part of the demo.
- Do not pass raw AI text directly to frontend. Always parse, validate, and wrap it in the shared response envelope.
- Do not rename `validation`, `approval`, `execution_update`, `ai_analysis`, `branch`, `phase`, `plan`, or `project`.
