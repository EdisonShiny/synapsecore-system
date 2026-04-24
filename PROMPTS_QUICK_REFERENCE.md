# Quick Reference: 8 Structured AI Prompts

## Pipeline Stages (Sequential Processing)

### ✅ Prompt 1: INTAKE
**Role**: Data Intake Processor  
**Input**: Raw request data  
**Output**: Normalized request object with completeness score  
**File**: `src/modules/ai/structured-prompts.ts:PROMPT_1_INTAKE`  
**Integration**: `input_understanding` module  

---

### ✅ Prompt 2: VALIDATION
**Role**: Data Validation Engine  
**Input**: Normalized request + business rules  
**Output**: Field validations with error codes + severity levels  
**File**: `src/modules/ai/structured-prompts.ts:PROMPT_2_VALIDATION`  
**Integration**: `validation` module  

---

### ✅ Prompt 3: ANALYSIS
**Role**: Contextual Analysis Processor  
**Input**: Validated data + historical context  
**Output**: Feasibility assessment + complexity metrics + risk factors  
**File**: `src/modules/ai/structured-prompts.ts:PROMPT_3_ANALYSIS`  
**Integration**: Available for custom workflows  

---

### ✅ Prompt 4: PROJECT CREATION
**Role**: Project Instantiation Manager  
**Input**: Analysis report + resource inventory  
**Output**: Project specifications + resource allocation  
**File**: `src/modules/ai/structured-prompts.ts:PROMPT_4_PROJECT_CREATION`  
**Integration**: `project_identification` module  

---

### ✅ Prompt 5: DECISION MAKING
**Role**: Decision Synthesis Engine  
**Input**: Analysis + decision matrix + policies  
**Output**: Approval/rejection decision with full justification  
**File**: `src/modules/ai/structured-prompts.ts:PROMPT_5_DECISION_MAKING`  
**Integration**: `approval_recommendation` module  

---

### ✅ Prompt 6: PROGRESSION
**Role**: Workflow State Transition Manager  
**Input**: Decision + current state + state machine  
**Output**: State transition validation + triggered actions  
**File**: `src/modules/ai/structured-prompts.ts:PROMPT_6_PROGRESSION`  
**Integration**: Available for workflow advancement  

---

## Request Approval Features

### ✅ Prompt 7: APPROVAL DECISION
**Role**: Request Approval Evaluator  
**Input**: Request details + requestor profile + approval policy  
**Output**: Approval decision + authorization level + approver assignment  
**File**: `src/modules/ai/structured-prompts.ts:PROMPT_7_APPROVAL_DECISION`  
**Integration**: `requestExtractorPrompt` in request workflow  

---

### ✅ Prompt 8: ESCALATION
**Role**: Escalation Protocol Executor  
**Input**: Request/decision + escalation policy + stakeholder registry  
**Output**: Escalation path + communication package + status tracking  
**File**: `src/modules/ai/structured-prompts.ts:PROMPT_8_ESCALATION`  
**Integration**: `requestValidatorPrompt` in request workflow  

---

## Usage Pattern

```typescript
import { PROMPT_X_NAME } from "@/src/modules/ai/structured-prompts";

// Use system prompt directly
const systemPrompt = PROMPT_X_NAME.systemPrompt;

// Build user prompt with context
const userPrompt = PROMPT_X_NAME.userPromptTemplate({
  /* required context for this prompt */
});

// Call AI with both prompts
const result = await callAiAPI({
  system: systemPrompt,
  user: userPrompt
});
```

---

## Key Properties of All Prompts

| Property | Description |
|----------|-------------|
| `role` | AI's role in the system |
| `task` | Clear task description |
| `systemPrompt` | Complete system instructions |
| `userPromptTemplate()` | Function to generate user prompt |

---

## Output Formats (All Strict JSON)

All prompts return **strict JSON only**:
- No markdown or code fences
- No explanations outside JSON
- Deterministic structure
- Proper error codes
- Audit trail fields

---

## Common Integration Points

| Feature | Prompts Used | Location |
|---------|-------------|----------|
| Workflow Execution | 1→2→4→5→6 | `/api/workflows/execute` |
| Request Submission | 7 + 8 | `/api/requests` |
| Phase Progression | 3→6 | `/projects/{id}/phases` |
| Approval/Rejection | 5→7 | `/approvals/decision` |

---

## Testing Checklist

- [ ] TypeScript compiles without errors
- [ ] Create workflow with structured prompts
- [ ] Execute workflow with test data
- [ ] Verify JSON output format
- [ ] Check audit trail generation
- [ ] Test error code assignment
- [ ] Verify deterministic approver assignment
- [ ] Test escalation trigger identification

---

## Documentation

- 📖 Full Guide: `PROMPTS_INTEGRATION_GUIDE.md`
- 📝 Summary: `INTEGRATION_COMPLETE.md`
- 📋 Reference: `PROMPTS_QUICK_REFERENCE.md` (this file)

