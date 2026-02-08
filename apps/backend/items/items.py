from fastapi import APIRouter, Request, HTTPException
from typing import Optional
from pydantic import BaseModel

router = APIRouter()

class ItemCreate(BaseModel):
    title: str
    item_type: str
    workflow_id: str

@router.get("/")
async def list_items(request: Request, type: Optional[str] = None, status: Optional[str] = None):
    pool = request.app.state.pool
    query = """
      SELECT 
        i.*,
        wv.snapshot->>'workflow' as workflow_data,
        (
          SELECT COUNT(*)::int 
          FROM step_executions se 
          JOIN workflow_executions we ON se.execution_id = we.id 
          WHERE we.item_id = i.id AND se.step_status = 'done'
        ) as completed_steps,
        (
          SELECT COUNT(*)::int 
          FROM step_executions se 
          JOIN workflow_executions we ON se.execution_id = we.id 
          WHERE we.item_id = i.id
        ) as total_steps
      FROM items i
      LEFT JOIN workflow_versions wv ON i.workflow_version_id = wv.id
      WHERE 1=1
    """
    params = []
    idx = 1
    if type:
        query += f" AND i.type = ${idx}"
        params.append(type); idx += 1
    if status:
        query += f" AND i.status = ${idx}"
        params.append(status); idx += 1
    query += " ORDER BY i.created_at DESC"
    rows = await pool.fetch(query, *params)
    return {"items": [dict(r) for r in rows]}

@router.post("/", status_code=201)
async def create_item(request: Request, payload: ItemCreate):
    pool = request.app.state.pool
    if not payload.title or not payload.item_type or not payload.workflow_id:
        raise HTTPException(status_code=400, detail="title, item_type and workflow_id are required")
    # Get latest workflow version
    versions = await pool.fetch(
        "SELECT * FROM workflow_versions WHERE workflow_id = $1 ORDER BY version_number DESC LIMIT 1",
        payload.workflow_id,
    )
    if not versions:
        raise HTTPException(status_code=404, detail="Workflow version not found")
    version = versions[0]
    # insert item
    item_row = await pool.fetchrow(
        "INSERT INTO items (title, type, workflow_version_id, created_by, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        payload.title,
        payload.item_type,
        version["id"],
        None,
        "not_started",
    )
    # create execution and step_executions here (similar to JS logic)...
    return {"item": dict(item_row)}