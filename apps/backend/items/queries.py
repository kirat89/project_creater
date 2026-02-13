LIST_ITEMS_BASE = """
SELECT
  i.*,
  (
    SELECT COALESCE(
      jsonb_build_object(
        'id', w.id,
        'name', w.name,
        'description', w.description,
        'type', w.type,
        'steps', COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', ws.id,
                'name', ws.name,
                'description', ws.description,
                'step_order', ws.step_order,
                'step_type', ws.step_type,
                'can_have_substeps', ws.can_have_substeps,
                'is_required', ws.is_required
              )
              ORDER BY ws.step_order
            )
            FROM workflow_steps ws
            WHERE ws.workflow_id = w.id AND ws.is_active = true
          ),
          '[]'::jsonb
        )
      ),
      '{}'::jsonb
    )
  ) AS workflow_data,
  (
    SELECT COUNT(*)::int
    FROM step_executions se
    JOIN workflow_executions we ON se.workflow_execution_id = we.id
    WHERE we.item_id = i.id AND se.status = 'done'
  ) AS completed_steps,
  (
    SELECT COUNT(*)::int
    FROM step_executions se
    JOIN workflow_executions we ON se.workflow_execution_id = we.id
    WHERE we.item_id = i.id
  ) AS total_steps
FROM items i
LEFT JOIN workflows w ON i.workflow_id = w.id
WHERE (w.id IS NULL OR w.is_active = true)
"""
GET_ACTIVE_WORKFLOW_WITH_STEPS = """
SELECT
  w.*,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ws.id,
          'name', ws.name,
          'description', ws.description,
          'step_order', ws.step_order,
          'step_type', ws.step_type,
          'can_have_substeps', ws.can_have_substeps,
          'is_required', ws.is_required
        )
        ORDER BY ws.step_order
      )
      FROM workflow_steps ws
      WHERE ws.workflow_id = w.id AND ws.is_active = true
    ),
    '[]'::jsonb
  ) AS steps
FROM workflows w
WHERE w.id = $1 AND w.is_active = true
"""
CREATE_ITEM = (
    "INSERT INTO items (title, description, type, workflow_id, status) "
    "VALUES ($1, $2, $3, $4, $5) RETURNING *"
)
CREATE_WORKFLOW_EXECUTION = (
    "INSERT INTO workflow_executions (item_id, workflow_id, status) "
    "VALUES ($1, $2, $3) RETURNING *"
)
CREATE_STEP_EXECUTION = """
INSERT INTO step_executions
(workflow_execution_id, step_id, step_order, name, step_type, status)
VALUES ($1, $2, $3, $4, $5, $6)
"""
ACTIVATE_FIRST_STEP = """
UPDATE step_executions
SET status = 'active'
WHERE id = (
  SELECT id FROM step_executions
  WHERE workflow_execution_id = $1
  ORDER BY step_order ASC
  LIMIT 1
)
"""
SET_WORKFLOW_EXECUTION_IN_PROGRESS = "UPDATE workflow_executions SET status = 'in_progress' WHERE id = $1"
SET_ITEM_IN_PROGRESS = "UPDATE items SET status = 'in_progress' WHERE id = $1"
GET_ITEM = "SELECT * FROM items WHERE id = $1"
GET_ITEM_EXECUTION = "SELECT * FROM workflow_executions WHERE item_id = $1"
GET_EXECUTION_STEPS = "SELECT * FROM step_executions WHERE workflow_execution_id = $1 ORDER BY step_order"
UPDATE_ITEM_BASE = "UPDATE items SET {updates} WHERE id = ${param_idx} RETURNING *"
ARCHIVE_ITEM = "UPDATE items SET status = 'archived' WHERE id = $1 AND status <> 'archived' RETURNING *"
