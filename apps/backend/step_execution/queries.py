LIST_EXECUTION_STEPS = "SELECT * FROM step_executions WHERE workflow_execution_id = $1 ORDER BY step_order"
UPDATE_STEP_STATUS = """
UPDATE step_executions
SET status = $1, completed_at = NOW()
WHERE id = $2 AND workflow_execution_id = $3
RETURNING *
"""
GET_NEXT_STEP = """
SELECT * FROM step_executions
WHERE workflow_execution_id = $1 AND step_order > $2
ORDER BY step_order
LIMIT 1
"""
ACTIVATE_STEP_BY_ID = "UPDATE step_executions SET status = 'active' WHERE id = $1"
COMPLETE_WORKFLOW_EXECUTION = "UPDATE workflow_executions SET status = 'completed', completed_at = NOW() WHERE id = $1"
GET_MAX_SUBSTEP_ORDER = "SELECT COALESCE(MAX(substep_order), 0) FROM substep_executions WHERE step_execution_id = $1"
CREATE_SUBSTEP = """
INSERT INTO substep_executions (step_execution_id, name, substep_order, status)
VALUES ($1, $2, $3, $4)
RETURNING *
"""
GET_SUBSTEPS = "SELECT * FROM substep_executions WHERE step_execution_id = $1 ORDER BY substep_order"
UPDATE_SUBSTEP_STATUS = """
UPDATE substep_executions
SET status = $1
WHERE id = $2 AND step_execution_id = $3
RETURNING *
"""
GET_SUBSTEP = "SELECT * FROM substep_executions WHERE id = $1 AND step_execution_id = $2"
DELETE_SUBSTEP = "DELETE FROM substep_executions WHERE id = $1"
