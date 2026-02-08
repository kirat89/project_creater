LIST_WORKFLOWS_BASE = "SELECT * FROM workflows WHERE is_active = true"
GET_WORKFLOW_BY_ID = "SELECT * FROM workflows WHERE id = $1 AND is_active = true"
GET_WORKFLOW_STEPS = """
SELECT ws.*
FROM workflow_step_links wsl
JOIN workflow_steps ws ON ws.id = wsl.step_id
WHERE wsl.workflow_id = $1
  AND wsl.is_active = true
  AND ws.is_active = true
ORDER BY wsl.step_order
"""
CREATE_WORKFLOW = (
    "INSERT INTO workflows (name, description, type, created_by, is_active) "
    "VALUES ($1, $2, $3, $4, true) RETURNING *"
)
UPDATE_WORKFLOW_BASE = "UPDATE workflows SET {updates} WHERE id = ${param_idx} AND is_active = true RETURNING *"
SOFT_DELETE_WORKFLOW = "UPDATE workflows SET is_active = false, updated_at = NOW() WHERE id = $1 AND is_active = true RETURNING *"
GET_LATEST_WORKFLOW_VERSION = "SELECT COALESCE(MAX(version_number), 0) FROM workflow_versions WHERE workflow_id = $1"
CREATE_WORKFLOW_VERSION = (
    "INSERT INTO workflow_versions (workflow_id, version_number, snapshot) VALUES ($1, $2, $3::jsonb) RETURNING *"
)
GET_WORKFLOW_VERSION = "SELECT * FROM workflow_versions WHERE workflow_id = $1 AND version_number = $2"
