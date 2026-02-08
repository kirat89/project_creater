-- Add is_active to workflow_steps and workflow_substeps
ALTER TABLE IF EXISTS workflow_steps
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- backfill existing rows to true (redundant given default, but safe)
UPDATE workflow_steps SET is_active = true WHERE is_active IS NULL;

ALTER TABLE IF EXISTS workflow_substeps
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE workflow_substeps SET is_active = true WHERE is_active IS NULL;

-- Optional: create indexes to speed up queries that filter by is_active
CREATE INDEX IF NOT EXISTS idx_workflow_steps_is_active ON workflow_steps (is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_substeps_is_active ON workflow_substeps (is_active);
