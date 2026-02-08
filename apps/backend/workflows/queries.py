LIST_WORKFLOWS_BASE = "SELECT * FROM workflows WHERE is_active = true"
GET_WORKFLOW_BY_ID = "SELECT * FROM workflows WHERE id = $1 AND is_active = true"
GET_WORKFLOW_STEPS = "SELECT * FROM workflow_steps WHERE workflow_id = $1 AND is_active = true ORDER BY step_order"
CREATE_WORKFLOW = (
    "INSERT INTO workflows (name, description, type, created_by, is_active) "
    "VALUES ($1, $2, $3, $4, true) RETURNING *"
)
UPDATE_WORKFLOW_BASE = "UPDATE workflows SET {updates} WHERE id = ${param_idx} AND is_active = true RETURNING *"
SOFT_DELETE_WORKFLOW = "UPDATE workflows SET is_active = false, updated_at = NOW() WHERE id = $1 AND is_active = true RETURNING *"
