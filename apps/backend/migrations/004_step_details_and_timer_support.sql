ALTER TABLE IF EXISTS workflow_steps
  ADD COLUMN IF NOT EXISTS completion_criteria TEXT,
  ADD COLUMN IF NOT EXISTS timer_duration_minutes INTEGER;

ALTER TABLE IF EXISTS step_executions
  ADD COLUMN IF NOT EXISTS step_description TEXT,
  ADD COLUMN IF NOT EXISTS completion_criteria TEXT,
  ADD COLUMN IF NOT EXISTS timer_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS timer_deadline_at TIMESTAMPTZ;

DO $$
DECLARE
  step_constraint_name TEXT;
  item_constraint_name TEXT;
BEGIN
  SELECT conname INTO step_constraint_name
  FROM pg_constraint
  WHERE conrelid = 'step_executions'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%';

  IF step_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE step_executions DROP CONSTRAINT %I', step_constraint_name);
  END IF;

  ALTER TABLE step_executions
    ADD CONSTRAINT step_executions_status_check
    CHECK (status IN ('pending', 'active', 'done', 'skipped', 'expired'));

  SELECT conname INTO item_constraint_name
  FROM pg_constraint
  WHERE conrelid = 'items'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%';

  IF item_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE items DROP CONSTRAINT %I', item_constraint_name);
  END IF;

  ALTER TABLE items
    ADD CONSTRAINT items_status_check
    CHECK (status IN ('not_started', 'in_progress', 'completed', 'archived', 'expired_step'));
END $$;
