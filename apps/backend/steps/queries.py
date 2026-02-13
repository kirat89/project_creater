LIST_STEPS = """
SELECT ws.*
FROM workflow_steps ws
JOIN workflows w ON ws.workflow_id = w.id
WHERE ws.workflow_id = $1 AND ws.is_active = true AND w.is_active = true
ORDER BY ws.step_order
"""
GET_MAX_STEP_ORDER = "SELECT COALESCE(MAX(step_order), 0) FROM workflow_steps WHERE workflow_id = $1 AND is_active = true"
CREATE_STEP = """
INSERT INTO workflow_steps
(workflow_id, name, description, step_order, step_type, can_have_substeps, is_required, timer_duration_minutes, completion_criteria, is_active)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
RETURNING *
"""
GET_STEP = "SELECT * FROM workflow_steps WHERE id = $1 AND is_active = true"
UPDATE_STEP_BASE = "UPDATE workflow_steps SET {updates} WHERE id = ${param_idx} AND is_active = true RETURNING *"
SOFT_DELETE_STEP = "UPDATE workflow_steps SET is_active = false WHERE id = $1 AND is_active = true RETURNING *"
GET_ACTIVE_WORKFLOW = "SELECT id FROM workflows WHERE id = $1 AND is_active = true"
