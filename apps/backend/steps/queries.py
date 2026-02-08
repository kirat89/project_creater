LIST_STEPS = "SELECT * FROM workflow_steps WHERE workflow_id = $1 ORDER BY step_order"
GET_MAX_STEP_ORDER = "SELECT COALESCE(MAX(step_order), 0) FROM workflow_steps WHERE workflow_id = $1"
CREATE_STEP = """
INSERT INTO workflow_steps
(workflow_id, name, description, step_order, step_type, can_have_substeps, is_required)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *
"""
GET_STEP = "SELECT * FROM workflow_steps WHERE id = $1"
UPDATE_STEP_BASE = "UPDATE workflow_steps SET {updates} WHERE id = ${param_idx} RETURNING *"
DELETE_STEP = "DELETE FROM workflow_steps WHERE id = $1"
