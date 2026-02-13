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
                'is_required', ws.is_required,
                'timer_duration_minutes', ws.timer_duration_minutes,
                'completion_criteria', ws.completion_criteria
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
          'is_required', ws.is_required,
          'timer_duration_minutes', ws.timer_duration_minutes,
          'completion_criteria', ws.completion_criteria
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
(workflow_execution_id, step_id, step_order, name, step_description, step_type, completion_criteria, timer_duration_minutes, timer_deadline_at, status)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
  CASE
    WHEN $6 = 'timer' AND $8 IS NOT NULL THEN NOW() + ($8 || ' minutes')::interval
    ELSE NULL
  END,
$9)
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
GET_EXECUTION_STEPS = """
SELECT se.*,
       COALESCE(se.name, ws.name) AS step_name,
       COALESCE(se.step_description, ws.description) AS step_description,
       COALESCE(se.completion_criteria, ws.completion_criteria) AS completion_criteria,
       COALESCE(se.timer_duration_minutes, ws.timer_duration_minutes) AS timer_duration_minutes,
       COALESCE(ws.can_have_substeps, false) AS can_have_substeps
FROM step_executions se
LEFT JOIN workflow_steps ws ON se.step_id = ws.id
WHERE se.workflow_execution_id = $1
ORDER BY se.step_order
"""
UPDATE_ITEM_BASE = "UPDATE items SET {updates} WHERE id = ${param_idx} RETURNING *"
ARCHIVE_ITEM = "UPDATE items SET status = 'archived' WHERE id = $1 AND status <> 'archived' RETURNING *"

EXPIRE_OVERDUE_TIMER_STEPS = """
UPDATE step_executions se
SET status = 'expired', updated_at = NOW()
WHERE se.workflow_execution_id = $1
  AND se.status = 'active'
  AND se.step_type = 'timer'
  AND se.timer_deadline_at IS NOT NULL
  AND se.timer_deadline_at <= NOW()
RETURNING se.id
"""
SET_ITEM_EXPIRED_FOR_EXECUTION = """
UPDATE items
SET status = 'expired_step', updated_at = NOW()
WHERE id = (SELECT item_id FROM workflow_executions WHERE id = $1)
"""
