# Implementation Guide: Using the 8 Structured Prompts

## Quick Start

The 8 structured prompts are now integrated into your SynapseCore system and ready to use immediately.

### Option 1: Use Default Integration (Automatic)
Simply create workflows and request approvals through the UI or API—they now use the structured prompts automatically.

### Option 2: Use Custom Workflows
Import and customize the prompts for your specific needs.

---

## Real-World Examples

### Example 1: Branch Submits Order Processing Request

**Flow**: Intake → Validation → Analysis → Project Creation → Decision → Progression

```bash
# Step 1: Create workflow
curl -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Order Processing Workflow",
    "description": "Handle branch order volume requests",
    "config": {
      "reportPrompt": "Extract the order volume requirement, current capacity, timeline, and business impact from the branch submission.",
      "extractorPrompt": "Pull out: order volume (units), current processing capacity, urgency level, and business justification.",
      "validatorPrompt": "Verify the numbers are supported by evidence. Check for realistic capacity vs. demand.",
      "projectBuilderPrompt": "Create a project for infrastructure upgrade with phases.",
      "phaseProgressPrompt": "Track progress on infrastructure deployment.",
      "phaseBuilderPrompt": "Plan next phase after current phase completion."
    }
  }'
```

**API Response**: Workflow created with ID `wf_123`

```bash
# Step 2: Execute workflow with branch submission
curl -X POST http://localhost:3000/api/workflows/wf_123/execute \
  -H "Content-Type: application/json" \
  -d '{
    "unstructuredInput": "We received 5000 orders yesterday but can only process 1000/day. Need to expand capacity by Q3.",
    "attachments": [],
    "selectedDatabasePaths": ["company/inventory", "company/orders"]
  }'
```

**What Happens**:
1. ✅ **Prompt 1 (Intake)**: Extracts order volume, current capacity, timeline
2. ✅ **Prompt 2 (Validation)**: Confirms numbers are grounded in submission
3. ✅ **Prompt 3 (Analysis)**: Assesses feasibility, resource requirements, risk
4. ✅ **Prompt 4 (Project Creation)**: Generates project with phases
5. ✅ **Prompt 5 (Decision)**: Recommends approval/rejection/escalation
6. ✅ **Prompt 6 (Progression)**: Advances workflow state

**Result**: Project created, ready for HQ review

```bash
# Step 3: Branch submits request for approval
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj_456",
    "projectTitle": "Order Processing Capacity Expansion",
    "applicationText": "Requesting approval for infrastructure upgrade to handle 5000 orders/day. Budget: $500K. Timeline: 8 weeks.",
    "attachments": [],
    "selectedDatabasePaths": ["company/budget", "company/infrastructure"]
  }'
```

**What Happens**:
1. ✅ **Prompt 7 (Approval Decision)**: Evaluates authorization level (Director/Executive)
2. ✅ **Prompt 8 (Escalation)**: Routes to appropriate approver if needed
3. ✅ Request enters HQ review queue

---

### Example 2: HQ Reviews and Escalates Request

**Flow**: Approval Decision → Escalation (if needed)

**Scenario**: Request requires executive approval (escalation triggered)

**Output from Prompts 7 & 8**:
```json
{
  "approval_id": "apr_789",
  "request_id": "req_123",
  "approval_decision": "ESCALATED",
  "required_authorization_level": "EXECUTIVE",
  "escalation_triggered": true,
  "escalation_level": 3,
  "escalation_path": [
    {
      "escalation_step": 1,
      "target_role": "Director of Operations",
      "target_contact_id": "user_456",
      "notification_method": "email",
      "response_deadline": "2026-04-28T17:00:00Z",
      "escalation_action_required": "Review budget impact and capacity plan"
    },
    {
      "escalation_step": 2,
      "target_role": "Chief Operating Officer",
      "target_contact_id": "user_789",
      "notification_method": "email",
      "response_deadline": "2026-04-29T17:00:00Z",
      "escalation_action_required": "Approve or deny infrastructure investment"
    }
  ],
  "communication_package": {
    "summary_for_escalation": "Branch office requesting $500K infrastructure upgrade to increase order processing capacity from 1K to 5K orders/day",
    "reason_for_escalation": "Budget exceeds director approval threshold",
    "recommended_resolution": "Approve if Q3 delivery timeline is acceptable"
  }
}
```

---

## Accessing Prompts Programmatically

### Import All Prompts
```typescript
import { ALL_STRUCTURED_PROMPTS } from "@/src/modules/ai/structured-prompts";

// Access any prompt
const intakePrompt = ALL_STRUCTURED_PROMPTS.PROMPT_1_INTAKE;
const approvalPrompt = ALL_STRUCTURED_PROMPTS.PROMPT_7_APPROVAL_DECISION;
```

