LIST_ITEMS_BASE = """
SELECT
  i.*,
  wv.snapshot AS workflow_data,
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
LEFT JOIN workflow_versions wv ON i.workflow_version_id = wv.id
LEFT JOIN workflows w ON wv.workflow_id = w.id
WHERE (w.id IS NULL OR w.is_active = true)
"""
GET_LATEST_WORKFLOW_VERSION = """
SELECT wv.*
FROM workflow_versions wv
JOIN workflows w ON w.id = wv.workflow_id
WHERE wv.workflow_id = $1 AND w.is_active = true
ORDER BY wv.version_number DESC
LIMIT 1
"""
CREATE_ITEM = (
    "INSERT INTO items (title, description, type, workflow_version_id, status) "
    "VALUES ($1, $2, $3, $4, $5) RETURNING *"
)
CREATE_WORKFLOW_EXECUTION = (
    "INSERT INTO workflow_executions (item_id, workflow_version_id, status) "
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
