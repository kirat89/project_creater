-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) workflows (editable container)
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('task', 'product', 'habit', 'generic')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) workflow_versions (immutable snapshots)
CREATE TABLE IF NOT EXISTS workflow_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) workflow_steps (authoring-time)
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  step_order INTEGER,
  step_type TEXT NOT NULL CHECK (step_type IN ('manual', 'checklist', 'approval', 'timer')),
  can_have_substeps BOOLEAN DEFAULT false,
  is_required BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true
);

-- 5) workflow_substeps (optional)
CREATE TABLE IF NOT EXISTS workflow_substeps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID REFERENCES workflow_steps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  substep_order INTEGER
);

-- 6) items (task / product / habit instances)
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('task', 'product', 'habit')),
  workflow_version_id UUID REFERENCES workflow_versions(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'archived')) DEFAULT 'not_started',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7) workflow_executions (runtime instance)
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  workflow_version_id UUID REFERENCES workflow_versions(id) ON DELETE SET NULL,
  current_step_id UUID NULL,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8) step_executions (runtime steps)
CREATE TABLE IF NOT EXISTS step_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
  step_id UUID,
  step_order INTEGER,
  name TEXT,
  step_type TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'done', 'skipped')) DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9) substep_executions
CREATE TABLE IF NOT EXISTS substep_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_execution_id UUID REFERENCES step_executions(id) ON DELETE CASCADE,
  name TEXT,
  substep_order INTEGER,
  status TEXT NOT NULL CHECK (status IN ('pending', 'done')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habit-specific tables (optional)
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly')),
  start_date DATE
);

CREATE TABLE IF NOT EXISTS habit_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  scheduled_date DATE,
  workflow_execution_id UUID REFERENCES workflow_executions(id) ON DELETE SET NULL,
  status TEXT
);

-- Supporting tables
CREATE TABLE IF NOT EXISTS step_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_execution_id UUID REFERENCES step_executions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT,
  entity_id UUID,
  content TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT,
  entity_id UUID,
  action TEXT,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backfill safety for older databases
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