### Use Helper Function
```typescript
import { getStructuredPromptByName } from "@/src/modules/ai/structured-prompts";

const prompt = getStructuredPromptByName("PROMPT_1_INTAKE");
console.log(prompt.role);        // "Data Intake Processor"
console.log(prompt.task);        // Full task description
console.log(prompt.systemPrompt); // Ready to use with AI API
```

### Build Custom Workflow
```typescript
import { PROMPT_1_INTAKE, PROMPT_2_VALIDATION } from "@/src/modules/ai/structured-prompts";

const customWorkflow = {
  name: "Custom Intake Validation",
  description: "Custom workflow for specialized use case",
  config: {
    reportPrompt: PROMPT_1_INTAKE.systemPrompt,
    extractorPrompt: PROMPT_2_VALIDATION.systemPrompt,
    validatorPrompt: PROMPT_2_VALIDATION.systemPrompt,
    projectBuilderPrompt: "Custom project builder prompt",
    phaseProgressPrompt: "Custom phase progress prompt",
    phaseBuilderPrompt: "Custom phase builder prompt"
  }
};
```

---

## Monitoring Prompt Output

### Check Request Approval Status
```bash
curl http://localhost:3000/api/requests/req_123
```

**Response includes**:
```json
{
  "id": "req_123",
  "status": "Waiting for Approval",
  "finalReport": "...",
  "finalExtraction": {
    "headline": "Order capacity expansion request",
    "items": ["5000 orders/day requirement", "8-week timeline", "$500K budget"],
    "confidenceScore": 92
  },
  "validation": {
    "result": "Pass",
    "summary": "All facts grounded in submission",
    "confidenceScore": 95
  },
  "recommendation": {
    "recommendation": "Approve",
    "reason": "Well-justified, with clear business case",
    "confidenceScore": 87
  }
}
```

### Check Approval Decision
```bash
curl http://localhost:3000/api/approvals/apr_789
```

**Response includes escalation info from Prompt 8**:
```json
{
  "escalation_id": "esc_999",
  "escalation_triggered": true,
  "escalation_level": 3,
  "escalation_path": [...],
  "escalation_status": "PENDING"
}
```

---

## Best Practices

### 1. Provide Sufficient Context
✅ DO: Include supporting documents, metrics, timelines
❌ DON'T: Submit vague requests without evidence

### 2. Use Relevant Database Paths
```bash
# Good: Include relevant company data
"selectedDatabasePaths": [
  "company/budget/approval_limits",
  "company/operations/capacity",
  "company/infrastructure/current_state"
]

# Avoid: Unnecessary data
"selectedDatabasePaths": [
  "company/hr/employee_roster"  # Not relevant
]
```

### 3. Format Application Text Clearly
```
REQUEST TITLE: Order Processing Capacity Expansion

BUSINESS NEED:
- Current capacity: 1,000 orders/day
- Recent volume: 5,000 orders/day
- Gap: 4,000 orders/day unprocessed

PROPOSED SOLUTION:
- Infrastructure upgrade
- Cost: $500,000
- Timeline: 8 weeks
- Expected capacity: 5,500 orders/day

IMPACT:
- Revenue increase: $2M/quarter
- Customer satisfaction: +15%
- Employee workload: -30%
```

### 4. Monitor Decision Audit Trails
All prompts create immutable audit trails:
```json
{
  "audit_entry": {
    "changed_by": "approval_recommendation_module",
    "change_timestamp": "2026-04-25T14:30:00Z",
    "state_before": "Submitted",
    "state_after": "AI Processing",
    "reason_code": "VALIDATION_PASSED"
  }
}
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Prompt returns non-JSON" | Verify "Return strict JSON only" is in system prompt |
| "Missing fields in output" | Check all required output fields are specified |
| "Decision seems wrong" | Review decision factors and confidence score in output |
| "Escalation not triggered" | Verify escalation_triggers_activated are met |
| "Inconsistent decisions" | Check if decision matrix is applied consistently |

---

## Next Steps

1. **Test in Development**
   - Create test workflow with structured prompts
   - Submit test request
   - Verify output format and quality

2. **Monitor in Production**
   - Set up logging for decision audit trails
   - Track approval rates and escalation frequency
   - Monitor confidence scores

3. **Customize as Needed**
   - Adjust prompts for your specific business rules
   - Add custom validation rules
   - Extend escalation policies

4. **Document Your Configuration**
   - Save custom prompt versions
   - Document decision matrix rules
   - Keep escalation policies updated

---

## Support Resources

- 📖 **Full Integration Guide**: `PROMPTS_INTEGRATION_GUIDE.md`
- 📋 **Quick Reference**: `PROMPTS_QUICK_REFERENCE.md`
- 📝 **Integration Summary**: `INTEGRATION_COMPLETE.md`
- 📂 **Source Code**: `/src/modules/ai/structured-prompts.ts`

