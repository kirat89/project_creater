ALTER TABLE IF EXISTS workflow_steps
  ADD COLUMN IF NOT EXISTS completion_criteria TEXT,
  ADD COLUMN IF NOT EXISTS timer_duration_minutes INTEGER;

ALTER TABLE IF EXISTS step_executions
  ADD COLUMN IF NOT EXISTS step_description TEXT,
  ADD COLUMN IF NOT EXISTS completion_criteria TEXT,
  ADD COLUMN IF NOT EXISTS timer_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS timer_deadline_at TIMESTAMPTZ;
