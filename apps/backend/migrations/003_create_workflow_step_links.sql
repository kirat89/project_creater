CREATE TABLE IF NOT EXISTS workflow_step_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workflow_id, step_id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_step_links_workflow_order
  ON workflow_step_links (workflow_id, step_order)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_workflow_step_links_step_id
  ON workflow_step_links (step_id);

INSERT INTO workflow_step_links (workflow_id, step_id, step_order, is_active)
SELECT
  ws.workflow_id,
  ws.id,
  COALESCE(ws.step_order, row_number() OVER (PARTITION BY ws.workflow_id ORDER BY ws.created_at)),
  COALESCE(ws.is_active, true)
FROM workflow_steps ws
ON CONFLICT (workflow_id, step_id) DO UPDATE
SET
  step_order = EXCLUDED.step_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();
