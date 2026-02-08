LIST_WORKFLOWS_BASE = "SELECT * FROM workflows WHERE is_active = true"
GET_WORKFLOW_BY_ID = "SELECT * FROM workflows WHERE id = $1"
GET_WORKFLOW_STEPS = "SELECT * FROM workflow_steps WHERE workflow_id = $1 ORDER BY step_order"
CREATE_WORKFLOW = (
    "INSERT INTO workflows (name, description, type, created_by, is_active) "
    "VALUES ($1, $2, $3, $4, true) RETURNING *"
)
SOFT_DELETE_WORKFLOW = "UPDATE workflows SET is_active = false WHERE id = $1 RETURNING *"
