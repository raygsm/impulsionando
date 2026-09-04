-- Canonical database redesign — DRAFT expand SQL
-- Authority: docs/reengineering/06-autonomous-marketing-platform/database/
-- Physical draft: Option A (dedicated private schemas in existing managed Supabase)
-- APPLY POLICY: DO NOT apply to staging or production until DB1+DB3+DB4 gates pass.
-- Not part of the auto-applied supabase/migrations corpus.
-- No secrets. Expand-only. No drops of legacy objects.

CREATE TABLE IF NOT EXISTS tasks.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenancy.tenants(id),
  business_unit_id uuid,
  assignee_user_id uuid,
  assignee_team text,
  title text NOT NULL,
  due_at timestamptz,
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  state text NOT NULL DEFAULT 'open'
    CHECK (state IN ('open','in_progress','completed','cancelled')),
  completed_at timestamptz,
  completion_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT tasks_tasks_tenant_row UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS tasks.task_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  task_id uuid NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tasks_task_links_task_fk
    FOREIGN KEY (tenant_id, task_id)
    REFERENCES tasks.tasks (tenant_id, id),
  UNIQUE (tenant_id, task_id, resource_type, resource_id)
);

CREATE TABLE IF NOT EXISTS tasks.assignment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  task_id uuid NOT NULL,
  from_assignee_user_id uuid,
  to_assignee_user_id uuid,
  actor_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tasks_assignment_history_task_fk
    FOREIGN KEY (tenant_id, task_id)
    REFERENCES tasks.tasks (tenant_id, id)
);

CREATE INDEX IF NOT EXISTS tasks_tasks_assignee_idx
  ON tasks.tasks (tenant_id, assignee_user_id, state);
