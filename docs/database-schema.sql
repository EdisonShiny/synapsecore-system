CREATE TABLE branches (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive'))
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('HQ', 'Branch Office')),
  branch_id UUID NULL REFERENCES branches(id),
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE projects (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  project_type TEXT NOT NULL,
  branch_id UUID NOT NULL REFERENCES branches(id),
  created_by UUID NOT NULL REFERENCES users(id),
  owner_role TEXT NOT NULL CHECK (owner_role IN ('HQ', 'Branch Office')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'validation_pending', 'approval_pending', 'executing', 'completed', 'escalated')),
  ai_confidence NUMERIC NOT NULL CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
  approval_status TEXT NOT NULL CHECK (approval_status IN ('pending', 'approved', 'rejected', 'revise_requested', 'escalated')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE project_inputs (
  id UUID PRIMARY KEY,
  project_id UUID NULL REFERENCES projects(id),
  source_type TEXT NOT NULL CHECK (source_type IN ('manual_form', 'branch_report', 'market_news', 'feedback', 'uploaded_document', 'outcome_update')),
  raw_text TEXT NOT NULL,
  file_url TEXT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE ai_analysis (
  id UUID PRIMARY KEY,
  input_id UUID NOT NULL REFERENCES project_inputs(id),
  issue_type TEXT NOT NULL,
  business_area TEXT NOT NULL,
  branch TEXT NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  summary TEXT NOT NULL,
  risks_json JSONB NOT NULL,
  opportunities_json JSONB NOT NULL,
  missing_information_json JSONB NOT NULL,
  confidence_score NUMERIC NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  suggest_project_creation BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE phases (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  phase_name TEXT NOT NULL,
  phase_order INTEGER NOT NULL,
  objective TEXT NOT NULL,
  responsible_party TEXT NOT NULL CHECK (responsible_party IN ('HQ', 'Branch Office')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'planned', 'validating', 'approved', 'executing', 'completed', 'blocked')),
  due_date TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE plans (
  id UUID PRIMARY KEY,
  phase_id UUID NOT NULL REFERENCES phases(id),
  objective TEXT NOT NULL,
  rationale TEXT NOT NULL,
  action_steps_json JSONB NOT NULL,
  required_inputs_json JSONB NOT NULL,
  expected_output TEXT NOT NULL,
  dependencies_json JSONB NOT NULL,
  estimated_risk TEXT NOT NULL CHECK (estimated_risk IN ('low', 'medium', 'high')),
  impact_if_successful TEXT NOT NULL,
  confidence_score NUMERIC NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  version INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE validations (
  id UUID PRIMARY KEY,
  phase_id UUID NOT NULL REFERENCES phases(id),
  groundedness_score NUMERIC NOT NULL CHECK (groundedness_score >= 0 AND groundedness_score <= 100),
  missing_information_json JSONB NOT NULL,
  unsupported_claims_json JSONB NOT NULL,
  contradiction_flags_json JSONB NOT NULL,
  impact_analysis TEXT NOT NULL,
  mitigation_steps_json JSONB NOT NULL,
  proceed_recommendation TEXT NOT NULL CHECK (proceed_recommendation IN ('proceed', 'proceed_with_caution', 'human_review_required', 'do_not_proceed')),
  human_review_level TEXT NOT NULL CHECK (human_review_level IN ('optional', 'recommended', 'required')),
  validated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE execution_updates (
  id UUID PRIMARY KEY,
  phase_id UUID NOT NULL REFERENCES phases(id),
  submitted_by UUID NOT NULL REFERENCES users(id),
  outcome_summary TEXT NOT NULL,
  evidence_text TEXT NOT NULL,
  file_url TEXT NULL,
  success_level TEXT NOT NULL CHECK (success_level IN ('low', 'partial', 'successful', 'failed')),
  unresolved_issues_json JSONB NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE approvals (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id),
  phase_id UUID NULL REFERENCES phases(id),
  request_type TEXT NOT NULL,
  request_summary TEXT NOT NULL,
  ai_recommendation TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  decision TEXT NULL CHECK (decision IN ('approved', 'rejected', 'revise_requested', 'escalated')),
  decision_note TEXT NULL,
  decided_by UUID NULL REFERENCES users(id),
  decided_at TIMESTAMPTZ NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'revise_requested', 'escalated'))
);
