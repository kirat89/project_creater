-- Remove workflow versioning model and move all references to workflow_id.

-- 1) Add direct workflow_id references.
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL;

ALTER TABLE workflow_executions
  ADD COLUMN IF NOT EXISTS workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL;

-- 2) Backfill workflow_id from workflow_versions when available.
UPDATE items i
SET workflow_id = wv.workflow_id
FROM workflow_versions wv
WHERE i.workflow_id IS NULL AND i.workflow_version_id = wv.id;

UPDATE workflow_executions we
SET workflow_id = wv.workflow_id
FROM workflow_versions wv
WHERE we.workflow_id IS NULL AND we.workflow_version_id = wv.id;

-- 3) Drop old versioning foreign key columns.
ALTER TABLE workflow_executions
  DROP COLUMN IF EXISTS workflow_version_id;

ALTER TABLE items
  DROP COLUMN IF EXISTS workflow_version_id;

-- 4) Drop version snapshots table.
DROP TABLE IF EXISTS workflow_versions;
